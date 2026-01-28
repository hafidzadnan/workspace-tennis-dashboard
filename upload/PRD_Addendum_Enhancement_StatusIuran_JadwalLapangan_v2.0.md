# PRD Addendum (Enhancement) — Status Iuran Anggota & Jadwal Penggunaan Lapangan

**Aplikasi:** Pencatat Keuangan Klub Tennis  
**Referensi PRD utama:** `PRD_Pencatat_Keuangan_Klub_Tennis_v1.7_Supabase_RLS_Checklist.docx`  
**Versi Addendum:** 2.0 (Markdown)  
**Tanggal:** 28 Januari 2026  
**Teknologi (tetap):** React + Tailwind CSS, Supabase (PostgreSQL), RLS, audit via DB trigger  
**Akses:** Halaman *Status Iuran* & *Jadwal Lapangan* **wajib login** (Anggota **read-only**, Pengurus **CRUD**)  

---

## 1. Ringkasan Eksekutif
Addendum ini menambahkan dua modul baru pada aplikasi:
1) **Status Pembayaran Iuran Bulanan Anggota** (domain terpisah dari transaksi keuangan), dan  
2) **Jadwal Penggunaan Lapangan Tennis** (weekly recurring).

Kedua modul ditampilkan pada halaman tersendiri dan **hanya dapat diakses setelah login**. Anggota dapat melihat informasi (read-only), sedangkan Pengurus dapat mengelola data sesuai kewenangan.

---

## 2. Latar Belakang & Masalah
- Versi sebelumnya belum menyediakan **status iuran per anggota per bulan** karena modul transaksi keuangan tidak memodelkan pembayaran per anggota.
- Jadwal penggunaan lapangan masih informal, berpotensi menimbulkan kebingungan/konflik dan sulit dipantau anggota.
- Pengurus membutuhkan cara yang rapi, cepat, dan konsisten untuk mengelola status iuran dan jadwal, tanpa mengganggu modul keuangan yang sudah ada.

---

## 3. Tujuan Produk & KPI Sederhana
### 3.1 Tujuan
- Anggota dapat melihat status iuran (lunas/belum) untuk **tahun berjalan**.
- Anggota dapat melihat jadwal penggunaan lapangan berbasis **mingguan** (Senin–Minggu) dengan **3 slot** per hari.
- Pengurus dapat memperbarui status iuran dan jadwal dengan mudah, serta perubahan tercatat (audit) melalui `updated_by/updated_at`.

### 3.2 KPI (contoh)
- ≥ 80% anggota mengakses halaman **Status Iuran** minimal 1x/bulan.
- ≥ 80% anggota mengakses halaman **Jadwal Lapangan** minimal 1x/bulan.
- ≥ 95% perubahan status iuran & jadwal dilakukan di aplikasi (bukan manual di luar sistem).

---

## 4. Target Pengguna & Persona Singkat
- **Anggota:** ingin mengetahui status iuran dan jadwal lapangan.
- **Pengurus:** mengelola status iuran bulanan dan jadwal mingguan tanpa konflik.

---

## 5. Ruang Lingkup
### 5.1 In-Scope (Enhancement)
#### A) Status Pembayaran Iuran Anggota
- Halaman *Status Iuran* (login required).
- Menampilkan tabel:
  - **Baris:** anggota **aktif**.
  - **Kolom:** bulan **Jan–Des** untuk **tahun berjalan**.
  - **Nilai sel:** status **lunas/belum**.
- Pengurus dapat mengubah status per sel via dropdown (lunas/belum).
- Ledger iuran menyimpan `nilai_iuran` per anggota-periode.

#### B) Jadwal Penggunaan Lapangan
- Halaman *Jadwal Lapangan* (login required).
- Menampilkan tabel:
  - **Kolom:** Senin–Minggu.
  - **Baris:** slot waktu **Pagi/Sore/Malam**.
- Slot waktu (fixed):
  - **Pagi:** 06:00–08:00
  - **Sore:** 16:00–18:00
  - **Malam:** 19:00–21:00
- Isi sel jadwal:
  - `nama_pengguna`
  - `status`: `vacant/occupied/canceled`
  - `no_contact` (opsional)
- Pengurus dapat menambah/mengedit jadwal.
- **Hapus jadwal = set slot menjadi `vacant`** (bukan delete row).
- **Tidak boleh konflik:** 1 (hari, slot) hanya boleh 1 jadwal.

### 5.2 Out-of-Scope
- Jadwal berbasis tanggal spesifik (calendar booking) dan multi-event per slot.
- Rekonsiliasi otomatis antara ledger iuran dan transaksi keuangan.
- Pembayaran online & pencocokan otomatis iuran.
- Notifikasi otomatis (reminder) iuran/jadwal (future).

---

## 6. Deskripsi Fitur Utama (Detail)

### 6.1 Status Pembayaran Iuran Anggota
**Tujuan bisnis**
- Transparansi status pembayaran iuran per anggota.
- Alat kerja pengurus untuk pencatatan status iuran yang terstruktur.

**Aktor**
- Anggota (read-only)
- Pengurus (edit status)

**Skenario utama**
1. User login → buka halaman **Status Iuran**.
2. Sistem menampilkan tabel **tahun berjalan**: anggota aktif × Jan–Des.
3. Pengurus mengubah status pada sel tertentu via dropdown.
4. Sistem menyimpan perubahan dan menampilkan notifikasi sukses.

**Aturan bisnis penting**
- Periode default: **tahun berjalan (Jan–Des)**.
- Hanya anggota dengan `status_keanggotaan=aktif` yang ditampilkan.
- Status per sel: `lunas` atau `belum`.
- **Default tampilan = `belum`** jika record ledger untuk sel tersebut belum ada.
- Update dilakukan dengan **upsert** berdasarkan kunci unik `(member_id, year, month)`.
- Ledger menyimpan `nilai_iuran` (integer Rupiah, max 9 digit) per anggota-periode.
- Anggota tidak bisa mengubah status (tidak ada dropdown).
- Audit: `updated_by` dan `updated_at` terisi otomatis via **DB trigger**.

---

### 6.2 Jadwal Penggunaan Lapangan
**Tujuan bisnis**
- Menyediakan jadwal yang jelas untuk semua anggota.
- Mencegah konflik jadwal dengan aturan satu jadwal per (hari, slot).

**Aktor**
- Anggota (read-only)
- Pengurus (tambah/edit, hapus→vacant)

**Skenario utama**
1. User login → buka halaman **Jadwal Lapangan**.
2. Sistem menampilkan tabel mingguan: Senin–Minggu × Pagi/Sore/Malam.
3. Pengurus klik slot → isi/ubah data jadwal → simpan.
4. Pengurus melakukan “hapus” jadwal → sistem set status menjadi `vacant`.

**Aturan bisnis penting**
- Weekly recurring: Senin–Minggu.
- Slot waktu tetap:
  - Pagi 06:00–08:00
  - Sore 16:00–18:00
  - Malam 19:00–21:00
- Satu `(day_of_week, time_slot)` hanya boleh satu jadwal (**no conflict**), enforced via **unique constraint**.
- Field:
  - `nama_pengguna`
  - `status` ∈ {`vacant`, `occupied`, `canceled`}
  - `no_contact` opsional
- Validasi:
  - Jika `status=occupied` → `nama_pengguna` **wajib**, `no_contact` opsional.
  - Jika `status=vacant` → `nama_pengguna` dikosongkan; `no_contact` dikosongkan.
- “Hapus jadwal” = set `status=vacant` (slot kembali tersedia), bukan delete row.
- Audit: `updated_by` dan `updated_at` via DB trigger.

---

## 7. Alur Pengguna (User Flow)
### 7.1 Narasi
Setelah login, user dapat memilih halaman **Status Iuran** untuk melihat status iuran tahun berjalan atau memilih halaman **Jadwal Lapangan** untuk melihat jadwal mingguan. Anggota hanya melihat data (read-only). Pengurus dapat memperbarui status iuran per anggota-per-bulan dan mengelola jadwal per slot. Perubahan oleh pengurus langsung tersimpan dan dapat dilihat oleh anggota.

### 7.2 Step-by-step
1. Login → navigasi lengkap tampil: Dashboard, Riwayat, **Status Iuran**, **Jadwal**.
2. Buka Status Iuran → lihat tabel Jan–Des tahun berjalan.
3. (Pengurus) ubah sel via dropdown lunas/belum → simpan.
4. Buka Jadwal Lapangan → lihat Senin–Minggu × Pagi/Sore/Malam.
5. (Pengurus) klik slot → tambah/edit → simpan; atau “hapus” → set `vacant`.

---

## 8. Requirement Fungsional
### 8.1 User Stories
- Sebagai anggota, saya ingin melihat status iuran dalam tabel tahun berjalan agar transparansi jelas.
- Sebagai pengurus, saya ingin mengubah status iuran per anggota-per-bulan agar pencatatan rapi.
- Sebagai anggota, saya ingin melihat jadwal lapangan mingguan agar bisa merencanakan bermain.
- Sebagai pengurus, saya ingin menambah/mengedit jadwal pada slot tertentu agar jadwal akurat.
- Sebagai pengurus, saya ingin menghapus jadwal sehingga slot menjadi vacant agar tersedia kembali.

### 8.2 Acceptance Criteria (Testable)
**Status Iuran**
- Halaman Status Iuran hanya bisa diakses setelah login.
- Menampilkan anggota aktif saja, kolom Jan–Des tahun berjalan.
- Anggota: read-only tanpa dropdown.
- Pengurus: dropdown tersedia di sel; perubahan melakukan upsert & audit (`updated_by/updated_at`).
- Default status `belum` jika record belum ada.

**Jadwal Lapangan**
- Halaman Jadwal hanya bisa diakses setelah login.
- Menampilkan 7 hari × 3 slot sesuai jam yang ditetapkan.
- Anggota: read-only.
- Pengurus: dapat add/edit; “hapus” mengubah status menjadi `vacant` (bukan delete).
- Tidak boleh konflik: DB menolak duplikasi `(day_of_week, time_slot)`.

---

## 9. Requirement Non-Fungsional
- **Keamanan:** halaman Status Iuran & Jadwal wajib login; RLS mencegah anon mengakses tabel.
- **Performa:** tabel harus responsif; untuk anggota banyak, pertimbangkan pagination/virtualization (future).
- **Reliabilitas:** constraint unik mencegah konflik jadwal; update bersifat atomic.
- **Audit:** perubahan mencatat `updated_by/updated_at` via trigger.

---

## 10. Arahan UX/UI
- Tetap mengikuti estetika aplikasi utama: **Minimalis, Modern**, **Dark Mode**, dominan **Hijau–Hitam**, tombol **rounded**.

**Status Iuran**
- Sel `lunas` diberi aksen hijau; `belum` abu/merah gelap.
- Mobile: tabel bisa scroll horizontal; kolom nama anggota *sticky*.

**Jadwal**
- Status `vacant/occupied/canceled` ditandai chip warna.
- Mobile: disarankan mode “pilih hari” + list 3 slot agar tidak terlalu lebar.

---

## 11. Analytics & Logging (Opsional)
- `dues_page_view`
- `dues_status_update` (role, member_id, periode, new_status, nilai_iuran)
- `schedule_page_view`
- `schedule_upsert` (day, slot, status)
- `schedule_set_vacant` (day, slot)
- Logging error RLS/policy untuk troubleshooting.

---

## 12. Risiko, Asumsi, dan Batasan
- Risiko salah update status iuran (per-sel) → mitigasi: toast + (future) undo/bulk edit.
- Risiko kebingungan `canceled` vs `vacant` → mitigasi: definisi jelas; “hapus” selalu set `vacant`.
- Asumsi jumlah anggota masih wajar untuk tabel tahun berjalan.
- Batasan: jadwal weekly recurring dan 1 slot 1 jadwal.

---

## 13. Ide Pengembangan ke Depan (Future Enhancements)
- Filter/tahun untuk status iuran (lihat tahun lalu).
- Integrasi ledger iuran dengan transaksi (rekonsiliasi).
- Notifikasi pengingat iuran & perubahan jadwal.
- Jadwal berbasis tanggal spesifik, multi-lapangan.

---

## 14. Teknologi & Constraint Teknis
### 14.1 Frontend (React + Tailwind)
**Halaman baru**
- `DuesStatusPage`
- `CourtSchedulePage`

**Komponen (high-level)**
- Status Iuran: `DuesTable`, `DuesRow`, `DuesCell` (read-only vs dropdown), `YearHeader`.
- Jadwal: `ScheduleGrid` (desktop), `DaySelector` + `SlotList` (mobile), `ScheduleCell`, `ScheduleModal` (pengurus).

**State management (high-level)**
- MVP: local state + caching sederhana.
- Disarankan: React Query untuk fetch/cache + invalidasi setelah update.

### 14.2 Database Supabase (High-level)
**Tabel yang disarankan**
1) `members`
- `id`, `name`, `user_id/email` (opsional), `status_keanggotaan`, `joined_at`

2) `dues_status` (ledger iuran)
- `id`, `member_id`, `year`, `month`, `status`, `nilai_iuran`, `updated_at`, `updated_by`
- Unique: `(member_id, year, month)`

3) `court_schedule`
- `id`, `day_of_week`, `time_slot`, `user_name`, `status`, `contact` (opsional), `updated_at`, `updated_by`
- Unique: `(day_of_week, time_slot)`
- Hapus = set `status=vacant` + kosongkan `user_name/contact`

### 14.3 RLS & Audit (Ringkas)
- **Anon:** tidak ada akses ke `members/dues_status/court_schedule`.
- **Anggota (login):** SELECT saja (read-only).
- **Pengurus (login):** INSERT/UPDATE untuk `dues_status` dan `court_schedule`.
- Audit `updated_by/updated_at` via DB trigger (selaras PRD v1.7).

---

## Lampiran — Checklist Implementasi (Ringkas)
### A) Status Iuran
- [ ] Tabel `members` hanya menampilkan `aktif` di UI.
- [ ] Default sel = `belum` jika record tidak ada.
- [ ] Upsert (member, year, month) + `nilai_iuran` tersimpan.
- [ ] Dropdown hanya untuk pengurus.
- [ ] Trigger audit mengisi `updated_by/updated_at`.

### B) Jadwal Lapangan
- [ ] Enforce unique `(day_of_week, time_slot)`.
- [ ] “Hapus” = set `vacant` + kosongkan `user_name/contact`.
- [ ] `contact` opsional.
- [ ] Validasi: `occupied` butuh `user_name`.
- [ ] Trigger audit mengisi `updated_by/updated_at`.
