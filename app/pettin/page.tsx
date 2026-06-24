"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================
   Pettin' — 은별이 쓰다듬기 시뮬레이터
   Next.js App Router (React 18) + Tailwind CSS 단일 컴포넌트
   ============================================================ */

type GameState = "idle" | "playing" | "gameover-fast" | "gameover-neglect" | "clear";

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

export default function Page() {
  /* ------------------- 상태 ------------------- */
  const [gameState, setGameState] = useState<GameState>("idle");
  const [satisfaction, setSatisfaction] = useState(0); // 0 ~ 100
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState("");
  const [neglectOpacity, setNeglectOpacity] = useState(0); // 0 ~ 1
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  /* ------------------- 이미지 (고정) ------------------- */
  const NORMAL_IMG = "/pettin-11.jpeg";
  const SAD_IMG = "/pettin-22.jpeg";

  /* ------------------- 레퍼런스 ------------------- */
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
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

  /* ------------------- 상수 ------------------- */
  const SATISFACTION_MAX = 100;
  const TOO_FAST_THRESHOLD = 2.5; // px/ms — 너무 빠른 기준
  const NEGLECT_MS = 2000; // 2초 멈춤
  const BRUSHING_GAIN = 0.6; // 만족도 상승 계수

  /* ------------------- 오디오 초기화 ------------------- */
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    // 1. 화이트 노이즈 버퍼 생성
    const bufferSize = ctx.sampleRate * 2; // 2초짜리 루프
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noiseNodeRef.current = noise;

    // 2. 1100Hz 밴드패스 필터 — "보송한 털 빗질" 중역대 강조
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.8;
    filterRef.current = filter;

    // 3. LFO — 진폭 변조로 "슥-사각-슥-" 아날로그 질감
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 4; // 4Hz 리듬
    lfoRef.current = lfo;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfoGainRef.current = lfoGain;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.gain); // 필터 gain에 변조

    // 4. 마스터 게인 — 속도 v에 따라 동적 볼륨
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
    // 속도가 0.1~2.0 사이일 때 볼륨 매핑
    const vol = Math.min(Math.max((speed - 0.1) / 2, 0), 0.25);
    gain.gain.setTargetAtTime(vol, now, 0.05);
  };

  const stopBrushAudio = () => {
    const gain = gainRef.current;
    if (!gain || !audioCtxRef.current) return;
    gain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
  };

  /* ------------------- 클리어 자장가 ------------------- */
  const playLullaby = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    // C-Major 아르페지오: C4-E4-G4-C5-E5
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
    // 하모니 추가 (G3)
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

  /* ------------------- 파티클 ------------------- */
  const spawnParticle = (x: number, y: number) => {
    const colors = ["#f43f5e", "#fda4af", "#fb7185", "#fecdd3"];
    const id = particleIdRef.current++;
    const p: Particle = {
      id,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -1.5 - Math.random() * 2,
      opacity: 1,
      scale: 0.6 + Math.random() * 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setParticles((prev) => [...prev.slice(-30), p]);
  };

  /* ------------------- 게임 루프 (파티클) ------------------- */
  useEffect(() => {
    const loop = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.015,
            scale: p.scale * 0.99,
          }))
          .filter((p) => p.opacity > 0)
      );
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  /* ------------------- 속도 분석 (Golden Pace) ------------------- */
  const analyzeSpeed = useCallback(
    (x: number, y: number): number => {
      const now = performance.now();
      const history = touchHistoryRef.current;
      history.push({ x, y, t: now });
      // 최근 5개 프레임만 유지
      while (history.length > 5) history.shift();

      if (history.length < 2) return 0;

      const first = history[0];
      const last = history[history.length - 1];
      const dt = last.t - first.t;
      if (dt < 5) return 0; // 너무 짧은 간격은 노이즈
      const dx = last.x - first.x;
      const dy = last.y - first.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const v = dist / dt; // px/ms
      return v;
    },
    []
  );

  /* ------------------- 게임오버 트리거 ------------------- */
  const triggerGameOver = useCallback(
    (type: "fast" | "neglect") => {
      if (!isPlayingRef.current) return;
      isPlayingRef.current = false;
      stopBrushAudio();

      setGameState(type === "fast" ? "gameover-fast" : "gameover-neglect");
      setShowBubble(true);
      setBubbleText(type === "fast" ? "그만,,," : "그만,,,");

      // 햅틱
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    },
    []
  );

  /* ------------------- 쓰다듬기 이벤트 ------------------- */
  const onStrokeStart = useCallback(
    (x: number, y: number) => {
      if (gameState === "clear" || gameState.startsWith("gameover")) return;
      if (gameState === "idle") {
        setGameState("playing");
        isPlayingRef.current = true;
        initAudio();
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume();
        }
      }
      lastTouchTimeRef.current = performance.now();
      touchHistoryRef.current = [{ x, y, t: performance.now() }];
      setNeglectOpacity(0);
      if (neglectTimerRef.current) clearTimeout(neglectTimerRef.current);
      if (neglectAnimRef.current) cancelAnimationFrame(neglectAnimRef.current);
    },
    [gameState, initAudio]
  );

  const onStrokeMove = useCallback(
    (x: number, y: number) => {
      if (!isPlayingRef.current) return;
      const v = analyzeSpeed(x, y);

      // Too Fast 판정
      if (v > TOO_FAST_THRESHOLD) {
        triggerGameOver("fast");
        return;
      }

      // Golden Pace: 적당한 속도 (0.2 ~ 2.0)
      if (v >= 0.15 && v <= TOO_FAST_THRESHOLD) {
        const inc = v * BRUSHING_GAIN * 0.5;
        satisfactionRef.current = Math.min(
          satisfactionRef.current + inc,
          SATISFACTION_MAX
        );
        setSatisfaction(satisfactionRef.current);

        // 파티클
        spawnParticle(x, y);

        // 햅틱
        if (navigator.vibrate) navigator.vibrate(8);

        // 오디오 볼륨
        setBrushVolume(v);
      } else {
        stopBrushAudio();
      }

      lastTouchTimeRef.current = performance.now();

      // Neglect 타이머 재설정
      if (neglectTimerRef.current) clearTimeout(neglectTimerRef.current);
      setNeglectOpacity(0);
      neglectTimerRef.current = setTimeout(() => {
        // 2초 후 neglect 애니메이션 시작
        let start: number | null = null;
        const animate = (ts: number) => {
          if (!start) start = ts;
          const elapsed = ts - start;
          const progress = Math.min(elapsed / 1000, 1); // 1초 동안 서서히
          setNeglectOpacity(progress);
          if (progress < 1) {
            neglectAnimRef.current = requestAnimationFrame(animate);
          } else {
            triggerGameOver("neglect");
          }
        };
        neglectAnimRef.current = requestAnimationFrame(animate);
      }, NEGLECT_MS);
    },
    [analyzeSpeed, triggerGameOver]
  );

  const onStrokeEnd = useCallback(() => {
    stopBrushAudio();
    touchHistoryRef.current = [];
  }, []);

  /* ------------------- 마우스 / 터치 이벤트 바인딩 ------------------- */
  useEffect(() => {
    const wrap = imgWrapRef.current;
    if (!wrap) return;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      onStrokeStart(e.clientX - rect.left, e.clientY - rect.top);
      const handleMove = (ev: MouseEvent) => {
        onStrokeMove(ev.clientX - rect.left, ev.clientY - rect.top);
      };
      const handleUp = () => {
        onStrokeEnd();
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const t = e.touches[0];
      onStrokeStart(t.clientX - rect.left, t.clientY - rect.top);
      const handleTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        const tt = ev.touches[0];
        onStrokeMove(tt.clientX - rect.left, tt.clientY - rect.top);
      };
      const handleTouchEnd = () => {
        onStrokeEnd();
        wrap.removeEventListener("touchmove", handleTouchMove);
        wrap.removeEventListener("touchend", handleTouchEnd);
      };
      wrap.addEventListener("touchmove", handleTouchMove, { passive: false });
      wrap.addEventListener("touchend", handleTouchEnd);
    };

    wrap.addEventListener("mousedown", handleMouseDown);
    wrap.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      wrap.removeEventListener("mousedown", handleMouseDown);
      wrap.removeEventListener("touchstart", handleTouchStart);
    };
  }, [onStrokeStart, onStrokeMove, onStrokeEnd]);

  /* ------------------- 클리어 체크 ------------------- */
  useEffect(() => {
    if (satisfaction >= SATISFACTION_MAX && isPlayingRef.current) {
      isPlayingRef.current = false;
      stopBrushAudio();
      setGameState("clear");
      playLullaby();
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [satisfaction]);

  /* ------------------- 재시작 ------------------- */
  const restart = () => {
    setGameState("idle");
    setSatisfaction(0);
    satisfactionRef.current = 0;
    setShowBubble(false);
    setNeglectOpacity(0);
    setParticles([]);
    isPlayingRef.current = false;
    stopBrushAudio();
    if (neglectTimerRef.current) clearTimeout(neglectTimerRef.current);
    if (neglectAnimRef.current) cancelAnimationFrame(neglectAnimRef.current);
  };

  /* ============================================================
     렌더
     ============================================================ */
  const isGameOver = gameState.startsWith("gameover");
  const isClear = gameState === "clear";
  const currentImg = isGameOver ? SAD_IMG : NORMAL_IMG;

  return (
    <div className="min-h-screen bg-[#fbfaf7] flex flex-col items-center px-6 py-10 select-none">
      {/* 헤더 */}
      <header className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-800 mb-2">
          Pettin&apos;
        </h1>
        <p className="text-sm text-stone-500">
          은별이가 가려운 곳을 긁어주길 기다립니다
        </p>
      </header>

      {/* 만족도 게이지 */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>은별이의 기분</span>
          <span>{Math.floor(satisfaction)}%</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-400 rounded-full transition-all duration-300"
            style={{ width: `${satisfaction}%` }}
          />
        </div>
      </div>

      {/* 메인 이미지 영역 */}
      <div className="relative w-full max-w-sm aspect-square mb-8">
        {/* 이미지 래퍼 */}
        <div
          ref={imgWrapRef}
          className="relative w-full h-full rounded-3xl border border-stone-200 overflow-hidden cursor-grab active:cursor-grabbing bg-white shadow-sm"
        >
          <img
            src={currentImg}
            alt="은별이"
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isGameOver ? "opacity-90" : "opacity-100"
            }`}
            draggable={false}
          />

          {/* 게임오버 / 클리어 오버레이 */}
          {isGameOver && (
            <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" />
          )}

          {/* neglect 블루 안개 */}
          <div
            className="absolute inset-0 bg-blue-200/40 pointer-events-none transition-opacity"
            style={{ opacity: neglectOpacity }}
          />

          {/* 클리어 고깔모자 */}
          {isClear && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
              🎉
            </div>
          )}

          {/* 말풍선 */}
          {showBubble && (
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 animate-[fadeIn_0.5s_ease]">
              <div className="relative bg-white/90 px-5 py-3 rounded-2xl rounded-bl-none shadow-lg border border-stone-100">
                <p className="text-stone-700 text-sm font-medium tracking-wide">
                  {bubbleText}
                </p>
                <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white/90 border-b border-r border-stone-100 rotate-45" />
              </div>
            </div>
          )}

          {/* 게임오버 텍스트 */}
          {isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-stone-800 text-lg font-semibold mb-1">
                  {gameState === "gameover-fast"
                    ? "은별이가 깜짝 놀라 도망쳤어요!"
                    : "오래 멈춘 손길에 외로워합니다"}
                </p>
                <button
                  onClick={restart}
                  className="mt-3 px-5 py-2 bg-stone-800 text-white text-sm rounded-full hover:bg-stone-700 transition"
                >
                  다시 시작
                </button>
              </div>
            </div>
          )}

          {/* 클리어 텍스트 */}
          {isClear && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-stone-800 text-lg font-semibold">
                  은별이가 행복해졌어요 🐾
                </p>
                <button
                  onClick={restart}
                  className="mt-3 px-5 py-2 bg-rose-400 text-white text-sm rounded-full hover:bg-rose-500 transition"
                >
                  다시 쓰다듬기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 하트 파티클 레이어 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: p.x,
                top: p.y,
                opacity: p.opacity,
                transform: `scale(${p.scale})`,
                transition: "transform 0.1s linear",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill={p.color}>
                <path d="M10 18.35l-1.45-1.32C5.4 12.36 2.5 9.28 2.5 6.5 2.5 4.24 4.24 2.5 6.5 2.5c1.17 0 2.3.55 3.05 1.42l-.05.05.05-.05C10.2 3.55 11.33 3 12.5 3c2.26 0 4 1.74 4 3.5 0 2.78-2.9 5.86-6.05 10.53L10 18.35z" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 가이드 */}
      <div className="text-center text-xs text-stone-400 space-y-1">
        <p>💡 조심스럽게 쓰다듬어 주세요</p>
        <p>너무 빠르거나 2초 이상 멈추면 은별이가 놀라요</p>
      </div>

      {/* 시작 안내 */}
      {gameState === "idle" && (
        <div className="fixed inset-0 flex items-center justify-center bg-stone-900/10 pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-lg border border-stone-100 text-center animate-pulse">
            <p className="text-stone-700 text-sm font-medium">
              은별이를 쓰다듬어 보세요 🐕
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
