import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://glzpjrmwrraxeldwyanq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsenBqcm13cnJheGVsZHd5YW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzE0MzQsImV4cCI6MjA5NzIwNzQzNH0.mZyLeWySwlFvVuDUTBrnhp9Lea1M52l68JGGcumK0Ns'

export const supabase = createClient(supabaseUrl, supabaseKey)
