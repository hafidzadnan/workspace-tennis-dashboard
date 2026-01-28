import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Start of current month (GMT+8 = server time)
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get transactions for current month
    const currentMonthTransactions = await db.transaction.findMany({
      where: {
        isDeleted: false,
        tanggalTransaksi: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Calculate current month KPIs
    let penerimaanBulanIni = 0;
    let pengeluaranBulanIni = 0;

    currentMonthTransactions.forEach((t) => {
      if (t.jenis === 'penerimaan') {
        penerimaanBulanIni += t.nilai;
      } else if (t.jenis === 'pengeluaran') {
        pengeluaranBulanIni += t.nilai;
      }
    });

    const netCashflow = penerimaanBulanIni - pengeluaranBulanIni;

    // Calculate previous month ending balance
    const previousMonthTransactions = await db.transaction.findMany({
      where: {
        isDeleted: false,
        tanggalTransaksi: {
          lt: startOfMonth,
        },
      },
    });

    let saldoAkhirBulanLalu = 0;
    previousMonthTransactions.forEach((t) => {
      if (t.jenis === 'penerimaan') {
        saldoAkhirBulanLalu += t.nilai;
      } else if (t.jenis === 'pengeluaran') {
        saldoAkhirBulanLalu -= t.nilai;
      }
    });

    const saldoBulanIni = saldoAkhirBulanLalu + netCashflow;

    // Generate 12-month trend data
    const trendData = [];
    for (let i = 11; i >= 0; i--) {
      const year = currentYear;
      const month = currentMonth - i;

      // Handle month/year rollover
      const trendDate = new Date(year, month, 1);
      const trendYear = trendDate.getFullYear();
      const trendMonth = trendDate.getMonth();

      const trendStart = new Date(trendYear, trendMonth, 1);
      const trendEnd = new Date(trendYear, trendMonth + 1, 0);

      const monthTransactions = await db.transaction.findMany({
        where: {
          isDeleted: false,
          tanggalTransaksi: {
            gte: trendStart,
            lte: trendEnd,
          },
        },
      });

      let monthPenerimaan = 0;
      let monthPengeluaran = 0;

      monthTransactions.forEach((t) => {
        if (t.jenis === 'penerimaan') {
          monthPenerimaan += t.nilai;
        } else if (t.jenis === 'pengeluaran') {
          monthPengeluaran += t.nilai;
        }
      });

      const monthName = trendDate.toLocaleDateString('id-ID', {
        month: 'short',
        year: '2-digit',
      });

      trendData.push({
        bulan: monthName,
        penerimaan: monthPenerimaan,
        pengeluaran: monthPengeluaran,
        net: monthPenerimaan - monthPengeluaran,
      });
    }

    return NextResponse.json({
      kpi: {
        penerimaanBulanIni,
        pengeluaranBulanIni,
        saldoBulanIni,
        netCashflow,
      },
      trend: trendData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data dashboard' },
      { status: 500 }
    );
  }
}
