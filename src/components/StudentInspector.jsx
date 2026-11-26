import Avatar from "./Avatar";
import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  CloseIcon,
  MapPinIcon,
  MessageIcon,
  PencilIcon,
} from "./Icons";
import {
  classmatesInSchool,
  distanceFromOrigin,
  sameCitySuggestions,
} from "../lib/data";

export default function StudentInspector({
  student,
  students,
  onClose,
  onSelectStudent,
  onViewOnMap,
  onEdit,
  onChat,
  className = "",
}) {
  if (!student) return null;

  const schoolPeers = classmatesInSchool(student, students);
  const suggestions = sameCitySuggestions(student, students);
  const distance = distanceFromOrigin(student.coordinates);

  return (
    <aside className={`student-inspector ${className}`} aria-label={`${student.name}的去向详情`}>
      <div className="inspector-heading">
        <h2>学生主页</h2>
        <button type="button" className="inspector-close" onClick={onClose} aria-label="关闭详情">
          <CloseIcon size={19} />
        </button>
      </div>

      <div className="student-identity">
        <Avatar name={student.name} avatarId={student.avatar} size={68} />
        <div>
          <h3>{student.name}</h3>
          <p className="student-school">{student.school}</p>
          <p className="student-status">
            {student.major || "专业待填写"} · 高三十九班毕业去向
          </p>
        </div>
      </div>

      <dl className="student-facts">
        <div>
          <dt>院校城市</dt>
          <dd>{student.city}</dd>
        </div>
        <div>
          <dt>所在省份</dt>
          <dd>{student.province}</dd>
        </div>
        <div>
          <dt>学习专业</dt>
          <dd className={!student.major ? "is-empty" : ""}>
            {student.major || "暂未填写"}
          </dd>
        </div>
        <div>
          <dt>院校校区</dt>
          <dd>{student.campus}</dd>
        </div>
        <div>
          <dt>同校伙伴</dt>
          <dd>{schoolPeers.length} 位</dd>
        </div>
        <div>
          <dt>从无锡出发</dt>
          <dd>约 {distance.toLocaleString("zh-CN")} km</dd>
        </div>
      </dl>

      <div className={`campus-location ${student.hasCustomLocation ? "is-custom" : ""}`}>
        <MapPinIcon size={17} />
        <div>
          <b>{student.address}</b>
          <span className="campus-coordinates">
            {student.coordinates[0].toFixed(5)}°N ·{" "}
            {student.coordinates[1].toFixed(5)}°E
          </span>
          <small>
            {student.hasCustomLocation
              ? "校区位置已锁定，个人主页和地图持续使用此坐标。"
              : "院校默认点按主要本科校区标注，可在个人资料中继续校准。"}
          </small>
        </div>
      </div>

      {student.notes && (
        <blockquote className="profile-note">“{student.notes}”</blockquote>
      )}

      <div className="journey-line" aria-label={`从无锡前往${student.city}的去向路线`}>
        <span className="journey-point is-origin" />
        <span className="journey-track" />
        <span className="journey-point is-destination" />
        <div className="journey-labels">
          <span>无锡</span>
          <span>{student.city}</span>
        </div>
      </div>

      <section className="inspector-section peer-section">
        <div className="inspector-section-title">
          <h4>同校同学</h4>
          <span>{schoolPeers.length ? `${schoolPeers.length + 1} 人` : "独行"}</span>
        </div>
        {schoolPeers.length ? (
          <div className="compact-people-list">
            {schoolPeers.slice(0, 3).map((peer) => (
              <button
                type="button"
                className="compact-person"
                key={peer.id}
                onClick={() => onSelectStudent(peer.id)}
              >
                <Avatar name={peer.name} avatarId={peer.avatar} size={36} />
                <span>
                  <b>{peer.name}</b>
                  <small>{peer.city}</small>
                </span>
                <ChevronRightIcon size={15} />
              </button>
            ))}
          </div>
        ) : (
          <p className="peer-empty">
            全班只有 {student.name} 一人前往这所院校。
          </p>
        )}
      </section>

      <section className="inspector-section more-section">
        <div className="inspector-section-title">
          <h4>更多同学</h4>
        </div>
        <div className="compact-people-list">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              className="compact-person"
              key={suggestion.id}
              onClick={() => onSelectStudent(suggestion.id)}
            >
              <Avatar
                name={suggestion.name}
                avatarId={suggestion.avatar}
                size={38}
              />
              <span>
                <b>{suggestion.name}</b>
                <small>{suggestion.school}</small>
              </span>
              <ChevronRightIcon size={15} />
            </button>
          ))}
        </div>
      </section>

      <div className="inspector-actions">
        <button type="button" className="edit-profile" onClick={() => onEdit(student)}>
          <PencilIcon size={16} />
          <span>编辑个人资料</span>
        </button>
        <button type="button" className="chat-profile" onClick={() => onChat(student)}>
          <MessageIcon size={16} />
          <span>私聊</span>
        </button>
        <button type="button" className="view-on-map" onClick={() => onViewOnMap(student)}>
          <MapPinIcon size={17} />
          <span>在地图中查看</span>
          <ArrowUpRightIcon size={15} />
        </button>
      </div>
    </aside>
  );
}
