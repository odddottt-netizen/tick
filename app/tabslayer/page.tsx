'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Globe,
  FileText,
  Image,
  Package,
  Table,
  Palette,
  Terminal,
  Bookmark,
  Film,
  Trash2,
  Archive,
  Copy,
  RefreshCw,
  Check,
  ArrowUp,
  Sparkles,
  Brain,
  Leaf,
  HardDrive,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CardData {
  id: number;
  title: string;
  subtitle: string;
  size: string;
  sizeMB: number;
  type: 'tab' | 'file';
  icon: string;
}

interface CompletedAction {
  card: CardData;
  action: 'trash' | 'archive' | 'keep';
}

/* ─── Sample Data ────────────────────────────────────────────────────────── */
const SAMPLE_CARDS: CardData[] = [
  { id: 1, title: 'New Tab', subtitle: 'Chrome • 열린 지 3일', size: '0 KB', sizeMB: 0, type: 'tab', icon: 'Globe' },
  { id: 2, title: 'react-useEffect-cleanup-tutorial-final.md', subtitle: 'Downloads/스터디/React', size: '2.3 MB', sizeMB: 2.3, type: 'file', icon: 'FileText' },
  { id: 3, title: 'screenshot_2024-06-15_143022.png', subtitle: 'Desktop/스크린샷', size: '8.5 MB', sizeMB: 8.5, type: 'file', icon: 'Image' },
  { id: 4, title: 'node_modules_backup_2023.zip', subtitle: 'Downloads/백업', size: '1.2 GB', sizeMB: 1200, type: 'file', icon: 'Package' },
  { id: 5, title: 'meeting-notes-untitled-47.docx', subtitle: 'Documents/회의록', size: '145 KB', sizeMB: 0.145, type: 'file', icon: 'FileText' },
  { id: 6, title: 'download_(4).pdf', subtitle: 'Downloads', size: '3.2 MB', sizeMB: 3.2, type: 'file', icon: 'FileText' },
  { id: 7, title: 'Spreadsheet – Q3 Planning', subtitle: 'Google Sheets • 열린 지 1주일', size: '0 KB', sizeMB: 0, type: 'tab', icon: 'Table' },
  { id: 8, title: 'Untitled-2.fig', subtitle: 'Figma/Projects', size: '45 MB', sizeMB: 45, type: 'file', icon: 'Palette' },
  { id: 9, title: 'IMG_20230921_182347.jpg', subtitle: 'Photos/2023/09', size: '6.8 MB', sizeMB: 6.8, type: 'file', icon: 'Image' },
  { id: 10, title: 'app-debug.log', subtitle: 'Dev/logs', size: '890 MB', sizeMB: 890, type: 'file', icon: 'Terminal' },
  { id: 11, title: 'temp_export_final_final_v2.psd', subtitle: 'Design/Temp', size: '128 MB', sizeMB: 128, type: 'file', icon: 'Palette' },
  { id: 12, title: 'bookmarks_2024_1_15.html', subtitle: 'Downloads', size: '2.1 MB', sizeMB: 2.1, type: 'file', icon: 'Bookmark' },
  { id: 13, title: 'unknown-dependency-3.2.1.tar.gz', subtitle: 'Downloads/압축', size: '14 MB', sizeMB: 14, type: 'file', icon: 'Package' },
  { id: 14, title: 'resume_old_version_2022.pdf', subtitle: 'Documents/이력서', size: '512 KB', sizeMB: 0.512, type: 'file', icon: 'FileText' },
  { id: 15, title: 'youtube-dl-cache', subtitle: 'Cache/Temp', size: '340 MB', sizeMB: 340, type: 'file', icon: 'Film' },
];

/* ─── Utilities ─────────────────────────────────────────────────────────── */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatSizeMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  if (mb > 0) return `${(mb * 1024).toFixed(0)} KB`;
  return '0 KB';
}

function getIconComponent(name: string) {
  switch (name) {
    case 'Globe': return Globe;
    case 'FileText': return FileText;
    case 'Image': return Image;
    case 'Package': return Package;
    case 'Table': return Table;
    case 'Palette': return Palette;
    case 'Terminal': return Terminal;
    case 'Bookmark': return Bookmark;
    case 'Film': return Film;
    default: return FileText;
  }
}

/* ─── Sound Synthesis (Web Audio API) ──────────────────────────────────── */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTrashSound() {
  try {
    const ctx = getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.4;
    const len = Math.ceil(duration * sampleRate);
    const buffer = ctx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 18);
      const noise = Math.random() * 2 - 1;
      const crackle = Math.random() > 0.9 ? (Math.random() - 0.5) * 0.8 : 0;
      data[i] = (noise * 0.6 + crackle) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5000;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    // Low thud
    const thudLen = Math.ceil(0.12 * sampleRate);
    const thudBuf = ctx.createBuffer(1, thudLen, sampleRate);
    const thudData = thudBuf.getChannelData(0);
    for (let i = 0; i < thudLen; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 14);
      const freq = 80 + Math.random() * 30;
      thudData[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.25;
    }
    const thudSrc = ctx.createBufferSource();
    thudSrc.buffer = thudBuf;
    const thudGain = ctx.createGain();
    thudGain.gain.value = 0.35;
    thudSrc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudSrc.start();
  } catch {
    // Silently ignore audio errors
  }
}

function playArchiveSound() {
  try {
    const ctx = getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.3;
    const len = Math.ceil(duration * sampleRate);
    const buffer = ctx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const env = 1 - t / duration;
      const mod = Math.sin(t * 70) * 80;
      const freq = 180 + mod + t * 200;
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.5;
      data[i] = sample * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    // Zip texture noise
    const noiseLen = Math.ceil(0.15 * sampleRate);
    const noiseBuf = ctx.createBuffer(1, noiseLen, sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 10);
      noiseData[i] = (Math.random() * 2 - 1) * env * 0.15;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 3000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.2;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start();
  } catch {
    // Silently ignore audio errors
  }
}

function playKeepSound() {
  try {
    const ctx = getAudioContext();
    const sampleRate = ctx.sampleRate;
    const duration = 0.6;
    const len = Math.ceil(duration * sampleRate);
    const buffer = ctx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const attack = Math.min(t * 4, 1);
      const decay = Math.exp(-t * 2.5);
      const env = attack * decay;
      const noise = Math.random() * 2 - 1;
      data[i] = noise * env * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Silently ignore audio errors
  }
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function TabSlayerPage() {
  const [cards, setCards] = useState<CardData[]>(() => shuffleArray([...SAMPLE_CARDS]));
  const [cardIndex, setCardIndex] = useState(0);
  const [completed, setCompleted] = useState<CompletedAction[]>([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeHint, setSwipeHint] = useState<'left' | 'right' | 'up' | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const dragState = useRef({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const flyDistanceRef = useRef(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ─── Effects ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    flyDistanceRef.current = Math.max(window.innerWidth, window.innerHeight) * 1.2;
  }, []);

  useEffect(() => {
    if (cardIndex >= cards.length && cards.length > 0 && !showReport) {
      const timer = setTimeout(() => setShowReport(true), 400);
      return () => clearTimeout(timer);
    }
  }, [cardIndex, cards.length, showReport]);

  /* ─── Drag Handlers ─────────────────────────────────────────────────────── */
  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (showReport || cardIndex >= cards.length || isFlying) return;
    dragState.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    };
    setIsDragging(true);
    setSwipeHint(null);
  }, [showReport, cardIndex, cards.length, isFlying]);

  const updateDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragState.current.active) return;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    dragState.current.currentX = clientX;
    dragState.current.currentY = clientY;
    setDragOffset({ x: dx, y: dy });

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 40) setSwipeHint('right');
      else if (dx < -40) setSwipeHint('left');
      else setSwipeHint(null);
    } else {
      if (dy < -40) setSwipeHint('up');
      else setSwipeHint(null);
    }
  }, []);

  const endDrag = useCallback(() => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setIsDragging(false);

    const dx = dragState.current.currentX - dragState.current.startX;
    const dy = dragState.current.currentY - dragState.current.startY;

    let action: 'trash' | 'archive' | 'keep' | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 100) action = 'archive';
      else if (dx < -100) action = 'trash';
    } else {
      if (dy < -80) action = 'keep';
    }

    if (action && cardIndex < cards.length) {
      const card = cards[cardIndex];
      setCompleted(prev => [...prev, { card, action }]);

      if (action === 'trash') playTrashSound();
      else if (action === 'archive') playArchiveSound();
      else if (action === 'keep') playKeepSound();

      setIsFlying(true);
      const fly = flyDistanceRef.current;
      if (action === 'trash') setDragOffset({ x: -fly, y: dy * 0.5 });
      else if (action === 'archive') setDragOffset({ x: fly, y: dy * 0.5 });
      else if (action === 'keep') setDragOffset({ x: dx * 0.5, y: -fly });

      setTimeout(() => {
        setCardIndex(prev => prev + 1);
        setIsFlying(false);
        setDragOffset({ x: 0, y: 0 });
        setSwipeHint(null);
        setCardKey(k => k + 1);
      }, 300);
    } else {
      // Elastic bounce-back
      setDragOffset({ x: 0, y: 0 });
      setSwipeHint(null);
    }
  }, [cardIndex, cards]);

  /* ─── Pointer Events ──────────────────────────────────────────────────── */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startDrag(e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [startDrag]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    updateDrag(e.clientX, e.clientY);
  }, [updateDrag]);

  const handlePointerUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handlePointerCancel = useCallback(() => {
    endDrag();
  }, [endDrag]);

  /* ─── Touch Events ──────────────────────────────────────────────────────── */
  const isTouchActive = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTouchActive.current) return;
    isTouchActive.current = true;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  }, [startDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchActive.current) return;
    const touch = e.touches[0];
    updateDrag(touch.clientX, touch.clientY);
  }, [updateDrag]);

  const handleTouchEnd = useCallback(() => {
    if (!isTouchActive.current) return;
    isTouchActive.current = false;
    endDrag();
  }, [endDrag]);

  /* ─── Keyboard Support ──────────────────────────────────────────────────── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showReport || cardIndex >= cards.length || isFlying) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const card = cards[cardIndex];
      setCompleted(prev => [...prev, { card, action: 'trash' }]);
      playTrashSound();
      setIsFlying(true);
      setDragOffset({ x: -flyDistanceRef.current, y: 0 });
      setTimeout(() => {
        setCardIndex(prev => prev + 1);
        setIsFlying(false);
        setDragOffset({ x: 0, y: 0 });
        setCardKey(k => k + 1);
      }, 300);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const card = cards[cardIndex];
      setCompleted(prev => [...prev, { card, action: 'archive' }]);
      playArchiveSound();
      setIsFlying(true);
      setDragOffset({ x: flyDistanceRef.current, y: 0 });
      setTimeout(() => {
        setCardIndex(prev => prev + 1);
        setIsFlying(false);
        setDragOffset({ x: 0, y: 0 });
        setCardKey(k => k + 1);
      }, 300);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const card = cards[cardIndex];
      setCompleted(prev => [...prev, { card, action: 'keep' }]);
      playKeepSound();
      setIsFlying(true);
      setDragOffset({ x: 0, y: -flyDistanceRef.current });
      setTimeout(() => {
        setCardIndex(prev => prev + 1);
        setIsFlying(false);
        setDragOffset({ x: 0, y: 0 });
        setCardKey(k => k + 1);
      }, 300);
    }
  }, [showReport, cardIndex, cards.length, isFlying, cards]);

  /* ─── Report ───────────────────────────────────────────────────────────── */
  const reportData = useMemo(() => {
    const trash = completed.filter(c => c.action === 'trash');
    const archive = completed.filter(c => c.action === 'archive');
    const keep = completed.filter(c => c.action === 'keep');
    const trashSize = trash.reduce((s, c) => s + c.card.sizeMB, 0);
    const archiveSize = archive.reduce((s, c) => s + c.card.sizeMB, 0);
    const totalCleaned = trashSize + archiveSize;
    const totalCleanedStr = totalCleaned >= 1024
      ? `${(totalCleaned / 1024).toFixed(1)}GB`
      : `${totalCleaned.toFixed(1)}MB`;
    const brainClearance = Math.min(99, Math.round((trash.length / Math.max(cards.length, 1)) * 55 + (archive.length / Math.max(cards.length, 1)) * 15 + 5));
    return { trash, archive, keep, trashSize, archiveSize, totalCleaned, totalCleanedStr, brainClearance };
  }, [completed, cards.length]);

  const reportMarkdown = useMemo(() => {
    const { trash, archive, keep, totalCleanedStr, brainClearance } = reportData;
    const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    return `# 🌿 오늘의 디지털 정리 리포트

> **${dateStr}** — 당신의 뇌 용량을 되찾은 특별한 순간

---

### 📊 정리 성과

| 항목 | 결과 |
|------|------|
| 🗑️ 휴지통 처리 | ${trash.length}개 파일 (${formatSizeMB(trash.reduce((s, c) => s + c.card.sizeMB, 0))}) |
| 📦 압축 아카이브 | ${archive.length}개 핵심 가치 |
| 💾 유지 결정 | ${keep.length}개 항목 |

### 🧠 뇌 용량 확보

**불필요한 리소스 ${totalCleanedStr}를 청소하고, ${archive.length}개의 핵심 가치만 아카이브하여 뇌 용량을 ${brainClearance}% 확보했습니다.**

---

### 💡 인사이트

> "디지털 미니멀리즘은 물건을 버리는 것이 아니라,  
> 중요한 것에 집중하는 용기입니다."

---

*Tab Slayer — 당신의 디지털 힐링 파트너*`;
  }, [reportData]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = reportMarkdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [reportMarkdown]);

  const handleRestart = useCallback(() => {
    setCards(shuffleArray([...SAMPLE_CARDS]));
    setCardIndex(0);
    setCompleted([]);
    setShowReport(false);
    setDragOffset({ x: 0, y: 0 });
    setSwipeHint(null);
    setIsDragging(false);
    setIsFlying(false);
    setCopied(false);
    setCardKey(k => k + 1);
  }, []);

  /* ─── Card Transform ────────────────────────────────────────────────────── */
  const cardTransform = useMemo(() => {
    if (isFlying) return undefined; // Let CSS transition handle it
    const rotate = dragOffset.x * 0.05;
    const scale = isDragging ? Math.max(0.96, 1 - Math.abs(dragOffset.x) / 6000) : 1;
    return `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotate}deg) scale(${scale})`;
  }, [dragOffset, isDragging, isFlying]);

  const cardTransition = useMemo(() => {
    if (isDragging) return 'none';
    if (isFlying) return 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
    return 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }, [isDragging, isFlying]);

  /* ─── Hint Opacity ──────────────────────────────────────────────────────── */
  const leftOpacity = Math.min(1, Math.max(0, -dragOffset.x / 100));
  const rightOpacity = Math.min(1, Math.max(0, dragOffset.x / 100));
  const upOpacity = Math.min(1, Math.max(0, -dragOffset.y / 80));

  /* ─── Current Card ──────────────────────────────────────────────────────── */
  const currentCard = cardIndex < cards.length ? cards[cardIndex] : null;
  const nextCard = cardIndex + 1 < cards.length ? cards[cardIndex + 1] : null;
  const progress = cards.length > 0 ? (cardIndex / cards.length) * 100 : 100;

  /* ─── Render ────────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen bg-[#faf9f6] relative overflow-hidden flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Tab Slayer 디지털 정리 게임"
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-8%] w-[500px] h-[500px] rounded-full tabslayer-ambient-mint blur-3xl opacity-60" />
        <div className="absolute bottom-[-12%] left-[-10%] w-[400px] h-[400px] rounded-full tabslayer-ambient-blush blur-3xl opacity-50" />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="w-5 h-5 text-[#8FA89A]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#4A4A4A]">
            Tab Slayer
          </h1>
        </div>
        <p className="text-center text-sm text-[#9E9A95]">
          당신의 디지털 공간을 정리하는 힐링 리추얼
        </p>
        <div className="mt-5 max-w-xs mx-auto">
          <div className="tabslayer-progress-track">
            <div
              className="tabslayer-progress-fill"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <p className="text-center text-xs text-[#9E9A95] mt-2">
            {cardIndex} / {cards.length} 정리 완료
          </p>
        </div>
      </header>

      {/* Main Card Area */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-6">
        <div ref={containerRef} className="relative w-full max-w-[340px] h-[440px]">
          {/* Next Card (Behind) */}
          {nextCard && (
            <div
              className="absolute inset-0 rounded-[24px] tabslayer-glass-card opacity-45 scale-[0.9]"
              style={{ transition: 'transform 0.3s ease, opacity 0.3s ease' }}
            >
              <div className="p-8 flex flex-col items-center justify-center h-full opacity-40">
                <div className="w-14 h-14 rounded-2xl bg-[#e2efeb]/40 flex items-center justify-center mb-3">
                  {(() => {
                    const Icon = getIconComponent(nextCard.icon);
                    return <Icon className="w-7 h-7 text-[#8FA89A]" />;
                  })()}
                </div>
                <p className="text-xs text-[#9E9A95] text-center">다음 항목</p>
              </div>
            </div>
          )}

          {/* Current Card */}
          {currentCard && (
            <div
              key={cardKey}
              className="absolute inset-0 rounded-[24px] tabslayer-glass-card tabslayer-card tabslayer-card-enter flex flex-col"
              style={{
                transform: cardTransform,
                transition: cardTransition,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Color tint overlay */}
              <div
                className="absolute inset-0 rounded-[24px] pointer-events-none transition-opacity duration-150"
                style={{
                  opacity: swipeHint === 'left' ? 0.07 : swipeHint === 'right' ? 0.07 : swipeHint === 'up' ? 0.07 : 0,
                  backgroundColor: swipeHint === 'left' ? '#c45d3e' : swipeHint === 'right' ? '#8FA89A' : swipeHint === 'up' ? '#5b8ea3' : 'transparent',
                }}
              />

              {/* Card Content */}
              <div className="relative z-10 flex flex-col h-full p-7">
                {/* Top badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                    currentCard.type === 'tab'
                      ? 'bg-[#e2efeb]/50 text-[#6B8778] border-[#c5d5cd]'
                      : 'bg-[#F0E6E0]/50 text-[#b89a8c] border-[#e0d4cc]'
                  }`}>
                    {currentCard.type === 'tab' ? '브라우저 탭' : '다운로드 파일'}
                  </span>
                  <span className="text-[10px] text-[#9E9A95] font-medium tracking-wide">
                    {currentCard.size}
                  </span>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                    currentCard.type === 'tab'
                      ? 'bg-[#e2efeb]/60 border border-[#c5d5cd]/40'
                      : 'bg-[#F0E6E0]/60 border border-[#e0d4cc]/40'
                  }`}>
                    {(() => {
                      const Icon = getIconComponent(currentCard.icon);
                      return <Icon className={`w-9 h-9 ${currentCard.type === 'tab' ? 'text-[#6B8778]' : 'text-[#b89a8c]'}`} />;
                    })()}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <h3 className="text-lg font-bold text-[#4A4A4A] leading-snug mb-2 line-clamp-2">
                    {currentCard.title}
                  </h3>
                  <p className="text-sm text-[#9E9A95]">{currentCard.subtitle}</p>
                </div>

                {/* Bottom hint text */}
                <div className="mt-4 text-center">
                  <p className="text-[11px] text-[#c0bdb8] tracking-wide">
                    스와이프로 정리하세요
                  </p>
                </div>
              </div>

              {/* Swipe Hints */}
              <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
                {/* Left - Trash */}
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ opacity: leftOpacity }}
                >
                  <div className="tabslayer-hint-badge border-[#c45d3e] text-[#c45d3e] bg-[#c45d3e]/5">
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4" />
                      휴지통
                    </span>
                  </div>
                </div>

                {/* Right - Archive */}
                <div
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ opacity: rightOpacity }}
                >
                  <div className="tabslayer-hint-badge border-[#8FA89A] text-[#8FA89A] bg-[#8FA89A]/5 rotate-[10deg]">
                    <span className="flex items-center gap-1.5">
                      <Archive className="w-4 h-4" />
                      아카이브
                    </span>
                  </div>
                </div>

                {/* Up - Keep */}
                <div
                  className="absolute top-5 left-1/2 -translate-x-1/2"
                  style={{ opacity: upOpacity }}
                >
                  <div className="tabslayer-hint-badge border-[#5b8ea3] text-[#5b8ea3] bg-[#5b8ea3]/5 rotate-0">
                    <span className="flex items-center gap-1.5">
                      <ArrowUp className="w-4 h-4" />
                      유지
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Done Placeholder */}
          {!currentCard && !showReport && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-10 h-10 text-[#8FA89A] mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-[#9E9A95]">정리 중...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Swipe Instructions */}
      <footer className="relative z-10 pb-10 px-6">
        <div className="flex justify-center gap-10">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#faf5f3] border border-[#f0e0d8] flex items-center justify-center mb-2 transition-transform hover:scale-105">
              <ChevronLeft className="w-5 h-5 text-[#c45d3e]" />
            </div>
            <p className="text-[11px] text-[#9E9A95] font-medium">휴지통</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#f3f8f6] border border-[#d8ebe4] flex items-center justify-center mb-2 transition-transform hover:scale-105">
              <ArrowUp className="w-5 h-5 text-[#5b8ea3]" />
            </div>
            <p className="text-[11px] text-[#9E9A95] font-medium">유지</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f7f5] border border-[#d0ddd6] flex items-center justify-center mb-2 transition-transform hover:scale-105">
              <ChevronRight className="w-5 h-5 text-[#8FA89A]" />
            </div>
            <p className="text-[11px] text-[#9E9A95] font-medium">아카이브</p>
          </div>
        </div>
      </footer>

      {/* Report Overlay */}
      {showReport && (
        <div className="fixed inset-0 z-50 bg-[#faf9f6] overflow-y-auto tabslayer-report-enter">
          <div className="max-w-lg mx-auto px-6 py-10 min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#e2efeb] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#6B8778]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#4A4A4A]">정리 완료</h2>
                  <p className="text-xs text-[#9E9A95]">오늘의 디지털 힐링 리포트</p>
                </div>
              </div>
              <button
                onClick={handleRestart}
                className="tabslayer-btn w-10 h-10 rounded-full bg-white border border-[#e8e2d9] flex items-center justify-center text-[#9E9A95] hover:text-[#4A4A4A] hover:border-[#d4ccc0]"
                aria-label="다시 시작"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl bg-white border border-[#e8e2d9] p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-[#faf5f3] flex items-center justify-center mx-auto mb-2">
                  <Trash2 className="w-4 h-4 text-[#c45d3e]" />
                </div>
                <p className="text-lg font-bold text-[#4A4A4A]">{reportData.trash.length}</p>
                <p className="text-[10px] text-[#9E9A95]">휴지통</p>
              </div>
              <div className="rounded-2xl bg-white border border-[#e8e2d9] p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-[#f4f7f5] flex items-center justify-center mx-auto mb-2">
                  <Archive className="w-4 h-4 text-[#8FA89A]" />
                </div>
                <p className="text-lg font-bold text-[#4A4A4A]">{reportData.archive.length}</p>
                <p className="text-[10px] text-[#9E9A95]">아카이브</p>
              </div>
              <div className="rounded-2xl bg-white border border-[#e8e2d9] p-4 text-center">
                <div className="w-8 h-8 rounded-full bg-[#f3f8f6] flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-4 h-4 text-[#5b8ea3]" />
                </div>
                <p className="text-lg font-bold text-[#4A4A4A]">{reportData.brainClearance}%</p>
                <p className="text-[10px] text-[#9E9A95]">뇌 용량 확보</p>
              </div>
            </div>

            {/* Insight Banner */}
            <div className="rounded-2xl bg-[#e2efeb]/30 border border-[#c5d5cd]/40 p-5 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e2efeb] flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-[#6B8778]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#4A4A4A] mb-1">
                    불필요한 리소스 {reportData.totalCleanedStr}를 청소하고, {reportData.archive.length}개의 핵심 가치만 아카이브하여 뇌 용량을 {reportData.brainClearance}% 확보했습니다.
                  </p>
                  <p className="text-xs text-[#9E9A95] leading-relaxed">
                    디지털 미니멀리즘은 물건을 버리는 것이 아니라, 중요한 것에 집중하는 용기입니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Markdown Block */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#4A4A4A]">Markdown 리포트</h3>
                <button
                  onClick={handleCopy}
                  className={`tabslayer-btn flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    copied
                      ? 'bg-[#e2efeb] text-[#6B8778]'
                      : 'bg-white border border-[#e8e2d9] text-[#9E9A95] hover:text-[#4A4A4A] hover:border-[#d4ccc0]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      복사 완료
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      복사하기
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-2xl bg-white border border-[#e8e2d9] p-5 overflow-hidden">
                <pre className="tabslayer-markdown-block text-xs text-[#4A4A4A] whitespace-pre-wrap break-words">
                  {reportMarkdown}
                </pre>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleRestart}
                className="tabslayer-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#4A4A4A] text-white font-semibold text-sm hover:bg-[#3a3a3a]"
              >
                <RefreshCw className="w-4 h-4" />
                다시 정리하기
              </button>
            </div>

            <p className="text-center text-[10px] text-[#c0bdb8] mt-4 pb-4">
              Tab Slayer — 당신의 디지털 힐링 파트너
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
