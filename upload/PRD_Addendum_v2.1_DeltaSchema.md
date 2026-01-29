# PRD Addendum v2.1 — Status Iuran, Jadwal Lapangan, & Manajemen Anggota/Akun (Supabase Auth)

**Aplikasi:** Pencatat Keuangan Klub Tennis  
**Referensi PRD utama:** `PRD_Pencatat_Keuangan_Klub_Tennis_v1.7_Supabase_RLS_Checklist.docx`  
**Versi Addendum:** 2.1 (Markdown)  
**Tanggal:** 29 Januari 2026  
**Teknologi (tetap):** React + Tailwind CSS, Supabase (PostgreSQL), RLS, audit via DB trigger  
**Akses:** Halaman *Status Iuran*, *Jadwal Lapangan*, dan *Anggota & Akses* **wajib login** (Anggota **read-only**, Pengurus **CRUD**)  

> Addendum v2.1 ini memperluas Addendum v2.0 dengan: **(1)** filter tahun pada Status Iuran, **(2)** kolom **Besaran Iuran** (default per anggota) setelah Nama Anggota, **(3)** halaman & form **Anggota & Akses** (buat anggota + buat akun login), serta **(4)** rencana migrasi `public.User` → `auth.users` (Supabase Auth) + `public.profiles`.

---

## 1. Ringkasan Eksekutif
Addendum ini menambahkan dan menyempurnakan tiga area fungsional:
1) **Status Pembayaran Iuran Bulanan Anggota** (domain terpisah dari transaksi keuangan),
2) **Jadwal Penggunaan Lapangan Tennis** (weekly recurring),
3) **Manajemen Anggota & Akses** (tambah anggota + buat akun login + set role).

Aplikasi tetap mempertahankan modul keuangan (Dashboard/Transaksi/Riwayat) dari PRD v1.7. Modul tambahan di addendum ini berfokus pada transparansi status iuran, penjadwalan lapangan, dan proses onboarding anggota agar seluruh anggota aktif memiliki akun.

---

## 2. Latar Belakang & Masalah
- Versi sebelumnya belum menyediakan status iuran per anggota-per-bulan karena transaksi keuangan tidak memodelkan pembayaran per individu.
- Jadwal lapangan masih informal sehingga rawan bentrok dan sulit dipantau.
- Diperlukan modul khusus untuk menambah anggota dan memastikan semua anggota aktif memiliki akun aplikasi dengan password yang ditetapkan pengurus.

---

## 3. Tujuan Produk & KPI Sederhana
### 3.1 Tujuan
- Anggota dapat melihat status iuran `lunas/belum` untuk tahun berjalan dan tahun lain via filter tahun.
- Anggota dapat melihat jadwal lapangan mingguan (Senin–Minggu) dengan slot waktu tetap.
- Pengurus dapat:
  - Mengubah status iuran per anggota-per-bulan,
  - Mengelola jadwal per slot tanpa konflik,
  - Menambah anggota sekaligus membuat akun login (email wajib) dengan password awal yang bisa langsung dipakai.

### 3.2 KPI (contoh)
- ≥ 80% anggota mengakses halaman Status Iuran minimal 1x/bulan.
- ≥ 80% anggota mengakses halaman Jadwal minimal 1x/bulan.
- 100% anggota **aktif** memiliki akun login terhubung (`Member.userId` terisi).

---

## 4. Target Pengguna & Persona Singkat
- **Anggota:** melihat status iuran dan jadwal.
- **Pengurus:** mencatat status iuran, mengelola jadwal, dan mengelola anggota & akses.

---

## 5. Ruang Lingkup
### 5.1 In-Scope (Enhancement v2.1)
#### A) Status Iuran
- Halaman *Status Iuran* (login required).
- Tabel: anggota aktif (baris) vs Jan–Des (kolom).
- **Kolom tambahan:** `Besaran Iuran` setelah `Nama Anggota`.
- **Filter Tahun:** dropdown tahun (default tahun berjalan).
- Pengurus dapat ubah status per sel via dropdown `lunas/belum`.

#### B) Jadwal Lapangan
- Halaman *Jadwal Lapangan* (login required).
- Tabel: Senin–Minggu (kolom) vs slot (baris) dengan jam:
  - Pagi 06:00–08:00
  - Sore 16:00–18:00
  - Malam 19:00–21:00
- Field sel: `userName`, `status (vacant/occupied/canceled)`, `contact` (opsional).
- **No conflict:** 1 (hari, slot) = 1 jadwal.
- **Hapus jadwal = set vacant** (bukan delete row).

#### C) Anggota & Akses
- Halaman *Anggota & Akses* (khusus pengurus, login required).
- Form *Tambah Anggota*:
  - `name` (wajib)
  - `email` (wajib)
  - `default_iuran` (wajib)
  - `status_keanggotaan` default `aktif`
- Pengurus membuat akun login untuk anggota (email+password) dan password awal langsung dapat dipakai.
- Anggota diperbolehkan mengganti password melalui fitur standar Supabase Auth.
- Pengurus dapat mengatur role user (pengurus/anggota) melalui tabel role.

### 5.2 Out-of-Scope
- Integrasi otomatis ledger iuran ↔ transaksi keuangan (rekonsiliasi).
- Jadwal berbasis tanggal spesifik dan multi-event per slot.
- Pembayaran online.

---

## 6. Deskripsi Fitur Utama

### 6.1 Status Pembayaran Iuran
**Tujuan bisnis**
- Transparansi status iuran per anggota.
- Memudahkan pengurus mencatat status iuran.

**Aktor**
- Anggota: read-only
- Pengurus: update status

**Skenario utama**
1. User login → buka *Status Iuran*.
2. Default tahun = tahun berjalan; bisa ganti tahun via dropdown.
3. Anggota melihat tabel; pengurus dapat mengubah status per sel.

**Aturan bisnis penting**
- Tampilkan hanya anggota `statusKeanggotaan=aktif`.
- **Besaran iuran** di kolom kedua adalah default per anggota (hanya pengurus yang bisa mengubah).
- Status sel `lunas/belum` berasal dari ledger `DuesStatus`.
- Default tampilan status = `belum` jika record belum ada untuk (member, year, month).
- Update status dilakukan sebagai **upsert** dengan kunci unik `(memberId, year, month)`.
- `DuesStatus.nilaiIuran` menyimpan nominal iuran per periode (untuk kasus override), tetapi tampilan kolom Besaran Iuran tetap memakai default per anggota.

---

### 6.2 Jadwal Penggunaan Lapangan
**Tujuan bisnis**
- Jadwal jelas untuk anggota.
- Mencegah konflik dengan aturan 1 slot 1 jadwal.

**Aktor**
- Anggota: read-only
- Pengurus: tambah/edit/hapus→vacant

**Aturan bisnis penting**
- Weekly recurring: Senin–Minggu.
- Slot waktu fixed (pagi/sore/malam) sesuai jam yang ditetapkan.
- Status: `vacant/occupied/canceled`.
- Jika `occupied` → `userName` wajib, `contact` opsional.
- Jika `vacant` → kosongkan `userName` dan `contact`.
- **Hapus jadwal = set status vacant** (bukan delete).
- Unique constraint `(dayOfWeek, timeSlot)` untuk mencegah konflik.

---

### 6.3 Anggota & Akses
**Tujuan bisnis**
- Semua anggota aktif memiliki akun.
- Pengurus bisa onboarding anggota secara terkontrol.

**Aturan bisnis penting**
- Email wajib dan unik.
- Semua anggota aktif harus memiliki akun (`Member.userId` terisi).
- Password awal dapat langsung digunakan; anggota boleh ganti password lewat fitur Supabase Auth.
- Pembuatan user + set password harus dilakukan via **server/Edge Function** (Admin API), bukan langsung dari browser.

---

## 7. Alur Pengguna (User Flow)
1. Login → navigasi menampilkan: Dashboard, Riwayat, Status Iuran, Jadwal. (Pengurus juga melihat Anggota & Akses).
2. Status Iuran → pilih tahun → lihat tabel & (pengurus) update status.
3. Jadwal → (pengurus) update slot atau set vacant.
4. Anggota & Akses (pengurus) → tambah anggota + buat akun.

---

## 8. Requirement Fungsional (Acceptance Criteria)
**Status Iuran**
- Year dropdown tersedia; default tahun berjalan.
- Kolom Besaran Iuran tampil setelah Nama Anggota dan menampilkan default iuran per anggota.
- Hanya anggota aktif yang tampil.
- Anggota read-only; pengurus dapat dropdown update status.

**Jadwal**
- Grid 7 hari × 3 slot.
- No conflict (enforced by unique constraint).
- Hapus jadwal = set vacant.

**Anggota & Akses**
- Form tambah anggota mewajibkan email.
- Setelah create akun, `Member.userId` terisi.
- Password awal langsung bisa digunakan; anggota dapat ganti password.

---

## 9. Teknologi & Constraint Teknis (Supabase)
- Autentikasi menggunakan Supabase Auth `auth.users`.
- Data profil aplikasi disimpan di `public.profiles` (`profiles.name`).
- RLS wajib untuk tabel aplikasi; audit `updated_by/updated_at` via trigger.

---

## 10. Lampiran — Migration Plan: `public.User` → `auth.users`
### 10.1 Konsep
- `auth.users` adalah sumber autentikasi.
- `public.profiles` menyimpan data aplikasi seperti nama.
- `Member.userId` dan `Role.userId` harus mengarah ke `auth.users.id`.

### 10.2 Tahapan Migrasi
1) Siapkan `public.profiles (id references auth.users(id), name)` + RLS.
2) Buat Edge Function `create_user_with_password` menggunakan Admin API.
3) Migrasi user existing: create di `auth.users`, isi `profiles`, relink FK.
4) Cutover login ke Supabase Auth.
5) Bekukan lalu hapus `public.User` setelah stabil.

---

## 15. Delta Schema & Constraint Wajib (untuk implementasi v2.1)
Bagian ini merangkum **perubahan minimal** (delta) terhadap skema Supabase saat ini agar fitur v2.1 berjalan **konsisten, aman, dan tidak ambigu**.

> **Prinsip:** constraint di level database untuk mencegah duplikasi/konflik (defense-in-depth), terutama karena akses data dilakukan langsung dari frontend dan bergantung pada RLS.

### 15.1 Delta — Tabel `Member`
**Kebutuhan v2.1:** kolom UI **Besaran Iuran** = **default iuran per anggota**.
- Tambahkan kolom `defaultIuran` (INTEGER NOT NULL, Rupiah, max 9 digit).
- Perketat `email`:
  - `email` **NOT NULL** (karena wajib saat tambah anggota).
  - `email` **UNIQUE** (mencegah duplikasi anggota/akun).
- Konsistensi “semua anggota aktif punya akun”:
  - `userId` sebaiknya **NOT NULL** untuk `statusKeanggotaan='aktif'`.
  - Bisa ditegakkan via aturan aplikasi atau CHECK constraint.

### 15.2 Delta — Tabel `DuesStatus`
**Kebutuhan v2.1:** upsert status iuran per anggota-per-bulan tanpa duplikasi.
- Tambahkan UNIQUE constraint: `UNIQUE (memberId, year, month)`.
- Tambahkan CHECK:
  - `status IN ('lunas','belum')`
  - `month BETWEEN 1 AND 12`
  - `nilaiIuran >= 0 AND nilaiIuran <= 999999999`

### 15.3 Delta — Tabel `CourtSchedule`
**Kebutuhan v2.1:** no conflict + slot/timeSlot konsisten.
- Tambahkan UNIQUE constraint: `UNIQUE (dayOfWeek, timeSlot)`.
- Tambahkan CHECK:
  - `dayOfWeek BETWEEN 1 AND 7`
  - `timeSlot IN ('pagi','sore','malam')`
  - `status IN ('vacant','occupied','canceled')`
- Aturan hapus jadwal:
  - UPDATE `status='vacant'`, set `userName=NULL`, `contact=NULL`.
  - (Opsional) trigger untuk auto-null saat status=vacant.

### 15.4 Tabel Baru (Wajib) — `public.profiles`
**Kebutuhan v2.1:** simpan nama user aplikasi di `public.profiles.name`.
- Buat tabel `profiles`:
  - `id uuid primary key references auth.users(id) on delete cascade`
  - `name text not null`
- Diisi saat provisioning akun via Edge Function atau trigger after insert pada `auth.users`.

### 15.5 Perapihan Relasi User/Role (Rekomendasi kuat)
- `Member.userId` dan `Role.userId` sebaiknya menunjuk ke `auth.users.id` (UUID).
- Saat create akun:
  - set `Member.userId = auth_user_id`
  - set `Role.userId = auth_user_id`
  - insert/update `profiles (id=auth_user_id, name=Member.name)`

### 15.6 Index yang Direkomendasikan
- `DuesStatus(year, month)` untuk query per tahun.
- `Member(statusKeanggotaan)` untuk filter anggota aktif.
- `CourtSchedule(dayOfWeek, timeSlot)` (biasanya sudah terbantu oleh UNIQUE).

### 15.7 Audit Trigger
- `updatedBy` dan `updatedAt` untuk `DuesStatus` dan `CourtSchedule` diisi otomatis pada setiap UPDATE.

