// Supabase Configuration
// Placeholders yang akan diganti otomatis oleh GitHub Actions saat deploy
// Untuk development local, ganti manual atau buat file .env.local
const SUPABASE_URL = 'https://xutuxgtvlshdadejpajv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dHV4Z3R2bHNoZGFkZWpwYWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1ODE5NzksImV4cCI6MjEwNDE1Nzk3OX0.nMOaUetyIRChPmoISGI-98hu2tGXcz3emv0ob9TsNDA';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);