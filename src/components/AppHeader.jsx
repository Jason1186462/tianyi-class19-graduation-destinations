import { useEffect, useState } from "react";
import {
  BotanicalMark,
  ChartIcon,
  DownloadIcon,
  MapIcon,
  PhotoIcon,
  PeopleIcon,
  SearchIcon,
} from "./Icons";

const navItems = [
  { id: "map", label: "去向地图", Icon: MapIcon },
  { id: "directory", label: "同学名录", Icon: PeopleIcon },
  { id: "insights", label: "数据洞察", Icon: ChartIcon },
  { id: "gallery", label: "会议相册", Icon: PhotoIcon },
];

export default function AppHeader({
  activeView,
  onViewChange,
  searchQuery,
  onSearch,
  onExport,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState(searchQuery);

  useEffect(() => {
    setDraftQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [activeView]);

  function submitSearch(event) {
    event.preventDefault();
    onSearch(draftQuery);
    setMobileSearchOpen(false);
  }

  function handleQueryChange(event) {
    setDraftQuery(event.target.value);
    if (!event.target.value) onSearch("");
  }

  return (
    <header className="app-header">
      <div className="brand-block">
        <BotanicalMark className="brand-mark" />
        <div className="brand-copy">
          <strong>天一 · 19</strong>
          <span>毕业去向</span>
        </div>
      </div>

      <nav className="top-nav" aria-label="主要视图">
        {navItems.map(({ id, label }) => (
          <button
            type="button"
            className={`top-nav-item ${activeView === id ? "is-active" : ""}`}
            onClick={() => onViewChange(id)}
            aria-current={activeView === id ? "page" : undefined}
            key={id}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <form className={`header-search ${mobileSearchOpen ? "is-open" : ""}`} onSubmit={submitSearch}>
          <SearchIcon size={17} />
          <input
            type="search"
            value={draftQuery}
            onChange={handleQueryChange}
            placeholder="搜索姓名或院校"
            aria-label="搜索姓名或院校"
            onFocus={() => {
              if (searchQuery !== draftQuery) setDraftQuery(searchQuery);
            }}
          />
          <button className="visually-hidden" type="submit">
            搜索
          </button>
        </form>

        <button
          type="button"
          className="mobile-search-toggle icon-button"
          onClick={() => setMobileSearchOpen((open) => !open)}
          aria-label={mobileSearchOpen ? "收起搜索" : "展开搜索"}
          aria-expanded={mobileSearchOpen}
        >
          <SearchIcon size={19} />
        </button>

        <button
          type="button"
          className="export-button"
          onClick={onExport}
          aria-label="导出纪念册"
        >
          <DownloadIcon size={16} />
          <span>导出纪念册</span>
        </button>
      </div>

    </header>
  );
}

export function MobileBottomNav({ activeView, onViewChange }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="移动端主要视图">
      {navItems.map(({ id, label, Icon }) => (
        <button
          type="button"
          className={activeView === id ? "is-active" : ""}
          onClick={() => onViewChange(id)}
          aria-current={activeView === id ? "page" : undefined}
          key={id}
        >
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
