import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isPengurus } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // For public dashboard, allow anonymous access
    const isPublicDashboard = request.nextUrl.searchParams.get('public') === 'true';

    if (!isPublicDashboard) {
      // Check authentication for non-public requests
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        );
      }
    }

    const transactions = await db.transaction.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        tanggalTransaksi: 'desc',
      },
      include: {
        createdByUser: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil transaksi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is pengurus
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const isAdmin = await isPengurus();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Hanya pengurus yang dapat menambah transaksi' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      tanggal_transaksi,
      jenis,
      nilai,
      kategori,
      catatan,
    } = body;

    // Validate input
    if (!tanggal_transaksi || !jenis || !nilai || !kategori) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi kecuali catatan' },
        { status: 400 }
      );
    }

    // Validate nilai (max 9 digits, no decimals)
    if (!/^\d{1,9}$/.test(nilai.toString())) {
      return NextResponse.json(
        { error: 'Nilai harus berupa angka maksimal 9 digit tanpa desimal' },
        { status: 400 }
      );
    }

    // Validate jenis
    if (!['penerimaan', 'pengeluaran'].includes(jenis)) {
      return NextResponse.json(
        { error: 'Jenis tidak valid' },
        { status: 400 }
      );
    }

    // Validate kategori
    const validCategories = ['iuran anggota', 'operasional', 'asset', 'lainnya'];
    if (!validCategories.includes(kategori)) {
      return NextResponse.json(
        { error: 'Kategori tidak valid' },
        { status: 400 }
      );
    }

    // If kategori is "iuran anggota", jenis must be "penerimaan"
    if (kategori === 'iuran anggota' && jenis !== 'penerimaan') {
      return NextResponse.json(
        { error: 'Kategori "iuran anggota" harus berjenis "penerimaan"' },
        { status: 400 }
      );
    }

    // Validate backdate (rolling 90 days)
    const transactionDate = new Date(tanggal_transaksi);
    const today = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    if (transactionDate > today || transactionDate < ninetyDaysAgo) {
      return NextResponse.json(
        { error: 'Tanggal transaksi harus dalam rentang 90 hari terakhir hingga hari ini' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        tanggalTransaksi: transactionDate,
        jenis,
        nilai: parseInt(nilai.toString()),
        kategori,
        catatan,
        createdByUser: {
          connect: {
            id: user.id
          }
        },
      },
      include: {
        createdByUser: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat transaksi' },
      { status: 500 }
    );
  }
}
