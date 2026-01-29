# PRD Addendum v2.1 Migration Guide

## Prerequisites

- Backup database sebelum memulai
- Pastikan semua member sudah memiliki email yang unik
- Siapkan Supabase SQL Editor

## Step 1: Execute Master Migration

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy isi file `EXECUTE_MASTER_MIGRATION.sql`
3. Paste dan jalankan di SQL Editor
4. Perhatikan output verification di bagian bawah

## Step 2: Verify Migration Results

Setelah eksekusi, pastikan output verification menunjukkan:
- `mapped_users` > 0
- `auth_users` = `mapped_users`
- `profiles` = `mapped_users`
- `members_linked` sesuai jumlah member dengan akun
- `roles_linked` sesuai jumlah user dengan role

## Step 3: Enable Supabase Auth in Application

1. Tambahkan environment variable:
   ```env
   USE_SUPABASE_AUTH=true
   ```

2. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Restart development server:
   ```bash
   npm run dev
   ```

## Step 4: Test Login

1. Login dengan kredensial yang ada (password sama seperti sebelumnya)
2. Verifikasi dapat mengakses halaman yang memerlukan autentikasi
3. Verifikasi role pengurus bisa akses halaman "Anggota & Akses"

## Step 5: Cleanup (OPSIONAL - Setelah Konfirmasi Semua Berjalan)

Setelah dipastikan semua berfungsi dengan baik, jalankan cleanup script:

```sql
DROP TABLE IF EXISTS public._user_migration_map;
ALTER TABLE public."Member" DROP COLUMN IF EXISTS "userId";
ALTER TABLE public."Role" DROP COLUMN IF EXISTS "userId";
DROP TABLE IF EXISTS public."User";
```

## Rollback

Jika terjadi masalah, restore database dari backup.

## Files Modified

- `prisma/schema.prisma` - Added Profile model, updated relations
- `src/lib/auth.ts` - Dual auth support (legacy + Supabase)
- `src/lib/supabase.ts` - Server client factory
- `src/app/actions/dues.ts` - Added defaultIuran
- `src/components/DuesTable.tsx` - Added Besaran Iuran column
- `src/app/actions/schedule.ts` - Lowercase timeSlot
- `src/components/ScheduleGrid.tsx` - Lowercase timeSlot
- `src/components/MemberManagement.tsx` - New component
- `src/app/actions/members.ts` - New server actions
- `src/app/page.tsx` - Added Anggota & Akses nav
