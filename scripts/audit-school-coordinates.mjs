import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { schoolLocations } from "../src/data/school-locations.js";

const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.resolve("preview");

function distanceKm([latA, lonA], [latB, lonB]) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const deltaLat = toRadians(latB - latA);
  const deltaLon = toRadians(lonB - lonA);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latA)) *
      Math.cos(toRadians(latB)) *
      Math.sin(deltaLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});
const context = await browser.newContext();
const audit = [];

for (const [school, location] of Object.entries(schoolLocations)) {
  const query = `${school} ${location.campus}`;
  const url =
    "https://photon.komoot.io/api/?limit=3" +
    `&q=${encodeURIComponent(query)}` +
    `&lat=${location.coordinates[0]}` +
    `&lon=${location.coordinates[1]}`;
  let candidates = [];

  try {
    const response = await context.request.get(url, {
      headers: { "User-Agent": "TianyiGraduationMap/1.0" },
      timeout: 18000,
    });
    if (response.ok()) {
      const data = await response.json();
      candidates = (data.features ?? []).map((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        return {
          name: feature.properties.name ?? "",
          label: [
            feature.properties.street,
            feature.properties.locality,
            feature.properties.district,
            feature.properties.city,
            feature.properties.state,
          ]
            .filter(Boolean)
            .join(" · "),
          coordinates: [latitude, longitude],
          distanceKm: distanceKm(location.coordinates, [latitude, longitude]),
        };
      });
    }
  } catch (error) {
    candidates = [{ error: error.message }];
  }

  audit.push({
    school,
    campus: location.campus,
    address: location.address,
    currentCoordinates: location.coordinates,
    query,
    candidates,
  });
  console.log(`${school}: ${candidates[0]?.distanceKm ?? "no result"}`);
}

await writeFile(
  path.join(outputDir, "school-coordinate-audit.json"),
  JSON.stringify(audit, null, 2),
  "utf8",
);
await browser.close();
