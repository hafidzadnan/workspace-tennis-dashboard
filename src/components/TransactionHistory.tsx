'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRupiah, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TransactionForm } from '@/components/TransactionForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Transaction {
  id: string;
  tanggalTransaksi: Date;
  jenis: 'penerimaan' | 'pengeluaran';
  nilai: number;
  kategori: string;
  catatan: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: {
    name: string | null;
  } | null;
}

export function TransactionHistory() {
  const { isPengurus } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${deleteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTransactions(transactions.filter(t => t.id !== deleteId));
        setDeleteId(null);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchTransactions();
  };

  const getJenisColor = (jenis: string) => {
    return jenis === 'penerimaan' ? 'bg-green-500' : 'bg-red-500';
  };

  const getKategoriBadge = (kategori: string) => {
    const colors: Record<string, string> = {
      'iuran anggota': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'operasional': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'asset': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'lainnya': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };
    return colors[kategori] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Memuat transaksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Riwayat Transaksi</h2>
          <p className="text-muted-foreground">
            Daftar seluruh transaksi klub tennis
          </p>
        </div>
        {isPengurus && (
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Transaksi
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                  {isPengurus && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isPengurus ? 7 : 6} className="text-center py-12">
                      <p className="text-muted-foreground">Belum ada transaksi</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.tanggalTransaksi)}</TableCell>
                      <TableCell>
                        <Badge className={getJenisColor(transaction.jenis)}>
                          {transaction.jenis}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getKategoriBadge(transaction.kategori)}>
                          {transaction.kategori}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.catatan || '-'}
                      </TableCell>
                      <TableCell>{transaction.createdByUser?.name || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${transaction.jenis === 'penerimaan' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {transaction.jenis === 'penerimaan' ? '+' : '-'}
                        {formatRupiah(transaction.nilai)}
                      </TableCell>
                      {isPengurus && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Form Dialog */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          open={showForm}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
