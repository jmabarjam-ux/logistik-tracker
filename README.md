# Logistik Tracker

Aplikasi sederhana untuk pencatatan data logistik ayam dengan **Supabase** sebagai backend dan **GitHub Pages** untuk hosting frontend.

## Fitur

- 🔐 **Authentication** - Login/Register dengan Supabase Auth (email/password)
- 📝 **Input Data** - Form input: Kode Logistik, Nama Logistik, No. Polisi, Ukuran Ayam (Grade 1-3)
- 📊 **Display Real-time** - Tabel data dengan update real-time via Supabase Realtime
- 📱 **Responsive** - Bekerja di desktop dan mobile
- 🚀 **Auto Deploy** - GitHub Actions deploy otomatis ke GitHub Pages

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (ES Modules)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan script dari `supabase-setup.sql`
3. Buka **Authentication** → **Providers** → Enable **Email**
4. Buka **Database** → **Replication** → Enable Realtime untuk tabel `logistik_data`
5. Copy **Project URL** dan **anon/public key** dari **Settings** → **API**

## Monitor Bongkar Publik

Halaman `monitor bongkar.html` tidak memerlukan login dan menampilkan dua truk terdepan dari antrean bongkar. Jalankan ulang bagian `supabase-setup.sql` agar kolom `status_bongkar` dan policy baca publik tersedia.

Status antrean dapat diubah oleh user login melalui halaman **Data Pengiriman**:

- `antri` - menunggu giliran
- `bongkar` - sedang dibongkar
- `selesai` - sudah selesai dan keluar dari antrean publik

Untuk mengisi 10 data contoh, jalankan script `seed-monitor-data.sql` sekali di Supabase SQL Editor.

## Konfigurasi Project

Edit file `js/supabase-client.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Akun Admin

Buat akun berikut di **Authentication → Users → Add user** pada Supabase Dashboard:

- Email: `admin@logistik-tracker.local`
- Password: `admin123`
- Aktifkan **Auto Confirm User** agar bisa langsung login.

Di halaman login, akun ini juga bisa digunakan dengan username `admin`. Ganti password bawaan setelah login pertama kali. Password tidak disimpan di source code aplikasi.

## Deploy ke GitHub Pages

1. Push repository ke GitHub
2. Buka **Settings** → **Pages**
3. Source: **GitHub Actions**
4. Tambahkan **Secrets** di **Settings** → **Secrets and variables** → **Actions**:
   - `SUPABASE_URL` - URL project Supabase
   - `SUPABASE_ANON_KEY` - Anon/public key Supabase
5. Push ke branch `main` akan trigger auto deploy

## Struktur Project

```
logistik-tracker/
├── index.html              # Login page
├── input.html              # Form input data
├── display.html            # Tabel data (real-time)
├── css/
│   └── style.css           # Stylesheet
├── js/
│   ├── supabase-client.js  # Supabase config
│   ├── auth.js             # Auth helpers
│   ├── router.js           # Auth guard
│   ├── input.js            # Form logic
│   └── display.js          # Table + realtime
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions deploy
├── supabase-setup.sql      # Database schema
└── README.md
```

## Alur Penggunaan

1. Buka website → Login/Register
2. Di halaman **Input Data** → Isi form → Simpan
3. Klik **Lihat Data** → Melihat tabel real-time
4. Data baru dari user lain akan muncul otomatis

## Database Schema

```sql
logistik_data
├── id (BIGSERIAL, PK)
├── kode_logistik (TEXT)
├── nama_logistik (TEXT)
├── nopol_kendaraan (TEXT)
├── ukuran_ayam (TEXT) -- Grade 1/2/3
├── created_by (UUID, FK → auth.users)
└── created_at (TIMESTAMPTZ)
```

## Row Level Security

- **INSERT**: Hanya user yang login, `created_by` harus = `auth.uid()`
- **SELECT**: Semua user login bisa baca semua data
- **UPDATE/DELETE** (opsional): Hanya pemilik data

## License

MIT