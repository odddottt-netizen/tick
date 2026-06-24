import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

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

  const phaseCount = level === 1 ? 2 : level === 2 ? 3 : 4
  const taskCount  = level === 1 ? 3 : level === 2 ? 4 : 5

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `사용자의 할 일을 Phase ${phaseCount}개 × Sub-task ${taskCount}개로 분해.
각 Sub-task는 5분 안에 시작 가능한 구체적 행동. 압박 표현 금지.
순수 JSON만 반환: {"phases":[{"number":"01","title":"...","tasks":["..."]}]}`,
      messages: [{ role: 'user', content: task }],
    })

    const enc = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(enc.encode(event.delta.text))
            }
          }
        } catch (e) {
          console.error('[crush] stream error:', e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[crush] Anthropic error:', message)
    return Response.json({ error: 'Anthropic API failed', detail: message }, { status: 502 })
  }
}
