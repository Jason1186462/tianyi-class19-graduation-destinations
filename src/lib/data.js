import { cityCoordinates, origin, students } from "../data/students.js";

export const provinceOrder = [
  "江苏",
  "北京",
  "陕西",
  "湖北",
  "天津",
  "河北",
  "山东",
  "四川",
  "湖南",
  "江西",
  "海南",
  "安徽",
  "浙江",
];

export const provinceRegion = {
  江苏: "华东",
  北京: "华北",
  陕西: "西北",
  湖北: "华中",
  天津: "华北",
  河北: "华北",
  山东: "华东",
  四川: "西南",
  湖南: "华中",
  江西: "华东",
  海南: "华南",
  安徽: "华东",
  浙江: "华东",
};

export function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export const provinceCounts = countBy(students, "province");
export const cityCounts = countBy(students, "city");
export const schoolCounts = countBy(students, "school");

export const sortedProvinces = Object.entries(provinceCounts).sort(
  ([provinceA, countA], [provinceB, countB]) =>
    countB - countA ||
    provinceOrder.indexOf(provinceA) - provinceOrder.indexOf(provinceB),
);

export const sortedCities = Object.entries(cityCounts).sort(
  ([cityA, countA], [cityB, countB]) => countB - countA || cityA.localeCompare(cityB, "zh-CN"),
);

export const sortedSchools = Object.entries(schoolCounts).sort(
  ([schoolA, countA], [schoolB, countB]) =>
    countB - countA || schoolA.localeCompare(schoolB, "zh-CN"),
);

export const classSummary = {
  students: students.length,
  provinces: new Set(students.map((student) => student.province)).size,
  schools: new Set(students.map((student) => student.school)).size,
  jiangsu: provinceCounts.江苏,
  jiangsuPercent: Math.round((provinceCounts.江苏 / students.length) * 100),
  multiStudentSchools: sortedSchools.filter(([, count]) => count >= 2).length,
  topCity: sortedCities[0][0],
  topCityCount: sortedCities[0][1],
};

export function studentsForSchool(school, studentList = students) {
  return studentList.filter((student) => student.school === school);
}

export function classmatesInSchool(selectedStudent, studentList = students) {
  return studentList.filter(
    (student) => student.school === selectedStudent.school && student.id !== selectedStudent.id,
  );
}

export function sameCitySuggestions(selectedStudent, studentList = students, limit = 3) {
  const sameCity = studentList.filter(
    (student) => student.id !== selectedStudent.id && student.city === selectedStudent.city,
  );
  const sameProvince = studentList.filter(
    (student) =>
      student.id !== selectedStudent.id &&
      student.province === selectedStudent.province &&
      student.city !== selectedStudent.city,
  );
  return [...sameCity, ...sameProvince, ...studentList].filter(
    (student, index, list) =>
      student.id !== selectedStudent.id &&
      list.findIndex((item) => item.id === student.id) === index,
  ).slice(0, limit);
}

export function searchStudents(query, studentList = students) {
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  if (!normalized) return studentList;
  return studentList.filter((student) =>
    `${student.name} ${student.school} ${student.city} ${student.province} ${student.major ?? ""} ${student.campus ?? ""}`
      .toLocaleLowerCase("zh-CN")
      .includes(normalized),
  );
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function distanceFromOrigin(target) {
  const [lon1, lat1] = origin.coordinates;
  let targetCoordinates;
  if (Array.isArray(target)) {
    targetCoordinates = [Number(target[1]), Number(target[0])];
  } else if (target && Array.isArray(target.coordinates)) {
    targetCoordinates = [
      Number(target.coordinates[1]),
      Number(target.coordinates[0]),
    ];
  } else {
    targetCoordinates = cityCoordinatesFromStudentCity(target);
  }
  const [lon2, lat2] = targetCoordinates;
  if (![lon2, lat2].every(Number.isFinite)) return 0;
  const earthRadius = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function cityCoordinatesFromStudentCity(city) {
  const found = students.find((student) => student.city === city);
  if (!found) return origin.coordinates;
  return cityCoordinates[city] ?? origin.coordinates;
}

export { students, origin };
