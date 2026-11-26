import { useEffect, useMemo, useState } from "react";
import Avatar from "./Avatar";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  FilterIcon,
  SortIcon,
} from "./Icons";
import { colorForProvince } from "../lib/theme";
import { searchStudents } from "../lib/data";

const PAGE_SIZE = 9;

export default function DirectoryView({
  students,
  searchQuery,
  selectedStudent,
  selectedProvince,
  selectedSchool,
  onProvinceChange,
  onSchoolChange,
  onSelectStudent,
  onOpenInspector,
  onClearFilters,
}) {
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchedStudents = useMemo(
    () => searchStudents(searchQuery, students),
    [searchQuery, students],
  );

  const provinceCounts = useMemo(
    () =>
      searchedStudents.reduce((counts, student) => {
        counts[student.province] = (counts[student.province] ?? 0) + 1;
        return counts;
      }, {}),
    [searchedStudents],
  );

  const provinceScopedStudents = useMemo(
    () =>
      selectedProvince === "全部"
        ? searchedStudents
        : searchedStudents.filter((student) => student.province === selectedProvince),
    [searchedStudents, selectedProvince],
  );

  const schoolOptions = useMemo(
    () =>
      Object.entries(
        provinceScopedStudents.reduce((counts, student) => {
          counts[student.school] = (counts[student.school] ?? 0) + 1;
          return counts;
        }, {}),
      )
        .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB, "zh-CN"))
        .slice(0, 6),
    [provinceScopedStudents],
  );

  const filteredStudents = useMemo(() => {
    const scoped =
      selectedSchool === "全部"
        ? provinceScopedStudents
        : provinceScopedStudents.filter((student) => student.school === selectedSchool);
    return [...scoped].sort((studentA, studentB) => {
      const result = studentA.school.localeCompare(studentB.school, "zh-CN");
      return sortDirection === "asc" ? result : -result;
    });
  }, [provinceScopedStudents, selectedSchool, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageStudents = filteredStudents.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedProvince, selectedSchool, sortDirection]);

  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  useEffect(() => {
    if (
      pageStudents.length &&
      !pageStudents.some((student) => student.id === selectedStudent?.id)
    ) {
      onSelectStudent(pageStudents[0].id);
    }
  }, [onSelectStudent, pageStudents, selectedStudent?.id]);

  function chooseProvince(province) {
    onProvinceChange(province);
    onSchoolChange("全部");
    setMobileFiltersOpen(false);
  }

  function chooseSchool(school) {
    onSchoolChange(school);
    setMobileFiltersOpen(false);
  }

  function selectRow(student) {
    onSelectStudent(student.id);
    onOpenInspector();
  }

  const filterContent = (
    <>
      <div className="filter-heading mobile-only">
        <h2>筛选同学</h2>
        <button
          type="button"
          className="icon-button"
          onClick={() => setMobileFiltersOpen(false)}
          aria-label="关闭筛选"
        >
          <CloseIcon />
        </button>
      </div>
      <section className="filter-section">
        <h2>省份筛选</h2>
        <div className="directory-province-list">
          <button
            type="button"
            className={`directory-filter-row ${selectedProvince === "全部" ? "is-active" : ""}`}
            onClick={() => chooseProvince("全部")}
          >
            <span>全部省份</span>
            <b>{searchedStudents.length}</b>
            <ChevronRightIcon size={14} />
          </button>
          {Object.entries(provinceCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([province, count]) => (
              <button
                type="button"
                className={`directory-filter-row ${
                  selectedProvince === province ? "is-active" : ""
                }`}
                key={province}
                onClick={() => chooseProvince(province)}
              >
                <span>{province}</span>
                <b>{count}</b>
                <ChevronRightIcon size={14} />
              </button>
            ))}
        </div>
      </section>

      <section className="filter-section school-filter-section">
        <h2>院校筛选</h2>
        <div className="school-filter-list">
          <button
            type="button"
            className={`school-filter-row ${selectedSchool === "全部" ? "is-active" : ""}`}
            onClick={() => chooseSchool("全部")}
          >
            <span>全部院校</span>
            <b>{new Set(provinceScopedStudents.map((student) => student.school)).size}</b>
            <ChevronRightIcon size={14} />
          </button>
          {schoolOptions.map(([school, count]) => (
            <button
              type="button"
              className={`school-filter-row ${
                selectedSchool === school ? "is-active" : ""
              }`}
              key={school}
              onClick={() => chooseSchool(school)}
            >
              <span>{school}</span>
              <b>{count}</b>
              <ChevronRightIcon size={14} />
            </button>
          ))}
        </div>
        <span className="filter-note">共 {new Set(students.map((student) => student.school)).size} 所院校</span>
      </section>

      {(selectedProvince !== "全部" || selectedSchool !== "全部" || searchQuery) && (
        <button
          type="button"
          className="clear-filters"
          onClick={() => {
            onClearFilters();
            setMobileFiltersOpen(false);
          }}
        >
          清除全部筛选
        </button>
      )}
    </>
  );

  return (
    <main className="directory-main">
      <aside className="directory-filter-rail" aria-label="同学筛选">
        {filterContent}
      </aside>

      {mobileFiltersOpen && (
        <div className="mobile-filter-backdrop" onClick={() => setMobileFiltersOpen(false)}>
          <aside
            className="mobile-filter-drawer"
            aria-label="筛选同学"
            onClick={(event) => event.stopPropagation()}
          >
            {filterContent}
          </aside>
        </div>
      )}

      <section className="directory-content">
        <div className="directory-heading">
          <div>
            <h1>{students.length} 位同学，各自远行</h1>
            <p>按省份、院校和姓名快速找到每一位同学的毕业去向</p>
          </div>
          <button
            type="button"
            className="mobile-filter-button"
            onClick={() => setMobileFiltersOpen(true)}
            aria-label="筛选同学"
          >
            <FilterIcon size={16} />
            <span>筛选</span>
            {(selectedProvince !== "全部" || selectedSchool !== "全部") && <i />}
          </button>
        </div>

        {searchQuery && (
          <div className="search-summary">
            <span>搜索“{searchQuery}”</span>
            <b>{filteredStudents.length} 条结果</b>
          </div>
        )}

        {pageStudents.length ? (
          <div className="directory-table-wrap">
            <table className="directory-table">
              <thead>
                <tr>
                  <th scope="col">同学</th>
                  <th scope="col" aria-sort={sortDirection === "asc" ? "ascending" : "descending"}>
                    <button
                      type="button"
                      className="sort-button"
                      onClick={() =>
                        setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))
                      }
                    >
                      毕业去向
                      <SortIcon size={14} />
                    </button>
                  </th>
                  <th scope="col">城市</th>
                  <th scope="col">省份</th>
                </tr>
              </thead>
              <tbody>
                {pageStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={selectedStudent?.id === student.id ? "is-active" : ""}
                    onClick={() => selectRow(student)}
                    tabIndex="0"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectRow(student);
                      }
                    }}
                    aria-label={`${student.name}，${student.school}，${student.city}，${student.province}`}
                  >
                    <td>
                      <div className="table-person">
                        <Avatar
                          name={student.name}
                          avatarId={student.avatar}
                          size={38}
                        />
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td className="school-cell">{student.school}</td>
                    <td>{student.city}</td>
                    <td>
                      <span className="province-table-cell">
                        <i
                          style={{
                            "--province-color": colorForProvince(student.province),
                          }}
                        />
                        {student.province}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="directory-list-mobile">
              {pageStudents.map((student) => (
                <button
                  type="button"
                  className={`directory-mobile-row ${
                    selectedStudent?.id === student.id ? "is-active" : ""
                  }`}
                  key={student.id}
                  onClick={() => selectRow(student)}
                >
                  <Avatar
                    name={student.name}
                    avatarId={student.avatar}
                    size={42}
                  />
                  <span className="mobile-row-primary">
                    <b>{student.name}</b>
                    <small>{student.school}</small>
                  </span>
                  <span className="mobile-row-secondary">
                    <b>{student.city}</b>
                    <small>{student.province}</small>
                  </span>
                  <ChevronRightIcon size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="directory-empty">
            <p>没有找到符合条件的同学。</p>
            <button
              type="button"
              onClick={() => {
                onClearFilters();
                setPage(0);
              }}
            >
              查看全部 55 位同学
            </button>
          </div>
        )}

        <footer className="directory-footer">
          <span>
            显示 <b>{filteredStudents.length}</b> / {students.length} 位同学
          </span>
          <div className="pagination">
            <button
              type="button"
              className="round-button square"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              aria-label="上一页"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <span>
              <b>{currentPage + 1}</b> / {pageCount}
            </span>
            <button
              type="button"
              className="round-button square"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
              aria-label="下一页"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
