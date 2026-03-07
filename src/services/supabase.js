import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR_SUPABASE") || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
    console.warn("Supabase credentials missing or set to placeholders. Please check your .env file.")
}

export const supabase = createClient(
    SUPABASE_URL || "https://sshtkpfxhwugaxpahrbg.supabase.co",
    SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzaHRrcGZ4aHd1Z2F4cGFocmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjAwMTksImV4cCI6MjA4ODQzNjAxOX0.uAc12sdCH2dEkeT4vxb839hs9SegNAPjEyigHLe_8Ss",
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
)