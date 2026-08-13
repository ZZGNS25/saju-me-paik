import { createClient } from '@supabase/supabase-js'

// Vite: VITE_ 로 시작하는 환경변수만 프론트에서 사용 가능
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 없습니다. .env 파일을 확인하고 개발 서버를 다시 실행하세요.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

/** Supabase/JWT 오류를 사용자용 한글로 바꿉니다. */
export function formatSupabaseError(error, fallback = '요청에 실패했습니다.') {
  const message = String(error?.message || error || '')
  const lower = message.toLowerCase()

  if (
    lower.includes('jwt issued at future') ||
    lower.includes('token used before issued') ||
    lower.includes('issued at future')
  ) {
    return '컴퓨터 시간이 실제보다 느립니다. Windows 시간을 인터넷과 동기화한 뒤, 로그아웃 후 다시 로그인해 주세요.'
  }

  if (lower.includes('jwt expired') || lower.includes('token is expired')) {
    return '로그인 세션이 만료되었습니다. 다시 로그인해 주세요. (컴퓨터 시간도 확인해 보세요)'
  }

  return message || fallback
}
