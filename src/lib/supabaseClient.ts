import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null
let hasWarned = false

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!hasWarned) {
      console.error('⚠️ Missing Supabase environment variables!')
      console.error('Please create a .env.local file with:')
      console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
      hasWarned = true
    }
    
    // Check if we're in browser environment - don't crash the app
    if (typeof window !== 'undefined') {
      // Return a dummy client that will return errors on any operation
      // This prevents app crash but operations will fail gracefully
      return createClient('https://placeholder.supabase.co', 'placeholder-key')
    }
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  },
})

