// Supabase Configuration
// Placeholders yang akan diganti otomatis oleh GitHub Actions saat deploy
// Untuk development local, ganti manual atau buat file .env.local
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);