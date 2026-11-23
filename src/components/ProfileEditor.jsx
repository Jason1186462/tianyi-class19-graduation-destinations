import { useEffect, useMemo, useRef, useState } from "react";
import CampusPickerMap from "./CampusPickerMap";
import { CloseIcon, MapPinIcon, ResetIcon } from "./Icons";
import { normalizeCoordinates, parseMapCoordinates } from "../lib/profiles";
import { findCampusPreset, getCampusPresets } from "../data/school-locations";

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

export default function ProfileEditor({ student, onClose, onSave }) {
  const nameInputRef = useRef(null);
  const [form, setForm] = useState(() => ({
    name: student.name,
    major: student.major ?? "",
    campus: student.campus,
    address: student.address,
    latitude: formatCoordinate(student.coordinates[0]),
    longitude: formatCoordinate(student.coordinates[1]),
    notes: student.notes ?? "",
  }));
  const [mapLink, setMapLink] = useState("");
  const [mapLinkStatus, setMapLinkStatus] = useState({ type: "", message: "" });
  const [manualLocationEdited, setManualLocationEdited] = useState(false);
  const [campusInputTouched, setCampusInputTouched] = useState(false);
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const campusOptions = useMemo(
    () => getCampusPresets(student.school),
    [student.school],
  );
  const campusListId = `campus-presets-${student.id}`;

  const coordinates = useMemo(
    () => normalizeCoordinates([Number(form.latitude), Number(form.longitude)]),
    [form.latitude, form.longitude],
  );
  const coordinatesInChina =
    coordinates &&
    coordinates[0] >= 3 &&
    coordinates[0] <= 54 &&
    coordinates[1] >= 73 &&
    coordinates[1] <= 135;
  const nameValid = form.name.trim().length > 0;
  const campusChanged = form.campus.trim() !== student.campus;
  const matchedCampus = findCampusPreset(student.school, form.campus);
  const campusMatched = Boolean(matchedCampus);
  const resolvedCity = matchedCampus?.city || student.city;
  const resolvedProvince = matchedCampus?.province || student.province;
  const campusNeedsCalibration =
    campusChanged && !campusMatched && !manualLocationEdited;
  const formValid =
    nameValid && Boolean(coordinatesInChina) && !campusNeedsCalibration;
  const locationChanged =
    form.campus.trim() !== student.defaultCampus ||
    form.address.trim() !== student.defaultAddress ||
    !coordinates ||
    Math.abs(coordinates[0] - student.defaultCoordinates[0]) > 0.000001 ||
    Math.abs(coordinates[1] - student.defaultCoordinates[1]) > 0.000001;

  useEffect(() => {
    nameInputRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "latitude" || field === "longitude") {
      setMapLink("");
      setMapLinkStatus({ type: "", message: "" });
      setManualLocationEdited(true);
    }
  }

  function updateCoordinates(nextCoordinates, source = "manual") {
    setForm((current) => ({
      ...current,
      latitude: formatCoordinate(nextCoordinates[0]),
      longitude: formatCoordinate(nextCoordinates[1]),
    }));
    if (source !== "import") setMapLink("");
    setMapLinkStatus({ type: "", message: "" });
    setManualLocationEdited(true);
  }

  function updateCampus(value) {
    const preset = findCampusPreset(student.school, value);
    setForm((current) => ({
      ...current,
      campus: preset?.campus ?? value,
      ...(preset
        ? {
            address: preset.address,
            latitude: formatCoordinate(preset.coordinates[0]),
            longitude: formatCoordinate(preset.coordinates[1]),
          }
        : {}),
    }));
    if (preset) setMapLink("");
    setManualLocationEdited(false);
    if (preset) setMapFocusToken((current) => current + 1);
    setMapLinkStatus(
      preset
        ? {
            type: "success",
            message: `已自动匹配 ${preset.campus} 的地址和校区坐标。`,
          }
        : { type: "", message: "" },
    );
  }

  function resetLocation() {
    setForm((current) => ({
      ...current,
      campus: student.defaultCampus,
      address: student.defaultAddress,
      latitude: formatCoordinate(student.defaultCoordinates[0]),
      longitude: formatCoordinate(student.defaultCoordinates[1]),
    }));
    setMapLink("");
    setMapLinkStatus({ type: "", message: "" });
    setManualLocationEdited(false);
    setMapFocusToken((current) => current + 1);
  }

  function importMapCoordinates() {
    const nextCoordinates = parseMapCoordinates(mapLink);
    if (!nextCoordinates) {
      setMapLinkStatus({
        type: "error",
        message: "未识别到中国大陆坐标，请粘贴包含经纬度的地图分享链接。",
      });
      return;
    }
    updateCoordinates(nextCoordinates, "import");
    setMapFocusToken((current) => current + 1);
    setMapLinkStatus({
      type: "success",
      message: `已读取：${formatCoordinate(nextCoordinates[0])}, ${formatCoordinate(nextCoordinates[1])}`,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!formValid) return;
    onSave({
      name: form.name.trim(),
      major: form.major.trim(),
      city: resolvedCity,
      province: resolvedProvince,
      campus: form.campus.trim() || student.defaultCampus,
      address: form.address.trim() || student.defaultAddress,
      coordinates,
      notes: form.notes.trim(),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div
      className="profile-editor-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="profile-editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
      >
        <form onSubmit={handleSubmit}>
          <header className="profile-editor-heading">
            <div>
              <span className="profile-editor-eyebrow">个人信息 / 校区定位</span>
              <h2 id="profile-editor-title">编辑 {student.name} 的资料</h2>
              <p>填写具体专业与校区，点击地图可直接校准到自己的报到校区。</p>
            </div>
            <button
              type="button"
              className="profile-editor-close"
              onClick={onClose}
              aria-label="关闭个人信息编辑"
            >
              <CloseIcon size={20} />
            </button>
          </header>

          <div className="profile-editor-layout">
            <div className="profile-editor-form">
              <div className="profile-editor-grid">
                <label className="profile-field">
                  <span>姓名</span>
                  <input
                    ref={nameInputRef}
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    maxLength={24}
                    aria-invalid={!nameValid}
                  />
                </label>
                <label className="profile-field">
                  <span>学习专业</span>
                  <input
                    value={form.major}
                    onChange={(event) => updateField("major", event.target.value)}
                    placeholder="例如：计算机科学与技术"
                    maxLength={60}
                  />
                </label>
                <label className="profile-field profile-field-wide">
                  <span>录取院校</span>
                  <input value={student.school} readOnly />
                </label>
                <label className="profile-field">
                  <span>城市</span>
                  <input value={resolvedCity} readOnly />
                </label>
                <label className="profile-field">
                  <span>省份</span>
                  <input value={resolvedProvince} readOnly />
                </label>
              </div>

              <section className="profile-location-fields">
                <div className="profile-location-heading">
                  <div>
                    <h3>具体校区位置</h3>
                    <p>坐标精确到小数点后 5～6 位即可定位到校区门口附近。</p>
                  </div>
                  <button type="button" onClick={resetLocation}>
                    <ResetIcon size={15} />
                    恢复学校默认位置
                  </button>
                </div>

                <label className="profile-field">
                  <span>校区名称</span>
                  <input
                    value={form.campus}
                    onChange={(event) => updateCampus(event.target.value)}
                    onBlur={() => setCampusInputTouched(true)}
                    list={campusOptions.length ? campusListId : undefined}
                    placeholder="例如：仙林校区"
                    maxLength={80}
                  />
                  {campusOptions.length > 0 && (
                    <datalist id={campusListId}>
                      {campusOptions.map((option) => (
                        <option value={option.campus} key={option.campus} />
                      ))}
                    </datalist>
                  )}
                </label>
                {campusOptions.length > 0 && (
                  <div className="profile-campus-index" aria-label={`${student.school}全部校区索引`}>
                    <div>
                      <span>该校全部校区索引</span>
                      <small>{campusOptions.length} 个已收录校区</small>
                    </div>
                    <div className="profile-campus-index-list">
                      {campusOptions.map((option) => (
                        <button
                          type="button"
                          className={
                            matchedCampus?.campus === option.campus ? "is-active" : ""
                          }
                          onClick={() => updateCampus(option.campus)}
                          title={option.address}
                          key={option.campus}
                        >
                          {option.campus}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {campusNeedsCalibration && campusInputTouched && (
                  <p className="profile-field-error" role="alert">
                    暂未收录这个校区名称。请从下方选择已有校区，或点击地图、粘贴地图链接确认坐标。
                  </p>
                )}
                <label className="profile-field">
                  <span>校区地址</span>
                  <input
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="填写完整校区地址"
                    maxLength={160}
                  />
                </label>
                <div className="profile-coordinate-grid">
                  <label className="profile-field">
                    <span>纬度 Latitude</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.000001"
                      value={form.latitude}
                      onChange={(event) => updateField("latitude", event.target.value)}
                    />
                  </label>
                  <label className="profile-field">
                    <span>经度 Longitude</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.000001"
                      value={form.longitude}
                      onChange={(event) => updateField("longitude", event.target.value)}
                    />
                  </label>
                </div>
                <div className="profile-coordinate-import">
                  <div>
                    <b>地图链接快速校准</b>
                    <small>可粘贴高德、Apple 或 Google 地图分享链接，也可直接输入“纬度, 经度”。</small>
                  </div>
                  <div className="profile-coordinate-import-row">
                    <input
                      aria-label="地图链接或坐标"
                      value={mapLink}
                      onChange={(event) => {
                        setMapLink(event.target.value);
                        if (mapLinkStatus.type) setMapLinkStatus({ type: "", message: "" });
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        importMapCoordinates();
                      }}
                      placeholder="例如：@32.384491,119.415240,17z"
                    />
                    <button
                      type="button"
                      onClick={importMapCoordinates}
                      disabled={!mapLink.trim()}
                    >
                      读取并定位
                    </button>
                  </div>
                  {mapLinkStatus.message && (
                    <p className={`profile-coordinate-import-status is-${mapLinkStatus.type}`} role="status">
                      {mapLinkStatus.message}
                    </p>
                  )}
                </div>
                {!coordinatesInChina && (
                  <p className="profile-field-error" role="alert">
                    请输入中国大陆范围内的有效经纬度，纬度 3～54，经度 73～135。
                  </p>
                )}
                <span className={`profile-location-state ${locationChanged ? "is-custom" : ""}`}>
                  <MapPinIcon size={14} />
                  {locationChanged
                    ? "保存后自动锁定此校区位置"
                    : "当前使用学校默认校区定位"}
                </span>
              </section>

              <label className="profile-field profile-notes-field">
                <span>个人寄语（选填）</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="写下一句话，留给高三十九班。"
                  maxLength={180}
                  rows={3}
                />
                <small>{form.notes.length} / 180</small>
              </label>
            </div>

            <aside className="profile-editor-map-column">
              <div className="profile-editor-map-heading">
                <div>
                  <span>校区地图校准</span>
                  <b>{form.campus || "待填写校区"}</b>
                </div>
                <small>{form.address || "待填写地址"}</small>
              </div>
              <CampusPickerMap
                coordinates={coordinatesInChina ? coordinates : student.defaultCoordinates}
                onChange={updateCoordinates}
                focusToken={mapFocusToken}
              />
              <p>
                点击地图任意位置或拖动红色标记，可把定位精确到具体校区。保存后会立即更新地图与个人主页。
              </p>
            </aside>
          </div>

          <footer className="profile-editor-footer">
            <span>资料仅保存在当前浏览器，不会自动上传到网络。</span>
            <div>
              <button type="button" className="profile-editor-cancel" onClick={onClose}>
                取消
              </button>
              <button type="submit" className="profile-editor-save" disabled={!formValid}>
                保存个人资料
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
