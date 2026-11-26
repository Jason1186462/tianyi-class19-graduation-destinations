import { useEffect, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
} from "./Icons";

const GALLERY_STORAGE_KEY = "tianyi-graduation-gallery-v1";

const placeholderMoments = [
  {
    id: "meeting-01",
    index: "01",
    season: "高三 · 起点",
    title: "高中会议影像",
    caption: "为真实会议照片预留的第一张记忆卡片",
    theme: "sage",
  },
  {
    id: "meeting-02",
    index: "02",
    season: "高三 · 同行",
    title: "主题班会",
    caption: "可放入誓师、班会或年级大会照片",
    theme: "sand",
  },
  {
    id: "meeting-03",
    index: "03",
    season: "高三 · 选择",
    title: "志愿与未来",
    caption: "记录专业选择、志愿填报和答疑现场",
    theme: "blue",
  },
  {
    id: "meeting-04",
    index: "04",
    season: "高三 · 定格",
    title: "班级合影",
    caption: "可放入毕业照、班级合影和活动照片",
    theme: "rose",
  },
  {
    id: "meeting-05",
    index: "05",
    season: "高三 · 日常",
    title: "教室与走廊",
    caption: "把普通的一天也留在这段时间里",
    theme: "olive",
  },
];

function readLocalPhotos() {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(GALLERY_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(stored)
      ? stored.filter((item) => item?.id && item?.src)
      : [];
  } catch {
    return [];
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maximumEdge = 1280;
      const scale = Math.min(
        1,
        maximumEdge / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(source);
      resolve(canvas.toDataURL("image/jpeg", 0.76));
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("无法读取这张图片"));
    };
    image.src = source;
  });
}

export default function GalleryView() {
  const [localPhotos, setLocalPhotos] = useState(readLocalPhotos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef(null);

  const slides = [
    ...localPhotos,
    ...placeholderMoments,
  ];

  useEffect(() => {
    try {
      window.localStorage.setItem(
        GALLERY_STORAGE_KEY,
        JSON.stringify(localPhotos),
      );
    } catch {
      setUploadMessage("浏览器存储空间不足，照片未保存");
    }
  }, [localPhotos]);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  async function handleFiles(event) {
    const files = [...event.target.files].slice(0, 6);
    event.target.value = "";
    if (!files.length) return;
    try {
      const photos = await Promise.all(
        files.map(async (file, index) => ({
          id: `local-${Date.now()}-${index}`,
          index: String(index + 1).padStart(2, "0"),
          season: "本机照片",
          title: file.name.replace(/\.[^.]+$/, "") || "会议照片",
          caption: "仅保存在当前浏览器",
          src: await compressImage(file),
        })),
      );
      setLocalPhotos((current) => [...photos, ...current].slice(0, 8));
      setUploadMessage(`已添加 ${photos.length} 张本机照片`);
      setActiveIndex(0);
    } catch (error) {
      setUploadMessage(error.message);
    }
  }

  function move(direction) {
    setActiveIndex(
      (current) => (current + direction + slides.length) % slides.length,
    );
    setPaused(true);
  }

  return (
    <main className="gallery-main">
      <header className="gallery-heading">
        <div>
          <span className="gallery-eyebrow">MEMORY ROTATION · 2026</span>
          <h1>高中会议相册</h1>
          <p>把班会、誓师、志愿填报与合影放进一条旋转的记忆长廊。</p>
        </div>
        <div className="gallery-actions">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            aria-label="添加会议照片"
          />
          <button
            type="button"
            className="gallery-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoIcon size={17} />
            添加本机照片
          </button>
          <small>本机添加的照片仅保存在当前浏览器</small>
        </div>
      </header>

      <section
        className="gallery-showcase"
        aria-label="高中会议照片旋转展示"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        <div className="gallery-orbit" aria-hidden="true" />
        <div className="gallery-slides">
          {slides.map((slide, index) => {
            const count = slides.length;
            const distance =
              ((index - activeIndex + count + Math.floor(count / 2)) % count) -
              Math.floor(count / 2);
            const absoluteDistance = Math.abs(distance);
            return (
              <button
                type="button"
                className={[
                  "gallery-slide",
                  distance === 0 ? "is-active" : "",
                  `theme-${slide.theme ?? "photo"}`,
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  "--slide-offset": distance,
                  "--slide-depth": absoluteDistance,
                  transform: `translate(-50%, -50%) translateX(${distance * 46}%) translateZ(${distance === 0 ? 90 : -absoluteDistance * 80}px) rotateY(${distance * -17}deg) scale(${distance === 0 ? 1 : Math.max(0.68, 0.9 - absoluteDistance * 0.07)})`,
                  opacity: absoluteDistance > 2 ? 0 : 1 - absoluteDistance * 0.22,
                  zIndex: 20 - absoluteDistance,
                }}
                onClick={() => {
                  setActiveIndex(index);
                  setPaused(true);
                }}
                aria-label={`${slide.title}，${slide.caption}`}
                tabIndex={absoluteDistance <= 1 ? 0 : -1}
                key={slide.id}
              >
                {slide.src ? (
                  <img src={slide.src} alt={slide.title} />
                ) : (
                  <span className="gallery-art" aria-hidden="true">
                    <i>{slide.index}</i>
                    <b />
                    <b />
                  </span>
                )}
                <span className="gallery-caption">
                  <small>{slide.season}</small>
                  <strong>{slide.title}</strong>
                  <em>{slide.caption}</em>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="gallery-arrow is-prev"
          onClick={() => move(-1)}
          aria-label="上一张照片"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <button
          type="button"
          className="gallery-arrow is-next"
          onClick={() => move(1)}
          aria-label="下一张照片"
        >
          <ChevronRightIcon size={20} />
        </button>
      </section>

      <footer className="gallery-footer">
        <div className="gallery-dots" aria-label="照片索引">
          {slides.map((slide, index) => (
            <button
              type="button"
              className={activeIndex === index ? "is-active" : ""}
              onClick={() => {
                setActiveIndex(index);
                setPaused(true);
              }}
              aria-label={`查看第 ${index + 1} 张：${slide.title}`}
              aria-current={activeIndex === index ? "true" : undefined}
              key={slide.id}
            />
          ))}
        </div>
        <span>{uploadMessage || `${activeIndex + 1} / ${slides.length} · 自动旋转`}</span>
      </footer>
    </main>
  );
}
