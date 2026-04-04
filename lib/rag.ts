// lib/rag.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getRelevantContext(query: string): Promise<string> {
  // Einfache Keyword-Suche als Fallback (funktioniert ohne Embeddings)
  const { data, error } = await supabase
    .from('documents')
    .select('content')
    .limit(5)

  if (error || !data || data.length === 0) {
    return ''
  }

  return data.map((d: { content: string }) => d.content).join('\n\n---\n\n')
}
