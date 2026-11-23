import {
  countBy,
  students as baseStudents,
} from "./data";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildMemorialHtml(studentList = baseStudents) {
  const provinceCounts = countBy(studentList, "province");
  const schoolCounts = countBy(studentList, "school");
  const sortedSchools = Object.entries(schoolCounts).sort(
    ([, countA], [, countB]) => countB - countA,
  );
  const jiangsu = provinceCounts.江苏 ?? 0;
  const summary = {
    students: studentList.length,
    provinces: new Set(studentList.map((student) => student.province)).size,
    schools: sortedSchools.length,
    jiangsu,
    jiangsuPercent: studentList.length
      ? Math.round((jiangsu / studentList.length) * 100)
      : 0,
  };
  const provinceGroups = Object.entries(provinceCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([province, count]) => {
      const people = studentList
        .filter((student) => student.province === province)
        .sort((studentA, studentB) => studentA.name.localeCompare(studentB.name, "zh-CN"));
      return `
        <section class="province-group">
          <div class="province-heading">
            <h2>${escapeHtml(province)}</h2>
            <span>${count} 位同学</span>
          </div>
          <table>
            <thead>
              <tr><th>姓名</th><th>院校 / 专业</th><th>具体校区</th><th>城市</th></tr>
            </thead>
            <tbody>
              ${people
                .map(
                  (student) => `
                    <tr>
                      <td>${escapeHtml(student.name)}</td>
                      <td>
                        <strong>${escapeHtml(student.school)}</strong>
                        <small>${escapeHtml(student.major || "专业待填写")}</small>
                      </td>
                      <td>${escapeHtml(student.campus || "校区待填写")}</td>
                      <td>${escapeHtml(student.city)}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>江苏省天一中学高三十九班 · 毕业去向纪念册</title>
  <style>
    :root { color-scheme: light; --paper:#f6f2e7; --ink:#172a27; --muted:#68736e; --line:#d9d2c3; --sage:#667f62; --accent:#c96142; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font-family: "Noto Sans SC","Microsoft YaHei",sans-serif; }
    main { max-width: 1020px; margin: 0 auto; padding: 70px 42px 80px; }
    header { border-bottom: 1px solid var(--ink); padding-bottom: 28px; margin-bottom: 38px; }
    .school { margin: 0 0 18px; color: var(--muted); font-size: 13px; letter-spacing: .12em; }
    h1 { margin: 0; font-family: "Noto Serif SC","Songti SC","SimSun",serif; font-size: 46px; font-weight: 650; letter-spacing: -.04em; }
    .subtitle { color: var(--muted); margin: 12px 0 0; font-size: 15px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0 44px; }
    .summary div { border-top: 2px solid var(--sage); padding-top: 12px; }
    .summary strong { display: block; font-family: "Noto Serif SC","Songti SC","SimSun",serif; font-size: 30px; font-weight: 600; }
    .summary span { color: var(--muted); font-size: 13px; }
    .province-group { break-inside: avoid; margin: 0 0 30px; }
    .province-heading { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
    .province-heading h2 { margin: 0; font-family: "Noto Serif SC","Songti SC","SimSun",serif; font-size: 23px; font-weight: 600; }
    .province-heading span { color: var(--muted); font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 8px 4px; border-bottom: 1px solid rgba(217,210,195,.62); font-size: 13px; }
    th { color: var(--muted); font-weight: 500; letter-spacing: .05em; }
    td:nth-child(1) { width: 16%; font-weight: 600; }
    td:nth-child(2) { width: 38%; }
    td:nth-child(3) { width: 28%; }
    td:nth-child(4) { width: 18%; color: var(--muted); }
    td strong { display: block; font-weight: 600; }
    td small { display: block; margin-top: 2px; color: var(--muted); font-size: 11px; }
    .footnote { margin-top: 44px; color: var(--muted); font-size: 12px; }
    @media print {
      @page { size: A4; margin: 14mm; }
      body { background: white; }
      main { max-width: none; padding: 0; }
      h1 { font-size: 36px; }
      .province-group { page-break-inside: avoid; }
    }
    @media (max-width: 620px) {
      main { padding: 40px 20px; }
      h1 { font-size: 34px; }
      .summary { gap: 12px; }
      th:nth-child(4), td:nth-child(4) { display: none; }
      td:nth-child(1) { width: 20%; }
      td:nth-child(2) { width: 44%; }
      td:nth-child(3) { width: 36%; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="school">江苏省天一中学 · 高三十九班</p>
      <h1>毕业去向纪念册</h1>
      <p class="subtitle">去向有迹，相逢有时。愿我们各自远行，也终会重逢。</p>
    </header>
    <section class="summary">
      <div><strong>${summary.students}</strong><span>位同学</span></div>
      <div><strong>${summary.provinces}</strong><span>个省级地区</span></div>
      <div><strong>${summary.schools}</strong><span>所院校</span></div>
    </section>
    ${provinceGroups}
    <p class="footnote">
      数据来源：班级毕业去向表与本人补充资料。统计口径：${summary.schools} 所院校，江苏省内 ${summary.jiangsu} 人，
      占全班 ${summary.jiangsuPercent}%。
    </p>
  </main>
</body>
</html>`;
}

export function downloadMemorial(studentList = baseStudents) {
  const html = buildMemorialHtml(studentList);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "天一中学高三十九班_毕业去向纪念册.html";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return anchor.download;
}
