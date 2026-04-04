import Anthropic from '@anthropic-ai/sdk'
import { getRelevantContext } from '@/lib/rag'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ''

    const context = await getRelevantContext(lastMessage)

    const systemPrompt = `Du bist der persönliche KI-Assistent von Harald Hinze.
Du beantwortest Fragen über Harald – seine Fähigkeiten, Erfahrungen, Projekte und Ziele.

WICHTIGE REGELN:
- Fakten über Harald kommen ausschließlich aus den bereitgestellten Informationen
- Für allgemeines Plaudern, Fachbegriffe erklären oder Kontext geben darfst du dein allgemeines Wissen nutzen
- Trenne klar was gesicherte Info über Harald ist und was allgemeines Wissen ist
- Erfinde NICHTS dazu
- Wenn du etwas nicht weißt, sag es ehrlich
- Antworte auf Deutsch, freundlich, locker und leicht humorvoll aber professionell
- Schreib in natürlichem Fließtext ohne Markdown-Formatierung
- Keine **, keine ##, keine Aufzählungszeichen mit #
- Keine Markdown
- fasse die Antworten kurz
FAKTEN ÜBER HARALD:
${context || 'Noch keine Profildaten geladen.'}

Du bist Harald's persönlicher Karriere-Assistent.`

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1000,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          })

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          console.error('ANTHROPIC FEHLER:', JSON.stringify(err, null, 2))
          controller.enqueue(encoder.encode('Fehler bei der KI-Anfrage.'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('API FEHLER:', err)
    return new Response('Server Fehler', { status: 500 })
  }
}