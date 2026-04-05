import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getRelevantContext(query: string, thema?: string): Promise<string> {
  let q = supabase.from('documents').select('content')

  if (thema) {
    q = q.eq('thema', thema)
  }

  const { data, error } = await q.limit(5)

  if (error || !data || data.length === 0) {
    return ''
  }

  return data.map((d: { content: string }) => d.content).join('\n\n---\n\n')
}