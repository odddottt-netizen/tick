import Anthropic from '@anthropic-ai/sdk'

const WINDOW_MS = 60_000
const MAX_REQ   = 5
const ipMap     = new Map<string, { count: number; reset: number }>()

export async function POST(req: Request) {
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[crush] ANTHROPIC_API_KEY not set')
    return Response.json({ error: 'API key not configured' }, { status: 503 })
  }

  const phaseCount = level === 1 ? 2 : level === 2 ? 3 : 4
  const taskCount  = level === 1 ? 3 : level === 2 ? 4 : 5

  let msg: Awaited<ReturnType<InstanceType<typeof Anthropic>['messages']['create']>>
  try {
    const client = new Anthropic({ apiKey })
    msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
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
    return Response.json({ error: 'Parse failed', raw }, { status: 502 })
  }
}
