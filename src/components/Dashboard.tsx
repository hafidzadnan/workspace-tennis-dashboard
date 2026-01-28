'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, TrendingUp, Wallet, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatRupiah } from '@/lib/format';

interface DashboardData {
  kpi: {
    penerimaanBulanIni: number;
    pengeluaranBulanIni: number;
    saldoBulanIni: number;
    netCashflow: number;
  };
  trend: Array<{
    bulan: string;
    penerimaan: number;
    pengeluaran: number;
    net: number;
  }>;
}

export function Dashboard({ onLoginClick }: { onLoginClick: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Gagal memuat data dashboard</p>
      </div>
    );
  }

  const { kpi, trend } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Dashboard Keuangan</h2>
        <p className="text-muted-foreground">
          Ringkasan keuangan klub tennis bulan ini
        </p>
        <Button onClick={onLoginClick} size="lg" className="bg-primary hover:bg-primary/90">
          Login untuk lihat detail transaksi
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penerimaan Bulan Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatRupiah(kpi.penerimaanBulanIni)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatRupiah(kpi.pengeluaranBulanIni)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
            <TrendingUp className={`h-4 w-4 ${kpi.netCashflow >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpi.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.netCashflow >= 0 ? '+' : ''}
              {formatRupiah(kpi.netCashflow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bulan Ini</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(kpi.saldoBulanIni)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren 12 Bulan Terakhir</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pergerakan kas 12 bulan terakhir
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatRupiah(value)}
                labelFormatter={(label) => `Bulan: ${label}`}
              />
              <Legend />
              <Bar dataKey="penerimaan" name="Penerimaan" fill="#10b981" />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Net Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Net Cashflow</CardTitle>
          <p className="text-sm text-muted-foreground">
            Net cashflow bulanan 12 bulan terakhir
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatRupiah(value)}
                labelFormatter={(label) => `Bulan: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="net"
                name="Net Cashflow"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
