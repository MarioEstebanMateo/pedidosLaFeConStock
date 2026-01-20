import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qoqtjiybyxnuwwugzcyt.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase

