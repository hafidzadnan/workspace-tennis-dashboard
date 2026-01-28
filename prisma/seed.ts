import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create officer (pengurus)
  const officer = await prisma.user.upsert({
    where: { email: 'budi@tennis.com' },
    update: {},
    create: {
      email: 'budi@tennis.com',
      password: hashedPassword,
      name: 'Budi (Pengurus)',
      role: {
        create: {
          roleName: 'pengurus',
        },
      },
    },
  });

  // Create member (anggota)
  const member = await prisma.user.upsert({
    where: { email: 'dina@tennis.com' },
    update: {},
    create: {
      email: 'dina@tennis.com',
      password: hashedPassword,
      name: 'Dina (Anggota)',
    },
  });

  console.log('✅ Created test users:', officer, member);

  // Create some sample transactions
  const now = new Date();

  // Previous month transactions
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  await prisma.transaction.createMany({
    data: [
      // Current month transactions
      {
        tanggalTransaksi: new Date(now.getFullYear(), now.getMonth(), 5),
        jenis: 'penerimaan',
        nilai: 500000,
        kategori: 'iuran anggota',
        catatan: 'Iuran bulanan anggota',
        createdBy: officer.id,
        updatedBy: officer.id,
      },
      {
        tanggalTransaksi: new Date(now.getFullYear(), now.getMonth(), 10),
        jenis: 'penerimaan',
        nilai: 500000,
        kategori: 'iuran anggota',
        catatan: 'Iuran bulanan anggota',
        createdBy: officer.id,
        updatedBy: officer.id,
      },
      {
        tanggalTransaksi: new Date(now.getFullYear(), now.getMonth(), 15),
        jenis: 'pengeluaran',
        nilai: 300000,
        kategori: 'operasional',
        catatan: 'Beli bola tennis',
        createdBy: officer.id,
        updatedBy: officer.id,
      },
      {
        tanggalTransaksi: new Date(now.getFullYear(), now.getMonth(), 20),
        jenis: 'pengeluaran',
        nilai: 50000,
        kategori: 'operasional',
        catatan: 'Air minum',
        createdBy: officer.id,
        updatedBy: officer.id,
      },
      // Last month transactions
      {
        tanggalTransaksi: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
        jenis: 'penerimaan',
        nilai: 1000000,
        kategori: 'iuran anggota',
        catatan: 'Iuran bulanan anggota',
        createdBy: officer.id,
        updatedBy: officer.id,
      },
      {
        tanggalTransaksi: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15),
        jenis: 'pengeluaran',
        nilai: 400000,
        kategori: 'asset',
        catatan: 'Net baru',
        createdBy: officer.id,
        updatedBy: officer.id,
      },
    ],
  });

  console.log('✅ Created sample transactions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
