import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = "http://127.0.0.1:4173/";
const outputDir = path.resolve("preview");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--use-angle=swiftshader",
  ],
});

const errors = [];

async function findMarkerOverlaps(page, selector) {
  return page.locator(selector).evaluateAll((elements) => {
    const boxes = elements
      .map((element) => ({
        box: element.getBoundingClientRect(),
        label:
          element.closest('[role="button"]')?.getAttribute("aria-label") ??
          element.getAttribute("aria-label") ??
          "",
      }))
      .filter(({ box }) => box.width > 0 && box.height > 0);
    const overlaps = [];
    for (let index = 0; index < boxes.length; index += 1) {
      for (let compare = index + 1; compare < boxes.length; compare += 1) {
        const horizontal =
          Math.min(boxes[index].box.right, boxes[compare].box.right) -
          Math.max(boxes[index].box.left, boxes[compare].box.left);
        const vertical =
          Math.min(boxes[index].box.bottom, boxes[compare].box.bottom) -
          Math.max(boxes[index].box.top, boxes[compare].box.top);
        if (horizontal > 0 && vertical > 0) {
          overlaps.push({
            first: boxes[index].label,
            second: boxes[compare].label,
            horizontal: Math.round(horizontal * 10) / 10,
            vertical: Math.round(vertical * 10) / 10,
          });
        }
      }
    }
    return overlaps;
  });
}

async function markerOverlapPairs(page, selector) {
  return (await findMarkerOverlaps(page, selector)).length;
}

const context = await browser.newContext({
  viewport: { width: 1536, height: 1024 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    errors.push(`${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("response", (response) => {
  if (response.status() >= 400) {
    errors.push(`http ${response.status()}: ${response.url()}`);
  }
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1800);
console.log("desktop-loaded");
await page.screenshot({ path: path.join(outputDir, "desktop-map.png") });
const initialMap = await page.evaluate(() => ({
  hasMap: Boolean(document.querySelector(".leaflet-container")),
  mapMarkers: document.querySelectorAll(".leaflet-province-count").length,
  bodyWidth: document.documentElement.scrollWidth,
  viewportWidth: window.innerWidth,
}));
if (!initialMap.hasMap || initialMap.mapMarkers !== 13) {
  throw new Error(`Map failed to initialize: ${JSON.stringify(initialMap)}`);
}

await page.locator(".leaflet-province-count").filter({ hasText: "3" }).first().click();
await page.waitForTimeout(900);
console.log("beijing-selected");
const beijingValue = await page.locator(".province-select select").inputValue();
if (beijingValue !== "北京") throw new Error(`Beijing province switch failed: ${beijingValue}`);
await page.getByRole("button", { name: "全国", exact: true }).click();
await page.waitForTimeout(700);
await page.locator('path[data-province="北京"]').dispatchEvent("click");
await page.waitForTimeout(700);
const polygonProvinceValue = await page.locator(".province-select select").inputValue();
if (polygonProvinceValue !== "北京") {
  throw new Error(`Province shape click failed: ${polygonProvinceValue}`);
}
await page.getByRole("button", { name: "全国", exact: true }).click();
await page.waitForTimeout(700);

await page.locator(".leaflet-province-count").filter({ hasText: "39" }).click();
await page.waitForTimeout(1100);
console.log("jiangsu-selected");
await page.screenshot({ path: path.join(outputDir, "desktop-province.png") });

const provinceValue = await page.locator(".province-select select").inputValue();
if (provinceValue !== "江苏") throw new Error(`Province switch failed: ${provinceValue}`);
const desktopCityLabelOverlapPairs = await markerOverlapPairs(
  page,
  ".leaflet-city-marker",
);

await page.locator(".city-rail-item").filter({ hasText: "南京" }).click();
await page.waitForTimeout(1200);
console.log("nanjing-selected");
await page.screenshot({ path: path.join(outputDir, "desktop-city-schools.png") });

const schoolCount = await page.locator(".school-rail-item").count();
if (schoolCount < 9) throw new Error(`Expected school markers, got ${schoolCount}`);
const cityResultText = (await page.locator(".map-result-count").innerText()).trim();
if (cityResultText !== "南京 · 20 人") {
  throw new Error(`City result count is ambiguous: ${cityResultText}`);
}
const citySchoolOverlapPairs = await markerOverlapPairs(
  page,
  ".leaflet-school-bubble",
);

await page
  .locator('.leaflet-school-marker-tile[aria-label^="南京大学"] .leaflet-school-bubble')
  .click();
await page.waitForTimeout(200);
const directProfileName = await page.locator(".student-identity h3").innerText();
if (directProfileName !== "蒋金豪") {
  throw new Error(`Single-school marker opened the wrong profile: ${directProfileName}`);
}

const multiSchoolMarker = page
  .locator(".leaflet-school-bubble")
  .filter({ hasText: /^3$/ })
  .first();
const markerBox = await multiSchoolMarker.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
});
await page.mouse.click(markerBox.x, markerBox.y);
await page.waitForTimeout(250);
console.log("school-clicked");
const directMapClickOpened = (await page.locator(".leaflet-school-popup").count()) > 0;
if (!directMapClickOpened) throw new Error("Clicking a school marker did not open the school list.");

if (await page.locator(".leaflet-popup-close-button").count()) {
  await page.locator(".leaflet-popup-close-button").click();
}

await page.locator(".school-rail-item").filter({ hasText: "南京林业大学" }).click();
await page.waitForTimeout(350);
await page.screenshot({ path: path.join(outputDir, "desktop-school-popup.png") });
const popupVisible = await page.locator(".leaflet-school-popup").isVisible();
if (!popupVisible) throw new Error("Multi-student school popup did not open.");

await page.locator(".leaflet-school-people button").filter({ hasText: "陶锦程" }).click();
await page.waitForTimeout(200);
const profileName = await page.locator(".student-identity h3").innerText();
if (profileName !== "陶锦程") throw new Error(`Wrong profile: ${profileName}`);

await page.getByRole("button", { name: "同学名录", exact: true }).click();
const search = page.getByPlaceholder("搜索姓名或院校");
await search.fill("吴运飞");
await search.press("Enter");
await page.waitForTimeout(200);
const directoryText = await page.locator(".directory-table tbody tr").first().innerText();
if (!directoryText.includes("吴运飞") || !directoryText.includes("扬州大学")) {
  throw new Error(`Name correction/search failed: ${directoryText}`);
}
await page.screenshot({ path: path.join(outputDir, "desktop-directory.png") });

await page.locator(".directory-table tbody tr").first().click();
await page.getByRole("button", { name: "在地图中查看", exact: true }).click();
await page.waitForTimeout(1300);
const focusedMapZoom = Number.parseFloat(
  (await page.locator(".leaflet-zoom-controls > span").innerText()).replace("×", ""),
);
if (focusedMapZoom < 15.5) {
  throw new Error(`School focus did not reach street level: ${focusedMapZoom}`);
}
if ((await page.locator(".leaflet-school-marker-tile.is-selected").count()) !== 1) {
  throw new Error("Focused school is not highlighted on the map.");
}
await page.screenshot({ path: path.join(outputDir, "desktop-school-focus.png") });

await page.getByRole("button", { name: "数据洞察", exact: true }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(outputDir, "desktop-insights.png") });

await page.setViewportSize({ width: 1024, height: 768 });
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1100);
await page.screenshot({ path: path.join(outputDir, "tablet-1024.png") });
const tabletMetrics = await page.evaluate(() => ({
  viewportWidth: window.innerWidth,
  documentWidth: document.documentElement.scrollWidth,
  headerHeight: document.querySelector(".app-header")?.getBoundingClientRect().height ?? 0,
  mapWidth: document.querySelector(".leaflet-map-canvas")?.getBoundingClientRect().width ?? 0,
}));
if (tabletMetrics.documentWidth > tabletMetrics.viewportWidth) {
  throw new Error(`Tablet layout overflows: ${JSON.stringify(tabletMetrics)}`);
}

await page.setViewportSize({ width: 768, height: 1024 });
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1100);
await page.screenshot({ path: path.join(outputDir, "tablet-768.png") });
const narrowTabletMetrics = await page.evaluate(() => ({
  viewportWidth: window.innerWidth,
  documentWidth: document.documentElement.scrollWidth,
  mapWidth: document.querySelector(".leaflet-map-canvas")?.getBoundingClientRect().width ?? 0,
  compactMarkers: document.querySelectorAll(".leaflet-city-marker.is-compact").length,
}));
if (narrowTabletMetrics.documentWidth > narrowTabletMetrics.viewportWidth) {
  throw new Error(`Narrow tablet layout overflows: ${JSON.stringify(narrowTabletMetrics)}`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(outputDir, "mobile-map.png") });
await page.locator(".mobile-province-strip button").filter({ hasText: "江苏" }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(outputDir, "mobile-province.png") });
const compactCityMarkerCount = await page.locator(".leaflet-city-marker.is-compact").count();
if (compactCityMarkerCount !== 9) {
  throw new Error(`Expected 9 compact Jiangsu city markers, got ${compactCityMarkerCount}`);
}
const mobileCityMarkerOverlapPairs = await markerOverlapPairs(
  page,
  ".leaflet-city-marker.is-compact",
);
await page.locator(".city-rail-item").filter({ hasText: "南京" }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(outputDir, "mobile-schools.png") });
const mobileSchoolOverlapPairs = await markerOverlapPairs(
  page,
  ".leaflet-school-bubble",
);
const mobileSchoolOverlapDetails = await findMarkerOverlaps(
  page,
  ".leaflet-school-bubble",
);
const overlapPairs = {
  desktopCities: desktopCityLabelOverlapPairs,
  desktopSchools: citySchoolOverlapPairs,
  mobileCities: mobileCityMarkerOverlapPairs,
  mobileSchools: mobileSchoolOverlapPairs,
};
if (Object.values(overlapPairs).some((count) => count > 0)) {
  throw new Error(`Map labels overlap: ${JSON.stringify(overlapPairs)}`);
}

const mobileMetrics = await page.evaluate(() => ({
  viewportWidth: window.innerWidth,
  documentWidth: document.documentElement.scrollWidth,
  schoolMarkers: document.querySelectorAll(".leaflet-school-marker-tile").length,
}));

const editorContext = await browser.newContext({
  viewport: { width: 1536, height: 1024 },
  deviceScaleFactor: 1,
});
const editorPage = await editorContext.newPage();
editorPage.setDefaultTimeout(10000);
editorPage.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    errors.push(`editor ${message.type()}: ${message.text()}`);
  }
});
editorPage.on("pageerror", (error) => errors.push(`editor pageerror: ${error.message}`));
editorPage.on("response", (response) => {
  if (response.status() >= 400) {
    errors.push(`editor http ${response.status()}: ${response.url()}`);
  }
});

await editorPage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
await editorPage.waitForTimeout(900);
await editorPage.getByRole("button", { name: "同学名录", exact: true }).click();
const editorSearch = editorPage.getByPlaceholder("搜索姓名或院校");
await editorSearch.fill("吴运飞");
await editorSearch.press("Enter");
await editorPage.waitForTimeout(250);
await editorPage.locator(".directory-table tbody tr").first().click();
await editorPage.getByRole("button", { name: "编辑个人资料", exact: true }).click();
await editorPage.waitForTimeout(650);

const profileEditorVisible = await editorPage.locator(".profile-editor-dialog").isVisible();
if (!profileEditorVisible) throw new Error("Profile editor did not open.");
if (!(await editorPage.locator(".campus-picker-canvas.leaflet-container").count())) {
  throw new Error("Campus picker map did not initialize.");
}
await editorPage.screenshot({ path: path.join(outputDir, "desktop-profile-editor.png") });

const latitudeInput = editorPage.getByLabel("纬度 Latitude");
const beforeMapPick = await latitudeInput.inputValue();
await editorPage.locator(".campus-picker-canvas").click({ position: { x: 210, y: 160 } });
await editorPage.waitForTimeout(250);
const afterMapPick = await latitudeInput.inputValue();
if (beforeMapPick === afterMapPick) {
  throw new Error("Clicking the campus picker did not update coordinates.");
}
await editorPage.getByLabel("地图链接或坐标").fill(
  "https://www.google.com/maps/@31.305300,120.640100,17z",
);
await editorPage.getByRole("button", { name: "读取并定位", exact: true }).click();
await editorPage.waitForTimeout(250);
const mapLinkCoordinates = {
  latitude: await editorPage.getByLabel("纬度 Latitude").inputValue(),
  longitude: await editorPage.getByLabel("经度 Longitude").inputValue(),
};
if (mapLinkCoordinates.latitude !== "31.305300" || mapLinkCoordinates.longitude !== "120.640100") {
  throw new Error(`Map link coordinates were not parsed: ${JSON.stringify(mapLinkCoordinates)}`);
}

await editorPage.setViewportSize({ width: 390, height: 844 });
await editorPage.waitForTimeout(450);
await editorPage.screenshot({ path: path.join(outputDir, "mobile-profile-editor.png") });
const mobileEditorMetrics = await editorPage.evaluate(() => ({
  viewportWidth: window.innerWidth,
  documentWidth: document.documentElement.scrollWidth,
  dialogWidth: document.querySelector(".profile-editor-dialog")?.getBoundingClientRect().width ?? 0,
}));
if (mobileEditorMetrics.documentWidth > mobileEditorMetrics.viewportWidth) {
  throw new Error(`Profile editor overflows on mobile: ${JSON.stringify(mobileEditorMetrics)}`);
}

await editorPage.setViewportSize({ width: 1536, height: 1024 });
await editorPage.getByLabel("学习专业").fill("中国语言文学");
const campusInput = editorPage.getByLabel("校区名称");
await campusInput.fill("未收录测试校区");
await campusInput.blur();
await editorPage.waitForTimeout(150);
const saveProfileButton = editorPage.getByRole("button", {
  name: "保存个人资料",
  exact: true,
});
if (
  !(await saveProfileButton.isDisabled()) ||
  !(await editorPage.locator(".profile-field-error").isVisible())
) {
  throw new Error("An unknown campus name did not require manual coordinate confirmation.");
}
await campusInput.fill("扬子津校区");
await editorPage.waitForTimeout(300);
const autoMatchedCampus = {
  campus: await editorPage.getByLabel("校区名称").inputValue(),
  address: await editorPage.getByLabel("校区地址").inputValue(),
  latitude: await editorPage.getByLabel("纬度 Latitude").inputValue(),
  longitude: await editorPage.getByLabel("经度 Longitude").inputValue(),
};
if (
  autoMatchedCampus.campus !== "扬子津校区" ||
  !autoMatchedCampus.address.includes("华扬西路196号") ||
  autoMatchedCampus.latitude !== "32.344390" ||
  autoMatchedCampus.longitude !== "119.405650"
) {
  throw new Error(`Campus preset did not update coordinates: ${JSON.stringify(autoMatchedCampus)}`);
}
if (await editorPage.getByLabel("地图链接或坐标").inputValue()) {
  throw new Error("The previous map link was not cleared after campus auto-matching.");
}
await editorPage.getByLabel("个人寄语（选填）").fill("愿我们各自努力，顶峰相见。");
await editorPage.screenshot({ path: path.join(outputDir, "desktop-profile-editor-filled.png") });
await saveProfileButton.click();
await editorPage.waitForTimeout(1000);

if (await editorPage.locator(".profile-editor-dialog").count()) {
  throw new Error("Profile editor did not close after saving.");
}
const autoMapVisible = await editorPage.locator(".map-layout").isVisible();
const autoSelectedMarkerLabel =
  (await editorPage.locator(".leaflet-school-marker-tile.is-selected").getAttribute("aria-label")) ??
  "";
const lockedLocationText = await editorPage.locator(".campus-location").innerText();
if (!autoMapVisible || !autoSelectedMarkerLabel.includes("扬子津校区")) {
  throw new Error("Saving the profile did not automatically lock and focus the campus on the map.");
}
if (!lockedLocationText.includes("校区位置已锁定")) {
  throw new Error("Saved campus location is not marked as locked in the student inspector.");
}
const savedProfileText = await editorPage.locator(".student-inspector").innerText();
if (
  !savedProfileText.includes("中国语言文学") ||
  !savedProfileText.includes("扬子津校区") ||
  !savedProfileText.includes("顶峰相见")
) {
  throw new Error("Saved profile fields were not reflected in the student inspector.");
}
const storedProfile = await editorPage.evaluate(() => {
  const key = "tianyi-graduation-profile-overrides-v1";
  return JSON.parse(window.localStorage.getItem(key) ?? "{}");
});
if (
  storedProfile["43"]?.major !== "中国语言文学" ||
  storedProfile["43"]?.campus !== "扬子津校区" ||
  storedProfile["43"]?.coordinates?.[0] !== 32.34439 ||
  storedProfile["43"]?.coordinates?.[1] !== 119.40565
) {
  throw new Error("Profile override was not persisted to localStorage.");
}

await editorPage.getByRole("button", { name: "在地图中查看", exact: true }).click();
await editorPage.waitForTimeout(1300);
const selectedMarkerLabel =
  (await editorPage.locator(".leaflet-school-marker-tile.is-selected").getAttribute("aria-label")) ??
  "";
if (!selectedMarkerLabel.includes("扬子津校区")) {
  throw new Error(`Map did not use the edited campus location: ${selectedMarkerLabel}`);
}
await editorPage.screenshot({ path: path.join(outputDir, "desktop-profile-edited-map.png") });

await editorPage.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
await editorPage.waitForTimeout(700);
await editorPage.getByRole("button", { name: "同学名录", exact: true }).click();
const persistedSearch = editorPage.getByPlaceholder("搜索姓名或院校");
await persistedSearch.fill("吴运飞");
await persistedSearch.press("Enter");
await editorPage.waitForTimeout(250);
await editorPage.locator(".directory-table tbody tr").first().click();
const persistedProfileText = await editorPage.locator(".student-inspector").innerText();
if (!persistedProfileText.includes("中国语言文学")) {
  throw new Error("Profile did not remain after page reload.");
}
await editorPage.screenshot({ path: path.join(outputDir, "desktop-profile-persisted.png") });

await persistedSearch.fill("施翰尧");
await persistedSearch.press("Enter");
await editorPage.waitForTimeout(250);
await editorPage.locator(".directory-table tbody tr").first().click();
await editorPage.getByRole("button", { name: "编辑个人资料", exact: true }).click();
await editorPage.waitForTimeout(500);
const shiCampusIndexLabels = await editorPage
  .locator(".profile-campus-index-list button")
  .allInnerTexts();
for (const requiredCampus of ["仙林校区", "汉中门校区", "泰州校区"]) {
  if (!shiCampusIndexLabels.includes(requiredCampus)) {
    throw new Error(`Campus index is missing ${requiredCampus}: ${JSON.stringify(shiCampusIndexLabels)}`);
  }
}
await editorPage.getByLabel("校区名称").fill("泰州校区");
await editorPage.waitForTimeout(350);
const shiCampus = {
  campus: await editorPage.getByLabel("校区名称").inputValue(),
  city: await editorPage.getByLabel("城市").inputValue(),
  address: await editorPage.getByLabel("校区地址").inputValue(),
  latitude: await editorPage.getByLabel("纬度 Latitude").inputValue(),
  longitude: await editorPage.getByLabel("经度 Longitude").inputValue(),
};
if (
  shiCampus.campus !== "泰州校区" ||
  shiCampus.city !== "泰州" ||
  !shiCampus.address.includes("匡时路6号") ||
  shiCampus.latitude !== "32.380690" ||
  shiCampus.longitude !== "119.892880"
) {
  throw new Error(`Taizhou campus automatic location failed: ${JSON.stringify(shiCampus)}`);
}
const personaOption = editorPage
  .locator(".profile-persona-options button")
  .filter({ hasText: "星夜" });
if (!(await personaOption.count())) {
  throw new Error("The starry persona option is missing.");
}
await personaOption.click();
await editorPage.waitForTimeout(200);
const selectedPersona = await personaOption.getAttribute("class");
if (!selectedPersona?.includes("is-active")) {
  throw new Error("Persona selection did not become active.");
}
await editorPage.screenshot({
  path: path.join(outputDir, "desktop-profile-shi-persona.png"),
});
await editorPage.getByRole("button", { name: "保存个人资料", exact: true }).click();
await editorPage.waitForTimeout(1100);
const storedShiAvatar = await editorPage.evaluate(
  () =>
    JSON.parse(
      window.localStorage.getItem("tianyi-graduation-profile-overrides-v1") ?? "{}",
    )["35"]?.avatar,
);
const inspectorAvatarLabel = await editorPage
  .locator(".student-inspector .avatar")
  .first()
  .getAttribute("aria-label");
if (storedShiAvatar !== "starry" || !inspectorAvatarLabel?.includes("星夜")) {
  throw new Error(
    `Persona was not persisted or rendered: ${JSON.stringify({
      storedShiAvatar,
      inspectorAvatarLabel,
    })}`,
  );
}
const shiMapMarkerLabel =
  (await editorPage.locator(".leaflet-school-marker-tile.is-selected").getAttribute("aria-label")) ??
  "";
if (!shiMapMarkerLabel.includes("南京中医药大学，泰州校区")) {
  throw new Error(`Taizhou campus was not focused on the map: ${shiMapMarkerLabel}`);
}
await editorPage.screenshot({
  path: path.join(outputDir, "desktop-profile-shi-taizhou-map.png"),
});
await editorPage.locator(".leaflet-breadcrumbs button").filter({ hasText: "全国" }).click();
await editorPage.waitForTimeout(1000);
const shiCountryPinLabel =
  (await editorPage
    .locator(".leaflet-selected-student-pin")
    .getAttribute("aria-label")) ?? "";
if (!shiCountryPinLabel.includes("施翰尧") || !shiCountryPinLabel.includes("泰州校区")) {
  throw new Error(`Selected student disappeared on the country map: ${shiCountryPinLabel}`);
}
await editorPage.screenshot({
  path: path.join(outputDir, "desktop-profile-shi-country-map.png"),
});
await editorPage.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
await editorPage.waitForTimeout(1100);
const reloadedShiPinLabel =
  (await editorPage
    .locator(".leaflet-selected-student-pin")
    .getAttribute("aria-label")) ?? "";
const reloadedInspectorText = await editorPage.locator(".student-inspector").innerText();
const reloadedShiAvatar =
  (await editorPage
    .locator(".leaflet-selected-student-pin")
    .getAttribute("data-avatar")) ?? "";
if (
  !reloadedShiPinLabel.includes("施翰尧") ||
  !reloadedShiPinLabel.includes("泰州校区") ||
  reloadedShiAvatar !== "starry" ||
  !reloadedInspectorText.includes("施翰尧")
) {
  throw new Error("Selected Taizhou student was not restored after reload.");
}
await editorPage.screenshot({
  path: path.join(outputDir, "desktop-profile-shi-country-reload.png"),
});
await editorPage
  .locator(".province-filter-row")
  .filter({ hasText: "江苏" })
  .click();
await editorPage.waitForTimeout(1800);
const taizhouCityMarker = editorPage.locator(
  '.leaflet-city-marker[aria-label^="泰州，"]',
);
const taizhouCityMarkerBox = await taizhouCityMarker.boundingBox();
const provinceMapBox = await editorPage.locator(".leaflet-map-canvas").boundingBox();
const taizhouCityVisible =
  taizhouCityMarkerBox &&
  provinceMapBox &&
  taizhouCityMarkerBox.x >= provinceMapBox.x &&
  taizhouCityMarkerBox.y >= provinceMapBox.y &&
  taizhouCityMarkerBox.x + taizhouCityMarkerBox.width <=
    provinceMapBox.x + provinceMapBox.width &&
  taizhouCityMarkerBox.y + taizhouCityMarkerBox.height <=
    provinceMapBox.y + provinceMapBox.height;
const taizhouCityLabel =
  (await taizhouCityMarker.getAttribute("aria-label")) ?? "";
if (!taizhouCityVisible || !taizhouCityLabel.includes("泰州，1 位同学")) {
  throw new Error(
    `Taizhou city point is outside the visible map: ${JSON.stringify({
      taizhouCityMarkerBox,
      provinceMapBox,
      taizhouCityLabel,
    })}`,
  );
}
await editorPage.screenshot({
  path: path.join(outputDir, "desktop-profile-shi-city-index.png"),
});
await editorPage.setViewportSize({ width: 320, height: 800 });
await editorPage.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
await editorPage.waitForTimeout(1200);
const compactPinBox = await editorPage
  .locator(".leaflet-selected-student-pin")
  .boundingBox();
const compactMapBox = await editorPage.locator(".map-canvas").boundingBox();
const compactPinInsideMap =
  compactPinBox &&
  compactMapBox &&
  compactPinBox.x >= compactMapBox.x &&
  compactPinBox.x + compactPinBox.width <= compactMapBox.x + compactMapBox.width + 1;
if (!compactPinInsideMap) {
  throw new Error(
    `Mobile selected student pin is clipped: ${JSON.stringify({
      compactPinBox,
      compactMapBox,
    })}`,
  );
}
await editorPage.locator(".recent-person").first().click();
await editorPage.waitForTimeout(650);
const mobileInspectorLayering = await editorPage.evaluate(() => {
  const inspector = document.querySelector(".student-inspector");
  const zoomControls = document.querySelector(".leaflet-zoom-controls");
  const inspectorRect = inspector.getBoundingClientRect();
  return {
    inspectorZ: Number(getComputedStyle(inspector).zIndex),
    zoomZ: Number(getComputedStyle(zoomControls).zIndex),
    topElementAtInspector:
      document.elementFromPoint(
        window.innerWidth / 2,
        inspectorRect.top + 40,
      )?.className ?? "",
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  };
});
if (
  mobileInspectorLayering.inspectorZ <= mobileInspectorLayering.zoomZ ||
  !String(mobileInspectorLayering.topElementAtInspector).includes("inspector") ||
  mobileInspectorLayering.documentWidth > mobileInspectorLayering.viewportWidth
) {
  throw new Error(
    `Mobile inspector still overlaps map controls: ${JSON.stringify(mobileInspectorLayering)}`,
  );
}
await editorPage.screenshot({
  path: path.join(outputDir, "mobile-inspector-fixed.png"),
});
await editorContext.close();

const zoomContext = await browser.newContext({
  viewport: { width: 1536, height: 1000 },
  deviceScaleFactor: 1,
});
const zoomPage = await zoomContext.newPage();
zoomPage.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    errors.push(`zoom ${message.type()}: ${message.text()}`);
  }
});
zoomPage.on("pageerror", (error) => errors.push(`zoom pageerror: ${error.message}`));
await zoomPage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
await zoomPage.waitForTimeout(1400);
const zoomState = () =>
  zoomPage.evaluate(() => ({
    zoom: Number.parseFloat(
      document.querySelector(".leaflet-zoom-controls span")?.textContent ?? "0",
    ),
    breadcrumbs: [...document.querySelectorAll(".leaflet-breadcrumbs button")].map(
      (element) => element.textContent.trim(),
    ),
    hasCityRail: Boolean(document.querySelector(".map-city-rail")),
    schoolMarkers: document.querySelectorAll(".leaflet-school-marker-tile").length,
    hasCountryStrip: Boolean(document.querySelector(".recent-strip")),
  }));
const zoomIn = zoomPage.getByRole("button", { name: "放大地图" });
const zoomOut = zoomPage.getByRole("button", { name: "缩小地图" });
let automaticZoomLevels = await zoomState();
for (
  let index = 0;
  index < 8 && automaticZoomLevels.breadcrumbs.length < 2;
  index += 1
) {
  await zoomIn.click({ force: true });
  await zoomPage.waitForTimeout(850);
  automaticZoomLevels = await zoomState();
}
if (
  automaticZoomLevels.breadcrumbs.length < 2 ||
  !automaticZoomLevels.hasCityRail
) {
  throw new Error(`Zoom-in did not enter a province: ${JSON.stringify(automaticZoomLevels)}`);
}
const automaticProvinceState = automaticZoomLevels;
const initialProvince = automaticZoomLevels.breadcrumbs.at(-1);
const zoomMapBox = await zoomPage.locator(".leaflet-map-canvas").boundingBox();
await zoomPage.mouse.move(
  zoomMapBox.x + zoomMapBox.width * 0.7,
  zoomMapBox.y + zoomMapBox.height * 0.5,
);
await zoomPage.mouse.down();
await zoomPage.mouse.move(
  zoomMapBox.x + zoomMapBox.width * 0.2,
  zoomMapBox.y + zoomMapBox.height * 0.5,
  { steps: 20 },
);
await zoomPage.mouse.up();
await zoomPage.waitForTimeout(1100);
automaticZoomLevels = await zoomState();
const pannedProvince = automaticZoomLevels.breadcrumbs.at(-1);
if (
  automaticZoomLevels.breadcrumbs.length < 2 ||
  pannedProvince === initialProvince
) {
  throw new Error(
    `Panning did not update the province: ${JSON.stringify({
      initialProvince,
      automaticZoomLevels,
    })}`,
  );
}
for (
  let index = 0;
  index < 16 && automaticZoomLevels.schoolMarkers === 0;
  index += 1
) {
  await zoomPage.getByRole("button", { name: "放大地图" }).click({ force: true });
  await zoomPage.waitForTimeout(500);
  automaticZoomLevels = await zoomState();
}
if (automaticZoomLevels.schoolMarkers === 0) {
  throw new Error(`Zoom-in did not enter a city: ${JSON.stringify(automaticZoomLevels)}`);
}
const automaticCityState = automaticZoomLevels;
for (
  let index = 0;
  index < 30 && automaticZoomLevels.zoom > 4.25;
  index += 1
) {
  await zoomOut.click({ force: true });
  await zoomPage.waitForTimeout(450);
  automaticZoomLevels = await zoomState();
}
if (
  automaticZoomLevels.zoom > 4.25 ||
  automaticZoomLevels.breadcrumbs.length !== 1 ||
  !automaticZoomLevels.hasCountryStrip
) {
  throw new Error(`Zoom-out did not return to country: ${JSON.stringify(automaticZoomLevels)}`);
}
await zoomPage.screenshot({
  path: path.join(outputDir, "desktop-auto-zoom-country.png"),
});
await zoomContext.close();

await writeFile(
  path.join(outputDir, "qa-report.json"),
  JSON.stringify(
    {
      errors,
      provinceValue,
      polygonProvinceValue,
      directProfileName,
      profileName,
      cityResultText,
      focusedMapZoom,
      automaticProvinceState,
      automaticCityState,
      automaticZoomLevels,
      tabletMetrics,
      narrowTabletMetrics,
      overlaps: {
        desktopCities: desktopCityLabelOverlapPairs,
        desktopSchools: citySchoolOverlapPairs,
        mobileCities: mobileCityMarkerOverlapPairs,
        mobileSchools: mobileSchoolOverlapPairs,
      },
      overlapDetails: {
        mobileSchools: mobileSchoolOverlapDetails,
      },
      mobileMetrics: {
        ...mobileMetrics,
        compactCityMarkerCount,
      },
      profileEditing: {
        saved: true,
        persistedAfterReload: true,
        mapLinkCoordinates,
        autoMatchedCampus,
        unknownCampusBlocked: true,
        shiCampus,
        shiCampusIndexLabels,
        selectedPersona,
        storedShiAvatar,
        inspectorAvatarLabel,
        reloadedShiAvatar,
        shiMapMarkerLabel,
        shiCountryPinLabel,
        reloadedShiPinLabel,
        taizhouCityLabel,
        taizhouCityMarkerBox,
        compactPinInsideMap,
        mobileInspectorLayering,
        mapUpdated: selectedMarkerLabel,
        autoLockedAfterSave: autoMapVisible && Boolean(autoSelectedMarkerLabel),
        lockedLocationText,
        beforeMapPick,
        afterMapPick,
        mobileEditorMetrics,
      },
    },
    null,
    2,
  ),
  "utf8",
);

await browser.close();
