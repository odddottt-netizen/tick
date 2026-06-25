'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';

// ─── Types ─────────────────────────────────────────────────────────────────
interface PhysicsBlock {
  id: string;
  body: Matter.Body;
  text: string;
  width: number;
  height: number;
  isBoss: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  angle: number;
  vAngle: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const BOSS_TEXTS = [
  'Q3 Market Expansion Strategy',
  'Stakeholder Alignment Framework',
  'ROI Optimization Roadmap',
  'Cross-functional Synergy Plan',
  'Agile Sprint Retrospective',
  'KPI Dashboard & Analytics',
  'Customer Journey Mapping',
  'Revenue Diversification Model',
  'Brand Equity Enhancement',
  'Operational Excellence Initiative',
  'Digital Transformation Blueprint',
  'Talent Acquisition Pipeline',
  'Product-Market Fit Analysis',
  'Competitive Landscape Review',
  'Sustainable Growth Framework',
];

const BLOCK_COLORS = [
  '#f5f2eb', '#f0ece3', '#ebe7dc', '#e8e2d9', '#f2efe8',
  '#ede9e0', '#e5e0d5', '#ebe6db', '#efebdf', '#e3ded3',
];

const SAND_COLORS = [
  '#d4ccc0', '#c8bfb0', '#b8a99a', '#a89a8a', '#c4b8a8',
  '#d8cfc0', '#e0d8d0', '#c0b5a5', '#b0a08a', '#d0c8b8',
];

// ─── Notion Doc Camouflage ────────────────────────────────────────────────
function NotionDocCamouflage({ onClose }: { onClose: () => void }) {
  const sections = [
    { heading: '📌 이번 분기 핵심 목표', body: '브랜드 인지도 확대와 신규 고객 유입을 중심으로 채널별 성과 지표를 재정의한다. 특히 유튜브 쇼핑과 스마트스토어 연계 프로모션을 통해 전환율을 전분기 대비 15% 향상시키는 것을 목표로 한다.' },
    { heading: '🗂 주요 업무 현황', body: 'SS 시즌 신상품 7종 기획 완료. 상세페이지 제작 3건 진행 중. 카카오 채널 자동화 메시지 A/B 테스트 결과 분석 대기 상태. 데이터랩 기반 키워드 보고서 초안 작성 완료.' },
    { heading: '📊 채널별 주간 리뷰', body: '자사몰 방문자 전주 대비 +8%. 스마트스토어 클릭률 3.2%로 카테고리 평균 상회. 유튜브 라이브 시청자 수 감소 추세 — 방송 시간대 조정 검토 필요.' },
    { heading: '⚠️ 리스크 및 이슈', body: '주력 원단 공급사 납기 2주 지연 통보 수신. FW 시즌 첫 출시 일정 조정 필요. 경쟁사 오르(Orr) 동일 가격대 신상품 출시 예고 — 포지셔닝 차별화 전략 재검토 요망.' },
  ];
  return (
    <div
      className="fixed inset-0 z-[100] overflow-auto"
      style={{ background: '#ffffff', fontFamily: "'Noto Sans KR', system-ui, sans-serif" }}
      onDoubleClick={onClose}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 32px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '22px' }}>📄</span>
          <span style={{ fontSize: '13px', color: '#b0b0b0' }}>데뮤즈 / 팀장 업무 노트</span>
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px', wordBreak: 'keep-all' }}>
          2026 SS 시즌 운영 현황 & 전략 메모
        </h1>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '36px', flexWrap: 'wrap' }}>
          {['마케팅', '전략', '시즌기획'].map(tag => (
            <span key={tag} style={{ fontSize: '12px', background: '#f1f0ef', color: '#787774', borderRadius: '4px', padding: '2px 8px' }}>{tag}</span>
          ))}
        </div>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px', wordBreak: 'keep-all' }}>{s.heading}</h2>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#37352f', wordBreak: 'keep-all' }}>{s.body}</p>
          </div>
        ))}
        <p style={{ fontSize: '11px', color: '#d0d0d0', textAlign: 'center', marginTop: '48px' }}>더블탭하여 돌아가기</p>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function StardustVentPage() {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const blocksRef = useRef<PhysicsBlock[]>([]);
  const rafRef = useRef<number>(0);
  const escTimerRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleRafRef = useRef<number>(0);
  const isVentedRef = useRef(false);

  // State
  const [inputValue, setInputValue] = useState('');
  const [blockCount, setBlockCount] = useState(0);
  const [isVented, setIsVented] = useState(false);
  const [bossMode, setBossMode] = useState(false);
  const [showBossHint, setShowBossHint] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // ─── Matter.js Init ───────────────────────────────────────────────────────
  const initPhysics = useCallback(() => {
    if (!containerRef.current) return;

    const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.2, scale: 0.001 },
    });
    engineRef.current = engine;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const wallThick = 100;

    const ground = Bodies.rectangle(w / 2, h + wallThick / 2 - 10, w + 200, wallThick, {
      isStatic: true,
      friction: 0.8,
      restitution: 0.2,
      render: { visible: false },
    });
    const leftWall = Bodies.rectangle(-wallThick / 2, h / 2, wallThick, h * 3, {
      isStatic: true,
      render: { visible: false },
    });
    const rightWall = Bodies.rectangle(w + wallThick / 2, h / 2, wallThick, h * 3, {
      isStatic: true,
      render: { visible: false },
    });

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Mouse interaction for dragging blocks
    const mouse = Mouse.create(containerRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.15,
        render: { visible: false },
      } as any,
    });
    Composite.add(engine.world, mouseConstraint);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Sync loop: update React state to trigger re-render of block positions
    const syncLoop = () => {
      if (!isVentedRef.current) {
        setRenderTick((t) => t + 1);
      }
      rafRef.current = requestAnimationFrame(syncLoop);
    };
    rafRef.current = requestAnimationFrame(syncLoop);
  }, []);

  // ─── Add Block ────────────────────────────────────────────────────────────
  const addBlock = useCallback(
    (text: string) => {
      if (!engineRef.current || !containerRef.current || isVentedRef.current) return;

      const { Bodies, Composite } = Matter;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      const padding = 20;
      const baseWidth = Math.min(280, Math.max(100, text.length * 13 + padding * 2));
      const blockHeight = 42;

      const x = Math.random() * (w - baseWidth - 40) + baseWidth / 2 + 20;
      const y = -60 - Math.random() * 100;

      const body = Bodies.rectangle(x, y, baseWidth, blockHeight, {
        restitution: 0.4,
        friction: 0.6,
        frictionAir: 0.015,
        chamfer: { radius: 14 },
        angle: (Math.random() - 0.5) * 0.3,
      });

      const id = `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      Composite.add(engineRef.current.world, body);

      const newBlock: PhysicsBlock = {
        id,
        body,
        text,
        width: baseWidth,
        height: blockHeight,
        isBoss: false,
      };

      blocksRef.current.push(newBlock);
      setBlockCount((c) => c + 1);
      setRenderTick((t) => t + 1);
    },
    []
  );

  // ─── Vent (Stardust Explosion) ────────────────────────────────────────────
  const vent = useCallback(() => {
    if (blocksRef.current.length === 0 || isVentedRef.current) return;
    isVentedRef.current = true;
    setIsVented(true);

    // Play ASMR sound
    playVentSound();
    if (navigator.vibrate) navigator.vibrate(300);

    // Generate particles from each block
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const newParticles: Particle[] = [];
    blocksRef.current.forEach((block) => {
      const bx = block.body.position.x;
      const by = block.body.position.y;
      const count = 40 + Math.floor(block.text.length * 3);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 6;
        const size = 1.5 + Math.random() * 3.5;
        const color = SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)];

        newParticles.push({
          x: bx + (Math.random() - 0.5) * block.width * 0.6,
          y: by + (Math.random() - 0.5) * block.height * 0.6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1,
          maxLife: 0.6 + Math.random() * 1.2,
          size,
          color,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.15,
        });
      }
    });

    particlesRef.current = newParticles;

    // Fade out blocks visually
    const blockEls = document.querySelectorAll<HTMLElement>('.physics-block');
    blockEls.forEach((el) => {
      el.style.transition = 'opacity 0.4s ease, transform 0.5s ease';
      el.style.opacity = '0';
      el.style.transform = `${el.style.transform || ''} scale(1.15)`.trim();
    });

    // Start particle animation
    let startTime = performance.now();
    const animateParticles = (now: number) => {
      const dt = Math.min((now - startTime) / 1000, 0.05);
      startTime = now;

      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      ctx.clearRect(0, 0, cw, ch);

      let alive = 0;
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.8; // gravity
        p.vx *= 0.985; // air resistance
        p.vy *= 0.985;
        p.angle += p.vAngle;
        p.life -= dt / p.maxLife;

        if (p.life > 0) {
          alive++;
          const alpha = Math.max(0, p.life * (p.life < 0.2 ? p.life / 0.2 : 1));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.roundRect(-p.size / 2, -p.size / 2, p.size, p.size, p.size * 0.3);
          ctx.fill();
          ctx.restore();
        }
      });

      if (alive > 0) {
        particleRafRef.current = requestAnimationFrame(animateParticles);
      } else {
        // Clean up physics world
        if (engineRef.current) {
          const { Composite } = Matter;
          blocksRef.current.forEach((b) => {
            Composite.remove(engineRef.current!.world, b.body);
          });
        }
        blocksRef.current = [];
        setBlockCount(0);
        setTimeout(() => {
          isVentedRef.current = false;
          setIsVented(false);
          ctx.clearRect(0, 0, cw, ch);
        }, 400);
      }
    };

    particleRafRef.current = requestAnimationFrame(animateParticles);
  }, []);

  // ─── ASMR Sound ────────────────────────────────────────────────────────────
  const playVentSound = useCallback(() => {
    try {
      let ctx = audioCtxRef.current;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') ctx.resume();

      const duration = 2.5;
      const sampleRate = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Brown noise approximation (deeper, softer than white noise — like sand/wind)
      let lastOut = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Low-pass filter for "sand through fingers" / wind whisper
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;

      // High-pass to remove rumble
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 120;

      // Gain envelope (fade in/out)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration - 0.3);

      source.connect(highPass);
      highPass.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
    } catch {
      // AudioContext may be blocked; silently fail
    }
  }, []);

  // ─── Boss Escape (Double ESC) ─────────────────────────────────────────────
  const triggerBossMode = useCallback(() => {
    setBossMode(true);
    setShowBossHint(true);

    if (engineRef.current && blocksRef.current.length > 0) {
      blocksRef.current.forEach((block) => {
        const newText = BOSS_TEXTS[Math.floor(Math.random() * BOSS_TEXTS.length)];
        block.text = newText;
        block.isBoss = true;
      });
      setRenderTick((t) => t + 1);
    }

    setTimeout(() => setShowBossHint(false), 3000);
  }, []);

  // ─── Handle Input Submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      addBlock(trimmed);
      setInputValue('');
      setBossMode(false);
    },
    [inputValue, addBlock]
  );

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    initPhysics();

    const handleResize = () => {
      if (!engineRef.current || !containerRef.current) return;
      const { Composite, Bodies } = Matter;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const bodies = Composite.allBodies(engineRef.current.world);
      bodies.forEach((b) => {
        if (b.isStatic) Composite.remove(engineRef.current!.world, b);
      });
      const wallThick = 100;
      const ground = Bodies.rectangle(w / 2, h + wallThick / 2 - 10, w + 200, wallThick, {
        isStatic: true,
        friction: 0.8,
        restitution: 0.2,
      });
      const leftWall = Bodies.rectangle(-wallThick / 2, h / 2, wallThick, h * 3, { isStatic: true });
      const rightWall = Bodies.rectangle(w + wallThick / 2, h / 2, wallThick, h * 3, { isStatic: true });
      Composite.add(engineRef.current.world, [ground, leftWall, rightWall]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - escTimerRef.current < 500) {
          triggerBossMode();
          escTimerRef.current = 0;
        } else {
          escTimerRef.current = now;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (particleRafRef.current) cancelAnimationFrame(particleRafRef.current);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, [initPhysics, triggerBossMode]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (bossMode) return <NotionDocCamouflage onClose={() => setBossMode(false)} />;
  return (
    <div className="stardust-page">
      {/* Header */}
      <div className="relative z-30 flex flex-col items-center pt-10 pb-4 px-6">
        <div className="stardust-title mb-1">Stardust Vent</div>
        <div className="stardust-subtitle mb-6">
          마음의 짐을 글로 쓰고, 별가루로 날려버리세요
        </div>

        {/* Poem prompt above input */}
        <p className="stardust-input-poem max-w-md mb-4 px-4">
          오늘 당신의 마음을 무겁게 만든 그림자를<br />
          조용히 적어주세요. 글자는 쌓이고, 당신은 가벼워집니다.
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit} className="w-full flex justify-center mb-4">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="여기에 마음의 무게를 내려놓으세요..."
            className="stardust-input"
            disabled={isVented}
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isVented}
            className="stardust-vent-btn"
            style={{ opacity: inputValue.trim() && !isVented ? 1 : 0.5 }}
          >
            떨어뜨리기
          </button>
          <button
            type="button"
            onClick={vent}
            disabled={blockCount === 0 || isVented}
            className="stardust-vent-btn"
            style={{
              background: 'linear-gradient(135deg, #b8a99a 0%, #a89988 100%)',
              opacity: blockCount > 0 && !isVented ? 1 : 0.5,
            }}
          >
            우주 먼지로 소멸 (Vent)
          </button>
        </div>

        {/* Security badge */}
        <div className="stardust-security-badge mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Zero-Data: 입력된 텍스트는 서버에 전송되지 않습니다. 이 브라우저 탭의 메모리에서만 존재합니다.
        </div>

        {/* Boss hint */}
        {showBossHint ? (
          <div className="text-xs text-[#8FA89A] font-medium mt-1 animate-fade-in-up">
            보스 대피 모드 활성화 — 모든 텍스트가 기획서로 변경되었습니다
          </div>
        ) : (
          <div className="stardust-boss-hint mt-1">
            보스가 오면 ESC 키를 두 번 빠르게 누르세요
          </div>
        )}
      </div>

      {/* Physics World + Stardust Canvas */}
      <div
        ref={containerRef}
        className="stardust-physics-container"
        style={{ top: 200, bottom: 0 }}
      >
        {/* Physics Blocks rendered as absolutely positioned HTML */}
        {blocksRef.current.map((block) => {
          const x = block.body.position.x - block.width / 2;
          const y = block.body.position.y - block.height / 2;
          const angle = block.body.angle;
          const color = BLOCK_COLORS[Math.abs(block.text.charCodeAt(0)) % BLOCK_COLORS.length];

          return (
            <div
              key={block.id}
              className={`physics-block ${block.isBoss ? 'boss-mode' : ''}`}
              style={{
                transform: `translate(${x}px, ${y}px) rotate(${angle}rad)`,
                width: block.width,
                height: block.height,
                background: block.isBoss ? '#e8f0e8' : color,
                opacity: isVented ? 0 : 1,
              }}
            >
              {block.text}
            </div>
          );
        })}

        {/* Stardust particle canvas overlay */}
        <canvas
          ref={canvasRef}
          className="stardust-canvas-overlay"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Decorative bottom gradient hinting at the transparent floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to top, rgba(212, 204, 192, 0.25) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
