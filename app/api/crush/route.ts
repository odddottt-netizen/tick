import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const WINDOW_MS = 60_000
const MAX_REQ   = 5
const ipMap     = new Map<string, { count: number; reset: number }>()

export async function POST(req: Request) {
  // IP Rate Limit — 분당 5회
  const ip    = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  const now   = Date.now()
  const entry = ipMap.get(ip)
  if (!entry || now > entry.reset) {
    ipMap.set(ip, { count: 1, reset: now + WINDOW_MS })
  } else if (entry.count >= MAX_REQ) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  } else {
    entry.count++
  }

  // 입력 검증
  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { task, level } = body as { task: unknown; level: unknown }

  if (typeof task !== 'string' || task.trim().length === 0) {
    return Response.json({ error: 'Invalid task' }, { status: 400 })
  }
  if (task.length > 500) {
    return Response.json({ error: 'Task too long' }, { status: 400 })
  }
  if (typeof level !== 'number' || ![1, 2, 3].includes(level)) {
    return Response.json({ error: 'Invalid level' }, { status: 400 })
  }

  const phaseCount = level === 1 ? 2 : level === 2 ? 3 : 4
  const taskCount  = level === 1 ? 3 : level === 2 ? 4 : 5

  // ── 💰 API 비용 최소화 아키텍처 ────────────────────────────────────────────
  //
  // ① 프롬프트 캐싱 (Prompt Caching) — 최대 90% 할인
  //   시스템 프롬프트가 1024 토큰 이상일 때 캐싱 활성화.
  //   현재 시스템 프롬프트는 약 80 토큰으로 임계값 미달.
  //   Few-shot 예시나 상세 가이드 추가 시 아래 구조로 교체:
  //
  //   system: [
  //     {
  //       type: 'text',
  //       text: LONG_SYSTEM_PROMPT,              // 1024 토큰 이상이어야 캐싱 적용
  //       cache_control: { type: 'ephemeral' }  // 5분간 캐시 유지, 최대 90% 할인
  //     }
  //   ],
  //
  // ② 저렴한 모델 타겟팅
  //   Claude Haiku 4.5: 입력 $1/MTok, 출력 $5/MTok (Sonnet 4.6 대비 ~67% 절감)
  //   → model: 'claude-haiku-4-5' 로 교체하면 동일 품질 대비 비용 대폭 절감 가능.
  //   단순 JSON 분해 작업은 Haiku로도 충분히 가능. 품질 우선 시 Sonnet 유지.
  //
  // ③ 엄격한 출력 토큰 제한 (max_tokens 잠금장치)
  //   JSON 구조 기준 Phase 4개 × 태스크 5개 = 약 400~500 토큰.
  //   max_tokens: 600 으로 제한해 불필요한 미사여구 원천 차단.
  //   시스템 프롬프트에 "순수 JSON 외 출력 절대 금지" 명시가 핵심.
  //
  // ──────────────────────────────────────────────────────────────────────────

  let msg: Awaited<ReturnType<typeof client.messages.create>>
  try {
    msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `사용자의 할 일을 Phase ${phaseCount}개 × Sub-task ${taskCount}개로 분해.
각 Sub-task는 5분 안에 시작 가능한 구체적 행동. 압박 표현 금지.
순수 JSON만 반환: {"phases":[{"number":"01","title":"...","tasks":["..."]}]}`,
      messages: [{ role: 'user', content: task }],
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[crush] Anthropic error:', message)
    return Response.json({ error: 'Anthropic API failed', detail: message }, { status: 502 })
  }

  const raw  = (msg.content[0] as { text: string }).text
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return Response.json(JSON.parse(text))
  } catch {
    console.error('[crush] JSON parse failed, raw output:', raw)
    return Response.json({ error: 'Parse failed' }, { status: 502 })
  }
}
