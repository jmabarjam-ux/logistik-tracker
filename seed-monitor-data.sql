-- Seed 10 data contoh untuk Monitor Bongkar
-- Jalankan sekali di Supabase SQL Editor setelah migration status_bongkar aktif.
-- Data ini sengaja dibuat tanpa created_by agar menjadi data display-only.

INSERT INTO logistik_data (
    kode_logistik,
    nama_logistik,
    nopol_kendaraan,
    ukuran_ayam,
    created_at,
    status_bongkar
)
VALUES
    ('TRK-001', 'Ekspedisi Ayam Jaya 01', 'B 1021 KQ', 'Grade 1 (1.2-1.5kg)', NOW() - INTERVAL '10 minutes', 'antri'),
    ('TRK-002', 'Ekspedisi Mitra Unggas 02', 'B 2384 RT', 'Grade 2 (1.5-1.8kg)', NOW() - INTERVAL '8 minutes', 'antri'),
    ('TRK-003', 'Ekspedisi Lancar Sentosa 03', 'D 4176 AM', 'Grade 3 (1.8-2kg)', NOW() - INTERVAL '6 minutes', 'antri'),
    ('TRK-004', 'Ekspedisi Prima Logistik 04', 'F 5290 JV', 'Grade 1 (1.2-1.5kg)', NOW() - INTERVAL '5 minutes', 'antri'),
    ('TRK-005', 'Ekspedisi Nusantara 05', 'E 6832 PL', 'Grade 2 (1.5-1.8kg)', NOW() - INTERVAL '4 minutes', 'antri'),
    ('TRK-006', 'Ekspedisi Sumber Rezeki 06', 'B 7418 HN', 'Grade 3 (1.8-2kg)', NOW() - INTERVAL '3 minutes', 'antri'),
    ('TRK-007', 'Ekspedisi Berkah Jaya 07', 'T 8064 KU', 'Grade 1 (1.2-1.5kg)', NOW() - INTERVAL '2 minutes', 'antri'),
    ('TRK-008', 'Ekspedisi Sentral Pangan 08', 'Z 9127 MD', 'Grade 2 (1.5-1.8kg)', NOW() - INTERVAL '1 minute', 'antri'),
    ('TRK-009', 'Ekspedisi Arta Mandiri 09', 'L 3456 QS', 'Grade 3 (1.8-2kg)', NOW(), 'antri'),
    ('TRK-010', 'Ekspedisi Tiga Putra 10', 'N 5678 VX', 'Grade 1 (1.2-1.5kg)', NOW(), 'antri');
