import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { CloseIcon, MessageIcon } from "./Icons";

const CHAT_STORAGE_KEY = "tianyi-graduation-local-chats-v1";

function readAllChats() {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(CHAT_STORAGE_KEY) ?? "{}",
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}

export default function ChatDrawer({ student, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [storageError, setStorageError] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (!student) return;
    setMessages(readAllChats()[student.id] ?? []);
    setDraft("");
    setStorageError("");
  }, [student?.id]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  if (!student) return null;

  function sendMessage(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    const nextMessages = [
      ...messages,
      {
        id: `${Date.now()}-${messages.length}`,
        sender: "me",
        content,
        createdAt: new Date().toISOString(),
      },
    ];
    const allChats = readAllChats();
    const nextChats = {
      ...allChats,
      [student.id]: nextMessages,
    };
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextChats));
      setMessages(nextMessages);
      setDraft("");
      setStorageError("");
    } catch {
      setStorageError("保存失败，请检查浏览器本地存储空间");
    }
  }

  return (
    <div
      className="chat-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="chat-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        <header className="chat-heading">
          <Avatar name={student.name} avatarId={student.avatar} size={46} />
          <div>
            <h2 id="chat-title">和 {student.name} 私聊</h2>
            <p>{student.school} · 本机预览模式</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭私聊">
            <CloseIcon size={19} />
          </button>
        </header>

        <div className="chat-mode-note">
          <MessageIcon size={16} />
          <span>
            当前是静态网站演示：消息只保存在本浏览器，不会发送到对方设备。
          </span>
        </div>

        <div className="chat-messages" ref={listRef} aria-live="polite">
          {messages.length ? (
            messages.map((message) => (
              <article className="chat-message" key={message.id}>
                <p>{message.content}</p>
                <time dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </article>
            ))
          ) : (
            <div className="chat-empty">
              <MessageIcon size={26} />
              <strong>还没有消息</strong>
              <p>可以在这里留下想对 {student.name} 说的话。</p>
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={sendMessage}>
          <label>
            <span className="visually-hidden">输入私聊消息</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(event);
                }
              }}
              placeholder={`写一句话给 ${student.name}…`}
              maxLength={500}
              rows={3}
            />
          </label>
          <div>
            <small>{storageError || `${draft.length} / 500`}</small>
            <button type="submit" disabled={!draft.trim()}>
              保存消息
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
