'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Constants ─────────────────────────────────────────────────────────────
const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const LOG_PREFIXES = ['[BUILD]', '[INFO]', '[WARN]', '[DEBUG]', '[SYSTEM]'];
const LOG_MESSAGES = [
  'Compiling asset tree...',
  'Checking memory leaks...',
  'Optimizing bundles...',
  'Type checking 1,234 files...',
  'Running unit tests...',
  'Deploying to edge nodes...',
  'Minifying CSS modules...',
  'Resolving dependencies...',
  'Hot module replacement active.',
  'Linting rules verified.',
  'Analyzing bundle size...',
  'Generating sitemap...',
  'Compressing static assets...',
  'Updating cache manifest...',
  'Validating environment variables...',
  'Parsing GraphQL schema...',
  'Indexing search documents...',
  'Syncing database replicas...',
  'Flushing CDN cache...',
  'Rotating log files...'
];

const STORAGE_KEY = 'terminal-focus-sessions';

/* ─── News Reader Camouflage (mobile) ──────────────────────────────────────── */
function NewsReaderCamouflage({ onClose }: { onClose: () => void }) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const articles = [
    { title: '2026 패션 트렌드 리포트: 미니멀리즘의 귀환', src: '패션비즈', time: '2시간 전', cat: '패션' },
    { title: '글로벌 이커머스 성장률 전년비 18% 상승', src: '어패럴뉴스', time: '4시간 전', cat: '비즈니스' },
    { title: 'D2C 브랜드 성공 방정식: 데이터 기반 고객 경험', src: '패션인사이트', time: '6시간 전', cat: '전략' },
    { title: 'SNS 마케팅, 숏폼 영상이 전환율 3배 높여', src: '마케팅위크', time: '12시간 전', cat: '마케팅' },
    { title: '소비자 행동 변화, MZ→알파세대 전환 가속', src: '삼성패션연구소', time: '1일 전', cat: '리서치' },
  ];
  const a = articles[activeIdx];
  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>뉴스</span>
        <button onClick={onClose} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>닫기 (F2)</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', borderBottom: '1px solid #e5e7eb' }}>
        {articles.map((ar, i) => (
          <div key={i} onClick={() => setActiveIdx(i)} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: i === activeIdx ? '#f0f9ff' : '#fff', cursor: 'pointer' }}>
            <div style={{ fontSize: '11px', color: '#E85D04', fontWeight: 600, marginBottom: '3px', textTransform: 'uppercase' }}>{ar.cat}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', marginBottom: '3px', lineHeight: 1.4 }}>{ar.title}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{ar.src} · {ar.time}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 2, overflowY: 'auto', padding: '20px 20px 40px' }}>
        <div style={{ fontSize: '11px', color: '#E85D04', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>{a.cat}</div>
        <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: '6px' }}>{a.title}</h2>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>{a.src} · {a.time}</div>
        <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, marginBottom: '10px' }}>
          패션 업계 전문가들은 올해 시장 변화를 면밀히 주시하고 있다. 소비자 구매 패턴의 변화와 디지털 전환 가속화가 맞물리며 브랜드 전략도 빠르게 진화하는 추세다.
        </p>
        <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>
          특히 30–50대 소비층의 온라인 구매 비중이 크게 늘면서, 모바일 퍼스트 전략의 중요성이 더욱 부각되고 있다. 시즌 기획부터 콘텐츠 마케팅까지 일관된 브랜드 경험이 핵심 과제로 떠오르고 있다.
        </p>
      </div>
    </div>
  );
}

export default function TerminalPage() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [logs, setLogs] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Record<string, number>>({});
  const [isCamouflage, setIsCamouflage] = useState(false);
  const [input, setInput] = useState('');
  const [terminalColor, setTerminalColor] = useState<'green' | 'orange'>('green');
  const [showHelp, setShowHelp] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  // ─── Refs (for intervals to read latest values without resetting) ──────────
  const timeLeftRef = useRef(timeLeft);
  const isRunningRef = useRef(isRunning);
  const modeRef = useRef(mode);
  const logEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ─── localStorage Load ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }, []);

  // ─── Audio Init ────────────────────────────────────────────────────────────
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  // ─── Sound Synthesis: Thock ────────────────────────────────────────────────
  const playThock = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);

    // subtle noise texture
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  }, [initAudio]);

  // ─── Sound Synthesis: Server Rack Cooler ───────────────────────────────────
  const playCoolerSound = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    const duration = 1.5;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.linearRampToValueAtTime(120, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(t);
    source.stop(t + duration);
  }, [initAudio]);

  // ─── Save Session ────────────────────────────────────────────────────────────
  const saveSession = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setSessions(prev => {
      const next = { ...prev, [today]: (prev[today] || 0) + 1 };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save session:', e);
      }
      return next;
    });
  }, []);

  // ─── Timer Logic ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && isRunningRef.current) {
      setIsRunning(false);
      if (navigator.vibrate) navigator.vibrate(modeRef.current === 'focus' ? [80, 40, 80] : 40);
      if (modeRef.current === 'focus') {
        saveSession();
        playThock();
        playCoolerSound();
      } else {
        playThock();
      }
    }
  }, [timeLeft, saveSession, playThock, playCoolerSound]);

  // ─── Log Generator ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      const addLog = () => {
        const total = modeRef.current === 'focus' ? FOCUS_TIME : BREAK_TIME;
        const progress = Math.min(100, Math.round(((total - timeLeftRef.current) / total) * 100));
        const prefix = LOG_PREFIXES[Math.floor(Math.random() * LOG_PREFIXES.length)];
        const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
        const suffix = Math.random() > 0.3 ? `(${progress}%)` : '';
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev.slice(-50), `${timestamp} ${prefix} ${msg} ${suffix}`.trim()]);
      };
      addLog();
      logIntervalRef.current = setInterval(addLog, 1000);
    } else {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    }
    return () => {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    };
  }, [isRunning]);

  // ─── Auto Scroll Logs ────────────────────────────────────────────────────────
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ─── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsCamouflage(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleStart = () => {
    initAudio();
    setIsRunning(true);
    setShowHelp(false);
  };
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
    setLogs([]);
  };
  const toggleMode = () => {
    setIsRunning(false);
    const next = mode === 'focus' ? 'break' : 'focus';
    setMode(next);
    setTimeLeft(next === 'focus' ? FOCUS_TIME : BREAK_TIME);
    setLogs([]);
  };
  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (cmd === 'start') handleStart();
    else if (cmd === 'pause') handlePause();
    else if (cmd === 'clear') handleReset();
    else if (cmd === 'break') { setMode('break'); setIsRunning(false); setTimeLeft(BREAK_TIME); setLogs([]); }
    else if (cmd === 'focus') { setMode('focus'); setIsRunning(false); setTimeLeft(FOCUS_TIME); setLogs([]); }
    else if (cmd === 'help') setShowHelp(true);
    else if (cmd) {
      setLogs(prev => [...prev.slice(-50), `${new Date().toLocaleTimeString('en-US', { hour12: false })} [ERROR] Command not found: ${cmd}`]);
    }
    setInput('');
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions[today] || 0;
  const totalSessions = Object.values(sessions).reduce((a, b) => a + b, 0);

  const textColor = terminalColor === 'green' ? 'text-[#22c55e]' : 'text-[#f97316]';
  const glowColor = terminalColor === 'green' ? 'shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'shadow-[0_0_8px_rgba(249,115,22,0.4)]';

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#faf8f5] text-[#222529] font-sans relative overflow-hidden">
      {/* Soft ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#e7e5e4] opacity-40 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#e7e5e4] opacity-40 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6 min-h-[100dvh]">
        {/* Header */}
        <header className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#222529]">Terminal Focus</h1>
            <p className="text-sm text-[#9E9A95] mt-1">sunmul.app concept</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCamouflage(true)}
              className="px-4 py-2.5 rounded-2xl glass text-xs font-semibold text-[#4A4A4A] hover:bg-white/80 transition-all active:scale-95"
            >
              F2: 위장모드
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          {/* Left Column: Terminal */}
          <div className="flex-1 flex flex-col gap-5 min-h-0">
            {/* Timer Card */}
            <div className="glass rounded-3xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#0a0a0a] flex items-center justify-center shadow-inner">
                  <span className={`text-2xl font-mono font-bold ${textColor}`}>
                    {mode === 'focus' ? '>' : '~'}
                  </span>
                </div>
                <div>
                  <div className="text-5xl font-mono font-bold tracking-tight text-[#222529] leading-none">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-xs text-[#9E9A95] uppercase tracking-wider font-medium mt-1">
                    {mode === 'focus' ? 'Focus Session' : 'Break Time'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleStart}
                  className="px-3 md:px-5 py-2.5 rounded-2xl bg-[#222529] text-[#faf8f5] text-sm font-semibold hover:bg-[#0a0a0a] transition-all active:scale-95"
                >
                  Start
                </button>
                <button
                  onClick={handlePause}
                  className="px-3 md:px-5 py-2.5 rounded-2xl glass text-sm font-semibold text-[#4A4A4A] hover:bg-white/80 transition-all active:scale-95"
                >
                  Pause
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 md:px-5 py-2.5 rounded-2xl glass text-sm font-semibold text-[#4A4A4A] hover:bg-white/80 transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={toggleMode}
                  className="px-3 md:px-5 py-2.5 rounded-2xl glass text-sm font-semibold text-[#4A4A4A] hover:bg-white/80 transition-all active:scale-95"
                >
                  {mode === 'focus' ? 'Break' : 'Focus'}
                </button>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="flex-1 glass-strong rounded-3xl p-1.5 flex flex-col min-h-0 overflow-hidden relative">
              {/* Color theme toggle */}
              <div className="absolute top-5 right-5 flex gap-2 z-20">
                <button
                  onClick={() => setTerminalColor('green')}
                  className={`w-3 h-3 rounded-full transition-all ${terminalColor === 'green' ? 'bg-[#22c55e] ring-2 ring-offset-2 ring-[#22c55e]' : 'bg-[#e7e5e4] hover:bg-[#22c55e]/40'}`}
                  title="Green"
                />
                <button
                  onClick={() => setTerminalColor('orange')}
                  className={`w-3 h-3 rounded-full transition-all ${terminalColor === 'orange' ? 'bg-[#f97316] ring-2 ring-offset-2 ring-[#f97316]' : 'bg-[#e7e5e4] hover:bg-[#f97316]/40'}`}
                  title="Orange"
                />
              </div>

              <div className="bg-[#0a0a0a] rounded-[22px] flex-1 flex flex-col p-6 min-h-0 overflow-hidden relative">
                {/* Window controls */}
                <div className="flex items-center gap-2 mb-4 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]/20" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]/20" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab36]/20" />
                  <span className="ml-3 text-[11px] text-[#9E9A95] font-mono opacity-60">bash — 80x24</span>
                </div>

                {/* Logs */}
                <div className="flex-1 overflow-y-auto font-mono text-[13px] leading-6 space-y-0.5 pr-2 custom-terminal-scroll">
                  {showHelp && !isRunning && logs.length === 0 && (
                    <div className="text-[#9E9A95] opacity-60 space-y-1">
                      <p>Welcome to Terminal Focus v1.0.0</p>
                      <p>Available commands: start, pause, clear, focus, break, help</p>
                      <p>Press F2 to toggle camouflage mode.</p>
                    </div>
                  )}
                  {logs.map((log, i) => (
                    <div key={i} className={`${textColor} opacity-90`}>
                      {log}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleCommand} className="mt-4 shrink-0 flex items-center gap-2 border-t border-[#222529] pt-3">
                  <span className={`font-mono text-sm ${textColor} select-none`}>$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-[#e7e5e4] placeholder-[#4A4A4A]/40 caret-[#22c55e]"
                    placeholder="type command..."
                    spellCheck={false}
                    autoComplete="off"
                  />
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="hidden md:flex w-60 shrink-0 flex-col gap-5">
            {/* Contribution Graph */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-sm font-bold text-[#222529] mb-4">Contribution Graph</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 49 }).map((_, i) => {
                  const isActive = i >= 49 - todaySessions;
                  return (
                    <div
                      key={i}
                      className={`w-full aspect-square rounded-[3px] transition-all duration-700 ${isActive ? 'bg-[#22c55e] ' + glowColor : 'bg-[#e7e5e4]'}`}
                      title={isActive ? 'Session completed' : 'Empty'}
                    />
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[#9E9A95]">Today</span>
                <span className="text-[#222529] font-bold text-sm">{todaySessions} sessions</span>
              </div>
            </div>

            {/* Stats */}
            <div className="glass rounded-3xl p-6 flex-1">
              <h3 className="text-sm font-bold text-[#222529] mb-5">Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9E9A95]">Total Focus</span>
                  <span className="text-sm font-bold text-[#222529]">{totalSessions} sessions</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9E9A95]">Current Streak</span>
                  <span className="text-sm font-bold text-[#222529]">{todaySessions > 0 ? 'Active' : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9E9A95]">Mode</span>
                  <span className="text-sm font-bold text-[#222529] capitalize">{mode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#9E9A95]">Theme</span>
                  <span className="text-sm font-bold text-[#222529] capitalize">{terminalColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Camouflage Overlay ──────────────────────────────────────────────────── */}
      {isCamouflage && !isDesktop && (
        <NewsReaderCamouflage onClose={() => setIsCamouflage(false)} />
      )}
      {isCamouflage && isDesktop && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in">
          {/* Excel-like title bar */}
          <div className="bg-[#f3f2f1] border-b border-[#d6d6d6] px-4 py-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#217346] rounded-sm flex items-center justify-center text-white text-[10px] font-bold">X</div>
              <span className="text-sm font-semibold text-[#222529]">대외비 매출 통계 분석.xlsx</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#605e5c]">자동저장 켜짐</span>
              <button onClick={() => setIsCamouflage(false)} className="text-xs text-[#605e5c] hover:text-[#222529] underline">닫기 (F2)</button>
            </div>
          </div>
          {/* Excel-like ribbon */}
          <div className="bg-[#f3f2f1] px-4 py-1.5 border-b border-[#d6d6d6] flex items-center gap-5 text-xs text-[#222529] select-none">
            <span className="font-semibold">파일</span>
            <span>홈</span>
            <span>삽입</span>
            <span>페이지 레이아웃</span>
            <span>수식</span>
            <span>데이터</span>
            <span>검토</span>
            <span>보기</span>
          </div>
          {/* Excel-like sheet */}
          <div className="flex-1 overflow-auto p-6 bg-white">
            <div className="border border-[#d6d6d6] w-full min-w-[800px]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f3f2f1]">
                    <th className="border border-[#d6d6d6] p-2 text-left font-semibold w-10">#</th>
                    <th className="border border-[#d6d6d6] p-2 text-left font-semibold w-40">제품명</th>
                    <th className="border border-[#d6d6d6] p-2 text-right font-semibold w-28">1분기</th>
                    <th className="border border-[#d6d6d6] p-2 text-right font-semibold w-28">2분기</th>
                    <th className="border border-[#d6d6d6] p-2 text-right font-semibold w-28">3분기</th>
                    <th className="border border-[#d6d6d6] p-2 text-right font-semibold w-28">4분기</th>
                    <th className="border border-[#d6d6d6] p-2 text-right font-semibold w-32">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                      <td className="border border-[#d6d6d6] p-2 text-[#605e5c] text-center">{i + 1}</td>
                      <td className="border border-[#d6d6d6] p-2 text-[#222529]">제품-{String.fromCharCode(65 + (i % 26))}{Math.floor(i / 26) > 0 ? Math.floor(i / 26) + 1 : ''}</td>
                      <td className="border border-[#d6d6d6] p-2 text-right text-[#222529]">{(Math.random() * 900 + 300).toFixed(1)}</td>
                      <td className="border border-[#d6d6d6] p-2 text-right text-[#222529]">{(Math.random() * 900 + 300).toFixed(1)}</td>
                      <td className="border border-[#d6d6d6] p-2 text-right text-[#222529]">{(Math.random() * 900 + 300).toFixed(1)}</td>
                      <td className="border border-[#d6d6d6] p-2 text-right text-[#222529]">{(Math.random() * 900 + 300).toFixed(1)}</td>
                      <td className="border border-[#d6d6d6] p-2 text-right font-bold text-[#222529]">{(Math.random() * 3600 + 1200).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-[#605e5c] select-none">
              <span>시트1 / 3</span>
              <span>표준</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
