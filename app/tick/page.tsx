'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, Check, Scissors, Volume2, VolumeX, Copy, Download, Upload, Settings } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubTask { id: number; text: string; completed: boolean }
interface Phase { id: number; number: string; title: string; subTasks: SubTask[] }
interface Particle { id: number; x: number; y: number; size: number; color: string; tx: number; ty: number; rot: number }

type AppState  = 'default' | 'loading' | 'result'
type ThemeMode = 'daily' | 'office'
type OfficeTab = 'excel' | 'notion'
type SoundType = 'keyboard' | 'wax' | 'crystal' | 'pencil' | 'bubble'

interface ViewProps {
  phases: Phase[]; mainTask: string; granularity: number; appState: AppState
  progress: number; completedCount: number; totalCount: number
  setMainTask: (v: string) => void; setGranularity: (v: number) => void
  handleCrush: () => void
  handleToggle: (phaseId: number, taskId: number, e: React.MouseEvent) => void
  handleDeleteTask: (phaseId: number, taskId: number) => void
  handleAddTask: (phaseId: number) => void
  handleReset: () => void; handleCopyMarkdown: () => void
  editingId: number | null; editText: string
  editInputRef: React.RefObject<HTMLInputElement | null>
  setEditingId: (id: number | null) => void; setEditText: (t: string) => void
  handleSaveEdit: () => void; copied: boolean
  soundType: SoundType; setSoundType: (t: SoundType) => void
  muted: boolean; setMuted: (v: boolean | ((p: boolean) => boolean)) => void
  volume: number; setVolume: (v: number) => void
  companyName: string; deptName: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MICROCOPIES = [
  '천리길도 한 걸음부터.',
  '작게 나누는 것부터 시작해봐요.',
  '큰 일도 하나씩 하면 금방이에요.',
  '한 번에 하나만.',
  '무리하지 않아도 돼요.',
  '오늘도 조금만 더.',
]

const SLIDER_LABELS: Record<number, string> = { 1: '가볍게', 2: '보통', 3: '아주 잘게' }

const PARTICLE_COLORS = [
  '#EA580C','#FB923C','#FED7AA',
  '#DC2626','#F97316','#FBBF24',
  '#78716C','#A8A29E',
]

const CONFETTI_COLORS = [
  '#EA580C','#FB923C','#FED7AA','#DC2626','#F97316','#FBBF24',
  '#4ADE80','#60A5FA','#A78BFA','#F472B6','#34D399','#FACC15',
]

const SOUND_LABELS: Record<SoundType, string> = {
  keyboard: '🎹 청축 키보드',
  wax:      '🫧 왁스볼',
  crystal:  '🔔 크리스탈 종',
  pencil:   '✏️ 연필 사각',
  bubble:   '💥 뽁뽁이',
}

const TAB_TITLES: Record<string, string> = {
  daily:  'Tick.',
  excel:  '매출데이터슈퍼스토어KR-test.xls - 호환성 모드',
  notion: '좋아 보이는 프레젠테이션 디자인의 비밀(가칭) 원고 진행',
}

const QUICK_PRESETS = [
  { label: '종합소득세 신고 💰', value: '종합소득세 신고' },
  { label: '이직 자소서 작성 📝', value: '이직 자소서 작성' },
  { label: '대청소 시작하기 🧹', value: '대청소 시작하기' },
]

// ─── Phase Templates ──────────────────────────────────────────────────────────

type PhaseTemplate = { number: string; title: string; tasks: string[] }

const PHASE_TEMPLATES: Record<string, PhaseTemplate[]> = {
  tax: [
    { number:'01', title:'준비 단계',   tasks:['홈택스 접속','공동·금융 인증서 확인','작년 신고 자료 열어두기','필요 서류 목록 메모'] },
    { number:'02', title:'서류 수집',   tasks:['근로소득 원천징수영수증 불러오기','의료비 지출 내역 확인','교육비·보험료 납입확인서 준비','기부금 영수증 파일 확인'] },
    { number:'03', title:'신고서 작성', tasks:['종합소득세 신고서 선택','소득 자동 채움 확인','공제 항목 하나씩 검토','예상 환급/납부 세액 확인'] },
    { number:'04', title:'제출 완료',   tasks:['전체 내용 한 번 더 검토','전자 신고 제출 클릭','납부서 PDF 저장','접수 완료 문자 확인'] },
  ],
  toeic: [
    { number:'01', title:'공부 준비',     tasks:['교재와 필기구 꺼내기','폰 무음 설정','물 한 잔 챙기기','목표 분량 메모'] },
    { number:'02', title:'LC 풀기',       tasks:['파트 1–2 문제 5개 풀기','틀린 문제 해설 읽기','발음 패턴 3개 메모'] },
    { number:'03', title:'RC 풀기',       tasks:['파트 5 문제 10개 풀기','모르는 단어 형광펜 긋기','어근 규칙 1가지 정리'] },
    { number:'04', title:'복습 & 마무리', tasks:['오늘 외울 단어 10개 정리','오답노트 간단히 작성','공부량 기록','내일 공부 페이지 표시'] },
  ],
  coverletter: [
    { number:'01', title:'기업 파악', tasks:['채용 공고 천천히 읽기','회사 홈페이지 미션 확인','핵심 키워드 3개 메모'] },
    { number:'02', title:'소재 발굴', tasks:['관련 경험 5개 브레인스톰','임팩트 있는 경험 2개 선택','STAR 구조로 메모'] },
    { number:'03', title:'초안 작성', tasks:['첫 문장만 써보기','지원 동기 단락 초안','역량/경험 단락 초안','포부 한 문장 써보기'] },
    { number:'04', title:'퇴고',      tasks:['소리 내어 한 번 읽기','어색한 문장 다듬기','맞춤법 검사기 돌리기','분량 기준 충족 확인'] },
  ],
  email: [
    { number:'01', title:'발송 준비', tasks:['받는 사람 이메일 확인','제목 먼저 정하기','첨부파일 미리 준비'] },
    { number:'02', title:'본문 작성', tasks:['인사말 한 줄 쓰기','핵심 용건 3줄 요약','마무리 인사 추가'] },
    { number:'03', title:'발송 확인', tasks:['전체 한 번 읽기','수신인 목록 재확인','발송 버튼 클릭'] },
  ],
  report: [
    { number:'01', title:'주제 정의',  tasks:['보고서 목적 한 문장으로 쓰기','독자가 원하는 것 파악','핵심 메시지 1개 정하기'] },
    { number:'02', title:'자료 수집',  tasks:['필요한 자료 목록 작성','빠른 자료 1개 먼저 찾기','차트·표 필요 여부 확인'] },
    { number:'03', title:'초안 작성',  tasks:['목차 뼈대 잡기','서론 단락 초안','본문 핵심 단락 1개 쓰기','결론 초안'] },
    { number:'04', title:'퇴고·제출', tasks:['전체 한 번 읽기','숫자·날짜 오류 확인','최종 파일 저장','제출 또는 전송'] },
  ],
  clean: [
    { number:'01', title:'구역 설정', tasks:['오늘 청소할 공간 1곳만 정하기','청소 도구 미리 꺼내두기'] },
    { number:'02', title:'정리 정돈', tasks:['버릴 물건 3개 바로 버리기','제자리 아닌 물건 모아두기','물건 용도별로 나누기'] },
    { number:'03', title:'청소 실행', tasks:['먼지 털기 또는 청소기 돌리기','바닥 한 번 닦기','쓰레기봉투 교체'] },
    { number:'04', title:'마무리',    tasks:['청소 도구 제자리에 두기','정리된 모습 사진 찍기','수고한 나를 칭찬하기'] },
  ],
  exercise: [
    { number:'01', title:'시작 준비', tasks:['운동복 꺼내서 입기','물 한 잔 마시기','좋아하는 노래 틀기'] },
    { number:'02', title:'워밍업',    tasks:['목·어깨 돌리기 30초','팔·다리 스트레칭 1분','제자리 걷기 1분'] },
    { number:'03', title:'본 운동',   tasks:['오늘 목표 운동 1가지 하기','세트 사이 30초 쉬기'] },
    { number:'04', title:'마무리',    tasks:['쿨다운 스트레칭','운동 기록 짧게 남기기','내일 운동 계획 1줄 메모'] },
  ],
  default: [
    { number:'01', title:'시작 준비',    tasks:['오늘 목표를 한 문장으로 쓰기','필요한 도구·자료 1개 준비','방해 요소 제거하기'] },
    { number:'02', title:'첫 번째 단계', tasks:['가장 작은 첫 단계만 해보기','5분 타이머 맞추기','모르는 것은 잠깐만 검색'] },
    { number:'03', title:'계속하기',     tasks:['다음 단계로 자연스럽게 이동','막히면 10분만 해보고 멈추기','중간 결과물 저장'] },
    { number:'04', title:'마무리',       tasks:['오늘 한 것 짧게 기록','다음에 할 것 한 줄 메모','오늘 노력한 나를 칭찬'] },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectTemplate(input: string): string {
  const l = input.toLowerCase()
  if (/세금|종소세|홈택스|세무|부가세|근로소득세|종합소득세/.test(l)) return 'tax'
  if (/토익|toeic|영어공부|어학|토플|toefl/.test(l))                  return 'toeic'
  if (/자소서|자기소개서|커버레터|취업|지원서/.test(l))               return 'coverletter'
  if (/메일|이메일|email/.test(l))                                     return 'email'
  if (/보고서|리포트|report|과제|논문/.test(l))                        return 'report'
  if (/청소|정리|치우/.test(l))                                        return 'clean'
  if (/운동|헬스|요가|러닝|달리기/.test(l))                           return 'exercise'
  return 'default'
}

function generatePhases(input: string, level: number): Phase[] {
  const templates  = PHASE_TEMPLATES[detectTemplate(input)]
  const phaseCount = level === 1 ? 2 : level === 2 ? 3 : 4
  const taskLimit  = level === 1 ? 3 : level === 2 ? 4 : 99
  const now = Date.now()
  return templates.slice(0, phaseCount).map((t, i) => ({
    id: now + i, number: t.number, title: t.title,
    subTasks: t.tasks.slice(0, taskLimit).map((text, j) => ({ id: now + i * 100 + j, text, completed: false })),
  }))
}

function toMarkdown(phases: Phase[], mainTask: string): string {
  const lines = [`# ${mainTask}`, '']
  for (const phase of phases) {
    lines.push(`- [ ] **Phase ${phase.number}: ${phase.title}**`)
    for (const task of phase.subTasks)
      lines.push(`   - [${task.completed ? 'x' : ' '}] ${task.text}`)
    lines.push('')
  }
  return lines.join('\n')
}

// ─── Sound Synthesis (5 types, Web Audio API only) ────────────────────────────

function playSound(type: SoundType, muted: boolean, volume: number) {
  if (muted) return
  const vol = Math.max(0, Math.min(1, volume))
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx() as AudioContext

    if (type === 'keyboard') {
      const len = Math.floor(ctx.sampleRate * 0.06)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d   = buf.getChannelData(0)
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.005))
      const src = ctx.createBufferSource(); src.buffer = buf
      const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 4200; flt.Q.value = 1.5
      const g1  = ctx.createGain(); g1.gain.setValueAtTime(0.55 * vol, ctx.currentTime); g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      src.connect(flt); flt.connect(g1); g1.connect(ctx.destination); src.start(); src.stop(ctx.currentTime + 0.07)
      const osc = ctx.createOscillator(); const g2 = ctx.createGain()
      osc.type = 'square'; osc.frequency.value = 3200
      g2.gain.setValueAtTime(0.07 * vol, ctx.currentTime); g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
      osc.connect(g2); g2.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.03)

    } else if (type === 'wax') {
      const dur = 0.2
      const len = Math.floor(ctx.sampleRate * dur)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d   = buf.getChannelData(0)
      for (let i = 0; i < len; i++) {
        const t   = i / ctx.sampleRate
        const env = Math.exp(-t / 0.035)
        const spl = Math.random() < 0.07 ? (Math.random() * 2 - 1) * 2.5 : Math.random() * 2 - 1
        d[i] = spl * env * 0.28
      }
      const src = ctx.createBufferSource(); src.buffer = buf
      const hs  = ctx.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 5000; hs.gain.value = 10
      const g   = ctx.createGain(); g.gain.value = 0.5 * vol
      src.connect(hs); hs.connect(g); g.connect(ctx.destination); src.start(); src.stop(ctx.currentTime + dur + 0.01)

    } else if (type === 'crystal') {
      const tone = (freq: number, delay: number, dur: number, v: number) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain()
        osc.type = 'sine'; osc.frequency.value = freq
        g.gain.setValueAtTime(v * vol, ctx.currentTime + delay)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + dur + 0.01)
      }
      tone(1046.5, 0,    1.3,  0.14)
      tone(1318.5, 0.01, 1.05, 0.08)
      tone(1567.9, 0.02, 0.9,  0.055)
      tone(2093,   0.03, 0.65, 0.03)

    } else if (type === 'pencil') {
      const dur = 0.18
      const len = Math.floor(ctx.sampleRate * dur)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d   = buf.getChannelData(0)
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate
        d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t / dur) * 0.6
      }
      const src = ctx.createBufferSource(); src.buffer = buf
      const lp  = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800; lp.Q.value = 0.7
      const g   = ctx.createGain(); g.gain.value = 0.45 * vol
      src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start(); src.stop(ctx.currentTime + dur + 0.01)

    } else {
      const len = Math.floor(ctx.sampleRate * 0.04)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d   = buf.getChannelData(0)
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t / 0.005) * 3
      }
      const src = ctx.createBufferSource(); src.buffer = buf
      const bp  = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.5
      const g   = ctx.createGain(); g.gain.value = 0.7 * vol
      src.connect(bp); bp.connect(g); g.connect(ctx.destination); src.start(); src.stop(ctx.currentTime + 0.05)
    }

    setTimeout(() => ctx.close(), 2500)
  } catch {}
}

// ─── Ta-da Victory Fanfare (C5→E5→G5→C6 arpeggio, pure sine waves) ───────────

function playTaDa(muted: boolean, volume: number) {
  if (muted) return
  const vol = Math.max(0, Math.min(1, volume))
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx() as AudioContext

    const notes = [
      { freq: 523.25, delay: 0,    dur: 0.18 }, // C5
      { freq: 659.25, delay: 0.13, dur: 0.18 }, // E5
      { freq: 783.99, delay: 0.26, dur: 0.18 }, // G5
      { freq: 1046.5, delay: 0.39, dur: 0.65 }, // C6 — 롱톤 마무리
    ]
    for (const note of notes) {
      const osc = ctx.createOscillator()
      const g   = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = note.freq
      g.gain.setValueAtTime(0, ctx.currentTime + note.delay)
      g.gain.linearRampToValueAtTime(0.28 * vol, ctx.currentTime + note.delay + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.delay + note.dur)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(ctx.currentTime + note.delay)
      osc.stop(ctx.currentTime + note.delay + note.dur + 0.01)
    }
    // E5 + G5 화음으로 마지막 C6에 두께 추가
    for (const freq of [659.25, 783.99]) {
      const osc = ctx.createOscillator()
      const g   = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq
      g.gain.setValueAtTime(0, ctx.currentTime + 0.39)
      g.gain.linearRampToValueAtTime(0.07 * vol, ctx.currentTime + 0.41)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.98)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(ctx.currentTime + 0.39); osc.stop(ctx.currentTime + 1.0)
    }
    setTimeout(() => ctx.close(), 2200)
  } catch {}
}

// ─── Design tokens — Stone Gray + Deep Orange ─────────────────────────────────

const C = {
  accent:       '#E85D04',
  accentHover:  '#D14000',
  accentLight:  'rgba(232,93,4,0.12)',
  accentMuted:  'rgba(232,93,4,0.08)',
  stone:        '#1E1B18',
  stoneMuted:   '#6B6560',
  stoneSub:     '#9E9995',
  border:       'rgba(0,0,0,0.08)',
  borderLight:  'rgba(0,0,0,0.06)',
  card:         'rgba(255,255,255,0.72)',
  bg:           '#FAF8F5',
  shadow:       '0 4px 24px rgba(0,0,0,0.1), 0 16px 64px rgba(0,0,0,0.08)',
  shadowAccent: '0 4px 20px rgba(232,93,4,0.3)',
}

// ─── Excel View ───────────────────────────────────────────────────────────────

function ExcelView(p: ViewProps) {
  type GridRow =
    | { kind: 'phase'; phase: Phase; rowNum: number }
    | { kind: 'task';  phase: Phase; task: SubTask; rowNum: number }

  const rows: GridRow[] = []
  let rowNum = 2
  for (const phase of p.phases) {
    rows.push({ kind: 'phase', phase, rowNum }); rowNum++
    for (const task of phase.subTasks) { rows.push({ kind: 'task', phase, task, rowNum }); rowNum++ }
  }

  const ribbon    = ['파일','홈','삽입','그리기','페이지 레이아웃','수식','데이터','검토','보기','자동화']
  const cols      = ['A','B','C','D','E','F']
  const userLabel = p.companyName
    ? `${p.companyName}${p.deptName ? ` · ${p.deptName}` : ''}`
    : '사내 내부망'

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0, fontFamily:'"Malgun Gothic","맑은 고딕",Arial,sans-serif', fontSize:'12px', background:'#fff' }}>
      {/* Title bar */}
      <div style={{ background:'#217346', color:'#fff', padding:'4px 10px', display:'flex', alignItems:'center', fontSize:'12px', userSelect:'none' }}>
        <span style={{ fontSize:'15px', marginRight:'8px' }}>📗</span>
        <span style={{ flex:1, textAlign:'center', fontSize:'12px', fontWeight:500 }}>
          {p.mainTask ? `${p.mainTask.slice(0,28)} - Excel` : '통합 문서1 - Excel'}
        </span>
        <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'16px', letterSpacing:'4px' }}>— □ ×</span>
      </div>
      {/* Ribbon */}
      <div style={{ background:'#217346', borderBottom:'2px solid #1a5c38' }}>
        <div style={{ display:'flex', alignItems:'center', padding:'0 6px', flexWrap:'wrap' }}>
          {ribbon.map(r => (
            <button key={r} style={{ color:'#fff', background:'transparent', border:'none', padding:'5px 8px', fontSize:'11px', cursor:'default', borderRadius:'2px' }}>{r}</button>
          ))}
          <button onClick={p.handleCrush} disabled={!p.mainTask.trim()||p.appState==='loading'}
            title="할 일 분쇄 실행 (Enter)"
            style={{ marginLeft:'auto', background:'#16843d', color:'#fff', border:'1px solid #0f6b32', padding:'4px 12px', fontSize:'11px', borderRadius:'2px', cursor:'pointer', opacity:(!p.mainTask.trim()||p.appState==='loading')?0.5:1, fontFamily:'inherit' }}>
            {p.appState==='loading' ? '⏳ 계산 중...' : '▶ 매크로 실행'}
          </button>
          <button onClick={()=>p.setMuted(m=>!m)} title={p.muted?'소리 켜기':'소리 끄기'}
            style={{ background:'transparent', border:'none', color:'#fff', cursor:'pointer', padding:'4px 6px', fontSize:'13px' }}>
            {p.muted?'🔇':'🔊'}
          </button>
        </div>
      </div>
      {/* Formatting toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:'3px', padding:'2px 6px', borderBottom:'1px solid #e0e0e0', background:'#f9f9f9', fontSize:'11px', flexWrap:'wrap', minHeight:'30px' }}>
        <select style={{ fontSize:'11px', border:'1px solid #ccc', borderRadius:'2px', padding:'1px 2px', background:'#fff', fontFamily:'inherit' }}><option>맑은 고딕</option></select>
        <select style={{ fontSize:'11px', border:'1px solid #ccc', borderRadius:'2px', padding:'1px 2px', width:'40px', background:'#fff' }}><option>11</option></select>
        {['B','I','U'].map(f => (
          <button key={f} style={{ fontWeight:f==='B'?700:400, fontStyle:f==='I'?'italic':'normal', textDecoration:f==='U'?'underline':'none', border:'1px solid #ccc', borderRadius:'2px', width:'22px', height:'22px', cursor:'default', background:'#fff', fontSize:'11px' }}>{f}</button>
        ))}
        <span style={{ color:'#bbb', margin:'0 2px' }}>│</span>
        <button style={{ border:'1px solid #ccc', borderRadius:'2px', width:'22px', height:'22px', cursor:'default', background:'#fff', fontSize:'10px' }}>≡</button>
        <button style={{ border:'1px solid #ccc', borderRadius:'2px', padding:'1px 5px', cursor:'default', background:'#fff', fontSize:'10px' }}>셀 병합 ▾</button>
        <button style={{ border:'1px solid #ccc', borderRadius:'2px', padding:'1px 5px', cursor:'default', background:'#fff', fontSize:'10px' }}>표시 형식 ▾</button>
        {p.appState==='result' && (
          <button onClick={p.handleCopyMarkdown} title="📋 마크다운으로 내보내기"
            style={{ marginLeft:'auto', border:'1px solid #217346', borderRadius:'2px', padding:'1px 8px', cursor:'pointer', background:'#fff', fontSize:'10px', color:'#217346', fontFamily:'inherit' }}>
            {p.copied ? '✓ 복사됨' : '내보내기'}
          </button>
        )}
      </div>
      {/* Formula bar = task input */}
      <div style={{ display:'flex', alignItems:'center', borderBottom:'2px solid #d0d0d0', height:'27px', background:'#fff', flexShrink:0 }}>
        <div style={{ width:'64px', borderRight:'1px solid #d0d0d0', padding:'0 6px', display:'flex', alignItems:'center', color:'#333', fontSize:'12px', flexShrink:0 }}>B2</div>
        <div style={{ width:'28px', display:'flex', alignItems:'center', justifyContent:'center', borderRight:'1px solid #d0d0d0', color:'#666', fontSize:'12px', fontStyle:'italic', flexShrink:0 }}>fx</div>
        <input value={p.mainTask} onChange={e => p.setMainTask(e.target.value)} onKeyDown={e => { if (e.key==='Enter') p.handleCrush() }}
          placeholder='할 일을 입력하세요 (Enter 또는 ▶ 매크로 실행)'
          style={{ flex:1, border:'none', outline:'none', padding:'0 8px', fontSize:'12px', color:'#111', fontFamily:'inherit', background:'transparent' }} />
      </div>
      {/* Grid */}
      <div style={{ flex:1, overflow:'auto' }}>
        <table style={{ borderCollapse:'collapse', minWidth:'700px', width:'100%', tableLayout:'fixed' }}>
          <colgroup>
            <col style={{ width:'36px' }} /><col style={{ width:'110px' }} /><col style={{ width:'260px' }} />
            <col style={{ width:'60px' }} /><col style={{ width:'80px' }} /><col style={{ width:'100px' }} /><col style={{ width:'80px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ background:'#f2f2f2', border:'1px solid #d0d0d0', borderBottom:'2px solid #a0a0a0', padding:'2px 0', textAlign:'center', color:'#666', fontSize:'11px', fontWeight:400, position:'sticky', top:0, zIndex:2 }}></th>
              {cols.map(c => <th key={c} style={{ background:'#f2f2f2', border:'1px solid #d0d0d0', borderBottom:'2px solid #a0a0a0', padding:'3px 6px', textAlign:'center', color:'#444', fontSize:'11px', fontWeight:400, position:'sticky', top:0, zIndex:2 }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ background:'#f2f2f2', border:'1px solid #d0d0d0', textAlign:'center', color:'#666', fontSize:'10px', padding:'3px 0' }}>1</td>
              {['Phase','작업 내용','완료','우선순위','담당자','비고'].map((h,j) => (
                <td key={j} style={{ border:'1px solid #d0d0d0', padding:'3px 6px', background:'#e2efda', fontWeight:700, fontSize:'11px', color:'#1a5c38' }}>{h}</td>
              ))}
            </tr>
            {rows.map((row, i) => {
              if (row.kind==='phase') {
                const done  = row.phase.subTasks.filter(t=>t.completed).length
                const total = row.phase.subTasks.length
                return (
                  <tr key={`ph-${row.phase.id}`}>
                    <td style={{ background:'#f2f2f2', border:'1px solid #d0d0d0', textAlign:'center', color:'#666', fontSize:'10px', padding:'2px 0' }}>{row.rowNum}</td>
                    <td style={{ border:'1px solid #c0c0c0', padding:'3px 6px', fontWeight:700, color:'#1a5c38', fontSize:'11px', background:'#e2efda' }}>Phase {row.phase.number}</td>
                    <td style={{ border:'1px solid #c0c0c0', padding:'3px 6px', fontWeight:700, color:'#1a5c38', fontSize:'11px', background:'#e2efda' }}>{row.phase.title}</td>
                    <td style={{ border:'1px solid #c0c0c0', padding:'3px 6px', textAlign:'center', color:'#1a5c38', fontSize:'11px', fontWeight:600, background:'#e2efda' }}>{done}/{total}</td>
                    <td colSpan={3} style={{ border:'1px solid #c0c0c0', background:'#e2efda' }}></td>
                  </tr>
                )
              }
              const task = row.task
              return (
                <tr key={`t-${task.id}`} style={{ background: i%2===0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ background:'#f2f2f2', border:'1px solid #e0e0e0', textAlign:'center', color:'#999', fontSize:'10px', padding:'2px 0' }}>{row.rowNum}</td>
                  <td style={{ border:'1px solid #e0e0e0', padding:'3px 6px', color:'#aaa', fontSize:'11px' }}></td>
                  <td style={{ border:'1px solid #e0e0e0', padding:'3px 8px', fontSize:'11px', color:task.completed?'#aaa':'#111', textDecoration:task.completed?'line-through':'none' }}>{task.text}</td>
                  <td style={{ border:'1px solid #e0e0e0', textAlign:'center', padding:'2px' }}>
                    <button onClick={e => p.handleToggle(row.phase.id, task.id, e)} title={task.completed?'완료 취소':'완료 체크'}
                      style={{ cursor:'pointer', background:'transparent', border:'none', fontSize:'15px', lineHeight:1 }}>
                      {task.completed ? '☑' : '☐'}
                    </button>
                  </td>
                  <td style={{ border:'1px solid #e0e0e0', padding:'3px 6px', fontSize:'11px', color:'#555' }}>상</td>
                  <td style={{ border:'1px solid #e0e0e0', padding:'3px 6px', fontSize:'11px', color:'#777' }}>본인</td>
                  <td style={{ border:'1px solid #e0e0e0', padding:'3px 6px', fontSize:'11px', color:'#aaa' }}></td>
                </tr>
              )
            })}
            {p.appState==='loading' && (
              <tr>
                <td style={{ background:'#f2f2f2', border:'1px solid #d0d0d0', textAlign:'center', color:'#666', fontSize:'10px' }}>{rows.length+2}</td>
                <td colSpan={6} style={{ border:'1px solid #d0d0d0', padding:'12px 8px', color:'#888', fontSize:'11px', fontStyle:'italic' }}>⏳ #계산중... 분석 매크로 실행 중</td>
              </tr>
            )}
            {p.appState==='default' && (
              <tr>
                <td style={{ background:'#f2f2f2', border:'1px solid #d0d0d0', textAlign:'center', color:'#666', fontSize:'10px' }}>2</td>
                <td colSpan={6} style={{ border:'1px solid #d0d0d0', padding:'12px 8px', color:'#ccc', fontSize:'11px' }}>수식 입력줄에 할 일을 입력하고 ▶ 매크로 실행 버튼을 클릭하세요.</td>
              </tr>
            )}
            {Array.from({ length: 8 }).map((_,i) => (
              <tr key={`empty-${i}`}>
                <td style={{ background:'#f2f2f2', border:'1px solid #e8e8e8', textAlign:'center', color:'#ccc', fontSize:'10px', padding:'3px 0' }}>{rows.length+3+i}</td>
                {cols.map(c => <td key={c} style={{ border:'1px solid #e8e8e8', height:'22px' }}></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Status bar — company info + volume slider disguised as zoom */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 8px', background:'#f0f0f0', borderTop:'1px solid #d0d0d0', fontSize:'11px', color:'#555', flexShrink:0 }}>
        <div style={{ display:'flex', gap:'0' }}>
          {['Sheet1','Sheet2','Sheet3'].map((s,i) => (
            <button key={s} style={{ padding:'2px 12px', background:i===0?'#fff':'#e0e0e0', border:'1px solid #ccc', borderBottom:i===0?'1px solid #fff':'1px solid #ccc', borderRadius:'2px 2px 0 0', fontSize:'11px', cursor:'default', color:i===0?'#1a5c38':'#666' }}>{s}</button>
          ))}
          <button style={{ padding:'2px 8px', background:'transparent', border:'none', cursor:'default', fontSize:'13px', color:'#888' }}>+</button>
        </div>
        <div style={{ display:'flex', gap:'8px', color:'#888', fontSize:'10px', alignItems:'center' }}>
          <span style={{ color:'#555', fontWeight:500 }}>사용자: {userLabel}</span>
          <span style={{ color:'#ccc' }}>|</span>
          <span>개수 {p.totalCount}</span>
          <span>합계 {p.completedCount}</span>
          <button onClick={p.handleReset} title="데이터 초기화" style={{ background:'transparent', border:'none', cursor:'pointer', color:'#bbb', fontSize:'10px', fontFamily:'inherit' }}>초기화</button>
          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}>
            <span>🔍</span>
            <input type="range" min={0} max={1} step={0.05} value={p.volume} onChange={e => p.setVolume(Number(e.target.value))}
              title="볼륨 조절 (확대/축소로 위장)"
              style={{ width:'70px', height:'10px', accentColor:'#217346', cursor:'pointer' }} />
            <span>{Math.round(p.volume * 100)}%</span>
          </span>
          <span style={{ color:'#aaa' }}>준비 완료</span>
        </div>
      </div>
    </div>
  )
}

// ─── Notion View ──────────────────────────────────────────────────────────────

function NotionView(p: ViewProps) {
  const allTasks  = p.phases.flatMap(ph => ph.subTasks)
  const totalRows = allTasks.length
  const today = new Date().toLocaleDateString('ko-KR',{ month:'2-digit', day:'2-digit' }).replace(/\.\s*/g,'/').replace(/\/$/,'')

  const workspaceName = p.companyName || '내 작업공간'
  const ownerLabel    = p.deptName    || '전략기획팀'

  const StatusTag = ({ completed }: { completed: boolean }) => {
    const bg    = completed ? '#d3f9d8' : '#dbe4ff'
    const color = completed ? '#2f9e44' : '#3b5bdb'
    return <span style={{ background:bg, color, borderRadius:'4px', padding:'2px 8px', fontSize:'11px', fontWeight:500, display:'inline-block', whiteSpace:'nowrap' }}>{completed?'완료':'진행 중'}</span>
  }

  return (
    <div style={{ display:'flex', flex:1, minHeight:0, background:'#fff', fontFamily:'"Noto Sans KR","Apple SD Gothic Neo","SF Pro Text",Arial,sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width:'220px', background:'#f7f6f5', borderRight:'1px solid #e9e9e7', display:'flex', flexDirection:'column', fontSize:'13px', color:'#37352f', flexShrink:0, overflow:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', padding:'10px 12px', gap:'8px', borderBottom:'1px solid #e9e9e7' }}>
          <div style={{ width:'24px', height:'24px', background:'#e8d5c4', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px' }}>🗂️</div>
          <span style={{ fontWeight:600, fontSize:'13px' }}>{workspaceName}</span>
          <span style={{ marginLeft:'auto', color:'#9b9a97', cursor:'default', fontSize:'16px' }}>···</span>
        </div>
        <div style={{ padding:'6px 4px' }}>
          {[{icon:'🔍',label:'검색'},{icon:'📥',label:'받은 메일함'},{icon:'📅',label:'오늘의 할 일'},{icon:'🗓️',label:'캘린더'}].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 10px', borderRadius:'4px', cursor:'default', color:'#37352f', fontSize:'13px' }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
          <div style={{ margin:'8px 10px', borderTop:'1px solid #e9e9e7' }}/>
          <div style={{ padding:'4px 10px', fontSize:'11px', color:'#9b9a97', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>개인 페이지</div>
          {[{icon:'📋',label:'작업 관리',active:true},{icon:'📝',label:'메모장',active:false},{icon:'📊',label:'주간 보고',active:false}].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 10px', borderRadius:'4px', cursor:'default', background:item.active?'rgba(0,0,0,0.05)':'transparent', color:'#37352f', fontSize:'13px' }}>
              <span>{item.icon}</span><span style={{ fontWeight:item.active?500:400 }}>{item.label}</span>
            </div>
          ))}
        </div>
        {/* Footer: company owner + donation disguise */}
        <div style={{ marginTop:'auto', padding:'10px 12px', borderTop:'1px solid #e9e9e7', fontSize:'10px', color:'#b7b7b4' }}>
          <span style={{ display:'block', marginBottom:'2px' }}>소유자: {ownerLabel}</span>
          <a href="https://ctee.kr/place/gavinkim" target="_blank" rel="noopener noreferrer" style={{ color:'#b7b7b4', textDecoration:'none', display:'block' }}>준비 완료</a>
          <span>개인 플랜 · 무료</span>
        </div>
      </div>
      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', padding:'6px 16px', borderBottom:'1px solid #e9e9e7', gap:'8px', fontSize:'12px', color:'#9b9a97', flexShrink:0 }}>
          <button style={{ background:'transparent', border:'none', cursor:'default', color:'#ccc', fontSize:'16px' }}>←</button>
          <button style={{ background:'transparent', border:'none', cursor:'default', color:'#ccc', fontSize:'16px' }}>→</button>
          <span>작업 관리</span><span>/</span>
          <span style={{ color:'#37352f', fontWeight:500 }}>오늘의 할 일</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:'6px', alignItems:'center' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#c1c0be' }}>
              <span title="볼륨 조절">🔊</span>
              <input type="range" min={0} max={1} step={0.05} value={p.volume} onChange={e => p.setVolume(Number(e.target.value))}
                title="볼륨 조절" style={{ width:'55px', height:'10px', accentColor:'#37352f', cursor:'pointer' }} />
            </span>
            <button onClick={()=>p.setMuted(m=>!m)} title={p.muted?'소리 켜기':'소리 끄기'} style={{ border:'none', background:'transparent', cursor:'pointer', color:'#9b9a97', fontSize:'14px', padding:'3px 4px' }}>{p.muted?'🔇':'🔊'}</button>
            <button style={{ border:'1px solid #e9e9e7', borderRadius:'4px', padding:'3px 10px', fontSize:'12px', cursor:'default', background:'#fff', color:'#37352f' }}>공유</button>
            <button style={{ border:'none', background:'transparent', cursor:'default', color:'#9b9a97', fontSize:'18px' }}>···</button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'32px 48px 48px' }}>
          <div style={{ marginBottom:'4px', fontSize:'36px' }}>📋</div>
          <input value={p.mainTask} onChange={e => p.setMainTask(e.target.value)} onKeyDown={e => { if (e.key==='Enter') p.handleCrush() }}
            placeholder='제목 없음'
            style={{ width:'100%', border:'none', outline:'none', fontSize:'36px', fontWeight:700, color:'#37352f', marginBottom:'20px', fontFamily:'inherit', background:'transparent', display:'block' }} />
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px', fontSize:'13px', flexWrap:'wrap' }}>
            <button style={{ display:'flex', alignItems:'center', gap:'4px', border:'none', background:'transparent', cursor:'default', color:'#9b9a97', padding:'3px 6px', borderRadius:'4px', fontSize:'13px' }}>⊞ 표</button>
            <span style={{ color:'#e9e9e7' }}>|</span>
            <button style={{ border:'none', background:'transparent', cursor:'default', color:'#9b9a97', padding:'3px 6px', fontSize:'13px' }}>필터</button>
            <button style={{ border:'none', background:'transparent', cursor:'default', color:'#9b9a97', padding:'3px 6px', fontSize:'13px' }}>정렬</button>
            <button style={{ border:'none', background:'transparent', cursor:'default', color:'#9b9a97', padding:'3px 6px', fontSize:'13px' }}>···</button>
            <button onClick={p.handleCrush} disabled={!p.mainTask.trim()||p.appState==='loading'} title="할 일 분쇄 실행"
              style={{ marginLeft:'auto', background:'#2e2b29', color:'#fff', border:'none', borderRadius:'4px', padding:'5px 14px', fontSize:'12px', cursor:'pointer', opacity:(!p.mainTask.trim()||p.appState==='loading')?0.4:1, fontFamily:'inherit' }}>
              {p.appState==='loading' ? '⏳ 분석 중...' : '+ 새로 만들기'}
            </button>
            {p.appState==='result' && (
              <button onClick={p.handleCopyMarkdown} title="📋 마크다운으로 내보내기"
                style={{ background:'transparent', border:'1px solid #e9e9e7', borderRadius:'4px', padding:'4px 10px', fontSize:'12px', cursor:'pointer', color:p.copied?'#2f9e44':'#9b9a97', fontFamily:'inherit' }}>
                {p.copied?'✓ 복사됨':'내보내기'}
              </button>
            )}
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', color:'#37352f' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #e9e9e7' }}>
                <th style={{ textAlign:'left', padding:'6px 10px', fontWeight:500, color:'#9b9a97', fontSize:'12px', width:'280px' }}><span style={{ marginRight:'4px' }}>Aa</span>소제목</th>
                <th style={{ textAlign:'left', padding:'6px 10px', fontWeight:500, color:'#9b9a97', fontSize:'12px', width:'100px' }}><span style={{ marginRight:'4px' }}>◉</span>진행상태</th>
                <th style={{ textAlign:'left', padding:'6px 10px', fontWeight:500, color:'#9b9a97', fontSize:'12px', width:'90px' }}><span style={{ marginRight:'4px' }}>📅</span>착수일</th>
                <th style={{ textAlign:'left', padding:'6px 10px', fontWeight:500, color:'#9b9a97', fontSize:'12px' }}><span style={{ marginRight:'4px' }}>🕐</span>최종수정</th>
              </tr>
            </thead>
            <tbody>
              {p.appState==='loading' && <tr><td colSpan={4} style={{ padding:'20px 10px', color:'#9b9a97', fontStyle:'italic', borderBottom:'1px solid #e9e9e7' }}>⏳ 데이터베이스를 불러오는 중...</td></tr>}
              {p.appState==='default' && <tr><td colSpan={4} style={{ padding:'20px 10px', color:'#b7b7b4', borderBottom:'1px solid #e9e9e7' }}>제목을 입력한 뒤 + 새로 만들기를 클릭하세요.</td></tr>}
              {p.phases.flatMap(phase => [
                <tr key={`ph-${phase.id}`} style={{ borderBottom:'1px solid #e9e9e7', background:'#f7f6f5' }}>
                  <td style={{ padding:'6px 10px', fontWeight:600, fontSize:'13px', color:'#37352f' }}>▸ Phase {phase.number} — {phase.title}</td>
                  <td style={{ padding:'6px 10px' }}><StatusTag completed={phase.subTasks.every(t=>t.completed)&&phase.subTasks.length>0} /></td>
                  <td style={{ padding:'6px 10px', color:'#9b9a97', fontSize:'12px' }}>{today}</td>
                  <td style={{ padding:'6px 10px', color:'#9b9a97', fontSize:'12px' }}>오늘</td>
                </tr>,
                ...phase.subTasks.map(task => (
                  <tr key={`t-${task.id}`} style={{ borderBottom:'1px solid #f0efee' }}>
                    <td style={{ padding:'5px 10px 5px 24px', fontSize:'13px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'8px' }}>
                        <button onClick={e => p.handleToggle(phase.id, task.id, e)} title={task.completed?'완료 취소':'완료 체크'}
                          style={{ width:'14px', height:'14px', borderRadius:'3px', border:task.completed?'none':'1.5px solid #c1c0be', background:task.completed?'#2f9e44':'transparent', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {task.completed && <span style={{ color:'#fff', fontSize:'9px', fontWeight:700, lineHeight:1 }}>✓</span>}
                        </button>
                        <span style={{ color:task.completed?'#9b9a97':'#37352f', textDecoration:task.completed?'line-through':'none' }}>{task.text}</span>
                      </span>
                    </td>
                    <td style={{ padding:'5px 10px' }}><StatusTag completed={task.completed} /></td>
                    <td style={{ padding:'5px 10px', color:'#9b9a97', fontSize:'12px' }}>{today}</td>
                    <td style={{ padding:'5px 10px', color:'#9b9a97', fontSize:'12px' }}>오늘</td>
                  </tr>
                )),
              ])}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:'1px solid #e9e9e7' }}>
                <td colSpan={4} style={{ padding:'6px 10px', fontSize:'12px', color:'#9b9a97' }}>
                  개수 {totalRows} &nbsp;·&nbsp; 완료 {p.completedCount} &nbsp;·&nbsp;
                  <button onClick={p.handleReset} title="데이터 초기화" style={{ background:'transparent', border:'none', cursor:'pointer', color:'#b7b7b4', fontSize:'12px', textDecoration:'underline', fontFamily:'inherit' }}>초기화</button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Company Settings Modal ───────────────────────────────────────────────────

function CompanySettingsModal({
  companyName, deptName, onSave, onClose,
}: {
  companyName: string; deptName: string
  onSave: (c: string, d: string) => void; onClose: () => void
}) {
  const [c, setC] = useState(companyName)
  const [d, setD] = useState(deptName)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.32)', display:'flex', alignItems:'center', justifyContent:'center' }}
         onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:'6px', padding:'20px', width:'320px', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', fontFamily:'"Malgun Gothic","맑은 고딕",Arial,sans-serif', maxWidth:'90vw' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <h3 style={{ margin:0, fontSize:'13px', fontWeight:700, color:'#333' }}>⚙️ 위장 정보 설정</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', color:'#888', lineHeight:1 }}>×</button>
        </div>
        <p style={{ fontSize:'11px', color:'#888', marginBottom:'14px', lineHeight:'1.7' }}>
          상사가 지나갈 때 더 완벽한 위장을 위해 실제 소속 정보를 입력하세요.
        </p>
        <label style={{ fontSize:'12px', color:'#555', display:'block', marginBottom:'4px' }}>회사명</label>
        <input value={c} onChange={e => setC(e.target.value)} placeholder="예: 삼성전자"
          style={{ width:'100%', border:'1px solid #ddd', borderRadius:'3px', padding:'7px 10px', fontSize:'12px', marginBottom:'10px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }} />
        <label style={{ fontSize:'12px', color:'#555', display:'block', marginBottom:'4px' }}>부서명</label>
        <input value={d} onChange={e => setD(e.target.value)} placeholder="예: 전략기획팀"
          style={{ width:'100%', border:'1px solid #ddd', borderRadius:'3px', padding:'7px 10px', fontSize:'12px', marginBottom:'18px', boxSizing:'border-box', outline:'none', fontFamily:'inherit' }} />
        <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'6px 16px', border:'1px solid #ddd', borderRadius:'3px', background:'#f5f5f5', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>취소</button>
          <button onClick={() => { onSave(c.trim(), d.trim()); onClose() }}
            style={{ padding:'6px 16px', border:'none', borderRadius:'3px', background:'#1f5c8b', color:'#fff', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────

function FeedbackModal({ onClose, isOffice }: { onClose: () => void; isOffice: boolean }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = () => {
    if (!text.trim()) return
    // TODO: 실제 제출 시 Tally / Google Forms 엔드포인트로 fetch POST 연결
    setSent(true)
    setTimeout(onClose, 1800)
  }

  const overlayStyle: React.CSSProperties = {
    position:'fixed', inset:0, zIndex:1000,
    background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily: isOffice ? '"Malgun Gothic","맑은 고딕",Arial,sans-serif' : 'Outfit,"Noto Sans KR",system-ui,sans-serif',
  }

  if (isOffice) {
    return (
      <div style={overlayStyle} onClick={e => { if (e.target===e.currentTarget) onClose() }}>
        <div style={{ background:'#fff', border:'1px solid #bbb', borderRadius:'2px', width:'420px', boxShadow:'4px 4px 12px rgba(0,0,0,0.25)', maxWidth:'90vw' }}>
          <div style={{ background:'#1f5c8b', color:'#fff', padding:'6px 10px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px' }}>
            <span>⚠️ IT Helpdesk — 오류 신고 티켓</span>
            <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#fff', cursor:'pointer', fontSize:'16px', lineHeight:1 }}>×</button>
          </div>
          <div style={{ padding:'16px' }}>
            <p style={{ fontSize:'11px', color:'#555', marginBottom:'10px', lineHeight:'1.6' }}>시스템 이상 증상을 상세히 기술해 주세요. 담당자가 확인 후 처리합니다.</p>
            {sent ? (
              <p style={{ color:'#217346', fontSize:'12px', textAlign:'center', padding:'16px 0' }}>✓ 티켓이 접수되었습니다. 빠른 시일 내 처리됩니다.</p>
            ) : (
              <>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={5}
                  placeholder="예) 특정 기능 동작 안됨, 오류 메시지 내용 등..."
                  style={{ width:'100%', border:'1px solid #ccc', borderRadius:'2px', padding:'6px 8px', fontSize:'12px', resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'6px', marginTop:'10px' }}>
                  <button onClick={onClose} style={{ padding:'4px 14px', border:'1px solid #ccc', background:'#f5f5f5', fontSize:'12px', cursor:'pointer', borderRadius:'2px', fontFamily:'inherit' }}>취소</button>
                  <button onClick={handleSubmit} disabled={!text.trim()} style={{ padding:'4px 14px', border:'none', background:'#1f5c8b', color:'#fff', fontSize:'12px', cursor:'pointer', borderRadius:'2px', fontFamily:'inherit', opacity:text.trim()?1:0.5 }}>티켓 제출</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'360px', boxShadow:'0 16px 48px rgba(0,0,0,0.16)', maxWidth:'90vw' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <h3 style={{ fontSize:'16px', fontWeight:700, color:'#292524', margin:0 }}>💬 익명 건의함</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#A8A29E', fontSize:'20px', lineHeight:1 }}>×</button>
        </div>
        <p style={{ fontSize:'12px', color:'#78716C', marginBottom:'14px', lineHeight:'1.6' }}>Tick.을 더 좋게 만들 아이디어를 보내주세요. 완전 익명입니다.</p>
        {sent ? (
          <p style={{ color:'#EA580C', fontSize:'14px', textAlign:'center', padding:'16px 0', fontWeight:600 }}>감사해요! 소중한 의견을 받았습니다. 🙏</p>
        ) : (
          <>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
              placeholder="자유롭게 적어주세요..."
              style={{ width:'100%', border:'1px solid #E7E5E4', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', resize:'none', fontFamily:'inherit', outline:'none', boxSizing:'border-box', color:'#292524' }} />
            <button onClick={handleSubmit} disabled={!text.trim()}
              style={{ marginTop:'12px', width:'100%', padding:'10px', background:'#EA580C', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer', opacity:text.trim()?1:0.4, fontFamily:'inherit' }}>
              의견 보내기
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Tick() {
  const [phases,              setPhases]              = useState<Phase[]>([])
  const [mainTask,            setMainTask]            = useState('')
  const [granularity,         setGranularity]         = useState(2)
  const [appState,            setAppState]            = useState<AppState>('default')
  const [microcopyIdx,        setMicrocopyIdx]        = useState(0)
  const [particles,           setParticles]           = useState<Particle[]>([])
  const [showMissionClear,    setShowMissionClear]    = useState(false)
  const [editingId,           setEditingId]           = useState<number | null>(null)
  const [editText,            setEditText]            = useState('')
  const [themeMode,           setThemeMode]           = useState<ThemeMode>('daily')
  const [officeTab,           setOfficeTab]           = useState<OfficeTab>('excel')
  const [soundType,           setSoundType]           = useState<SoundType>('keyboard')
  const [muted,               setMuted]               = useState(false)
  const [volume,              setVolume]              = useState(0.7)
  const [bossMode,            setBossMode]            = useState(false)
  const [copied,              setCopied]              = useState(false)
  const [showFeedback,        setShowFeedback]        = useState(false)
  const [companyName,         setCompanyName]         = useState('')
  const [deptName,            setDeptName]            = useState('')
  const [showCompanySettings, setShowCompanySettings] = useState(false)
  const [isFallback,          setIsFallback]          = useState(false)

  const editInputRef    = useRef<HTMLInputElement>(null)
  const particleIdRef   = useRef(0)
  const escCountRef     = useRef(0)
  const escTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const confettiRafRef  = useRef<number>(0)
  const celebratedRef   = useRef(false)
  const importInputRef  = useRef<HTMLInputElement>(null)
  const mutedRef        = useRef(muted)
  const volumeRef       = useRef(volume)

  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { volumeRef.current = volume }, [volume])

  useEffect(() => {
    setMicrocopyIdx(Math.floor(Math.random() * MICROCOPIES.length))
    const id = setInterval(() => setMicrocopyIdx(i => (i + 1) % MICROCOPIES.length), 4500)
    return () => clearInterval(id)
  }, [])

  // Restore tasks + settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tc-v2')
      if (saved) {
        const { phases: p, mainTask: m } = JSON.parse(saved)
        if (Array.isArray(p) && p.length > 0) { setPhases(p); setMainTask(m ?? ''); setAppState('result') }
      }
    } catch {}
    try {
      const settings = localStorage.getItem('tc-settings')
      if (settings) {
        const { c, d } = JSON.parse(settings)
        if (c) setCompanyName(c)
        if (d) setDeptName(d)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (phases.length > 0) localStorage.setItem('tc-v2', JSON.stringify({ phases, mainTask }))
  }, [phases, mainTask])

  useEffect(() => {
    if (editingId !== null) { editInputRef.current?.focus(); editInputRef.current?.select() }
  }, [editingId])

  useEffect(() => {
    document.title = themeMode === 'daily' ? TAB_TITLES.daily : TAB_TITLES[officeTab]
  }, [themeMode, officeTab])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (bossMode) return
      escCountRef.current += 1
      if (escTimerRef.current) clearTimeout(escTimerRef.current)
      if (escCountRef.current >= 2) {
        escCountRef.current = 0; setBossMode(true); setMuted(true)
      } else {
        escTimerRef.current = setTimeout(() => { escCountRef.current = 0 }, 600)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bossMode])

  useEffect(() => () => cancelAnimationFrame(confettiRafRef.current), [])

  const allTasks       = phases.flatMap(ph => ph.subTasks)
  const completedCount = allTasks.filter(t => t.completed).length
  const totalCount     = allTasks.length
  const progress       = totalCount === 0 ? 0 : (completedCount / totalCount) * 100

  // ── Grand confetti canvas ──────────────────────────────────────────────────

  const launchGrandConfetti = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    cancelAnimationFrame(confettiRafRef.current)
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const c = ctx // non-null alias for closure

    const W = canvas.width, H = canvas.height

    interface ConfettiP {
      x: number; y: number; vx: number; vy: number
      color: string; w: number; h: number; rot: number; rotV: number; isRect: boolean
    }

    const particles2: ConfettiP[] = []
    const launchY = H * 0.72
    for (const sx of [W * 0.12, W * 0.5, W * 0.88]) {
      for (let i = 0; i < 65; i++) {
        const spread = sx === W * 0.5 ? 1.1 : 0.75
        const a   = -Math.PI / 2 + (Math.random() - 0.5) * spread
        const spd = 11 + Math.random() * 14
        particles2.push({
          x: sx + (Math.random() - 0.5) * 30, y: launchY,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          w: 7 + Math.random() * 10, h: 4 + Math.random() * 5,
          rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 14,
          isRect: Math.random() > 0.35,
        })
      }
    }

    const startTime = performance.now()
    const duration  = 4200

    function tick(now: number) {
      const elapsed = now - startTime
      const alpha   = Math.max(0, 1 - elapsed / duration)
      c.clearRect(0, 0, W, H)
      for (const p of particles2) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.995; p.rot += p.rotV
        c.save()
        c.globalAlpha = alpha
        c.translate(p.x, p.y)
        c.rotate(p.rot * Math.PI / 180)
        c.fillStyle = p.color
        if (p.isRect) {
          c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        } else {
          c.beginPath()
          c.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, Math.PI * 2)
          c.fill()
        }
        c.restore()
      }
      if (elapsed < duration) {
        confettiRafRef.current = requestAnimationFrame(tick)
      } else {
        c.clearRect(0, 0, W, H)
      }
    }
    confettiRafRef.current = requestAnimationFrame(tick)
  }, [])

  // ── 100% completion trigger ────────────────────────────────────────────────

  useEffect(() => {
    if (progress >= 100 && totalCount > 0 && !celebratedRef.current) {
      celebratedRef.current = true
      setShowMissionClear(true)
      playTaDa(mutedRef.current, volumeRef.current)
      launchGrandConfetti()
    }
    if (progress < 100) {
      celebratedRef.current = false
    }
  }, [progress, totalCount, launchGrandConfetti])

  // ── Click-particle burst ───────────────────────────────────────────────────

  const spawnParticles = useCallback((cx: number, cy: number) => {
    const burst: Particle[] = Array.from({ length: 10 }, (_, i) => {
      const angle  = (i / 10) * Math.PI * 2
      const spread = 50 + Math.random() * 40
      return {
        id: ++particleIdRef.current, x: cx - 4, y: cy - 4,
        size: 6 + Math.random() * 5,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        tx: Math.cos(angle) * spread, ty: Math.sin(angle) * spread - 20,
        rot: Math.random() * 360,
      }
    })
    setParticles(prev => [...prev, ...burst])
    setTimeout(() => setParticles(prev => prev.filter(p => !burst.find(b => b.id === p.id))), 850)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  // [LLM API 연결] — fetch('/api/crush') 호출 + API 실패 시 목 데이터 폴백
  const handleCrush = useCallback(async () => {
    if (!mainTask.trim()) return
    setAppState('loading'); setPhases([]); setShowMissionClear(false); setEditingId(null)
    celebratedRef.current = false
    try {
      const res = await fetch('/api/crush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: mainTask, level: granularity }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const now  = Date.now()
      setPhases(data.phases.map(
        (ph: { number: string; title: string; tasks: string[] }, i: number) => ({
          id: now + i, number: ph.number, title: ph.title,
          subTasks: ph.tasks.map((text: string, j: number) => ({ id: now + i * 100 + j, text, completed: false })),
        })
      ))
      setIsFallback(false)
      setAppState('result')
    } catch {
      setPhases(generatePhases(mainTask, granularity))
      setIsFallback(true)
      setAppState('result')
    }
  }, [mainTask, granularity])

  const handlePreset = useCallback(async (value: string) => {
    setMainTask(value)
    setAppState('loading'); setPhases([]); setShowMissionClear(false); setEditingId(null)
    celebratedRef.current = false
    try {
      const res = await fetch('/api/crush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: value, level: granularity }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const now  = Date.now()
      setPhases(data.phases.map(
        (ph: { number: string; title: string; tasks: string[] }, i: number) => ({
          id: now + i, number: ph.number, title: ph.title,
          subTasks: ph.tasks.map((text: string, j: number) => ({ id: now + i * 100 + j, text, completed: false })),
        })
      ))
      setIsFallback(false)
      setAppState('result')
    } catch {
      setPhases(generatePhases(value, granularity))
      setIsFallback(true)
      setAppState('result')
    }
  }, [granularity])

  const handleToggle = useCallback((phaseId: number, taskId: number, e: React.MouseEvent) => {
    setPhases(prev => {
      const task = prev.find(ph => ph.id === phaseId)?.subTasks.find(t => t.id === taskId)
      if (!task) return prev
      if (!task.completed) { playSound(soundType, muted, volume); spawnParticles(e.clientX, e.clientY) }
      return prev.map(ph => ph.id !== phaseId ? ph : {
        ...ph, subTasks: ph.subTasks.map(t => t.id !== taskId ? t : { ...t, completed: !t.completed }),
      })
    })
  }, [spawnParticles, soundType, muted, volume])

  const handleDeleteTask = useCallback((phaseId: number, taskId: number) => {
    setPhases(prev => prev.map(ph => ph.id !== phaseId ? ph : { ...ph, subTasks: ph.subTasks.filter(t => t.id !== taskId) }))
  }, [])

  const handleAddTask = useCallback((phaseId: number) => {
    const id = Date.now()
    setPhases(prev => prev.map(ph => ph.id !== phaseId ? ph : { ...ph, subTasks: [...ph.subTasks, { id, text:'', completed:false }] }))
    setTimeout(() => { setEditingId(id); setEditText('') }, 30)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editingId === null) return
    setPhases(prev => prev.map(ph => ({
      ...ph,
      subTasks: editText.trim()
        ? ph.subTasks.map(t => t.id === editingId ? { ...t, text: editText.trim() } : t)
        : ph.subTasks.filter(t => t.id !== editingId),
    })))
    setEditingId(null); setEditText('')
  }, [editingId, editText])

  const handleReset = useCallback(() => {
    setPhases([]); setMainTask(''); setAppState('default'); setShowMissionClear(false)
    celebratedRef.current = false
    cancelAnimationFrame(confettiRafRef.current)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    localStorage.removeItem('tc-v2')
  }, [])

  const handleCopyMarkdown = useCallback(() => {
    navigator.clipboard.writeText(toMarkdown(phases, mainTask)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }, [phases, mainTask])

  // ── Backup / Restore ──────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const data = { version: 2, mainTask, phases, exportedAt: new Date().toISOString() }
    const blob  = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href = url; a.download = `tick-backup-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }, [mainTask, phases])

  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data.phases) && data.phases.length > 0) {
          setPhases(data.phases); setMainTask(data.mainTask ?? ''); setAppState('result')
          celebratedRef.current = false
        } else {
          alert('유효한 Tick. 백업 파일이 아닙니다.')
        }
      } catch {
        alert('파일을 읽는 데 실패했습니다. JSON 형식을 확인해 주세요.')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleSaveCompanySettings = useCallback((c: string, d: string) => {
    setCompanyName(c); setDeptName(d)
    try { localStorage.setItem('tc-settings', JSON.stringify({ c, d })) } catch {}
  }, [])

  const viewProps: ViewProps = {
    phases, mainTask, granularity, appState, progress, completedCount, totalCount,
    setMainTask, setGranularity, handleCrush, handleToggle, handleDeleteTask,
    handleAddTask, handleReset, handleCopyMarkdown, editingId, editText,
    editInputRef, setEditingId, setEditText, handleSaveEdit, copied,
    soundType, setSoundType, muted, setMuted, volume, setVolume,
    companyName, deptName,
  }

  // ── Boss Mode ─────────────────────────────────────────────────────────────

  if (bossMode) {
    return (
      <div className="min-h-screen bg-white" style={{ cursor:'default', userSelect:'none' }}
           onDoubleClick={() => { setBossMode(false); setMuted(false) }}>
        <div style={{ maxWidth:'700px', margin:'0 auto', padding:'64px 40px', fontFamily:'Georgia,serif' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'6px', background:'#f1f3f5', marginBottom:'24px' }} />
          <div style={{ height:'42px', background:'#f8f9fa', borderRadius:'4px', width:'58%', marginBottom:'32px' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {[78,65,82,71,55,88,60,74].map((w,i) => (
              <div key={i} style={{ height:'14px', background:'#f8f9fa', borderRadius:'3px', width:`${w}%` }} />
            ))}
          </div>
          <p style={{ marginTop:'64px', fontSize:'11px', color:'#dee2e6', textAlign:'center' }}>더블클릭하여 돌아가기</p>
        </div>
      </div>
    )
  }

  // ── Office Mode ────────────────────────────────────────────────────────────

  if (themeMode === 'office') {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
        {particles.map(p => (
          <div key={p.id} className="particle" style={{ left:p.x, top:p.y, width:p.size, height:p.size, backgroundColor:p.color, '--ptx':`${p.tx}px`, '--pty':`${p.ty}px`, '--prot':`${p.rot}deg` } as React.CSSProperties} />
        ))}
        <div style={{ background:'#f0f0f0', borderBottom:'1px solid #ccc', padding:'4px 10px 0', display:'flex', gap:'2px', alignItems:'flex-end', fontFamily:'Arial,sans-serif', flexShrink:0 }}>
          {(['excel','notion'] as OfficeTab[]).map(tab => (
            <button key={tab} onClick={() => setOfficeTab(tab)} style={{
              padding:'4px 16px 5px', fontSize:'12px', cursor:'pointer',
              background: officeTab===tab ? '#fff' : '#e4e4e4',
              border:'1px solid #bbb', borderBottom: officeTab===tab ? '1px solid #fff' : '1px solid #bbb',
              borderRadius:'3px 3px 0 0', color: officeTab===tab ? '#222' : '#666',
            }}>
              {tab==='excel' ? '📊 Excel 뷰' : '⬜ Notion 뷰'}
            </button>
          ))}
          <button onClick={() => setShowFeedback(true)}
            title="IT Helpdesk에 시스템 오류를 신고합니다"
            style={{ marginLeft:'8px', marginBottom:'2px', padding:'3px 10px', fontSize:'11px', cursor:'pointer', background:'#fff8f0', border:'1px solid #d4956b', borderRadius:'3px', color:'#7c3a0a', fontFamily:'Arial,sans-serif' }}>
            ⚠️ 사내 IT Helpdesk 티켓 발행
          </button>
          <button onClick={() => setShowCompanySettings(true)}
            title="위장 정보 설정 (회사명·부서명)"
            style={{ marginLeft:'4px', marginBottom:'2px', padding:'3px 8px', fontSize:'11px', cursor:'pointer', background:'#fff', border:'1px solid #bbb', borderRadius:'3px', color:'#666', fontFamily:'Arial,sans-serif' }}>
            ⚙️
          </button>
          <button onClick={() => setThemeMode('daily')} title="일상 모드로 전환"
            style={{ marginLeft:'auto', marginBottom:'2px', padding:'3px 10px', fontSize:'11px', cursor:'pointer', background:'#fff', border:'1px solid #bbb', borderRadius:'3px', color:'#555', fontFamily:'Arial,sans-serif' }}>
            🌤 일상 모드
          </button>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
          {officeTab === 'excel' ? <ExcelView {...viewProps} /> : <NotionView {...viewProps} />}
        </div>
        {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} isOffice={true} />}
        {showCompanySettings && (
          <CompanySettingsModal
            companyName={companyName} deptName={deptName}
            onSave={handleSaveCompanySettings}
            onClose={() => setShowCompanySettings(false)}
          />
        )}
      </div>
    )
  }

  // ── Daily Mode ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F0EBE5 0%, #E8E2D9 50%, #E0D8D0 100%)' }}>
      {/* Grand confetti canvas — fixed overlay, pointer-events none */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:55, pointerEvents:'none' }} />

      {/* Click particles */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left:p.x, top:p.y, width:p.size, height:p.size, backgroundColor:p.color, '--ptx':`${p.tx}px`, '--pty':`${p.ty}px`, '--prot':`${p.rot}deg` } as React.CSSProperties} />
      ))}

      {/* Hidden file input for import */}
      <input ref={importInputRef} type="file" accept=".json" style={{ display:'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = '' }} />

      {/* MISSION CLEAR Modal */}
      {showMissionClear && (
        <div
          className="fixed inset-0 flex items-center justify-center animate-fade-in"
          style={{ zIndex:60, backgroundColor:'rgba(250,248,245,0.87)', backdropFilter:'blur(12px)' }}
          onClick={() => setShowMissionClear(false)}>
          <div
            className="text-center mx-4 animate-fade-in-up glass-strong"
            style={{ borderRadius:'28px', padding:'48px 40px', maxWidth:'380px', width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.12)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'56px', marginBottom:'16px' }}>🎉</div>
            <h2 style={{ fontSize:'26px', fontWeight:900, color:C.stone, margin:'0 0 8px', fontFamily:'Outfit,system-ui', letterSpacing:'-0.02em' }}>
              MISSION CLEAR
            </h2>
            <p style={{ fontSize:'16px', fontWeight:700, color:C.accent, margin:'0 0 6px' }}>
              모든 작업을 정복하셨습니다!
            </p>
            <p className="leading-relaxed" style={{ fontSize:'14px', color:C.stoneMuted, margin:'0 0 28px' }}>
              이제 완전히 뇌를 쉬어주세요.<br />
              오늘 정말 잘했어요. 🙌
            </p>
            <button
              onClick={() => setShowMissionClear(false)}
              style={{ padding:'14px 40px', backgroundColor:C.accent, color:'#fff', border:'none', borderRadius:'16px', fontSize:'15px', fontWeight:600, cursor:'pointer', boxShadow:C.shadowAccent, fontFamily:'Outfit,system-ui' }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} isOffice={false} />}

      <div className="max-w-[560px] mx-auto px-5 py-12 md:py-20">

        {/* Header */}
        <header className="mb-8 text-center animate-fade-in">
          <h1 style={{ fontFamily:'Outfit,system-ui', fontSize:'42px', fontWeight:900, letterSpacing:'-0.04em', color:C.stone, lineHeight:1.1 }}>
            Tick<span style={{ color:C.accent }}>.</span>
          </h1>
          <p className="mt-2 text-[14px] md:text-[15px]" style={{ color:C.stoneMuted, wordBreak:'keep-all' }}>큰 일을 작은 조각으로.</p>

          {/* Microcopy banner — glass pill */}
          <div className="mt-5 inline-flex px-5 py-2.5 rounded-full glass" style={{ maxWidth:'100%' }}>
            <p
              className="text-[12px] md:text-[13px] font-medium leading-relaxed"
              style={{ color:C.accent, wordBreak:'keep-all', overflowWrap:'break-word' }}>
              {MICROCOPIES[microcopyIdx]}
            </p>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <select value={soundType} onChange={e => setSoundType(e.target.value as SoundType)}
              title="체크 완료 사운드 선택"
              style={{ fontSize:'11px', borderRadius:'10px', padding:'6px 8px', border:`1px solid ${C.border}`, backgroundColor:C.card, color:C.stoneMuted, outline:'none', cursor:'pointer' }}>
              {(Object.entries(SOUND_LABELS) as [SoundType,string][]).map(([k,v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button onClick={() => setMuted(m => !m)}
              className="w-8 h-8 rounded-lg flex items-center justify-center border cursor-pointer"
              style={{ borderColor:C.border, backgroundColor:C.card, color:muted?C.stoneSub:C.accent }}
              title={muted ? '🔊 소리 켜기' : '🔇 소리 끄기 (음소거)'}
              aria-label={muted?'소리 켜기':'소리 끄기'}>
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border" style={{ borderColor:C.border, backgroundColor:C.card }}>
              <span style={{ fontSize:'10px', color:C.stoneSub }}>🔉</span>
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                title={`볼륨 ${Math.round(volume * 100)}%`}
                aria-label="볼륨 조절"
                style={{ width:'48px', height:'3px', accentColor:C.accent, cursor:'pointer' }} />
            </div>
            <button onClick={() => setThemeMode('office')}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border cursor-pointer flex items-center gap-1"
              style={{ borderColor:C.border, backgroundColor:C.card, color:C.stoneMuted }}
              title="🌓 회사 위장 모드 전환 (Esc×2 = 긴급 대피)">
              🌓 회사 위장 모드
            </button>
          </div>
        </header>

        {/* Input section */}
        <section className={`mb-2 transition-opacity duration-300 ${appState==='loading'?'opacity-40 pointer-events-none':''}`}>
          <div className="rounded-3xl overflow-hidden glass-strong" style={{ border:'1px solid rgba(255,255,255,0.7)' }}>
            <div className="p-5">
              <textarea rows={3} value={mainTask} onChange={e => setMainTask(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); handleCrush() } }}
                placeholder="지금 압도적인 마음이 드는 일을 적어 보세요..."
                className="w-full resize-none text-[16px] leading-relaxed focus:outline-none"
                style={{ color:C.stone, backgroundColor:'transparent' }} />
            </div>

            {/* Quick preset buttons */}
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {QUICK_PRESETS.map(preset => (
                <button key={preset.value} onClick={() => handlePreset(preset.value)}
                  title={`"${preset.value}" 바로 분쇄하기`}
                  className="text-[12px] px-3.5 py-1.5 rounded-full border cursor-pointer transition-all duration-200"
                  style={{ borderColor:C.border, backgroundColor:'rgba(255,255,255,0.5)', color:C.stoneMuted }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent; e.currentTarget.style.backgroundColor=C.accentLight }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.stoneMuted; e.currentTarget.style.backgroundColor='rgba(255,255,255,0.5)' }}>
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="px-5 pb-5 border-t pt-4" style={{ borderColor:'rgba(0,0,0,0.04)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:C.stoneSub }}>쪼개기 강도</span>
                <span className="text-[11px] font-semibold" style={{ color:C.accent }}>{SLIDER_LABELS[granularity]}</span>
              </div>
              <input type="range" min={1} max={3} value={granularity} onChange={e => setGranularity(Number(e.target.value))} aria-label="쪼개기 강도" />
              <div className="flex justify-between mt-1.5 text-[10px]" style={{ color:C.stoneSub }}>
                <span>가볍게</span><span>보통</span><span>아주 잘게</span>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <p className="mt-3 text-center text-[11px] px-4 leading-relaxed" style={{ color:C.stoneSub }}>
            🔒 Tick.은 로그인이나 서버 저장을 하지 않습니다. 당신의 모든 할 일은 오직 현재 브라우저(localStorage)에만 안전하게 보관됩니다.
          </p>

          <button onClick={handleCrush} disabled={!mainTask.trim()||appState==='loading'}
            className="w-full mt-4 flex items-center justify-center gap-2.5 font-semibold text-[16px] py-[16px] rounded-2xl text-white cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor:C.accent, boxShadow:C.shadowAccent, fontFamily:'Outfit,system-ui' }}
            title="✂️ 분쇄하기 (Enter)"
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor=C.accentHover }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor=C.accent }}>
            <Scissors size={16} strokeWidth={2.5} />
            {appState==='loading' ? '잘게 쪼개는 중...' : appState==='result' ? '다시 분쇄하기' : '분쇄하기'}
          </button>
        </section>

        {/* Loading */}
        {appState==='loading' && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="relative w-10 h-10 mb-5">
              <div className="absolute inset-0 border-[3px] rounded-full" style={{ borderColor:C.accentLight }} />
              <div className="absolute inset-0 border-[3px] border-t-transparent rounded-full animate-spin-slow" style={{ borderColor:C.accent, borderTopColor:'transparent' }} />
            </div>
            <p className="text-[14px] animate-pulse-soft" style={{ color:C.stoneMuted }}>잘게 쪼개는 중이에요...</p>
          </div>
        )}

        {/* Fallback notice */}
        {appState==='result' && isFallback && (
          <div className="mb-3 px-4 py-3 rounded-2xl text-[12px] flex items-center gap-2 animate-fade-in"
            style={{ backgroundColor:'rgba(234,88,12,0.08)', color:'#C2410C', border:'1px solid rgba(234,88,12,0.18)' }}>
            <span>⚠️</span>
            <span>AI 연결 실패 — 기본 템플릿을 보여드립니다. 잠시 후 다시 분쇄해보세요.</span>
          </div>
        )}

        {/* Results */}
        {appState==='result' && phases.length > 0 && (
          <div className="animate-fade-in-up">
            {/* Toolbar row: backup buttons + copy */}
            <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button onClick={handleExport}
                  title="현재 작업을 JSON 파일로 백업"
                  className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border cursor-pointer transition-all duration-200"
                  style={{ borderColor:C.border, backgroundColor:C.card, color:C.stoneMuted }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.stoneMuted }}>
                  <Download size={12} />
                  <span>파일로 백업</span>
                </button>
                <button onClick={() => importInputRef.current?.click()}
                  title="이전 백업 파일(.json) 불러오기"
                  className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border cursor-pointer transition-all duration-200"
                  style={{ borderColor:C.border, backgroundColor:C.card, color:C.stoneMuted }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.stoneMuted }}>
                  <Upload size={12} />
                  <span>백업 불러오기</span>
                </button>
              </div>
              <button onClick={handleCopyMarkdown} title="📋 마크다운 복사"
                className="flex items-center gap-1.5 text-[12px] px-3.5 py-2 rounded-xl border cursor-pointer transition-all duration-200"
                style={{ borderColor:C.border, backgroundColor:C.card, color:copied?C.accent:C.stoneMuted }}>
                <Copy size={12} />
                {copied ? '복사됨!' : '마크다운 복사'}
              </button>
            </div>

            {/* Overall progress */}
            <div className="mb-8 rounded-3xl p-5 glass-strong" style={{ border:'1px solid rgba(255,255,255,0.7)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:C.stoneSub }}>진행률</p>
                  <p className="text-[32px] font-bold leading-none mt-1" style={{ color:C.accent, fontFamily:'Outfit,system-ui' }}>
                    {Math.round(progress)}<span className="text-[18px]">%</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold" style={{ color:C.stone }}>{completedCount}<span style={{ color:C.stoneMuted }}>/{totalCount}</span></p>
                  <p className="text-[11px] mt-1" style={{ color:C.stoneSub }}>완료</p>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden progress-spring-track" style={{ backgroundColor:C.borderLight }}>
                <div className="h-full rounded-full progress-spring" style={{ transform:`scaleX(${progress/100})`, backgroundColor:C.accent }} />
              </div>
              {progress>=100 && (
                <p className="mt-3 text-center text-[14px] font-semibold animate-fade-in" style={{ color:C.accent }}>모든 단계 완료 🎉</p>
              )}
            </div>

            {/* Phase cards — Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phases.map((phase, phaseIdx) => {
                const done    = phase.subTasks.filter(t=>t.completed).length
                const total   = phase.subTasks.length
                const pct     = total===0 ? 0 : done/total
                const allDone = done===total && total>0

                return (
                  <div key={phase.id} className="rounded-3xl overflow-hidden animate-scale-in glass-card"
                       style={{ animationDelay:`${phaseIdx*0.08}s`, animationFillMode:'both' }}>
                    <div className="relative px-5 pt-5 pb-3 overflow-hidden">
                      <span className="absolute select-none pointer-events-none" aria-hidden style={{ right:'-4px', top:'50%', transform:'translateY(-50%)', fontSize:'72px', fontWeight:900, lineHeight:1, color:C.accentMuted, fontFamily:'Outfit,system-ui' }}>
                        {phase.number}
                      </span>
                      <div className="relative flex items-center justify-between" style={{ zIndex:1 }}>
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl text-[11px] font-bold text-white" style={{ backgroundColor:C.accent }}>{phase.number}</span>
                          <h3 className="text-[15px] font-semibold" style={{ color:allDone?C.stoneSub:C.stone }}>{phase.title}</h3>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor:C.accentLight, color:C.accent }}>{done}/{total}</span>
                      </div>
                      <div className="relative mt-3 w-full h-[4px] rounded-full overflow-hidden progress-spring-track" style={{ backgroundColor:C.borderLight, zIndex:1 }}>
                        <div className="h-full rounded-full progress-spring" style={{ transform:`scaleX(${pct})`, backgroundColor:C.accent }} />
                      </div>
                    </div>

                    <div className="mx-5 h-px" style={{ backgroundColor:C.borderLight }} />

                    <div className="px-5 py-2">
                      {phase.subTasks.map(task => (
                        <div key={task.id} className="group flex items-center gap-3 py-[12px] border-b last:border-0" style={{ borderColor:C.borderLight }}>
                          <button onClick={e => handleToggle(phase.id, task.id, e)}
                            className="flex-shrink-0 w-[28px] h-[28px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none"
                            style={{ backgroundColor:task.completed?C.accent:'transparent', border:task.completed?`2.5px solid ${C.accent}`:'2.5px solid #E0DCD8' }}
                            onMouseEnter={e => { if (!task.completed) e.currentTarget.style.borderColor=C.accent }}
                            onMouseLeave={e => { if (!task.completed) e.currentTarget.style.borderColor='#E0DCD8' }}
                            title={task.completed?'완료 취소':'완료 체크'}
                            aria-label={task.completed?'완료 취소':'완료 체크'}>
                            {task.completed && <Check size={14} strokeWidth={2.5} className="text-white" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            {editingId===task.id ? (
                              <input ref={editInputRef} type="text" value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={e => { if (e.key==='Enter') handleSaveEdit(); if (e.key==='Escape') { setEditingId(null); setEditText('') } }}
                                placeholder="할 일을 입력하세요..."
                                className="w-full text-[14px] bg-transparent border-b focus:outline-none py-0.5"
                                style={{ color:C.stone, borderColor:C.accent }} />
                            ) : (
                              <span
                                className={`task-line-through text-[14px] leading-relaxed block transition-colors duration-300 ${task.completed?'done':''}`}
                                style={{ color:task.completed?C.stoneSub:C.stone }}
                                onDoubleClick={() => { setEditingId(task.id); setEditText(task.text) }}
                                title="더블클릭하여 편집">
                                {task.text || <span style={{ color:C.stoneSub }}>비어 있음</span>}
                              </span>
                            )}
                          </div>

                          <button onClick={() => handleDeleteTask(phase.id, task.id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-150"
                            style={{ color:'#D6D3D1' }}
                            onMouseEnter={e => { e.currentTarget.style.color='#EF4444'; e.currentTarget.style.backgroundColor='#FEF2F2' }}
                            onMouseLeave={e => { e.currentTarget.style.color='#D6D3D1'; e.currentTarget.style.backgroundColor='transparent' }}
                            aria-label="태스크 삭제" title="태스크 삭제">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 pb-4">
                      <button onClick={() => handleAddTask(phase.id)}
                        className="flex items-center gap-1.5 text-[12px] cursor-pointer transition-colors duration-150"
                        style={{ color:C.stoneSub }}
                        onMouseEnter={e => { e.currentTarget.style.color=C.accent }}
                        onMouseLeave={e => { e.currentTarget.style.color=C.stoneSub }}
                        title="이 Phase에 단계 추가">
                        <Plus size={14} /> 단계 추가
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-10 text-center">
              <button onClick={handleReset}
                className="text-[13px] underline underline-offset-4 cursor-pointer transition-colors duration-150"
                style={{ color:C.stoneSub, textDecorationColor:C.border }}
                onMouseEnter={e => { e.currentTarget.style.color=C.stoneMuted }}
                onMouseLeave={e => { e.currentTarget.style.color=C.stoneSub }}
                title="처음부터 새로 시작">새로 시작하기</button>
            </div>
          </div>
        )}

        {/* Backup restore in default state */}
        {appState==='default' && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => importInputRef.current?.click()}
              title="이전 백업 파일(.json) 불러오기"
              className="flex items-center gap-1.5 text-[12px] px-4 py-2 rounded-xl border cursor-pointer"
              style={{ borderColor:C.border, backgroundColor:C.card, color:C.stoneSub }}>
              <Upload size={12} /> 백업 불러오기
            </button>
          </div>
        )}

        {/* Donation footer */}
        <footer className="mt-16 animate-fade-in">
          <div className="rounded-3xl p-6 text-center glass-card" style={{ border:'1px solid rgba(255,255,255,0.5)' }}>
            <p className="text-[14px] leading-relaxed" style={{ color:C.stoneMuted }}>
              Tick.은 혼자 만들어가는 개인 프로젝트입니다.<br />
              서비스가 작은 도움이 되었다면 따뜻한 커피 한 잔으로 힘을 보태주세요.
            </p>
            <a href="https://ctee.kr/place/gavinkim" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-2xl text-[14px] font-semibold text-white"
              style={{ backgroundColor:C.accent, boxShadow:'0 2px 8px rgba(232,93,4,0.3)' }}>
              ☕ 커피 한 잔 보내기
            </a>
            <p className="mt-4 text-[11px]" style={{ color:C.stoneSub }}>Tick. · 2026 · Esc×2 = 긴급 대피</p>
          </div>
          <div className="mt-4 flex justify-center items-center gap-4">
            <button onClick={() => setShowFeedback(true)}
              className="text-[12px] cursor-pointer"
              style={{ color:C.stoneSub, background:'transparent', border:'none' }}
              onMouseEnter={e => { e.currentTarget.style.color=C.stoneMuted }}
              onMouseLeave={e => { e.currentTarget.style.color=C.stoneSub }}
              title="익명으로 의견을 보내주세요">
              💬 익명 건의함
            </button>
            <button
              onClick={() => { setThemeMode('office'); setTimeout(() => setShowCompanySettings(true), 80) }}
              className="text-[12px] cursor-pointer flex items-center gap-1"
              style={{ color:C.stoneSub, background:'transparent', border:'none' }}
              title="회사 위장 정보 설정"
              onMouseEnter={e => { e.currentTarget.style.color=C.stoneMuted }}
              onMouseLeave={e => { e.currentTarget.style.color=C.stoneSub }}>
              <Settings size={12} /> 위장 설정
            </button>
          </div>
        </footer>

      </div>
    </div>
  )
}
