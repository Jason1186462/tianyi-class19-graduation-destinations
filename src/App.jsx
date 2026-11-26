import { useCallback, useEffect, useMemo, useState } from "react";
import AppHeader, { MobileBottomNav } from "./components/AppHeader";
import ChatDrawer from "./components/ChatDrawer";
import DirectoryView from "./components/DirectoryView";
import GalleryView from "./components/GalleryView";
import InsightsView from "./components/InsightsView";
import MapView from "./components/MapView";
import ProfileEditor from "./components/ProfileEditor";
import StudentInspector from "./components/StudentInspector";
import SummaryRail from "./components/SummaryRail";
import { students as baseStudents } from "./lib/data";
import { downloadMemorial } from "./lib/exportMemorial";
import {
  createStudentProfiles,
  loadProfileOverrides,
  saveProfileOverrides,
} from "./lib/profiles";

const defaultStudent =
  baseStudents.find((student) => student.name === "蒋金豪") ?? baseStudents[0];
const LAST_SELECTED_STUDENT_KEY = "tianyi-last-selected-student-v1";

function loadLastSelectedStudentId() {
  if (typeof window === "undefined") return defaultStudent.id;
  const storedId = Number(window.localStorage.getItem(LAST_SELECTED_STUDENT_KEY));
  return baseStudents.some((student) => student.id === storedId)
    ? storedId
    : defaultStudent.id;
}

export default function App() {
  const [profileOverrides, setProfileOverrides] = useState(loadProfileOverrides);
  const [activeView, setActiveView] = useState("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapScope, setMapScope] = useState("all");
  const [selectedProvince, setSelectedProvince] = useState("全部");
  const [selectedStudentId, setSelectedStudentId] = useState(loadLastSelectedStudentId);
  const [directoryProvince, setDirectoryProvince] = useState("全部");
  const [directorySchool, setDirectorySchool] = useState("全部");
  const [mapFocusRequest, setMapFocusRequest] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [chatStudentId, setChatStudentId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const students = useMemo(
    () => createStudentProfiles(profileOverrides),
    [profileOverrides],
  );
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? defaultStudent,
    [selectedStudentId, students],
  );
  const editingStudent = students.find((student) => student.id === editingStudentId);
  const chatStudent = students.find((student) => student.id === chatStudentId);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAST_SELECTED_STUDENT_KEY, String(selectedStudentId));
    } catch {
      // The profile itself already reports storage failures to the user.
    }
  }, [selectedStudentId]);

  const changeView = useCallback((nextView) => {
    setActiveView(nextView);
    setInspectorOpen(false);
    setChatStudentId(null);
  }, []);

  function handleGlobalSearch(query) {
    setSearchQuery(query);
    if (query.trim()) {
      setActiveView("directory");
      setDirectoryProvince("全部");
      setDirectorySchool("全部");
    }
  }

  function handleProvinceSelect(province) {
    setMapFocusRequest(null);
    setSelectedProvince(province);
    if (province !== "全部" && selectedStudent.province !== province) {
      const firstStudent = students.find((student) => student.province === province);
      if (firstStudent) setSelectedStudentId(firstStudent.id);
    }
    if (mapScope === "inside" && province !== "江苏") setMapScope("all");
    if (mapScope === "outside" && province === "江苏") setMapScope("all");
  }

  function handleScopeChange(nextScope) {
    setMapScope(nextScope);
    if (nextScope === "inside") setSelectedProvince("江苏");
    if (nextScope === "outside" && selectedProvince === "江苏") setSelectedProvince("全部");
  }

  function handleViewOnMap(student) {
    setSelectedStudentId(student.id);
    setSelectedProvince(student.province);
    setMapScope("all");
    setMapFocusRequest({
      school: student.school,
      city: student.city,
      province: student.province,
      campus: student.campus,
      coordinates: student.coordinates,
      mode: "school",
      nonce: Date.now(),
    });
    setActiveView("map");
    setInspectorOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleOpenSchool(school, city = "") {
    setActiveView("directory");
    setDirectoryProvince("全部");
    setDirectorySchool(school);
    setSearchQuery(city);
    setInspectorOpen(false);
  }

  function clearDirectoryFilters() {
    setSearchQuery("");
    setDirectoryProvince("全部");
    setDirectorySchool("全部");
  }

  function handleExport() {
    const filename = downloadMemorial(students);
    setToastMessage(`已生成「${filename}」`);
  }

  function handleProfileSave(profile) {
    if (!editingStudentId) return;
    const nextOverrides = {
      ...profileOverrides,
      [editingStudentId]: profile,
    };
    if (!saveProfileOverrides(nextOverrides)) {
      setToastMessage("个人资料保存失败，请检查浏览器是否允许本地存储");
      return;
    }
    setProfileOverrides(nextOverrides);
    setEditingStudentId(null);
    handleViewOnMap({ ...editingStudent, ...profile });
    setToastMessage(`已保存 ${profile.name}，${profile.campus} 的校区位置已锁定并自动定位`);
  }

  const inspector = (
    <StudentInspector
      student={selectedStudent}
      students={students}
      className={inspectorOpen ? "is-open" : ""}
      onClose={() => setInspectorOpen(false)}
      onSelectStudent={(id) => {
        setSelectedStudentId(id);
        setInspectorOpen(true);
      }}
      onViewOnMap={handleViewOnMap}
      onEdit={(student) => {
        setSelectedStudentId(student.id);
        setEditingStudentId(student.id);
      }}
      onChat={(student) => {
        setSelectedStudentId(student.id);
        setInspectorOpen(false);
        setChatStudentId(student.id);
      }}
    />
  );

  return (
    <div className="app-shell">
      <AppHeader
        activeView={activeView}
        onViewChange={changeView}
        searchQuery={searchQuery}
        onSearch={handleGlobalSearch}
        onExport={handleExport}
      />
      <MobileBottomNav activeView={activeView} onViewChange={changeView} />

      <div className="app-body">
        {activeView === "map" && (
          <div className="map-layout">
            <SummaryRail
              selectedProvince={selectedProvince}
              onProvinceSelect={handleProvinceSelect}
            />
            <MapView
              students={students}
              scope={mapScope}
              onScopeChange={handleScopeChange}
              selectedProvince={selectedProvince}
              onProvinceSelect={handleProvinceSelect}
              externalFocusRequest={mapFocusRequest}
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudentId}
              onOpenInspector={() => setInspectorOpen(true)}
            />
            {inspector}
          </div>
        )}

        {activeView === "directory" && (
          <div className="directory-layout">
            <DirectoryView
              students={students}
              searchQuery={searchQuery}
              selectedStudent={selectedStudent}
              selectedProvince={directoryProvince}
              selectedSchool={directorySchool}
              onProvinceChange={setDirectoryProvince}
              onSchoolChange={setDirectorySchool}
              onSelectStudent={setSelectedStudentId}
              onOpenInspector={() => setInspectorOpen(true)}
              onClearFilters={clearDirectoryFilters}
            />
            {inspector}
          </div>
        )}

        {activeView === "insights" && (
          <InsightsView students={students} onOpenSchool={handleOpenSchool} />
        )}

        {activeView === "gallery" && <GalleryView />}
      </div>

      {inspectorOpen && (
        <button
          type="button"
          className="mobile-inspector-backdrop"
          onClick={() => setInspectorOpen(false)}
          aria-label="关闭学生详情"
        />
      )}

      {editingStudent && (
        <ProfileEditor
          student={editingStudent}
          onClose={() => setEditingStudentId(null)}
          onSave={handleProfileSave}
        />
      )}

      {chatStudent && (
        <ChatDrawer
          student={chatStudent}
          onClose={() => setChatStudentId(null)}
        />
      )}

      <div className={`toast ${toastMessage ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </div>
  );
}
