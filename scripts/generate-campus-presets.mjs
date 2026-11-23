import { writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import { schoolLocations } from "../src/data/school-locations.js";
import { students as baseStudents } from "../src/data/students.js";

const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const excludedNamePattern =
  /(?:门|楼|馆|站|停车场|广场|食堂|宿舍|医院|服务中心|学院\()/;
const sublocationPattern =
  /(?:会议中心|餐厅|体育|活动中心|幼儿园|咖啡|快递|超市|生活区|教学楼|实验楼|图书馆|停车场|食堂|宿舍|医院|附属|学院|驿站|中心)/;

function normalizeName(value) {
  return String(value ?? "")
    .replace(/扬州大学|江苏(?:省)?扬州市?/g, "")
    .replace(/校区/g, "")
    .replace(/[\s()（）·,，-]/g, "")
    .toLowerCase();
}

function normalizeAdminName(value) {
  return String(value ?? "")
    .replace(/(?:特别行政区|自治区|自治州|地区|省|市)$/g, "")
    .trim();
}

function extractCampusName(name, school) {
  const remainder = name.slice(name.indexOf(school) + school.length).trim();
  const parenthetical = remainder.match(/^[((]([^()]+)[))]/)?.[1];
  return (parenthetical ?? remainder).replace(/[（(].*$/, "").trim();
}

function parseRouteCoordinates(result) {
  const pair =
    result?.ext?.detail_info?.travel_info?.poi_acc_mis?.route_end_list
      ?.split(";")[0]
      ?.split(",")
      .map(Number) ?? [];
  if (pair.length !== 2 || pair.some((value) => !Number.isFinite(value))) return null;
  return [pair[1], pair[0]];
}

function isCampusLabel(name, school) {
  const campus = extractCampusName(name, school);
  return (
    campus &&
    /(校区|分校)/.test(campus) &&
    !sublocationPattern.test(campus) &&
    !/[-－].+/.test(campus)
  );
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const output = {};

for (const [school, location] of Object.entries(schoolLocations)) {
  const schoolStudent = baseStudents.find((student) => student.school === school);
  const presets = [
    {
      campus: location.campus,
      aliases: [location.campus],
      address: location.address,
      coordinates: location.coordinates,
      city: schoolStudent?.city ?? "",
      province: schoolStudent?.province ?? "",
    },
  ];
  const campusCandidates = new Map();
  const suggestionQueries = [
    school,
    `${school} 校区`,
    `${school} 新校区`,
    `${school} 分校`,
    `${school} 东校区`,
    `${school} 西校区`,
    `${school} 南校区`,
    `${school} 北校区`,
  ];

  for (const query of suggestionQueries) {
    try {
      const response = await context.request.get(
        `https://map.baidu.com/su?wd=${encodeURIComponent(query)}&cid=0&type=0`,
        { timeout: 20000 },
      );
      const data = await response.json();
      for (const suggestion of data.s ?? []) {
        const [cityName, , , name, cityId] = suggestion.split("$");
        if (!name) continue;
        if (!name.startsWith(school) || !/(校区|分校)/.test(name)) continue;
        if (excludedNamePattern.test(name)) continue;
        if (!isCampusLabel(name, school)) continue;
        campusCandidates.set(name, { cityName, cityId });
      }
    } catch (error) {
      console.warn(`${school} (${query}): ${error.message}`);
    }
  }

  for (const [candidateName, suggestion] of campusCandidates) {
    try {
      const response = await context.request.get(
        `https://map.baidu.com/?qt=s&wd=${encodeURIComponent(candidateName)}` +
          `&rn=10&ie=utf-8&c=${suggestion.cityId}`,
        { timeout: 20000 },
      );
      const data = await response.json();
      const target = normalizeName(candidateName);
      const result = (data.content ?? []).find((item) => {
        const name = normalizeName(item.name);
        return name === target || name.startsWith(target);
      });
      if (!result) continue;
      const coordinates = parseRouteCoordinates(result);
      if (!coordinates) continue;
      const campus = extractCampusName(candidateName, school);
      if (!isCampusLabel(candidateName, school)) continue;
      if (presets.some((preset) => normalizeName(preset.campus) === normalizeName(campus))) {
        continue;
      }
      presets.push({
        campus,
        aliases: [candidateName],
        address: result.addr || location.address,
        coordinates,
        city: normalizeAdminName(
          result.admin_info?.city_name ?? result.city_name ?? suggestion.cityName,
        ),
        province: normalizeAdminName(result.admin_info?.province_name),
      });
    } catch (error) {
      console.warn(`${school} (${candidateName}): ${error.message}`);
    }
  }

  output[school] = presets;
}

await browser.close();
await writeFile(
  new URL("../src/data/campus-preset-catalog.js", import.meta.url),
  `// Generated from Baidu Maps campus POIs on 2026-11-23.\n` +
    `// This is a static offline catalog; the application does not call Baidu at runtime.\n` +
    `export const generatedCampusPresets = ${JSON.stringify(output, null, 2)};\n`,
  "utf8",
);

console.log(
  Object.entries(output)
    .map(([school, presets]) => `${school}: ${presets.length}`)
    .join("\n"),
);
