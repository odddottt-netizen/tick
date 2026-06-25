'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, MoreVertical,
  PhoneOff, MessageSquare, Users, X, ChevronRight, BarChart3,
  TrendingUp, Users as UsersIcon, Target, Clock, Shield, FileText
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types & Data                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

interface Participant {
  id: string
  name: string
  initials: string
  color: string
  isScreenSharing?: boolean
}

const PARTICIPANTS: Participant[] = [
  { id: 'self', name: 'You', initials: 'YO', color: '#8ab4f8' },
  { id: 'p1', name: 'Alex Chen', initials: 'AC', color: '#81c995' },
  { id: 'p2', name: 'Sarah Kim', initials: 'SK', color: '#f28b82' },
  { id: 'p3', name: 'Mike Johnson', initials: 'MJ', color: '#fbbc04' },
  { id: 'p4', name: 'Emily Park', initials: 'EP', color: '#c58af9' },
]

const TRANSCRIPTIONS: string[] = [
  "Alright, let's dive into the Q3 revenue numbers.",
  "As you can see, our top-line growth is up fourteen percent year-over-year.",
  "The marketing team has outperformed every KPI we set in January.",
  "Customer acquisition cost dropped by nearly twelve percent, which is huge.",
  "We need to double down on the enterprise segment before Q4.",
  "The product roadmap is on track for the November launch.",
  "I want everyone to review the funnel metrics by EOD.",
  "Our churn rate is stabilizing, but we can still improve retention.",
  "The board is asking for a detailed risk assessment next week.",
  "Let's schedule a follow-up with the design team on Thursday.",
  "We should A/B test the new onboarding flow immediately.",
  "The partnership with the cloud vendor is looking very promising.",
  "I noticed a slight dip in engagement on the mobile app.",
  "Can someone pull the latest cohort analysis for the APAC region?",
  "We need to allocate more budget to performance marketing.",
  "The engineering sprint is ahead of schedule, which is rare.",
  "Let's not forget about the compliance audit in two weeks.",
  "I spoke with the CFO, and she's optimistic about the runway.",
  "The competitor launched a similar feature, so we need to differentiate.",
  "Great work everyone, let's keep this momentum going into Q4.",
  "Before we wrap, does anyone have blockers for next week?",
  "Remember, our all-hands is moved to Tuesday morning.",
  "I'll send the deck to everyone right after this call.",
  "Thanks for joining, and have a productive rest of your day.",
]

const TIPS: string[] = [
  "누군가 올 때: 고개를 끄덕이며 'Hmm, I see...'라고 중얼거리세요",
  "펜으로 노트를 적는 흉내를 내보세요",
  "눈썹을 살짝 찌푸리며 심각한 표정",
  "가끔 화면을 응시하며 'That's interesting'라고 중얼거리세요",
  "팔짱을 끼고 고개를 살짝 기울이세요",
  "키보드를 두드리는 소리를 내며 집중하는 척하세요",
]

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Slide Components (SVG / Canvas)                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function SlideRevenue() {
  const bars = [45, 62, 78, 55, 88, 72, 95, 67, 82, 58]
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
  return (
    <div className="w-full h-full bg-[#1a1a2e] flex flex-col items-center justify-center p-6 meet-slide-enter">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[#8ab4f8]" />
        <span className="text-lg font-semibold text-white">Q3 Revenue Dashboard</span>
      </div>
      <svg viewBox="0 0 400 200" className="w-full max-w-md">
        <rect x="30" y="10" width="340" height="160" fill="rgba(255,255,255,0.03)" rx="8" />
        {bars.map((h, i) => (
          <rect
            key={i}
            x={40 + i * 34}
            y={170 - h}
            width="24"
            height={h}
            fill={i >= 7 ? '#81c995' : '#8ab4f8'}
            rx="3"
            className="meet-bar-grow"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
        {months.map((m, i) => (
          <text key={m} x={52 + i * 34} y="195" fill="#9aa0a6" fontSize="10" textAnchor="middle">{m}</text>
        ))}
        <text x="200" y="30" fill="#e8eaed" fontSize="12" textAnchor="middle" fontWeight="600">Monthly Revenue ($K)</text>
      </svg>
      <div className="flex gap-6 mt-4 text-sm text-[#9aa0a6]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8ab4f8]" />Previous</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#81c995]" />Current</span>
      </div>
    </div>
  )
}

function SlideRoadmap() {
  const steps = [
    { label: 'Q1 Research', done: true },
    { label: 'Q2 MVP', done: true },
    { label: 'Q3 Beta', done: true },
    { label: 'Q4 Launch', done: false },
    { label: 'Q1 Scale', done: false },
  ]
  return (
    <div className="w-full h-full bg-[#0f172a] flex flex-col items-center justify-center p-6 meet-slide-enter">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-[#fbbc04]" />
        <span className="text-lg font-semibold text-white">Marketing Roadmap 2024</span>
      </div>
      <div className="w-full max-w-md space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              s.done ? 'bg-[#81c995] text-[#1a1a2e]' : 'bg-[#3c4043] text-[#9aa0a6]'
            }`}>
              {s.done ? '✓' : i + 1}
            </div>
            <div className={`flex-1 h-10 rounded-lg flex items-center px-4 text-sm font-medium ${
              s.done ? 'bg-[#81c995]/20 text-[#81c995]' : 'bg-[#3c4043]/50 text-[#9aa0a6]'
            }`}>
              {s.label}
            </div>
            {s.done && <ChevronRight className="w-4 h-4 text-[#81c995]" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideFunnel() {
  const stages = [
    { label: 'Awareness', value: 10000, color: '#8ab4f8' },
    { label: 'Interest', value: 6500, color: '#81c995' },
    { label: 'Consideration', value: 3200, color: '#fbbc04' },
    { label: 'Conversion', value: 840, color: '#f28b82' },
  ]
  const max = 10000
  return (
    <div className="w-full h-full bg-[#1a1a2e] flex flex-col items-center justify-center p-6 meet-slide-enter">
      <div className="flex items-center gap-2 mb-4">
        <UsersIcon className="w-5 h-5 text-[#81c995]" />
        <span className="text-lg font-semibold text-white">User Acquisition Funnel</span>
      </div>
      <svg viewBox="0 0 300 200" className="w-full max-w-sm">
        {stages.map((s, i) => {
          const w = (s.value / max) * 260
          const x = (300 - w) / 2
          const y = 20 + i * 45
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height="36" fill={s.color} rx="6" opacity="0.85" className="meet-bar-grow" style={{ animationDelay: `${i * 0.15}s` }} />
              <text x={x + 8} y={y + 22} fill="#1a1a2e" fontSize="11" fontWeight="600">{s.label}</text>
              <text x={x + w - 8} y={y + 22} fill="#1a1a2e" fontSize="10" textAnchor="end" fontWeight="500">{s.value.toLocaleString()}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function SlideTimeline() {
  const events = [
    { month: 'Sep', label: 'Design Review', color: '#8ab4f8' },
    { month: 'Oct', label: 'Beta Release', color: '#81c995' },
    { month: 'Nov', label: 'Product Launch', color: '#fbbc04' },
    { month: 'Dec', label: 'User Testing', color: '#f28b82' },
  ]
  return (
    <div className="w-full h-full bg-[#0f172a] flex flex-col items-center justify-center p-6 meet-slide-enter">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-[#f28b82]" />
        <span className="text-lg font-semibold text-white">Product Launch Timeline</span>
      </div>
      <div className="w-full max-w-md flex items-center justify-between px-4">
        {events.map((e, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: e.color, color: '#1a1a2e' }}>
              {e.month}
            </div>
            <div className="h-8 w-0.5 bg-[#3c4043] my-2" />
            <span className="text-xs text-[#9aa0a6] text-center max-w-[80px]">{e.label}</span>
            {i < events.length - 1 && (
              <div className="absolute" style={{ left: `${25 + i * 25}%`, top: '50%', width: '20%', height: '2px', background: '#3c4043' }} />
            )}
          </div>
        ))}
      </div>
      <div className="w-full max-w-md h-1 bg-[#3c4043] rounded-full mt-2 relative">
        <div className="absolute left-0 top-0 h-full w-1/2 bg-[#8ab4f8] rounded-full" />
      </div>
    </div>
  )
}

function SlideCompetitor() {
  const competitors = [
    { name: 'Us', share: 42, color: '#8ab4f8' },
    { name: 'Comp A', share: 28, color: '#f28b82' },
    { name: 'Comp B', share: 18, color: '#fbbc04' },
    { name: 'Comp C', share: 12, color: '#81c995' },
  ]
  return (
    <div className="w-full h-full bg-[#1a1a2e] flex flex-col items-center justify-center p-6 meet-slide-enter">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#c58af9]" />
        <span className="text-lg font-semibold text-white">Competitor Analysis</span>
      </div>
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {competitors.reduce((acc, c, i) => {
          const startAngle = acc.angle
          const angle = (c.share / 100) * 360
          const endAngle = startAngle + angle
          const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180)
          const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180)
          const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180)
          const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180)
          const largeArc = angle > 180 ? 1 : 0
          const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`
          acc.paths.push(
            <path key={i} d={path} fill={c.color} opacity="0.9" stroke="#1a1a2e" strokeWidth="2" className="meet-bar-grow" style={{ animationDelay: `${i * 0.1}s` }} />
          )
          acc.angle = endAngle
          return acc
        }, { paths: [] as React.ReactNode[], angle: 0 }).paths}
        <circle cx="100" cy="100" r="45" fill="#1a1a2e" />
        <text x="100" y="95" fill="white" fontSize="14" textAnchor="middle" fontWeight="700">Market</text>
        <text x="100" y="112" fill="#9aa0a6" fontSize="10" textAnchor="middle">Share</text>
      </svg>
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        {competitors.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-[#9aa0a6]">
            <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
            <span>{c.name}: {c.share}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideGrowth() {
  const points = [30, 45, 42, 58, 65, 72, 68, 85, 92, 88, 95, 105]
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  const path = points.map((p, i) => `${20 + i * 30},${160 - p}`).join(' ')
  return (
    <div className="w-full h-full bg-[#0f172a] flex flex-col items-center justify-center p-6 meet-slide-enter">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#81c995]" />
        <span className="text-lg font-semibold text-white">Annual Growth Projection</span>
      </div>
      <svg viewBox="0 0 360 180" className="w-full max-w-md">
        <rect x="10" y="10" width="340" height="140" fill="rgba(255,255,255,0.03)" rx="8" />
        <polyline
          points={path}
          fill="none"
          stroke="#81c995"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="meet-line-draw"
        />
        {points.map((p, i) => (
          <circle key={i} cx={20 + i * 30} cy={160 - p} r="3" fill="#81c995" className="meet-bar-grow" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
        {months.map((m, i) => (
          <text key={m} x={20 + i * 30} y="175" fill="#9aa0a6" fontSize="9" textAnchor="middle">{m}</text>
        ))}
        <text x="180" y="30" fill="#e8eaed" fontSize="12" textAnchor="middle" fontWeight="600">Revenue Growth (%)</text>
      </svg>
      <div className="mt-3 text-sm text-[#81c995] font-medium">+14% YoY Projected</div>
    </div>
  )
}

const SLIDES = [SlideRevenue, SlideRoadmap, SlideFunnel, SlideTimeline, SlideCompetitor, SlideGrowth]

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Privacy Policy Content (Boss Mode)                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

const PRIVACY_CONTENT = `
개인정보 처리방침

제1조 (목적)
주식회사 선물랩(이하 "회사")는 정보주체의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제2조 (개인정보의 처리 범위)
회사는 법령의 규정과 정보주체의 동의에 의해서만 개인정보를 수집·보유·처리합니다. 수집되는 개인정보 항목은 서비스 유형에 따라 상이할 수 있으며, 최소한의 범위 내에서 적법하게 처리됩니다.

제3조 (개인정보의 처리 및 보유기간)
① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
  1. 회원 가입 및 관리: 회원 탈퇴 시까지
  2. 재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료 시까지
  3. 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우: 해당 수사·조사 종료 시까지

제4조 (정보주체의 권리·의무 및 행사방법)
① 정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.
② 제1항에 따른 권리 행사는 개인정보 보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.
③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 정정 또는 삭제를 완료할 때까지 해당 개인정보를 이용하거나 제공하지 않습니다.

제5조 (개인정보의 파기)
① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
② 개인정보의 파기 절차 및 방법은 다음과 같습니다.
  1. 파기절차: 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.
  2. 파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하며, 종이 문서는 분쇄하거나 소각합니다.

제6조 (개인정보의 안전성 확보조치)
회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
  1. 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육
  2. 기술적 조치: 개인정보처리시스템의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화
  3. 물리적 조치: 전산실, 자료보관실 등의 접근통제

제7조 (개인정보 보호책임자)
회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

제8조 (권익침해 구제방법)
정보주체는 개인정보 침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁조정이나 상담 등을 신청할 수 있습니다.

제9조 (개인정보 처리방침의 변경)
이 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다. 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 수 있으며, 변경 시에는 시행일 7일 전부터 공지사항을 통하여 고지합니다.
`


/* ─────────────────────────────────────────────────────────────────────────── */
/*  Mobile Mail Camouflage                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function MobileMailCamouflage({ onBack }: { onBack: () => void }) {
  const mails = [
    { from: '김대표', subject: '이번 주 전략 미팅 일정 확인 요청', preview: '안녕하세요, 이번 주 목요일 오후 2시 미팅 일정 괜찮으신가요?', time: '10:32', unread: true },
    { from: '박팀장', subject: '[공유] 2분기 판매 실적 보고서', preview: '첨부된 파일 확인 부탁드립니다. 주요 수치 요약은 본문 참조해주세요.', time: '09:15', unread: true },
    { from: '네이버 스마트스토어', subject: '광고 효율 주간 리포트 도착', preview: '지난 7일 클릭률 3.2%, 전환율 1.8%로 집계되었습니다.', time: '어제', unread: false },
    { from: '카페24', subject: '6월 정기 점검 안내 (06/28 02:00~04:00)', preview: '서비스 안정화를 위한 정기 점검이 예정되어 있습니다.', time: '어제', unread: false },
    { from: '이디자이너', subject: 'FW 시즌 룩북 시안 2차 전달드립니다', preview: '수정 사항 반영했습니다. 검토 후 의견 주시면 바로 수정하겠습니다.', time: '월요일', unread: false },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex flex-col min-h-[100dvh]" style={{ background: '#f2f2f7', fontFamily: "'Noto Sans KR', system-ui, sans-serif" }} onDoubleClick={onBack}>
      <div style={{ background: '#f2f2f7', padding: '52px 16px 8px', borderBottom: '1px solid #d1d1d6' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#1c1c1e', marginBottom: '4px' }}>받은편지함</div>
        <div style={{ fontSize: '13px', color: '#8e8e93' }}>{mails.filter(m => m.unread).length}개 읽지 않음</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mails.map((m, i) => (
          <div key={i} style={{ background: '#ffffff', borderBottom: '1px solid #e5e5ea', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.unread ? '#007aff' : 'transparent', marginTop: '6px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '15px', fontWeight: m.unread ? 600 : 400, color: '#1c1c1e' }}>{m.from}</span>
                <span style={{ fontSize: '13px', color: '#8e8e93', flexShrink: 0 }}>{m.time}</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: m.unread ? 600 : 400, color: '#1c1c1e', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</div>
              <div style={{ fontSize: '13px', color: '#8e8e93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.preview}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', background: '#f2f2f7', borderTop: '1px solid #d1d1d6', textAlign: 'center' }}>
        <span style={{ fontSize: '11px', color: '#c7c7cc' }}>더블탭하여 돌아가기</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function MeetEscapePage() {
  /* ── State ─────────────────────────────────────────────────────────────── */
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenShare, setScreenShare] = useState(false)
  const [raiseHand, setRaiseHand] = useState(false)
  const [rightPanel, setRightPanel] = useState<'none' | 'people' | 'chat'>('people')
  const [activeSlide, setActiveSlide] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [currentTip, setCurrentTip] = useState(0)
  const [bossMode, setBossMode] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [camError, setCamError] = useState(false)
  const [escPressed, setEscPressed] = useState(false)
  const [chatMessages, setChatMessages] = useState<{name: string; text: string; time: string}[]>([
    { name: 'Alex Chen', text: 'Can everyone see the Q3 deck?', time: '10:02 AM' },
    { name: 'Sarah Kim', text: 'Yes, the revenue chart looks solid.', time: '10:03 AM' },
    { name: 'Mike Johnson', text: 'Great progress on the CAC reduction.', time: '10:04 AM' },
    { name: 'Emily Park', text: 'I\'ll follow up with the design team.', time: '10:05 AM' },
  ])

  /* ── Refs ──────────────────────────────────────────────────────────────── */
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const escTimerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptionRef = useRef({ sentenceIndex: 0, charIndex: 0, isDeleting: false })
  const chatInputRef = useRef<HTMLInputElement>(null)

  /* ── Webcam ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!camOn) {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop())
        setVideoStream(null)
      }
      return
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        setVideoStream(stream)
        setCamError(false)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch(() => {
        setCamError(true)
        setVideoStream(null)
      })
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop())
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn])

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream
    }
  }, [videoStream])

  /* ── Fake Voice (Web Audio API) ────────────────────────────────────────── */
  useEffect(() => {
    const initAudio = () => {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      noiseNodeRef.current = noise

      // Lowpass filter (radio-like cutoff)
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800
      filter.Q.value = 0.5

      // Slight distortion / waveshaper
      const shaper = ctx.createWaveShaper()
      const curve = new Float32Array(256)
      for (let i = 0; i < 256; i++) {
        const x = (i - 128) / 128
        curve[i] = Math.tanh(x * 2.5)
      }
      shaper.curve = curve
      shaper.oversample = '4x'

      const gain = ctx.createGain()
      gain.gain.value = 0.04

      noise.connect(filter)
      filter.connect(shaper)
      shaper.connect(gain)
      gain.connect(ctx.destination)
      noise.start()
    }

    // Start after user interaction to comply with autoplay policy
    const handleInteraction = () => {
      if (!audioCtxRef.current) {
        initAudio()
      }
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      if (noiseNodeRef.current) {
        try { noiseNodeRef.current.stop() } catch {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [])

  /* ── Slide Rotation (every 60s) ────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % SLIDES.length)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  /* ── Transcription Typing Effect ─────────────────────────────────────────── */
  useEffect(() => {
    const typeInterval = setInterval(() => {
      const state = transcriptionRef.current
      const sentences = TRANSCRIPTIONS

      if (state.isDeleting) {
        if (state.charIndex > 0) {
          state.charIndex -= 1
          setTranscription(sentences[state.sentenceIndex].slice(0, state.charIndex))
        } else {
          state.isDeleting = false
          state.sentenceIndex = (state.sentenceIndex + 1) % sentences.length
        }
      } else {
        const sentence = sentences[state.sentenceIndex]
        if (state.charIndex < sentence.length) {
          state.charIndex += 1
          setTranscription(sentence.slice(0, state.charIndex))
        } else {
          // Pause before deleting
          setTimeout(() => {
            state.isDeleting = true
          }, 2000)
        }
      }
    }, 55)
    return () => clearInterval(typeInterval)
  }, [])

  /* ── Gesture Tip Rotation ──────────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % TIPS.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  /* ── ESC Key Boss Mode ─────────────────────────────────────────────────── */
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !bossMode) {
        setEscPressed(true)
        if (escTimerRef.current) clearTimeout(escTimerRef.current)
        escTimerRef.current = setTimeout(() => {
          setBossMode(true)
        }, 800)
      }
    }
    const handleUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEscPressed(false)
        if (escTimerRef.current) {
          clearTimeout(escTimerRef.current)
          escTimerRef.current = null
        }
      }
    }
    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [bossMode])

  /* ── isDesktop detection ─────────────────────────────────────────────────── */
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ── Chat Auto-scroll ────────────────────────────────────────────────────── */
  const chatEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  /* ── Handlers ────────────────────────────────────────────────────────────── */
  const sendChat = useCallback(() => {
    const text = chatInputRef.current?.value.trim()
    if (!text) return
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setChatMessages(prev => [...prev, { name: 'You', text, time }])
    if (chatInputRef.current) chatInputRef.current.value = ''
  }, [])

  const handleChatKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendChat()
  }, [sendChat])

  const ActiveSlideComponent = SLIDES[activeSlide]

  /* ── Render ──────────────────────────────────────────────────────────────── */
  if (bossMode) {
    if (!isDesktop) return <MobileMailCamouflage onBack={() => setBossMode(false)} />
    return (
      <div className="meet-escape-page meet-boss-fade">
        <div className="meet-boss-content w-full h-full overflow-auto p-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#1a73e8]" />
            <h1>개인정보 처리방침</h1>
          </div>
          {PRIVACY_CONTENT.trim().split('\n').map((line, i) => {
            if (line.startsWith('제') && line.includes('조')) {
              return <h2 key={i}>{line}</h2>
            }
            if (line.startsWith('  ') || line.startsWith('\t')) {
              return <li key={i}>{line.trim()}</li>
            }
            if (line.trim() === '') {
              return <div key={i} className="h-3" />
            }
            return <p key={i}>{line}</p>
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="meet-escape-page">
      {/* Top bar info */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-[#e8eaed]">Weekly Business Review</div>
          <div className="px-2 py-0.5 rounded bg-[#ea4335]/20 text-[#ea4335] text-xs font-medium">LIVE</div>
        </div>
        <div className="text-xs text-[#9aa0a6]">10:06 AM · meet.google.com/abc-defg-hij</div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-10 pb-20 px-4 gap-4 overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-3 w-full max-w-4xl aspect-video">
            {/* Self video */}
            <div className="meet-video-tile relative bg-[#3c4043] rounded-xl overflow-hidden flex items-center justify-center">
              {camOn && !camError && videoStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : camError ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-[#5f6368] flex items-center justify-center text-2xl font-bold text-white">
                    YO
                  </div>
                  <span className="text-sm text-[#9aa0a6]">카메라 로딩 중...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-[#8ab4f8] flex items-center justify-center text-2xl font-bold text-[#202124]">
                    YO
                  </div>
                  <span className="text-sm text-[#9aa0a6]">카메라가 꺼져 있습니다</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/50 text-xs text-white">
                You {micOn ? '' : '(muted)'}
              </div>
              {!micOn && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#ea4335] flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Other participants */}
            {PARTICIPANTS.slice(1, 4).map((p) => (
              <div
                key={p.id}
                className="meet-video-tile relative bg-[#3c4043] rounded-xl overflow-hidden flex items-center justify-center meet-breathe"
                style={{ animationDelay: `${Math.random() * 2}s` }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: p.color, color: '#202124' }}
                >
                  {p.initials}
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/50 text-xs text-white">
                  {p.name}
                </div>
              </div>
            ))}

            {/* Screen share tile (replaces 4th participant) */}
            <div className="meet-video-tile relative bg-[#1a1a2e] rounded-xl overflow-hidden col-span-2 sm:col-span-1">
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#8ab4f8]/20 text-xs text-[#8ab4f8] font-medium flex items-center gap-1">
                <MonitorUp className="w-3 h-3" />
                Presenting
              </div>
              <div className="w-full h-full">
                <ActiveSlideComponent />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        {rightPanel !== 'none' && (
          <div className="w-80 bg-[#2d2e31] rounded-xl hidden md:flex flex-col overflow-hidden border border-[#5f6368]/30">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#5f6368]/30">
              <div className="flex gap-4">
                <button
                  onClick={() => setRightPanel('people')}
                  className={`text-sm font-medium flex items-center gap-1.5 ${rightPanel === 'people' ? 'text-[#8ab4f8]' : 'text-[#9aa0a6]'}`}
                >
                  <Users className="w-4 h-4" />
                  People (5)
                </button>
                <button
                  onClick={() => setRightPanel('chat')}
                  className={`text-sm font-medium flex items-center gap-1.5 ${rightPanel === 'chat' ? 'text-[#8ab4f8]' : 'text-[#9aa0a6]'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
              </div>
              <button onClick={() => setRightPanel('none')} className="text-[#9aa0a6] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {rightPanel === 'people' ? (
              <div className="flex-1 overflow-y-auto meet-scroll p-3 space-y-2">
                {PARTICIPANTS.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#3c4043]/50 transition-colors">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: p.color, color: '#202124' }}
                    >
                      {p.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#e8eaed] truncate">
                        {p.name} {p.id === 'self' && '(You)'}
                      </div>
                    </div>
                    {p.id === 'self' && !micOn && (
                      <MicOff className="w-4 h-4 text-[#ea4335]" />
                    )}
                  </div>
                ))}
                <div className="pt-2 border-t border-[#5f6368]/30">
                  <div className="text-xs text-[#9aa0a6] px-2 py-1">In call</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto meet-scroll p-3 space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#8ab4f8]">{msg.name}</span>
                        <span className="text-xs text-[#5f6368]">{msg.time}</span>
                      </div>
                      <p className="text-sm text-[#e8eaed]">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-[#5f6368]/30 flex gap-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    placeholder="Send a message..."
                    className="flex-1 bg-[#3c4043] border border-[#5f6368]/50 rounded-lg px-3 py-2 text-sm text-[#e8eaed] placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8]"
                    onKeyDown={handleChatKey}
                  />
                  <button
                    onClick={sendChat}
                    className="px-3 py-2 rounded-lg bg-[#8ab4f8] text-[#202124] text-sm font-medium hover:bg-[#aecbfa] transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#202124] border-t border-[#3c4043]/50 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-2 text-sm text-[#9aa0a6]">
          <div className="w-2 h-2 rounded-full bg-[#81c995]" />
          10:06 AM
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`meet-control-btn w-11 h-11 rounded-full flex items-center justify-center ${
              micOn ? 'bg-[#3c4043] text-white' : 'bg-[#ea4335] text-white'
            }`}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setCamOn(!camOn)}
            className={`meet-control-btn w-11 h-11 rounded-full flex items-center justify-center ${
              camOn ? 'bg-[#3c4043] text-white' : 'bg-[#ea4335] text-white'
            }`}
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setScreenShare(!screenShare)}
            className={`meet-control-btn w-11 h-11 rounded-full flex items-center justify-center ${
              screenShare ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] text-white'
            }`}
            title="Present now"
          >
            <MonitorUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRaiseHand(!raiseHand)}
            className={`meet-control-btn w-11 h-11 rounded-full flex items-center justify-center ${
              raiseHand ? 'bg-[#fbbc04] text-[#202124]' : 'bg-[#3c4043] text-white'
            }`}
            title="Raise hand"
          >
            <Hand className="w-5 h-5" />
          </button>
          <button className="meet-control-btn w-11 h-11 rounded-full bg-[#3c4043] text-white flex items-center justify-center" title="More options">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRightPanel(rightPanel === 'people' ? 'none' : 'people')}
            className={`meet-control-btn w-11 h-11 rounded-full flex items-center justify-center ${
              rightPanel === 'people' ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] text-white'
            }`}
            title="Show everyone"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRightPanel(rightPanel === 'chat' ? 'none' : 'chat')}
            className={`meet-control-btn w-11 h-11 rounded-full flex items-center justify-center ${
              rightPanel === 'chat' ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] text-white'
            }`}
            title="Chat with everyone"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="meet-end-call w-12 h-12 rounded-full flex items-center justify-center" title="Leave call">
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Live Transcription Overlay */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 max-w-2xl w-full px-4 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
          <div className="text-xs text-[#8ab4f8] font-medium mb-1 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ea4335] meet-speaking-pulse" />
            [Live Transcription]
          </div>
          <div className="text-sm text-[#e8eaed] meet-typing-cursor">
            {transcription || 'Waiting for speech...'}
          </div>
        </div>
      </div>

      {/* Gesture Tip Overlay (corner, semi-transparent) */}
      <div className="absolute top-16 right-4 z-10 max-w-xs pointer-events-none">
        <div key={currentTip} className="meet-tip-fade bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 border border-[#8ab4f8]/20">
          <div className="text-xs text-[#8ab4f8] font-medium mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Gesture Tip
          </div>
          <p className="text-xs text-[#e8eaed] leading-relaxed">{TIPS[currentTip]}</p>
        </div>
      </div>

      {/* ESC Indicator */}
      {escPressed && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-8 py-6 text-center border border-[#ea4335]/30">
            <div className="text-2xl mb-2">🛡️</div>
            <div className="text-sm text-[#e8eaed] font-medium">Hold ESC to activate Boss Mode...</div>
            <div className="w-32 h-1 bg-[#3c4043] rounded-full mt-3 mx-auto overflow-hidden">
              <div className="h-full bg-[#ea4335] rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
