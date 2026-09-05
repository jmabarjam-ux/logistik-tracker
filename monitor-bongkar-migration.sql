-- Jalankan file ini saja untuk mengaktifkan Monitor Bongkar
-- Aman untuk tabel logistik_data yang sudah ada.

ALTER TABLE public.logistik_data
    ADD COLUMN IF NOT EXISTS status_bongkar TEXT;

UPDATE public.logistik_data
SET status_bongkar = 'antri'
WHERE status_bongkar IS NULL;

ALTER TABLE public.logistik_data
    ALTER COLUMN status_bongkar SET DEFAULT 'antri',
    ALTER COLUMN status_bongkar SET NOT NULL;

ALTER TABLE public.logistik_data
    DROP CONSTRAINT IF EXISTS logistik_data_status_bongkar_check;

ALTER TABLE public.logistik_data
    ADD CONSTRAINT logistik_data_status_bongkar_check
    CHECK (status_bongkar IN ('antri', 'bongkar', 'selesai'));

ALTER TABLE public.logistik_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public monitor can read queue" ON public.logistik_data;

CREATE POLICY "Public monitor can read queue"
    ON public.logistik_data
    FOR SELECT
    TO anon
    USING (status_bongkar IN ('antri', 'bongkar'));

CREATE INDEX IF NOT EXISTS idx_logistik_data_status_bongkar_created_at
    ON public.logistik_data(status_bongkar, created_at);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'logistik_data'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.logistik_data;
    END IF;
END
$$;
