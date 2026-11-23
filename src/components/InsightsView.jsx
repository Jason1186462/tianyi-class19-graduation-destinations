import { ArrowUpRightIcon, MapPinIcon } from "./Icons";
import {
  countBy,
  distanceFromOrigin,
  students as baseStudents,
  studentsForSchool,
} from "../lib/data";
import { colorForProvince } from "../lib/theme";

const cityColor = {
  南京: "#667f62",
  苏州: "#718783",
  扬州: "#9a9c6d",
  北京: "#4b7297",
  武汉: "#6d91ac",
  西安: "#c66b4c",
};

export default function InsightsView({ onOpenSchool, students = baseStudents }) {
  const provinceCounts = countBy(students, "province");
  const cityCounts = countBy(students, "city");
  const schoolCounts = countBy(students, "school");
  const sortedCities = Object.entries(cityCounts).sort(
    ([cityA, countA], [cityB, countB]) =>
      countB - countA || cityA.localeCompare(cityB, "zh-CN"),
  );
  const sortedSchools = Object.entries(schoolCounts).sort(
    ([schoolA, countA], [schoolB, countB]) =>
      countB - countA || schoolA.localeCompare(schoolB, "zh-CN"),
  );
  const summary = {
    students: students.length,
    provinces: new Set(students.map((student) => student.province)).size,
    schools: new Set(students.map((student) => student.school)).size,
    jiangsu: provinceCounts.江苏 ?? 0,
    jiangsuPercent: students.length
      ? Math.round(((provinceCounts.江苏 ?? 0) / students.length) * 100)
      : 0,
    multiStudentSchools: sortedSchools.filter(([, count]) => count >= 2).length,
    topCity: sortedCities[0]?.[0] ?? "",
    topCityCount: sortedCities[0]?.[1] ?? 0,
  };

  const provinceRows = Object.entries(provinceCounts).sort(
    ([, countA], [, countB]) => countB - countA,
  );

  const cityRows = sortedCities.filter(([, count]) => count >= 2).slice(0, 6);
  const otherCitiesCount = sortedCities
    .slice(cityRows.length)
    .reduce((total, [, count]) => total + count, 0);

  const schoolRows = sortedSchools.slice(0, 8);
  const otherSchoolsCount = sortedSchools
    .slice(schoolRows.length)
    .reduce((total, [, count]) => total + count, 0);

  const sharedSchoolGroups = sortedSchools
    .filter(([, count]) => count >= 2)
    .slice(0, 3)
    .map(([school, count]) => ({
      school,
      count,
      names: studentsForSchool(school, students).map((student) => student.name),
    }));

  const farthestStudent = [...students].sort(
    (studentA, studentB) =>
      distanceFromOrigin(studentB.coordinates) -
      distanceFromOrigin(studentA.coordinates),
  )[0];

  return (
    <main className="insights-main">
      <section className="insights-content">
        <div className="insights-heading">
          <h1>{students.length} 份去向，汇成一张地图</h1>
          <p>从省份、城市与院校三个角度，看见高三十九班的共同去向</p>
        </div>

        <section className="insight-block province-chart-block">
          <div className="insight-block-heading">
            <span>一</span>
            <h2>省份分布</h2>
            <small>共 {summary.provinces} 个省级地区</small>
          </div>
          <div className="province-bar-chart">
            {provinceRows.map(([province, count], index) => (
              <div
                className={`province-bar-row ${province === "江苏" ? "is-highlighted" : ""}`}
                key={province}
                style={{ "--row-delay": `${index * 28}ms` }}
              >
                <span className="province-bar-label">{province}</span>
                <span className="province-bar-track">
                  <i
                    style={{
                      "--bar-width": `${(count / Math.max(...Object.values(provinceCounts))) * 100}%`,
                      "--bar-color": colorForProvince(province),
                    }}
                  />
                </span>
                <b>{count}</b>
                <em>{Math.round((count / students.length) * 100)}%</em>
              </div>
            ))}
          </div>
        </section>

        <section className="insight-block city-chart-block">
          <div className="insight-block-heading">
            <span>二</span>
            <h2>城市集中度</h2>
            <div className="inline-legend">
              <span><i className="inside" />省内</span>
              <span><i className="outside" />省外</span>
            </div>
          </div>
          <div className="city-dot-grid">
            {cityRows.map(([city, count]) => (
              <button
                type="button"
                className="city-dot-item"
                key={city}
                onClick={() => onOpenSchool("全部", city)}
              >
                <span className="city-dot-title">
                  <b>{city}</b>
                  <strong>{count}</strong>
                </span>
                <span className="city-dot-track" aria-hidden="true">
                  {Array.from({ length: count }, (_, index) => (
                    <i
                      key={index}
                      style={{
                        "--dot-color": cityColor[city] ?? "#4b7297",
                      }}
                    />
                  ))}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="city-dot-item city-dot-other"
              onClick={() => onOpenSchool("全部")}
            >
              <span className="city-dot-title">
                <b>其他城市</b>
                <strong>{otherCitiesCount}</strong>
              </span>
              <span className="city-dot-track" aria-hidden="true">
                {Array.from({ length: Math.min(otherCitiesCount, 12) }, (_, index) => (
                  <i key={index} />
                ))}
                {otherCitiesCount > 12 && <small>+{otherCitiesCount - 12}</small>}
              </span>
            </button>
          </div>
        </section>

        <section className="insight-block school-chart-block">
          <div className="insight-block-heading">
            <span>三</span>
            <h2>院校集中度</h2>
            <small>按人数排序</small>
          </div>
          <div className="school-chart-table">
            <div className="school-chart-head">
              <span>院校</span>
              <span>人数</span>
              <span>占比</span>
            </div>
            {[...schoolRows, ["其他院校", otherSchoolsCount]].map(
              ([school, count], index) => (
                <button
                  type="button"
                  className={`school-chart-row ${school === "其他院校" ? "is-other" : ""}`}
                  key={school}
                  onClick={() => onOpenSchool(school === "其他院校" ? "全部" : school)}
                >
                  <span className="school-chart-name">
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    <b>{school}</b>
                    <i
                      style={{
                        "--school-bar": `${(count / sortedSchools[0][1]) * 100}%`,
                      }}
                    />
                  </span>
                  <span>{count}</span>
                  <span>{Math.round((count / students.length) * 100)}%</span>
                </button>
              ),
            )}
          </div>
        </section>
      </section>

      <aside className="insights-rail">
        <div className="insights-rail-heading">
          <h2>四组线索</h2>
          <p>不总结青春，只整理我们共同抵达的地方。</p>
        </div>

        <section className="key-finding">
            <h3>江苏是主要去向，{summary.jiangsu} 人留在省内</h3>
          <p>{summary.jiangsuPercent}% 的同学选择留在江苏，继续在家乡或省内发展。</p>
        </section>
        <section className="key-finding">
          <h3>
            {summary.topCity}最集中，{summary.topCityCount} 位同学
          </h3>
          <p>
            {Math.round((summary.topCityCount / students.length) * 100)}%
            的同学去了南京，成为班级最集中的城市。
          </p>
        </section>
        <section className="key-finding">
          <h3>{summary.schools} 所院校中，{summary.multiStudentSchools} 所接收 2 人及以上</h3>
          <p>多数同学独自出发，但也有不少熟悉的姓名在另一所校园再次相遇。</p>
        </section>
        <section className="key-finding farthest-finding">
          <h3>从无锡向南，最远去往海南</h3>
          <p>{farthestStudent.name} · {farthestStudent.school}</p>
          <div className="travel-arc" aria-label="从无锡到海南的去向路线">
            <span className="travel-endpoint start" />
            <svg viewBox="0 0 270 64" preserveAspectRatio="none" aria-hidden="true">
              <path d="M8 53 Q130 -2 260 53" />
            </svg>
            <span className="travel-endpoint end" />
            <small className="start-label">无锡</small>
            <small className="end-label">海南</small>
          </div>
        </section>

        <section className="shared-school-section">
          <div className="shared-school-heading">
            <h2>同校同行</h2>
            <MapPinIcon size={16} />
          </div>
          {sharedSchoolGroups.map((group) => (
            <button
              type="button"
              className="shared-school-group"
              key={group.school}
              onClick={() => onOpenSchool(group.school)}
            >
              <div>
                <b>{group.school}</b>
                <span>{group.count} 人</span>
              </div>
              <p>{group.names.join("、")}</p>
            </button>
          ))}
          <button type="button" className="insights-link" onClick={() => onOpenSchool("全部")}>
            在名录中查看同校同学
            <ArrowUpRightIcon size={15} />
          </button>
        </section>
      </aside>
    </main>
  );
}
