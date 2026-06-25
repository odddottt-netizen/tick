"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
   Pettin' — 은별이 쓰다듬기 시뮬레이터
   + sunmul.app 감성 + PC/Mobile 이중 카모플라주 시스템
   Next.js App Router (React 18) + Tailwind CSS 단일 파일
   ============================================================ */

/* ─────── 타입 ─────── */
type GameState = "idle" | "playing" | "gameover-fast" | "gameover-neglect" | "clear";
type AppMode = "game" | "camouflage";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  scale: number;
  color: string;
}

interface TouchRecord {
  x: number;
  y: number;
  t: number;
}

/* ─────── 상수 ─────── */
const SATISFACTION_MAX = 100;
const TOO_FAST_THRESHOLD = 2.5; // px/ms
const NEGLECT_MS = 2000;
const BRUSHING_GAIN = 0.6;
const DAMPING = 0.55; // 모바일 터치 감쇠 계수
const TOUCH_Y_OFFSET = -35; // 손가락 가림 방지 Y 오프셋
const NORMAL_IMG = "/pettin-11.jpeg";
const SAD_IMG = "/pettin-22.jpeg";
const PARTICLE_COLORS = ["#f43f5e", "#fda4af", "#fb7185", "#fecdd3"];

/* ============================================================
   1. Pettin' 게임 컴포넌트
   ============================================================ */
function PettinGame({ onToggleCamo }: { onToggleCamo: () => void }) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [satisfaction, setSatisfaction] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [neglectOpacity, setNeglectOpacity] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  const imgWrapRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const touchHistoryRef = useRef<TouchRecord[]>([]);
  const neglectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const neglectAnimRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number>(0);
  const gameLoopRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const satisfactionRef = useRef(0);
  const lastTapRef = useRef<number>(0); // 더블 탭 감지

  /* ─────── 오디오 ─────── */
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.8;
    filterRef.current = filter;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 4;
    lfoRef.current = lfo;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfoGainRef.current = lfoGain;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.gain);

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gainRef.current = gain;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    lfo.start();
  }, []);

  const setBrushVolume = (speed: number) => {
    const gain = gainRef.current;
    if (!gain || !audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    const vol = Math.min(Math.max((speed * DAMPING - 0.1) / 2, 0), 0.25);
    gain.gain.setTargetAtTime(vol, now, 0.05);
  };

  const stopBrushAudio = () => {
    const gain = gainRef.current;
    if (!gain || !audioCtxRef.current) return;
    gain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
  };

  const playLullaby = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((freq, i) => {
      const t = now + i * 0.4;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    });
    const bass = ctx.createOscillator();
    const bassG = ctx.createGain();
    bass.type = "triangle";
    bass.frequency.value = 196.0;
    bassG.gain.setValueAtTime(0.06, now);
    bassG.gain.exponentialRampToValueAtTime(0.001, now + 3);
    bass.connect(bassG);
    bassG.connect(ctx.destination);
    bass.start(now);
    bass.stop(now + 3);
  };

  /* ─────── 파티클 ─────── */
  const spawnParticle = (x: number, y: number) => {
    const id = particleIdRef.current++;
    const p: Particle = {
      id,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -1.5 - Math.random() * 2,
      opacity: 1,
      scale: 0.6 + Math.random() * 0.8,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    };
    setParticles((prev) => [...prev.slice(-30), p]);
  };

  useEffect(() => {
    const loop = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, opacity: p.opacity - 0.015, scale: p.scale * 0.99 }))
          .filter((p) => p.opacity > 0)
      );
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, []);

  /* ─────── 속도 분석 (Golden Pace + 감쇠) ─────── */
  const analyzeSpeed = useCallback((x: number, y: number): number => {
    const now = performance.now();
    const history = touchHistoryRef.current;
    history.push({ x, y, t: now });
    while (history.length > 5) history.shift();
    if (history.length < 2) return 0;
    const first = history[0];
    const last = history[history.length - 1];
    const dt = last.t - first.t;
    if (dt < 5) return 0;
    const dist = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
    return (dist / dt) * DAMPING; // 감쇠 계수 적용
  }, []);

  /* ─────── 게임오버 ─────── */
  const triggerGameOver = useCallback((type: "fast" | "neglect") => {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;
    stopBrushAudio();
    setGameState(type === "fast" ? "gameover-fast" : "gameover-neglect");
    setShowBubble(true);
    setBubbleText("그만,,,");
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  /* ─────── 더블 탭 감지 (위장 모드) ─────── */
  const detectDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onToggleCamo();
    }
    lastTapRef.current = now;
  };

  /* ─────── 쓰다듬기 이벤트 ─────── */
  const onStrokeStart = useCallback((x: number, y: number) => {
    if (gameState === "clear" || gameState.startsWith("gameover")) return;
    detectDoubleTap();
    if (gameState === "idle") {
      setGameState("playing");
      isPlayingRef.current = true;
      initAudio();
      if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    }
    lastTouchTimeRef.current = performance.now();
    touchHistoryRef.current = [{ x, y, t: performance.now() }];
    setNeglectOpacity(0);
    if (neglectTimerRef.current) clearTimeout(neglectTimerRef.current);
    if (neglectAnimRef.current) cancelAnimationFrame(neglectAnimRef.current);
  }, [gameState, initAudio, onToggleCamo]);

  const onStrokeMove = useCallback((x: number, y: number) => {
    if (!isPlayingRef.current) return;
    const v = analyzeSpeed(x, y + TOUCH_Y_OFFSET); // Y축 오프셋 적용
    if (v > TOO_FAST_THRESHOLD * DAMPING) { triggerGameOver("fast"); return; }
    if (v >= 0.15 * DAMPING && v <= TOO_FAST_THRESHOLD * DAMPING) {
      const inc = v * BRUSHING_GAIN * 0.5;
      satisfactionRef.current = Math.min(satisfactionRef.current + inc, SATISFACTION_MAX);
      setSatisfaction(satisfactionRef.current);
      spawnParticle(x, y + TOUCH_Y_OFFSET);
      if (navigator.vibrate) navigator.vibrate(8);
      setBrushVolume(v);
    } else { stopBrushAudio(); }
    lastTouchTimeRef.current = performance.now();
    if (neglectTimerRef.current) clearTimeout(neglectTimerRef.current);
    setNeglectOpacity(0);
    neglectTimerRef.current = setTimeout(() => {
      let start: number | null = null;
      const animate = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / 1000, 1);
        setNeglectOpacity(progress);
        if (progress < 1) neglectAnimRef.current = requestAnimationFrame(animate);
        else triggerGameOver("neglect");
      };
      neglectAnimRef.current = requestAnimationFrame(animate);
    }, NEGLECT_MS);
  }, [analyzeSpeed, triggerGameOver]);

  const onStrokeEnd = useCallback(() => { stopBrushAudio(); touchHistoryRef.current = []; }, []);

  /* ─────── 이벤트 바인딩 ─────── */
  useEffect(() => {
    const wrap = imgWrapRef.current;
    if (!wrap) return;
    const handleMouseDown = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      onStrokeStart(e.clientX - rect.left, e.clientY - rect.top);
      const handleMove = (ev: MouseEvent) => { onStrokeMove(ev.clientX - rect.left, ev.clientY - rect.top); };
      const handleUp = () => { onStrokeEnd(); window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    };
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const t = e.touches[0];
      onStrokeStart(t.clientX - rect.left, t.clientY - rect.top);
      const handleTouchMove = (ev: TouchEvent) => { ev.preventDefault(); const tt = ev.touches[0]; onStrokeMove(tt.clientX - rect.left, tt.clientY - rect.top); };
      const handleTouchEnd = () => { onStrokeEnd(); wrap.removeEventListener("touchmove", handleTouchMove); wrap.removeEventListener("touchend", handleTouchEnd); };
      wrap.addEventListener("touchmove", handleTouchMove, { passive: false });
      wrap.addEventListener("touchend", handleTouchEnd);
    };
    wrap.addEventListener("mousedown", handleMouseDown);
    wrap.addEventListener("touchstart", handleTouchStart, { passive: false });
    return () => { wrap.removeEventListener("mousedown", handleMouseDown); wrap.removeEventListener("touchstart", handleTouchStart); };
  }, [onStrokeStart, onStrokeMove, onStrokeEnd]);

  /* ─────── 클리어 체크 ─────── */
  useEffect(() => {
    if (satisfaction >= SATISFACTION_MAX && isPlayingRef.current) {
      isPlayingRef.current = false;
      stopBrushAudio();
      setGameState("clear");
      playLullaby();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [satisfaction]);

  /* ─────── 재시작 ─────── */
  const restart = () => {
    setGameState("idle"); setSatisfaction(0); satisfactionRef.current = 0;
    setShowBubble(false); setNeglectOpacity(0); setParticles([]);
    isPlayingRef.current = false; stopBrushAudio();
    if (neglectTimerRef.current) clearTimeout(neglectTimerRef.current);
    if (neglectAnimRef.current) cancelAnimationFrame(neglectAnimRef.current);
  };

  const isGameOver = gameState.startsWith("gameover");
  const isClear = gameState === "clear";
  const currentImg = isGameOver ? SAD_IMG : NORMAL_IMG;

  return (
    <div className="min-h-[100dvh] bg-[#fbfaf7] flex flex-col items-center px-6 py-10 select-none" style={{ touchAction: "none", wordBreak: "keep-all", overflowWrap: "break-word" }}>
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-800 mb-2" style={{ fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', serif" }}>Pettin&apos;</h1>
        <p className="text-sm text-stone-500">은별이가 가려운 곳을 긁어주길 기다립니다</p>
      </header>

      {/* 만족도 게이지 */}
      <div className="w-full max-w-xs mb-5">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>은별이의 기분</span><span>{Math.floor(satisfaction)}%</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-rose-400 rounded-full transition-all duration-300" style={{ width: `${satisfaction}%` }} />
        </div>
      </div>

      {/* 메인 이미지 영역 */}
      <div className="relative w-full max-w-sm aspect-square mb-6">
        <div ref={imgWrapRef} className="relative w-full h-full rounded-3xl border border-stone-200 overflow-hidden cursor-grab active:cursor-grabbing bg-white shadow-xl shadow-stone-200/50">
          <img src={currentImg} alt="은별이" className={`w-full h-full object-cover transition-opacity duration-500 ${isGameOver ? "opacity-90" : "opacity-100"}`} draggable={false} />
          {isGameOver && <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" />}
          <div className="absolute inset-0 bg-blue-200/40 pointer-events-none transition-opacity" style={{ opacity: neglectOpacity }} />
          {isClear && <div className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl animate-bounce">🎉</div>}
          {showBubble && (
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 animate-[fadeIn_0.5s_ease]">
              <div className="relative bg-white/90 px-5 py-3 rounded-2xl rounded-bl-none shadow-lg border border-stone-100">
                <p className="text-stone-700 text-sm font-medium tracking-wide">{bubbleText}</p>
                <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white/90 border-b border-r border-stone-100 rotate-45" />
              </div>
            </div>
          )}
          {isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-stone-800 text-lg font-semibold mb-1">{gameState === "gameover-fast" ? "은별이가 깜짝 놀라 도망쳤어요!" : "오래 멈춘 손길에 외로워합니다"}</p>
                <button onClick={restart} className="mt-3 px-5 py-2 bg-stone-800 text-white text-sm rounded-full hover:bg-stone-700 transition">다시 시작</button>
              </div>
            </div>
          )}
          {isClear && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-stone-800 text-lg font-semibold">은별이가 행복해졌어요 🐾</p>
                <button onClick={restart} className="mt-3 px-5 py-2 bg-rose-400 text-white text-sm rounded-full hover:bg-rose-500 transition">다시 쓰다듬기</button>
              </div>
            </div>
          )}
        </div>
        {/* 파티클 레이어 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {particles.map((p) => (
            <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, opacity: p.opacity, transform: `scale(${p.scale})`, transition: "transform 0.1s linear" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill={p.color}><path d="M10 18.35l-1.45-1.32C5.4 12.36 2.5 9.28 2.5 6.5 2.5 4.24 4.24 2.5 6.5 2.5c1.17 0 2.3.55 3.05 1.42l-.05.05.05-.05C10.2 3.55 11.33 3 12.5 3c2.26 0 4 1.74 4 3.5 0 2.78-2.9 5.86-6.05 10.53L10 18.35z" /></svg>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 가이드 + 위장 버튼 */}
      <div className="text-center text-xs text-stone-400 space-y-1 mb-4">
        <p>💡 조심스럽게 쓰다듬어 주세요</p>
        <p>너무 빠르거나 2초 이상 멈추면 은별이가 놀라요</p>
      </div>
      <button onClick={onToggleCamo} className="mt-auto mb-4 px-4 py-2 bg-stone-100 text-stone-500 text-xs rounded-full border border-stone-200 hover:bg-stone-200 transition">🏢 회사 모드</button>

      {/* 시작 안내 */}
      {gameState === "idle" && (
        <div className="fixed inset-0 flex items-center justify-center bg-stone-900/10 pointer-events-none z-40">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-stone-100 text-center animate-pulse">
            <p className="text-stone-700 text-sm font-medium">은별이를 쓰다듬어 보세요 🐕</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   2. PC 위장: Slack 데스크탑 뷰 (Desktop Camouflage)
   ============================================================ */
function SlackCamouflage({ onBack }: { onBack: () => void }) {
  const channels = ["#general", "#random", "#tft-issue", "#praise-me"];
  const dms = ["김 팀장", "이 대리", "박 과장"];
  const [activeChannel, setActiveChannel] = useState("#praise-me");
  const messages = [
    { user: "김 팀장", role: "PM", text: "오늘 리뷰 잘 봤습니다. 고생 많으셨어요!", time: "09:42" },
    { user: "이 대리", role: "디자인", text: "피그마 파일 링크 공유드릴게요", time: "09:45" },
    { user: "박 과장", role: "개발", text: "배포 완료했습니다. 모니터링 중이에요", time: "10:12" },
    { user: "김 팀장", role: "PM", text: "모두 고생하셨습니다. 점심 맛있게 드세요 🍱", time: "11:30" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex" style={{ fontFamily: "'Segoe UI', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-[#19171d] text-[#bcabbb] flex flex-col border-r border-[#2c2c2e] select-none">
        <div className="px-4 py-3 border-b border-[#2c2c2e] flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">💼 우리 회사</h2>
          <span className="text-xs">▼</span>
        </div>
        <div className="px-3 pt-3 pb-1 text-xs text-[#999] font-medium">채널</div>
        {channels.map((ch) => (
          <div key={ch} onClick={() => setActiveChannel(ch)} className={`mx-2 px-3 py-1.5 rounded text-sm cursor-pointer transition ${activeChannel === ch ? "bg-[#1164a3] text-white" : "hover:bg-[#2c2c2e] hover:text-white"}`}>
            <span className="mr-1 text-[#666]">#</span>{ch.slice(1)}
          </div>
        ))}
        <div className="px-3 pt-3 pb-1 text-xs text-[#999] font-medium">다이렉트 메시지</div>
        {dms.map((name) => (
          <div key={name} className="mx-2 px-3 py-1.5 rounded text-sm cursor-pointer hover:bg-[#2c2c2e] hover:text-white transition flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#2eb67d] flex items-center justify-center text-[10px] text-white font-bold">{name[0]}</div>
            {name}
          </div>
        ))}
        <div className="mt-auto px-3 py-3 border-t border-[#2c2c2e]">
          <button onClick={onBack} className="w-full text-xs text-[#999] hover:text-white text-left transition">← 게임으로 돌아가기</button>
        </div>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 flex flex-col bg-[#1a1d21] min-w-0">
        <header className="h-14 border-b border-[#2c2c2e] flex items-center justify-between px-5">
          <div>
            <div className="text-white font-bold text-sm">{activeChannel}</div>
            <div className="text-[#999] text-xs">팀 공지사항 및 업무 소통</div>
          </div>
          <div className="bg-[#2c2c2e] border border-[#3e3e40] rounded px-3 py-1.5 text-xs text-[#888] flex items-center gap-2">
            <span>🔍</span><span>검색</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-center text-xs text-[#555] my-4">오늘</div>
          {messages.map((m, i) => (
            <div key={i} className="flex gap-3 hover:bg-[#222529] p-2 rounded transition">
              <div className="w-9 h-9 rounded bg-[#36c5f0] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{m.user[0]}</div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-white text-sm font-bold">{m.user}</span>
                  <span className="text-[#999] text-[10px] bg-[#2c2c2e] px-1.5 rounded-full">{m.role}</span>
                  <span className="text-[#666] text-[10px]">{m.time}</span>
                </div>
                <p className="text-[#d1d2d3] text-sm leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[#2c2c2e]">
          <div className="bg-[#222529] border border-[#3e3e40] rounded-lg px-3 py-2 text-sm text-[#888]">{activeChannel} 에 메시지 보내기</div>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   3. Mobile 위장: 카카오톡 채팅방 (Mobile Camouflage)
   ============================================================ */
function KakaoCamouflage({ onBack }: { onBack: () => void }) {
  const chats = [
    { me: false, text: "오늘 회의 몇 시에요?", time: "09:15" },
    { me: true, text: "10시에요!", time: "09:16" },
    { me: false, text: "알겠습니다. 준비해 둘게요", time: "09:17" },
    { me: true, text: "넵 감사합니다 🙇", time: "09:18" },
    { me: false, text: "점심 뭐 드실래요?", time: "11:25" },
    { me: true, text: "김치찌개 어떠세요?", time: "11:26" },
    { me: false, text: "좋아요! 같이 가요", time: "11:27" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#b2c7da]" style={{ fontFamily: "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif" }}>
      {/* 헤더 */}
      <header className="h-12 bg-[#9bbbd4] flex items-center justify-between px-4 text-white border-b border-[#8aaac5] shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-lg">←</button>
          <span className="font-bold text-sm">김 팀장</span>
        </div>
        <div className="flex gap-3 text-sm">
          <span>🔍</span><span>☰</span>
        </div>
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center text-xs text-[#666] my-2">2024년 6월 24일 월요일</div>
        {chats.map((c, i) => (
          <div key={i} className={`flex ${c.me ? "justify-end" : "justify-start"} gap-2`}>
            {!c.me && <div className="w-8 h-8 rounded-full bg-[#8aaac5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">김</div>}
            <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${c.me ? "bg-[#fef01b] text-stone-800 rounded-br-sm" : "bg-white text-stone-800 rounded-bl-sm"}`} style={{ wordBreak: "keep-all", overflowWrap: "break-word" }}>
              {c.text}
            </div>
            <span className="text-[10px] text-[#666] self-end flex-shrink-0">{c.time}</span>
          </div>
        ))}
      </div>

      {/* 입력창 */}
      <div className="bg-white px-3 py-2 border-t border-[#ddd] flex items-center gap-2 shrink-0">
        <button className="text-xl text-[#999]">+</button>
        <div className="flex-1 bg-[#f5f5f5] rounded-full px-4 py-2 text-sm text-[#888]">메시지를 입력하세요</div>
        <button className="text-xl text-[#999]">😊</button>
        <button className="text-xl text-[#9bbbd4]">⬆</button>
      </div>

      {/* 하단 탭 (위장용) */}
      <div className="h-14 bg-white border-t border-[#eee] flex items-center justify-around shrink-0">
        <span className="text-2xl">👤</span>
        <span className="text-2xl">💬</span>
        <span className="text-2xl">⚙</span>
      </div>
    </div>
  );
}

/* ============================================================
   4. 메인 페이지: 기기 감지 + 위장 모드 전환
   ============================================================ */
export default function Page() {
  const [mode, setMode] = useState<AppMode>("game");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleCamo = () => setMode((prev) => (prev === "game" ? "camouflage" : "game"));

  return (
    <div className="min-h-[100dvh]">
      {mode === "game" ? (
        <PettinGame onToggleCamo={toggleCamo} />
      ) : isDesktop ? (
        <SlackCamouflage onBack={toggleCamo} />
      ) : (
        <KakaoCamouflage onBack={toggleCamo} />
      )}
    </div>
  );
}
