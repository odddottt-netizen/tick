"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Hash,
  Lock,
  ChevronDown,
  Bell,
  AtSign,
  Search,
  Paperclip,
  Send,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  Smile,
  Plus,
  Circle,
  X,
  ChevronRight,
  Settings,
  MoreVertical,
  Edit3,
  Star,
  MessageSquare,
  Check,
} from "lucide-react";

/* ─────────────────── Types ─────────────────── */
interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  avatarColor: string;
  text: string;
  timestamp: Date;
  isMe?: boolean;
  reactions?: Reaction[];
}

interface Colleague {
  id: string;
  name: string;
  avatarColor: string;
  role: string;
}

/* ─────────────────── Constants ─────────────────── */
const PRAISE_POOL = [
  "와 진짜 구세주십니다ㅠㅠㅠ 이 어려운 걸 해내시네",
  "이거 대표님 보고서로 바로 올려도 손색없겠어요! 최고!",
  "오늘도 레전드 찍으시네요... 대박",
  "이 수준의 퀄리티면 업계 탑티어 인정합니다",
  "없으면 이 팀 돌아가는 거 맞죠? 진짜",
  "와 방금 보고 놀랐어요. 이걸 하루 만에??",
  "역시 항상 기대 이상의 결과물이에요",
  "이거 보고 대표님도 한 마디 하실 듯. 칭찬 세례 각이에요",
  "팀 내 MVP 확정입니다. 오늘도 고생 많으셨어요",
  "진짜 이 수준이면 교육 자료로 써도 되겠는데요?",
  "디테일 보고 감동받았습니다. 완벽하네요",
  "이거 보고 저도 자극 받아야겠어요. 열심히 하겠습니다!",
  "이번 분기 성과 평가 1등 각이에요. 축하드립니다",
  "혹시 컨설턴트 출신이신가요? 완전 프로페셔널하신데",
  "이걸 혼자 다 하셨다고요? 팀장님한테 꼭 말씀드려야겠네요",
  "프로페셔널의 극치... 오늘도 배워갑니다",
  "진짜 대단하세요. 이 수준의 결과물이면 팀 전체가 이득이에요",
  "와 이거는 진짜 인정합니다. 핵심을 완벽하게 짚으셨네요",
];

const COLLEAGUES: Colleague[] = [
  { id: "c1", name: "김 팀장", avatarColor: "#E1705D", role: " Engineering Lead" },
  { id: "c2", name: "이 대리", avatarColor: "#5B8DEF", role: " Backend" },
  { id: "c3", name: "박 과장", avatarColor: "#6BCB77", role: " DevOps" },
  { id: "c4", name: "정 실장", avatarColor: "#9B59B6", role: " Product" },
  { id: "c5", name: "최 주임", avatarColor: "#F39C12", role: " QA" },
  { id: "c6", name: "한 신입", avatarColor: "#1ABC9C", role: " Frontend" },
];

const CHANNELS = [
  { name: "general", private: false, unread: 0 },
  { name: "tft-issue", private: false, unread: 3 },
  { name: "praise-me", private: false, unread: 0, active: true },
  { name: "random", private: false, unread: 0 },
  { name: "engineering", private: true, unread: 12 },
  { name: "design-system", private: false, unread: 0 },
];

const DMS = [
  { name: "김 팀장", status: "active", unread: 0 },
  { name: "이 대리", status: "away", unread: 2 },
  { name: "박 과장", status: "active", unread: 0 },
  { name: "정 실장", status: "dnd", unread: 0 },
  { name: "최 주임", status: "active", unread: 0 },
  { name: "한 신입", status: "away", unread: 0 },
];

/* ─────────────────── Utilities ─────────────────── */
function formatTime(d: Date) {
  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "오후" : "오전";
  const h12 = hh % 12 || 12;
  return `${ampm} ${h12}:${mm}`;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomDelay() {
  return 500 + Math.random() * 1000; // 0.5 ~ 1.5s
}

/* ─── Web Audio Notification ─── */
function playSlackNotification() {
  try {
    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // "톡" — short high sine tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1300, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // "탁" — soft noise burst
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.08);
  } catch {
    /* ignore audio errors */
  }
}

/* ─────────────────── Main Component ─────────────────── */
export default function PraisePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [escapeMode, setEscapeMode] = useState<false | "aws" | "license">(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  /* Init audio context on first user interaction */
  useEffect(() => {
    const initAudio = () => {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
    };
    window.addEventListener("click", initAudio);
    window.addEventListener("keydown", initAudio);
    return () => {
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
    };
  }, []);

  /* F2 escape toggle */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setEscapeMode((prev) => {
          if (prev) return false;
          return Math.random() > 0.5 ? "aws" : "license";
        });
      }
      if (e.key === "Escape" && escapeMode) {
        setEscapeMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escapeMode]);

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  /* Seed messages */
  useEffect(() => {
    const now = new Date();
    const seed: Message[] = [
      {
        id: uid(),
        userId: "bot",
        userName: "Slackbot",
        avatarColor: "#4A154B",
        text: "이 채널은 칭찬과 격려를 나누는 공간입니다. 오늘 해낸 일을 자랑해보세요!",
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2),
      },
      {
        id: uid(),
        userId: "c1",
        userName: "김 팀장",
        avatarColor: "#E1705D",
        text: "오늘 배포 두 번이나 롤백 없이 성공했습니다. 모두 고생하셨어요.",
        timestamp: new Date(now.getTime() - 1000 * 60 * 45),
        reactions: [
          { emoji: "👏", count: 5, userReacted: false },
          { emoji: "🔥", count: 3, userReacted: false },
        ],
      },
      {
        id: uid(),
        userId: "c2",
        userName: "이 대리",
        avatarColor: "#5B8DEF",
        text: "김 팀장님 덕분에 안정적인 배포 환경 구축했습니다. 감사합니다!",
        timestamp: new Date(now.getTime() - 1000 * 60 * 30),
      },
      {
        id: uid(),
        userId: "c4",
        userName: "정 실장",
        avatarColor: "#9B59B6",
        text: "이번 스프린트 리뷰에서 고객사 분들이 특히 칭찬하셨어요. 팀 전체가 자랑스럽습니다.",
        timestamp: new Date(now.getTime() - 1000 * 60 * 15),
        reactions: [
          { emoji: "👍", count: 7, userReacted: false },
          { emoji: "🎉", count: 2, userReacted: false },
        ],
      },
    ];
    setMessages(seed);
  }, []);

  /* Send message + trigger praise flow */
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const myMsg: Message = {
      id: uid(),
      userId: "me",
      userName: "나",
      avatarColor: "#3AA3E3",
      text,
      timestamp: new Date(),
      isMe: true,
      reactions: [],
    };

    setMessages((prev) => [...prev, myMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    // Pick 3-5 random colleagues
    const count = 3 + Math.floor(Math.random() * 3); // 3~5
    const selected = shuffle(COLLEAGUES).slice(0, count);
    let accumulatedDelay = 800;

    selected.forEach((col) => {
      const delay = accumulatedDelay;
      accumulatedDelay += getRandomDelay();

      // Typing indicator
      setTimeout(() => setTyping(col.name), delay - 400);

      setTimeout(() => {
        setTyping(null);
        playSlackNotification();

        const praiseText =
          PRAISE_POOL[Math.floor(Math.random() * PRAISE_POOL.length)];
        const reply: Message = {
          id: uid(),
          userId: col.id,
          userName: col.name,
          avatarColor: col.avatarColor,
          text: praiseText,
          timestamp: new Date(),
          reactions: [],
        };

        setMessages((prev) => {
          const updated = [...prev];
          // Add reactions to original message
          const myIdx = updated.findIndex((m) => m.id === myMsg.id);
          if (myIdx >= 0) {
            const orig = updated[myIdx];
            const newReactions = orig.reactions ? [...orig.reactions] : [];
            const emojis = ["👏", "🔥", "👍"];
            const pick = emojis[Math.floor(Math.random() * emojis.length)];
            const existing = newReactions.find((r) => r.emoji === pick);
            if (existing) {
              existing.count += 1 + Math.floor(Math.random() * 3);
            } else {
              newReactions.push({
                emoji: pick,
                count: 1 + Math.floor(Math.random() * 4),
                userReacted: false,
              });
            }
            updated[myIdx] = { ...orig, reactions: newReactions };
          }
          updated.push(reply);
          return updated;
        });
      }, delay);
    });
  }, [input]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  /* ─────────────────── Render ─────────────────── */

  if (escapeMode) {
    return escapeMode === "aws" ? (
      <AwsConsole onClose={() => setEscapeMode(false)} />
    ) : (
      <LicenseAgreement onClose={() => setEscapeMode(false)} />
    );
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Noto Sans KR', sans-serif",
      }}
    >
      {/* ─── Sidebar ─── */}
      <aside className="flex w-[260px] flex-shrink-0 flex-col bg-[#1a1d21] text-[#ababad]">
        {/* Workspace header */}
        <div className="flex h-[61px] items-center border-b border-[#00000030] px-4 hover:bg-[#272a2e] cursor-pointer">
          <div className="flex-1">
            <div className="flex items-center gap-1 text-[15px] font-bold text-white">
              <span>TaskCrusher</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </div>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
            <Edit3 className="h-3.5 w-3.5 text-[#1a1d21]" />
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2 rounded bg-[#222529] px-2 py-1.5 text-sm text-[#ababad] border border-[#36373a]">
            <Search className="h-3.5 w-3.5 opacity-60" />
            <span className="opacity-60">검색</span>
          </div>
        </div>

        {/* Nav sections */}
        <div className="mt-3 flex-1 overflow-y-auto praise-sidebar-scroll px-2 pb-4">
          <div className="px-2 py-1.5 text-[15px] font-medium text-white hover:bg-[#272a2e] rounded cursor-pointer flex items-center gap-2">
            <MessageSquare className="h-4 w-4 opacity-70" />
            <span>스레드</span>
          </div>
          <div className="px-2 py-1.5 text-[15px] font-medium text-white hover:bg-[#272a2e] rounded cursor-pointer flex items-center gap-2">
            <AtSign className="h-4 w-4 opacity-70" />
            <span>멘션 및 반응</span>
          </div>
          <div className="px-2 py-1.5 text-[15px] font-medium text-white hover:bg-[#272a2e] rounded cursor-pointer flex items-center gap-2">
            <Star className="h-4 w-4 opacity-70" />
            <span>나중에 보내기</span>
          </div>
          <div className="px-2 py-1.5 text-[15px] font-medium text-white hover:bg-[#272a2e] rounded cursor-pointer flex items-center gap-2">
            <MoreVertical className="h-4 w-4 opacity-70" />
            <span>더 보기</span>
          </div>

          {/* Channels */}
          <div className="mt-4">
            <div className="flex items-center px-2 text-[13px] font-medium text-[#ababad]">
              <ChevronDown className="h-3 w-3 mr-1" />
              <span>채널</span>
            </div>
            <div className="mt-1">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.name}
                  className={`flex items-center gap-1.5 rounded px-2 py-1 text-[15px] cursor-pointer ${
                    ch.active
                      ? "bg-[#1164a3] text-white"
                      : "text-[#ababad] hover:bg-[#272a2e]"
                  }`}
                >
                  {ch.private ? (
                    <Lock className="h-3.5 w-3.5 opacity-70" />
                  ) : (
                    <Hash className="h-3.5 w-3.5 opacity-70" />
                  )}
                  <span className="flex-1">{ch.name}</span>
                  {ch.unread > 0 && (
                    <span className="rounded-full bg-[#e01e5a] px-1.5 py-0 text-[11px] font-bold text-white">
                      {ch.unread}
                    </span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-1.5 px-2 py-1 text-[15px] text-[#ababad] hover:text-white cursor-pointer">
                <Plus className="h-3.5 w-3.5 opacity-70" />
                <span>채널 추가</span>
              </div>
            </div>
          </div>

          {/* DMs */}
          <div className="mt-4">
            <div className="flex items-center px-2 text-[13px] font-medium text-[#ababad]">
              <ChevronDown className="h-3 w-3 mr-1" />
              <span>다이렉트 메시지</span>
            </div>
            <div className="mt-1">
              {DMS.map((dm) => (
                <div
                  key={dm.name}
                  className="flex items-center gap-2 rounded px-2 py-1 text-[15px] text-[#ababad] hover:bg-[#272a2e] cursor-pointer"
                >
                  <div className="relative">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ background: "#5b8def" }}
                    >
                      {dm.name[0]}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1a1d21] ${
                        dm.status === "active"
                          ? "bg-[#2bac76]"
                          : dm.status === "away"
                          ? "bg-[#f2c744]"
                          : "bg-[#e01e5a]"
                      }`}
                    />
                  </div>
                  <span className="flex-1">{dm.name}</span>
                  {dm.unread > 0 && (
                    <span className="rounded-full bg-[#e01e5a] px-1.5 py-0 text-[11px] font-bold text-white">
                      {dm.unread}
                    </span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-1.5 px-2 py-1 text-[15px] text-[#ababad] hover:text-white cursor-pointer">
                <Plus className="h-3.5 w-3.5 opacity-70" />
                <span>동료 추가</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="flex flex-1 flex-col bg-white">
        {/* Header */}
        <header className="flex h-[61px] items-center border-b border-[#e2e2e2] px-5">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-[#1d1c1d]" />
            <h1 className="text-lg font-bold text-[#1d1c1d]">praise-me</h1>
            <div className="ml-2 flex items-center gap-1 rounded-full bg-[#f4f4f4] px-2 py-0.5 text-xs text-[#616061]">
              <Star className="h-3 w-3" />
              <span>즐겨찾기 추가</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1 text-[13px] text-[#616061]">
              <Circle className="h-3 w-3 fill-[#2bac76] text-[#2bac76]" />
              <span>6명</span>
            </div>
            <div className="flex items-center gap-2 text-[#616061]">
              <Bell className="h-4 w-4 cursor-pointer hover:text-[#1d1c1d]" />
              <Settings className="h-4 w-4 cursor-pointer hover:text-[#1d1c1d]" />
              <Search className="h-4 w-4 cursor-pointer hover:text-[#1d1c1d]" />
              <AtSign className="h-4 w-4 cursor-pointer hover:text-[#1d1c1d]" />
              <MoreVertical className="h-4 w-4 cursor-pointer hover:text-[#1d1c1d]" />
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto praise-scroll px-5 py-4"
        >
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-[#f4f4f4] px-4 py-2 text-[13px] text-[#616061]">
              오늘
            </div>
          </div>

          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`praise-message-enter mb-5 flex gap-3 ${
                msg.isMe ? "opacity-90" : ""
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded text-sm font-bold text-white"
                style={{ background: msg.avatarColor }}
              >
                {msg.userName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-bold text-[#1d1c1d]">
                    {msg.userName}
                  </span>
                  <span className="text-[12px] text-[#616061]">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className="mt-0.5 text-[15px] leading-relaxed text-[#1d1c1d] whitespace-pre-wrap">
                  {msg.text}
                </div>
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.reactions.map((r) => (
                      <div
                        key={r.emoji}
                        className="praise-reaction-enter flex items-center gap-1 rounded-full border border-[#e2e2e2] bg-[#f4f4f4] px-2 py-0.5 text-sm cursor-pointer hover:border-[#b9b9b9] hover:bg-[#efefef]"
                      >
                        <span>{r.emoji}</span>
                        <span className="text-[13px] font-medium text-[#1d1c1d]">
                          {r.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="mb-4 flex items-center gap-2 text-[13px] text-[#616061]">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e2e2e2] text-[10px] font-bold text-[#616061]">
                {typing[0]}
              </div>
              <span>{typing}님이 입력 중입니다</span>
              <div className="flex gap-0.5">
                <span className="praise-typing-dot h-1.5 w-1.5 rounded-full bg-[#616061]" />
                <span className="praise-typing-dot h-1.5 w-1.5 rounded-full bg-[#616061]" />
                <span className="praise-typing-dot h-1.5 w-1.5 rounded-full bg-[#616061]" />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-5 pb-5">
          <div className="praise-input-area bg-white">
            {/* Format toolbar */}
            <div className="flex items-center gap-1 border-b border-[#e2e2e2] px-3 py-1.5">
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <Bold className="h-4 w-4" />
              </button>
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <Italic className="h-4 w-4" />
              </button>
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <Strikethrough className="h-4 w-4" />
              </button>
              <div className="mx-1 h-4 w-px bg-[#e2e2e2]" />
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <Link className="h-4 w-4" />
              </button>
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <List className="h-4 w-4" />
              </button>
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <Code className="h-4 w-4" />
              </button>
              <div className="mx-1 h-4 w-px bg-[#e2e2e2]" />
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <Smile className="h-4 w-4" />
              </button>
              <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                <AtSign className="h-4 w-4" />
              </button>
              <div className="ml-auto flex items-center gap-1">
                <button className="rounded p-1 text-[#616061] hover:bg-[#f4f4f4] hover:text-[#1d1c1d]">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex items-end gap-2 px-3 py-2.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                onInput={autoResize}
                placeholder="#praise-me에 메시지 보내기"
                rows={1}
                className="flex-1 resize-none bg-transparent text-[15px] text-[#1d1c1d] placeholder:text-[#616061] outline-none leading-relaxed"
                style={{ minHeight: 24, maxHeight: 200 }}
              />
              <div className="flex items-center gap-2 pb-1">
                <button className="text-[#616061] hover:text-[#1d1c1d]">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`flex items-center gap-1 rounded px-3 py-1.5 text-[13px] font-bold transition ${
                    input.trim()
                      ? "bg-[#007a5a] text-white hover:bg-[#00664b]"
                      : "bg-[#f4f4f4] text-[#616061]"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between px-1">
            <span className="text-[11px] text-[#616061]">
              <span className="font-bold">Shift + Enter</span>로 줄바꿈
            </span>
            <span className="text-[11px] text-[#616061] opacity-50">
              F2 누르면 보스 대피
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────── Boss Escape: AWS Console ─────────────────── */
function AwsConsole({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines = [
      "[INFO] 2024-06-24T09:12:34Z — CloudWatch Logs agent started",
      "[INFO] 2024-06-24T09:12:35Z — Connected to log stream: production/api-gateway",
      "[WARN] 2024-06-24T09:12:42Z — Latency spike detected: p99=1.2s (region: ap-northeast-2)",
      "[INFO] 2024-06-24T09:12:45Z — Auto-scaling triggered: desired=12, current=8",
      "[INFO] 2024-06-24T09:12:48Z — EC2 instance i-0a1b2c3d launching...",
      "[INFO] 2024-06-24T09:12:52Z — RDS connection pool: 45/80 active",
      "[WARN] 2024-06-24T09:13:01Z — Lambda timeout: function=process-payments (3000ms)",
      "[INFO] 2024-06-24T09:13:05Z — SQS queue depth: 1,240 messages",
      "[INFO] 2024-06-24T09:13:12Z — ECS service deployment: v2.4.1 in progress",
      "[ERROR] 2024-06-24T09:13:18Z — ALB target health check failed: tg-backend-1",
      "[INFO] 2024-06-24T09:13:20Z — Route53 health check: PASS",
      "[WARN] 2024-06-24T09:13:25Z — EBS burst balance < 20% (vol-12345)",
      "[INFO] 2024-06-24T09:13:30Z — CloudFront cache hit ratio: 94.2%",
      "[INFO] 2024-06-24T09:13:35Z — DynamoDB consumed read capacity: 42%",
      "[INFO] 2024-06-24T09:13:40Z — ElastiCache memory usage: 67%",
    ];
    let idx = 0;
    const id = setInterval(() => {
      if (idx >= lines.length) {
        idx = 0;
      }
      setLogs((prev) => [...prev.slice(-50), lines[idx]]);
      idx++;
    }, 800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="praise-aws-console flex h-screen w-full flex-col bg-[#0f141f] text-white">
      {/* Top bar */}
      <div className="flex h-12 items-center border-b border-[#232f3e] bg-[#232f3e] px-4">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold">AWS Management Console</div>
          <div className="h-4 w-px bg-[#4a5568]" />
          <div className="text-xs text-[#aab7b8]">CloudWatch</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-[#aab7b8]">ap-northeast-2</div>
          <div className="text-xs text-[#aab7b8]">hyunsubkim@taskcrusher.io</div>
          <button onClick={onClose} className="rounded bg-[#ff9900] px-3 py-1 text-xs font-bold text-[#232f3e] hover:bg-[#e8890c]">
            Sign out
          </button>
        </div>
      </div>

      {/* Sub nav */}
      <div className="flex h-9 items-center border-b border-[#232f3e] bg-[#1a2332] px-4 text-xs text-[#aab7b8]">
        <span className="cursor-pointer hover:text-white">Services</span>
        <ChevronRight className="mx-2 h-3 w-3" />
        <span className="cursor-pointer hover:text-white">CloudWatch</span>
        <ChevronRight className="mx-2 h-3 w-3" />
        <span className="text-white">Logs Insights</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[220px] border-r border-[#232f3e] bg-[#161d26] p-3">
          <div className="mb-3 text-xs font-bold text-[#aab7b8] uppercase tracking-wider">
            CloudWatch
          </div>
          {["Dashboards", "Alarms", "Logs", "Metrics", "X-Ray", "Application Signals", "Container Insights"].map(
            (item) => (
              <div
                key={item}
                className={`mb-1 cursor-pointer rounded px-2 py-1.5 text-[13px] ${
                  item === "Logs" ? "bg-[#232f3e] text-white" : "text-[#aab7b8] hover:text-white"
                }`}
              >
                {item}
              </div>
            )
          )}
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center border-b border-[#232f3e] bg-[#1a2332] px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#2bac76]" />
              <span className="text-sm font-bold">Log group: /aws/lambda/production-api</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded bg-[#232f3e] px-2 py-1 text-xs text-[#aab7b8]">Last 1 hour</span>
              <span className="rounded bg-[#232f3e] px-2 py-1 text-xs text-[#aab7b8]">Live tail</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden p-4">
            <div className="mb-2 rounded border border-[#232f3e] bg-[#161d26] p-3">
              <div className="text-xs text-[#aab7b8] mb-1">Query</div>
              <div className="font-mono text-sm text-[#ff9900]">
                fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20
              </div>
            </div>
            <div className="flex-1 overflow-y-auto rounded border border-[#232f3e] bg-[#0d1117] p-3 font-mono text-xs leading-6">
              {logs.map((l, i) => (
                <div key={i} className={`${l.includes("ERROR") ? "text-[#ff5f5f]" : l.includes("WARN") ? "text-[#f2c744]" : "text-[#aab7b8]"}`}>
                  {l}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Boss Escape: License Agreement ─────────────────── */
function LicenseAgreement({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-screen w-full flex-col bg-[#f5f5f5] text-[#1a1a1a]">
      <div className="flex h-14 items-center border-b border-[#d4d4d4] bg-white px-6">
        <div className="text-sm font-bold text-[#333]">소프트웨어 라이선스 계약서</div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-[#666]">TaskCrusher Enterprise Edition v4.2.1</span>
          <button onClick={onClose} className="rounded border border-[#ccc] bg-[#f0f0f0] px-3 py-1 text-xs font-bold text-[#333] hover:bg-[#e0e0e0]">
            닫기
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[280px] border-r border-[#d4d4d4] bg-white p-4">
          <div className="mb-2 text-xs font-bold text-[#888] uppercase">목차</div>
          {[
            "제1조 (목적)",
            "제2조 (정의)",
            "제3조 (라이선스의 부여)",
            "제4조 (이용 제한)",
            "제5조 (지식재산권)",
            "제6조 (보증의 부인)",
            "제7조 (손해배상)",
            "제8조 (계약의 해지)",
            "제9조 (분쟁해결)",
            "제10조 (기타)",
          ].map((sec, i) => (
            <div
              key={i}
              className={`mb-1 cursor-pointer rounded px-2 py-1.5 text-[13px] ${
                i === 2 ? "bg-[#e8f0fe] font-bold text-[#1a73e8]" : "text-[#555] hover:bg-[#f5f5f5]"
              }`}
            >
              {sec}
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8">
            <h2 className="mb-4 text-2xl font-bold text-[#1a1a1a]">
              최종 사용자 라이선스 계약서 (EULA)
            </h2>
            <div className="space-y-4 text-[15px] leading-7 text-[#333]">
              <p>
                <strong>제1조 (목적)</strong> 본 계약은 TaskCrusher 주식회사(이하 "회사")가
                제공하는 소프트웨어 및 관련 서비스(이하 "소프트웨어")의 이용에 관한 권리와
                의무, 책임 사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
              <p>
                <strong>제2조 (정의)</strong> "사용자"란 본 계약에 따라 회사가 제공하는 소프트웨어를
                이용하는 개인 또는 법인을 의미합니다. "서비스"란 소프트웨어와 관련된 모든
                기술 지원, 업데이트, 클라우드 인프라를 포함합니다.
              </p>
              <p>
                <strong>제3조 (라이선스의 부여)</strong> 회사는 사용자가 본 계약의 조건을 준수하는
                조건 하에, 소프트웨어를 설치, 실행, 백업할 수 있는 제한적이고 비독점적인
                라이선스를 부여합니다. 사용자는 본 라이선스를 제3자에게 양도하거나
                재허가할 수 없습니다.
              </p>
              <p>
                <strong>제4조 (이용 제한)</strong> 사용자는 다음 각 호의 행위를 하여서는 안 됩니다.
                (1) 소프트웨어의 역설계, 디컴파일, 디스어셈블
                (2) 라이선스 키의 불법 복제 또는 공유
                (3) 서비스의 보안 기능을 우회하는 행위
                (4) 타인의 지식재산권을 침해하는 방식으로 소프트웨어를 이용하는 행위
              </p>
              <p>
                <strong>제5조 (지식재산권)</strong> 소프트웨어에 대한 모든 저작권, 특허권,
                상표권, 영업비밀 및 기타 지식재산권은 회사에 귀속됩니다. 본 계약은
                사용자에게 소프트웨어에 대한 소유권을 부여하지 않습니다.
              </p>
              <p>
                <strong>제6조 (보증의 부인)</strong> 소프트웨어는 "있는 그대로" 제공되며, 회사는
                상품성, 특정 목적에의 적합성, 비침해성에 대한 묵시적 보증을 포함하여
                어떠한 종류의 보증도 제공하지 않습니다.
              </p>
              <p>
                <strong>제7조 (손해배상)</strong> 회사의 고의 또는 중대한 과실로 인하여 사용자에게
                손해가 발생한 경우를 제외하고, 회사는 어떠한 간접적, 특별, 부수적,
                징벌적, 결과적 손해에 대하여 책임을 지지 않습니다.
              </p>
              <p>
                <strong>제8조 (계약의 해지)</strong> 사용자가 본 계약의 조건을 위반할 경우, 회사는
                사전 통지 없이 본 계약을 해지할 수 있으며, 이 경우 사용자는 즉시
                소프트웨어의 사용을 중단하고 모든 복사본을 폐기해야 합니다.
              </p>
              <p>
                <strong>제9조 (분쟁해결)</strong> 본 계약과 관련하여 분쟁이 발생한 경우, 양 당사자는
                상호 협의하여 해결을 시도합니다. 협의가 이루어지지 않을 경우, 서울중앙지방법원을
                제1심 관할법원으로 합니다.
              </p>
              <p>
                <strong>제10조 (기타)</strong> 본 계약은 대한민국 법률에 따라 규율되고 해석됩니다.
                본 계약의 일부 조항이 무효로 판결되더라도, 나머지 조항은 유효하게
                유지됩니다.
              </p>
            </div>

            <div className="mt-8 rounded border border-[#d4d4d4] bg-white p-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" checked readOnly />
                <span className="text-[13px] font-medium text-[#333]">
                  위 라이선스 계약의 모든 조항을 읽고 이해하였으며, 이에 동의합니다.
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="rounded bg-[#1a73e8] px-5 py-2 text-sm font-bold text-white hover:bg-[#1557b0]">
                  동의 및 계속
                </button>
                <button className="rounded border border-[#ccc] bg-white px-5 py-2 text-sm font-bold text-[#333] hover:bg-[#f5f5f5]">
                  동의하지 않음
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
