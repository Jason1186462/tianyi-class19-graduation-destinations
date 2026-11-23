import { ChevronRightIcon } from "./Icons";
import {
  classSummary,
  provinceCounts,
  provinceOrder,
  students,
} from "../lib/data";
import { colorForProvince } from "../lib/theme";

const orderedProvinceRows = provinceOrder.map((province) => [
  province,
  provinceCounts[province],
]);

export default function SummaryRail({ selectedProvince, onProvinceSelect }) {
  return (
    <aside className="summary-rail" aria-label="班级去向概览">
      <section className="metrics-strip" aria-label="班级数据">
        <div className="metric">
          <strong>{classSummary.students}</strong>
          <span>位同学</span>
        </div>
        <div className="metric">
          <strong>{classSummary.provinces}</strong>
          <span>个省级地区</span>
        </div>
        <div className="metric">
          <strong>{classSummary.schools}</strong>
          <span>所院校</span>
        </div>
      </section>

      <section className="province-progress">
        <div className="progress-label">
          <span>江苏省内</span>
          <strong>
            {classSummary.jiangsu} 人 · {classSummary.jiangsuPercent}%
          </strong>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${classSummary.jiangsuPercent}%` }} />
        </div>
      </section>

      <section className="rail-section">
        <div className="rail-section-heading">
          <h2>各省份人数</h2>
          <span>{students.length} 人</span>
        </div>
        <div className="province-filter-list">
          <button
            type="button"
            className={`province-filter-row all-provinces-row ${
              selectedProvince === "全部" ? "is-active" : ""
            }`}
            onClick={() => onProvinceSelect("全部")}
          >
            <span className="province-dot all-dot" />
            <span>全部去向</span>
            <b>{students.length}</b>
            <ChevronRightIcon size={15} />
          </button>
          {orderedProvinceRows.map(([province, count]) => (
            <button
              type="button"
              className={`province-filter-row ${
                selectedProvince === province ? "is-active" : ""
              }`}
              onClick={() => onProvinceSelect(province)}
              key={province}
              aria-pressed={selectedProvince === province}
            >
              <span
                className="province-dot"
                style={{ "--province-color": colorForProvince(province) }}
              />
              <span>{province}</span>
              <b>{count}</b>
              <ChevronRightIcon size={15} />
            </button>
          ))}
        </div>
      </section>

      <p className="rail-source">数据来源：班级毕业去向表 · 共 55 位同学</p>
    </aside>
  );
}
