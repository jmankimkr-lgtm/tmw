import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // 빌드 시 GitHub Secrets, 로컬은 frontend/.env.local 에 설정
  console.error(
    'Supabase 환경변수가 없습니다. VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 설정하세요.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
