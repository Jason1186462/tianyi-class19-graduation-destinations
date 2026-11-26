import { useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";
import LeafletChinaMap from "./LeafletChinaMap";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import { colorForProvince } from "../lib/theme";
import { provinceCounts, provinceOrder } from "../lib/data";
import { groupStudentsByCampus } from "../lib/profiles";

const scopes = [
  { id: "all", label: "全部" },
  { id: "inside", label: "省内" },
  { id: "outside", label: "省外" },
];

export default function MapView({
  students,
  scope,
  onScopeChange,
  selectedProvince,
  onProvinceSelect,
  externalFocusRequest,
  selectedStudent,
  onSelectStudent,
  onOpenInspector,
}) {
  const [recentOffset, setRecentOffset] = useState(0);
  const [focusRequest, setFocusRequest] = useState(null);
  const [activeCity, setActiveCity] = useState(null);
  const [schoolOpenRequest, setSchoolOpenRequest] = useState(null);

  useEffect(() => {
    if (focusRequest && focusRequest.province !== selectedProvince) {
      setFocusRequest(null);
    }
  }, [focusRequest, selectedProvince]);

  useEffect(() => {
    if (externalFocusRequest?.city) {
      setActiveCity(externalFocusRequest.city);
    }
  }, [externalFocusRequest]);

  useEffect(() => {
    if (!activeCity) return;
    const belongsToProvince = students.some(
      (student) => student.city === activeCity && student.province === selectedProvince,
    );
    if (!belongsToProvince) setActiveCity(null);
  }, [activeCity, selectedProvince, students]);

  useEffect(() => {
    setSchoolOpenRequest(null);
  }, [activeCity]);

  const scopeStudents = useMemo(() => {
    let filtered = students;
    if (scope === "inside") filtered = filtered.filter((student) => student.province === "江苏");
    if (scope === "outside") filtered = filtered.filter((student) => student.province !== "江苏");
    return filtered;
  }, [scope, students]);

  const filteredStudents = useMemo(() => {
    let filtered = scopeStudents;
    if (selectedProvince !== "全部") {
      filtered = filtered.filter((student) => student.province === selectedProvince);
    }
    return filtered;
  }, [scopeStudents, selectedProvince]);

  const cityCounts = useMemo(
    () =>
      filteredStudents.reduce((counts, student) => {
        counts[student.city] = (counts[student.city] ?? 0) + 1;
        return counts;
      }, {}),
    [filteredStudents],
  );

  const cityRailItems = Object.entries(cityCounts).sort(
    ([cityA, countA], [cityB, countB]) =>
      countB - countA || cityA.localeCompare(cityB, "zh-CN"),
  );
  const cityScopeProvince =
    selectedProvince === "全部" ? selectedStudent?.province : selectedProvince;
  const citiesInScope = cityRailItems.filter(([city]) =>
    students.some((student) => student.city === city && student.province === cityScopeProvince),
  );
  const visibleCityRailItems =
    selectedProvince === "全部" ? citiesInScope.slice(0, 6) : citiesInScope;

  const schoolRailItems = useMemo(() => {
    if (!activeCity) return [];
    return groupStudentsByCampus(filteredStudents, activeCity).sort(
      (groupA, groupB) =>
        groupB.students.length - groupA.students.length ||
        groupA.school.localeCompare(groupB.school, "zh-CN") ||
        groupA.location.campus.localeCompare(groupB.location.campus, "zh-CN"),
    );
  }, [activeCity, filteredStudents]);

  const activeCityStudentCount = schoolRailItems.reduce(
    (count, group) => count + group.students.length,
    0,
  );

  const recentStudents = useMemo(() => {
    const preferred = ["陈羿贺", "宋佳怡", "洪隽泽", "蔡宛吟", "张梦妮", "刘帅"];
    const named = preferred
      .map((name) => filteredStudents.find((student) => student.name === name))
      .filter(Boolean);
    return [...named, ...filteredStudents].filter(
      (student, index, list) =>
        list.findIndex((item) => item.id === student.id) === index,
    );
  }, [filteredStudents]);

  const visibleRecent = Array.from(
    { length: Math.min(3, recentStudents.length) },
    (_, index) => recentStudents[(index + recentOffset) % recentStudents.length],
  ).filter(Boolean);

  function focusCity(city) {
    const firstStudent = filteredStudents.find((student) => student.city === city);
    if (!firstStudent) return;
    onProvinceSelect(firstStudent.province);
    onSelectStudent(firstStudent.id);
    setActiveCity(city);
    setSchoolOpenRequest(null);
    setFocusRequest({
      city,
      school: firstStudent.school,
      province: firstStudent.province,
      campus: firstStudent.campus,
      coordinates: firstStudent.coordinates,
      mode: "city",
      nonce: Date.now(),
    });
  }

  function handleProvinceChange(province) {
    setFocusRequest(null);
    setActiveCity(null);
    setSchoolOpenRequest(null);
    onProvinceSelect(province);
  }

  function resetMapContext() {
    setFocusRequest(null);
    setActiveCity(null);
    setSchoolOpenRequest(null);
    onScopeChange("all");
    onProvinceSelect("全部");
  }

  function handleAutoRegionChange({ province = "全部", city = null }) {
    setFocusRequest(null);
    setSchoolOpenRequest(null);
    setActiveCity(city);
    onProvinceSelect(province || "全部");
  }

  return (
    <main className="map-main">
      <div className="map-heading-row">
        <div>
          <h1>去向有迹，相逢有时</h1>
          <p>
            从无锡出发，去往 <strong>13</strong> 个省级地区
          </p>
        </div>
        <div className="map-mobile-filter">
          <button
            type="button"
            onClick={() => handleProvinceChange(selectedProvince === "全部" ? "江苏" : "全部")}
          >
            {selectedProvince === "全部" ? "江苏" : "全部"}
          </button>
        </div>
      </div>

      <div className="map-inline-metrics" aria-label="班级去向概览">
        <span><b>55</b> 位同学</span>
        <span><b>13</b> 个省级地区</span>
        <span><b>34</b> 所院校</span>
        <span><b>71%</b> 留在江苏</span>
      </div>

      <div className="map-controls" aria-label="地图筛选">
        <div className="segment-control">
          {scopes.map((item) => (
            <button
              type="button"
              key={item.id}
              className={scope === item.id ? "is-active" : ""}
              onClick={() => onScopeChange(item.id)}
              aria-pressed={scope === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="province-select">
          <span className="visually-hidden">按省份筛选</span>
          <select
            value={selectedProvince}
            onChange={(event) => handleProvinceChange(event.target.value)}
          >
            <option value="全部">按省份</option>
            <option value="江苏">江苏 39</option>
            <option value="北京">北京 3</option>
            <option value="陕西">陕西 2</option>
            <option value="湖北">湖北 2</option>
            <option value="天津">天津 1</option>
            <option value="河北">河北 1</option>
            <option value="山东">山东 1</option>
            <option value="四川">四川 1</option>
            <option value="湖南">湖南 1</option>
            <option value="江西">江西 1</option>
            <option value="海南">海南 1</option>
            <option value="安徽">安徽 1</option>
            <option value="浙江">浙江 1</option>
          </select>
          <ChevronDownIcon size={15} />
        </label>
        <span className="map-result-count" aria-live="polite">
          {activeCity ? `${activeCity} · ${activeCityStudentCount} 人` : `${filteredStudents.length} 人`}
        </span>
      </div>

      <div className="mobile-province-strip" aria-label="按省份快速筛选">
        <button
          type="button"
          className={selectedProvince === "全部" ? "is-active" : ""}
          onClick={() => handleProvinceChange("全部")}
        >
          全部 <b>{students.length}</b>
        </button>
        {provinceOrder.map((province) => (
          <button
            type="button"
            className={selectedProvince === province ? "is-active" : ""}
            key={province}
            onClick={() => handleProvinceChange(province)}
          >
            {province} <b>{provinceCounts[province]}</b>
          </button>
        ))}
      </div>

      <section className="map-canvas" aria-label="中国毕业去向地图">
        <LeafletChinaMap
          filteredStudents={filteredStudents}
          provinceStudents={scopeStudents}
          selectedProvince={selectedProvince}
          selectedStudent={selectedStudent}
          activeCity={activeCity}
          schoolOpenRequest={schoolOpenRequest}
          focusRequest={externalFocusRequest ?? focusRequest}
          onProvinceSelect={handleProvinceChange}
          onCitySelect={focusCity}
          onAutoRegionChange={handleAutoRegionChange}
          onResetMapContext={resetMapContext}
          onStudentOpen={(studentId) => {
            onSelectStudent(studentId);
            onOpenInspector();
          }}
        />

      </section>

      {selectedProvince !== "全部" && (
        <section
          className={`map-city-rail ${activeCity ? "is-school-rail" : ""}`}
          aria-label={activeCity ? "院校层级" : "城市层级"}
        >
          <span className="map-city-rail-title">{activeCity ? "院校" : "城市"}</span>
          <div className="map-city-rail-list">
            {activeCity
              ? schoolRailItems.map((group) => (
                  <button
                    type="button"
                    className="school-rail-item"
                    title={group.students.map((student) => student.name).join("、")}
                    aria-label={`${group.school}，${group.location.campus}，${group.students.length} 位同学：${group.students
                      .map((student) => student.name)
                      .join("、")}`}
                    key={group.groupKey}
                    onClick={() => {
                      if (group.students.length === 1) {
                        onSelectStudent(group.students[0].id);
                        onOpenInspector();
                      } else {
                        setSchoolOpenRequest({
                          groupKey: group.groupKey,
                          nonce: Date.now(),
                        });
                      }
                    }}
                  >
                    <span className="school-rail-name">
                      {group.school}
                      <small>{group.location.campus}</small>
                    </span>
                    <b>{group.students.length}</b>
                  </button>
                ))
              : visibleCityRailItems.map(([city, count]) => (
                  <button
                    type="button"
                    className={`city-rail-item ${
                      selectedStudent?.city === city ? "is-active" : ""
                    }`}
                    key={city}
                    onClick={() => focusCity(city)}
                  >
                    <i
                      style={{
                        "--city-color": colorForProvince(
                          students.find((student) => student.city === city)?.province ?? "江苏",
                        ),
                      }}
                    />
                    <span>{city}</span>
                    <b>{count}</b>
                  </button>
                ))}
          </div>
        </section>
      )}

      {selectedProvince === "全部" && <section className="recent-strip" aria-label="最近关注">
        <h2>最近关注</h2>
        <div className="recent-people">
          {visibleRecent.map((student) => (
            <button
              type="button"
              className={`recent-person ${selectedStudent?.id === student.id ? "is-active" : ""}`}
              key={student.id}
              onClick={() => {
                onSelectStudent(student.id);
                onOpenInspector();
              }}
            >
              <Avatar
                name={student.name}
                avatarId={student.avatar}
                size={42}
              />
              <span>
                <b>{student.name}</b>
                <small>{student.school}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="strip-pagination">
          <button
            type="button"
            className="round-button"
            onClick={() =>
              setRecentOffset((offset) => Math.max(0, offset - 1))
            }
            disabled={recentOffset === 0}
            aria-label="上一组最近关注"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            className="round-button"
            onClick={() =>
              setRecentOffset((offset) =>
                recentStudents.length ? (offset + 1) % recentStudents.length : 0,
              )
            }
            aria-label="下一组最近关注"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </section>}
    </main>
  );
}
