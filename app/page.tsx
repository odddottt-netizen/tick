'use client'

import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AppItem {
  id: string
  emoji: string
  name: string
  description: string
  tags: string[]
  href: string
  color: string
}

const APPS: AppItem[] = [
  {
    id: 'tick',
    emoji: '🎯',
    name: 'Tick.',
    description: '거대한 계획을 미세한 단위로 쪼개어 행동력을 유도하는 계층형 태스크 분쇄 서비스',
    tags: ['생산성', '목표달성'],
    href: '/tick',
    color: '#E85D04',
  },
  {
    id: 'terminal',
    emoji: '💻',
    name: 'Terminal Focus',
    description: '해커 터미널 테마의 뽀모도로 타이머. 집중 시간 동안 빌드 로그가 흘러가고, 완료 후 기계식 키보드 타격음을 즐겨보세요.',
    tags: ['집중', '뽀모도로'],
    href: '/terminal',
    color: '#D4A373',
  },
  {
    id: 'stardust',
    emoji: '🌌',
    name: 'Stardust Vent',
    description: '스트레스 텍스트를 물리 블록으로 쌓고, 우주 먼지로 소멸시키는 감정 분쇄기. Matter.js 물리 엔진 탑재.',
    tags: ['감정', '카타르시스'],
    href: '/stardust',
    color: '#8FA89A',
  },
  {
    id: 'tabslayer',
    emoji: '🗂️',
    name: 'Tab Slayer',
    description: '크롬 탭 과부하를 틴더 스타일 카드 스와이프 게임으로 해결하는 3단계 미니멀리즘 정리 도구.',
    tags: ['정리', '게임'],
    href: '/tabslayer',
    color: '#6B8778',
  },
  {
    id: 'meet',
    emoji: '📹',
    name: 'Meet Escape',
    description: '지루한 화상회의 중 딴짓하는 척 할 수 있는 Google Meet 클론. ESC 길게 누르면 보스 모드.',
    tags: ['회의', '생존'],
    href: '/meet',
    color: '#1a73e8',
  },
  {
    id: 'praise',
    emoji: '🎉',
    name: 'Praise Me',
    description: 'Slack 칭찬 채널 시뮬레이터. 메시지를 보내면 동료들이 쏟아지는 칭찬으로 응답해줍니다.',
    tags: ['칭찬', '힐링'],
    href: '/praise',
    color: '#007a5a',
  },
  {
    id: 'pettin',
    emoji: '🐕',
    name: "Pettin'",
    description: '은별이를 조심스럽게 쓰다듬어 보세요. 너무 빠르거나 멈추면 도망갑니다.',
    tags: ['힐링', '게임'],
    href: '/pettin',
    color: '#f43f5e',
  },
]

function FloatingBlob({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`fixed rounded-full pointer-events-none animate-float ${className || ''}`}
      style={{ filter: 'blur(80px)', opacity: 0.45, ...style }}
    />
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #F0EBE5 0%, #E8E2D9 50%, #E0D8D0 100%)' }}>
      {/* Floating background blobs */}
      <FloatingBlob
        className="w-[400px] h-[400px] -top-20 -left-40"
        style={{ background: 'radial-gradient(circle, rgba(232,93,4,0.18) 0%, transparent 70%)', animationDelay: '0s', animationDuration: '8s' }}
      />
      <FloatingBlob
        className="w-[320px] h-[320px] top-[30%] -right-32"
        style={{ background: 'radial-gradient(circle, rgba(143,168,154,0.2) 0%, transparent 70%)', animationDelay: '2s', animationDuration: '10s' }}
      />
      <FloatingBlob
        className="w-[280px] h-[280px] bottom-[20%] -left-24"
        style={{ background: 'radial-gradient(circle, rgba(212,163,115,0.15) 0%, transparent 70%)', animationDelay: '4s', animationDuration: '9s' }}
      />
      <FloatingBlob
        className="w-[360px] h-[360px] bottom-0 right-0"
        style={{ background: 'radial-gradient(circle, rgba(232,93,4,0.1) 0%, transparent 70%)', animationDelay: '1s', animationDuration: '7s' }}
      />

      {/* Subtle noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <div className="max-w-[960px] mx-auto px-6 py-12 md:py-20 relative z-10">

        {/* Header */}
        <header className="text-center mb-20 md:mb-28 animate-fade-in">
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8 md:mb-10 animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0.55) 100%)',
              backgroundSize: '200% 100%',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <Sparkles size={15} style={{ color: '#E85D04' }} className="animate-pulse-soft" />
            <span className="text-[13px] md:text-[14px] font-semibold" style={{ color: '#6B6560' }}>sunmul.app</span>
          </div>

          <h1
            className="leading-[1.1] mb-6 md:mb-8"
            style={{
              fontFamily: 'Outfit,system-ui',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#1E1B18',
            }}
          >
            당신의 일상을<br className="hidden sm:block" />
            <span
              style={{
                background: 'linear-gradient(135deg, #E85D04 0%, #F97316 50%, #FB923C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              다채롭게
            </span>{' '}
            만들어줄 선물들
          </h1>

          <p
            className="text-[16px] md:text-[19px] max-w-[420px] mx-auto leading-[1.7] md:leading-[1.8]"
            style={{ color: '#6B6560', wordBreak: 'keep-all' }}
          >
            매일매일을 더 특별하게 만드는<br className="sm:hidden" />
            작은 도구들을 모았습니다.
            <br className="hidden md:block" />
            지금 바로 골라서 사용해 보세요.
          </p>

          {/* Scroll indicator */}
          <div className="mt-10 md:mt-14 flex flex-col items-center gap-2 animate-fade-in-up">
            <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: '#9E9995' }}>Scroll</span>
            <div className="w-5 h-8 rounded-full border-2 flex items-start justify-center p-1.5" style={{ borderColor: '#C0BDB8' }}>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#E85D04', animation: 'float 2s ease-in-out infinite' }}
              />
            </div>
          </div>
        </header>

        {/* App Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {APPS.map((app, i) => (
            <a
              key={app.id}
              href={app.href}
              className="group relative rounded-3xl p-6 md:p-8 glass-card animate-scale-in overflow-hidden"
              style={{ animationDelay: `${i * 0.12}s`, animationFillMode: 'both' }}
            >
              {/* Gradient border glow on hover */}
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${app.color}20 0%, transparent 50%, ${app.color}10 100%)`,
                  padding: '1px',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5 md:mb-6">
                  <div
                    className="w-[56px] h-[56px] md:w-[64px] md:h-[64px] rounded-2xl flex items-center justify-center text-[28px] md:text-[32px] transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${app.color}12` }}
                  >
                    {app.emoji}
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <span className="text-[13px] md:text-[14px] font-semibold" style={{ color: app.color }}>앱 실행하기</span>
                    <ArrowRight size={18} style={{ color: app.color }} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>

                <h2 className="text-[22px] md:text-[24px] font-bold mb-2.5" style={{ fontFamily: 'Outfit,system-ui', color: '#1E1B18' }}>
                  {app.name}
                </h2>
                <p className="text-[14px] md:text-[15px] leading-[1.7] mb-6" style={{ color: '#6B6560', wordBreak: 'keep-all' }}>
                  {app.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {app.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-colors duration-200"
                      style={{ backgroundColor: `${app.color}12`, color: app.color }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </section>

        {/* Stats / Social proof section */}
        <section className="mt-16 md:mt-24 text-center animate-fade-in-up">
          <div className="rounded-3xl p-8 md:p-10 glass-strong inline-block max-w-[600px] w-full">
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              {[
                { value: '4+', label: '서비스' },
                { value: '0', label: '로그인 필요' },
                { value: '∞', label: '무료' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-[28px] md:text-[36px] font-bold" style={{ fontFamily: 'Outfit,system-ui', color: '#E85D04' }}>
                    {stat.value}
                  </p>
                  <p className="text-[12px] md:text-[13px] mt-1" style={{ color: '#6B6560' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 md:mt-24 text-center animate-fade-in">
          <div className="rounded-3xl p-8 md:p-10 glass-card inline-block max-w-[520px] w-full">
            <p className="text-[14px] md:text-[15px] leading-[1.8]" style={{ color: '#6B6560', wordBreak: 'keep-all' }}>
              sunmul.app은 일상을 더 풍요롭게 만드는<br className="hidden sm:block" />
              도구들을 큐레이션하는 플랫폼입니다.<br />
              새로운 앱이 계속 추가될 예정이에요.
            </p>
            <p className="mt-5 text-[12px] md:text-[13px]" style={{ color: '#9E9995' }}>
              sunmul.app · 2026
            </p>
          </div>
        </footer>

      </div>

      {/* Fixed scroll-to-top */}
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full glass-strong flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          aria-label="맨 위로"
        >
          <ChevronDown size={18} style={{ color: '#6B6560', transform: 'rotate(180deg)' }} />
        </button>
      )}
    </div>
  )
}
