import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isPengurus } from '@/lib/auth';

// GET single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const transaction = await db.transaction.findUnique({
      where: {
        id: id,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil transaksi' },
      { status: 500 }
    );
  }
}

// UPDATE transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { error: 'Hanya pengurus yang dapat mengedit transaksi' },
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

    // Update transaction
    const transaction = await db.transaction.update({
      where: {
        id: id,
      },
      data: {
        tanggalTransaksi: transactionDate,
        jenis,
        nilai: parseInt(nilai.toString()),
        kategori,
        catatan,
        updatedBy: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupdate transaksi' },
      { status: 500 }
    );
  }
}

// DELETE transaction (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { error: 'Hanya pengurus yang dapat menghapus transaksi' },
        { status: 403 }
      );
    }

    // Soft delete transaction
    await db.transaction.update({
      where: {
        id: id,
      },
      data: {
        isDeleted: true,
        updatedBy: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus transaksi' },
      { status: 500 }
    );
  }
}
