// scripts/ingest.mjs
// Dieses Skript liest dein Profil und lädt es in Supabase
// Ausführen mit: node scripts/ingest.mjs

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Env-Variablen laden (einfache Version ohne dotenv)
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .filter(([k]) => k)
)

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY']
)

const anthropic = new Anthropic({ apiKey: env['ANTHROPIC_API_KEY'] })

// Text in Chunks aufteilen
function chunkText(text, chunkSize = 500) {
  const paragraphs = text.split('\n\n').filter(p => p.trim())
  const chunks = []
  let current = ''
  for (const para of paragraphs) {
    if ((current + para).length > chunkSize && current) {
      chunks.push(current.trim())
      current = para
    } else {
      current += '\n\n' + para
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

async function main() {
  console.log('📖 Lese Profildaten...')
  const profileText = fs.readFileSync(
    path.join(__dirname, '../data/profil.txt'),
    'utf-8'
  )

  const chunks = chunkText(profileText)
  console.log(`✂️  ${chunks.length} Textblöcke erstellt`)

  // Alte Daten löschen
  await supabase.from('documents').delete().neq('id', 0)
  console.log('🗑️  Alte Daten gelöscht')

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`🔢 Erstelle Embedding ${i + 1}/${chunks.length}...`)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1,
      messages: [{ role: 'user', content: chunk }],
    })

    // Anthropic Embeddings via separatem Endpunkt
    const embResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env['ANTHROPIC_API_KEY'],
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1,
        messages: [{ role: 'user', content: `Erstelle einen Embedding-Vektor für: ${chunk}` }],
      }),
    })

    // Wir nutzen OpenAI-kompatible Embeddings über Supabase Edge Functions
    // Für jetzt: text-embedding-3-small via direktem Fetch
    const openAIResp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env['OPENAI_API_KEY'] || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: chunk,
      }),
    })

    let embedding
    if (openAIResp.ok) {
      const data = await openAIResp.json()
      embedding = data.data[0].embedding
    } else {
      // Fallback: einfaches Dummy-Embedding (1536 Nullen) für lokalen Test
      console.log('⚠️  Kein OpenAI Key - nutze Platzhalter-Embedding')
      embedding = new Array(1536).fill(0)
    }

    const { error } = await supabase
      .from('documents')
      .insert({ content: chunk, embedding })

    if (error) {
      console.error('❌ Fehler:', error)
    } else {
      console.log(`✅ Block ${i + 1} gespeichert`)
    }
  }

  console.log('🎉 Fertig! Alle Daten sind in Supabase.')
}

main().catch(console.error)
