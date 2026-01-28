# Pencatat Keuangan Klub Tennis

Aplikasi pencatat keuangan klub tennis dengan transparansi dan kemudahan akses.

## Fitur

### Dashboard (Pre-login)
- Tampilan dashboard tanpa perlu login (read-only)
- KPI Cards menampilkan:
  - Penerimaan bulan ini
  - Pengeluaran bulan ini
  - Net cashflow bulan ini
  - Saldo bulan ini (ending balance)
- Grafik tren 12 bulan terakhir:
  - Bar chart penerimaan vs pengeluaran
  - Line chart net cashflow
- CTA "Login untuk lihat detail transaksi"

### Riwayat Transaksi (Post-login)
- Daftar seluruh transaksi
- Filter tanggal, jenis, kategori
- Untuk Anggota: Read-only
- Untuk Pengurus: CRUD (Create, Read, Update, Delete)

### Fitur Transaksi
- Input transaksi dengan validasi
- Kategori: Iuran Anggota, Operasional, Asset, Lainnya
- Jenis: Penerimaan, Pengeluaran
- Nilai: Maksimal 9 digit, tanpa desimal
- Backdate: Rolling 90 hari dari hari ini
- Catatan: Opsional
- Soft delete: Transaksi tidak dihapus permanen

### Akses & Keamanan
- Login dengan email dan password
- Role-based access control:
  - **Anggota**: Read-only
  - **Pengurus**: Full CRUD
- Autentikasi dengan JWT token (httpOnly cookies)

## Teknologi

- **Frontend**: Next.js 16, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Prisma ORM dengan SQLite
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod
- **Icons**: Lucide React

## Getting Started

### Install Dependencies
```bash
bun install
```

### Setup Database
```bash
bun run db:push
```

### Seed Data (Optional)
```bash
bun run tsx prisma/seed.ts
```

### Run Development Server
```bash
bun run dev
```

Aplikasi akan berjalan di http://localhost:3000

## Akun Demo

Setelah menjalankan seed script, Anda dapat menggunakan akun berikut:

### Pengurus (Officer)
- Email: `budi@tennis.com`
- Password: `password123`
- Akses: Full CRUD

### Anggota (Member)
- Email: `dina@tennis.com`
- Password: `password123`
- Akses: Read-only

## API Routes

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction (Pengurus only)
- `GET /api/transactions/[id]` - Get single transaction
- `PUT /api/transactions/[id]` - Update transaction (Pengurus only)
- `DELETE /api/transactions/[id]` - Soft delete transaction (Pengurus only)

### Dashboard
- `GET /api/dashboard` - Get dashboard summary (public)

## Database Schema

### User
- `id`: Primary key
- `email`: Unique email
- `password`: Hashed password
- `name`: Display name

### Role
- `id`: Primary key
- `userId`: User ID (unique)
- `roleName`: "pengurus" or empty (member)

### Transaction
- `id`: Primary key
- `tanggalTransaksi`: Transaction date
- `jenis`: "penerimaan" or "pengeluaran"
- `nilai`: Transaction value (max 9 digits)
- `kategori`: "iuran anggota", "operasional", "asset", "lainnya"
- `catatan`: Optional notes
- `isDeleted`: Soft delete flag
- `createdAt`: Created timestamp
- `updatedAt`: Updated timestamp
- `createdBy`: Creator user ID (immutable)
- `updatedBy`: Last updater user ID

## Catatan

- Aplikasi menggunakan SQLite untuk kemudahan demo. Untuk production, dapat di-migrate ke PostgreSQL atau database lain yang didukung Prisma.
- Password di-hash menggunakan bcryptjs.
- Autentikasi menggunakan JWT token dengan httpOnly cookies untuk keamanan.
- Backdate validasi menggunakan server time (GMT+8).

## Future Enhancements (Out of Scope)

- Status iuran per anggota
- Integrasi pembayaran online (QRIS/e-wallet/VA)
- Multi-klub / multi-tenant
- Approval workflow dan audit trail lengkap
- Fitur restore untuk transaksi yang di-soft delete
- Export data ke Excel/PDF
- Notifikasi via email/SMS
