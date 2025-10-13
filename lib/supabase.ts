import { Config } from "@/config"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = Config.SupabaseUrl as string
const supabaseAnonKey = Config.SupabaseAnonymousKey as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
