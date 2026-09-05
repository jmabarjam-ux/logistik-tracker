-- Supabase Setup untuk Logistik Tracker
-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel logistik_data
CREATE TABLE logistik_data (
    id BIGSERIAL PRIMARY KEY,
    kode_logistik TEXT NOT NULL,
    nama_logistik TEXT NOT NULL,
    nopol_kendaraan TEXT NOT NULL,
    ukuran_ayam TEXT NOT NULL CHECK (ukuran_ayam IN (
        'Grade 1 (1.2-1.5kg)', 
        'Grade 2 (1.5-1.8kg)', 
        'Grade 3 (1.8-2kg)'
    )),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status_bongkar TEXT NOT NULL DEFAULT 'antri' CHECK (status_bongkar IN ('antri', 'bongkar', 'selesai'))
);

-- Migration aman untuk project yang sudah memiliki tabel logistik_data
ALTER TABLE logistik_data
    ADD COLUMN IF NOT EXISTS status_bongkar TEXT NOT NULL DEFAULT 'antri';

ALTER TABLE logistik_data
    DROP CONSTRAINT IF EXISTS logistik_data_status_bongkar_check;

ALTER TABLE logistik_data
    ADD CONSTRAINT logistik_data_status_bongkar_check
    CHECK (status_bongkar IN ('antri', 'bongkar', 'selesai'));

-- 2. Enable Row Level Security (RLS)
ALTER TABLE logistik_data ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated users can insert their own data
CREATE POLICY "Authenticated users can insert" ON logistik_data
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- 4. Policy: Authenticated users can read all data
CREATE POLICY "Authenticated users can read" ON logistik_data
    FOR SELECT TO authenticated
    USING (true);

-- Public monitor hanya bisa membaca data yang masih berada di antrean
CREATE POLICY "Public monitor can read queue" ON logistik_data
    FOR SELECT TO anon
    USING (status_bongkar IN ('antri', 'bongkar'));

-- 5. Policy: Users can update their own data (optional)
CREATE POLICY "Users can update own data" ON logistik_data
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- 6. Policy: Users can delete their own data (optional)
CREATE POLICY "Users can delete own data" ON logistik_data
    FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

-- 7. Enable Realtime untuk tabel ini
ALTER PUBLICATION supabase_realtime ADD TABLE logistik_data;

-- 8. Buat index untuk performa query
CREATE INDEX idx_logistik_data_created_at ON logistik_data(created_at DESC);
CREATE INDEX idx_logistik_data_created_by ON logistik_data(created_by);
CREATE INDEX idx_logistik_data_nama_logistik ON logistik_data(nama_logistik);
CREATE INDEX idx_logistik_data_status_bongkar_created_at ON logistik_data(status_bongkar, created_at);

-- 9. (Opsional) Enable RLS pada auth.users untuk keamanan tambahan
-- ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;