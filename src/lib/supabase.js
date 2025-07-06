import { createClient } from '@supabase/supabase-js'

// Project credentials from connected Supabase project
const SUPABASE_URL = 'https://iprjfyzeklhzkyvgayum.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcmpmeXpla2xoemt5dmdheXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDc5NjAsImV4cCI6MjA2NzM4Mzk2MH0.Tuu170ztur_obEsA1UXFboqlvKtFIsxP63Rd0wkM6tk'

if(SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})