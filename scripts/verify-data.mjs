import {
  classSummary,
  provinceCounts,
  sortedCities,
  sortedSchools,
  students,
} from "../src/lib/data.js";
import {
  findCampusPreset,
  getCampusPresets,
  schoolLocations,
} from "../src/data/school-locations.js";

const expected = {
  students: 55,
  provinces: 13,
  schools: 34,
  jiangsu: 39,
  jiangsuPercent: 71,
  multiStudentSchools: 11,
  topCity: "南京",
  topCityCount: 21,
};

const failures = [];
for (const [key, value] of Object.entries(expected)) {
  const actual = classSummary[key];
  if (JSON.stringify(actual) !== JSON.stringify(value)) {
    failures.push(`${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`);
  }
}

if (provinceCounts.江苏 !== 39) failures.push(`江苏 count: ${provinceCounts.江苏}`);
if (sortedCities[0][0] !== "南京" || sortedCities[0][1] !== 21) {
  failures.push(`Top city: ${JSON.stringify(sortedCities[0])}`);
}
if (sortedSchools[0][0] !== "南京林业大学" || sortedSchools[0][1] !== 5) {
  failures.push(`Top school: ${JSON.stringify(sortedSchools[0])}`);
}
if (students.some((student) => !student.name || !student.school || !student.province || !student.city)) {
  failures.push("Each student must have a name, school, province, and city.");
}
if (new Set(students.map((student) => student.name)).size !== students.length) {
  failures.push("Student names must be unique.");
}
if (!students.some((student) => student.name === "吴运飞")) {
  failures.push("Corrected classmate name 吴运飞 is missing.");
}
if (students.some((student) => student.name === "吴云飞")) {
  failures.push("Legacy classmate name 吴云飞 still exists.");
}
const missingSchoolLocations = sortedSchools
  .map(([school]) => school)
  .filter((school) => !schoolLocations[school]);
if (missingSchoolLocations.length) {
  failures.push(`Missing school locations: ${missingSchoolLocations.join(", ")}`);
}
const missingCampusIndexes = sortedSchools
  .map(([school]) => school)
  .filter((school) => getCampusPresets(school).length === 0);
if (missingCampusIndexes.length) {
  failures.push(`Schools without campus indexes: ${missingCampusIndexes.join(", ")}`);
}
const invalidCampusPresets = [];
let campusPresetCount = 0;
for (const [school] of sortedSchools) {
  for (const preset of getCampusPresets(school)) {
    campusPresetCount += 1;
    const [latitude, longitude] = preset.coordinates ?? [];
    if (
      !preset.campus ||
      !preset.address ||
      !preset.city ||
      !preset.province ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      invalidCampusPresets.push(`${school}/${preset.campus || "未命名校区"}`);
    }
  }
}
if (invalidCampusPresets.length) {
  failures.push(`Invalid campus presets: ${invalidCampusPresets.join(", ")}`);
}
const requiredCampusIndexes = {
  南京中医药大学: ["仙林校区", "汉中门校区", "泰州校区"],
  南京邮电大学: ["仙林校区", "三牌楼校区", "锁金村校区"],
  南京大学: ["仙林校区", "鼓楼校区", "浦口校区", "苏州校区"],
  中国矿业大学: ["南湖校区", "文昌校区"],
};
for (const [school, campuses] of Object.entries(requiredCampusIndexes)) {
  for (const campus of campuses) {
    if (!findCampusPreset(school, campus)) {
      failures.push(`Required campus index is missing: ${school}/${campus}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Data verified:", classSummary);
  console.log("Province counts:", provinceCounts);
  console.log(`Campus indexes: ${campusPresetCount}`);
  console.log("Top cities:", sortedCities.slice(0, 8));
  console.log("Top schools:", sortedSchools.slice(0, 12));
}
