'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface TransactionFormProps {
  transaction: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  tanggal_transaksi: string;
  jenis: 'penerimaan' | 'pengeluaran';
  nilai: string;
  kategori: 'iuran anggota' | 'operasional' | 'asset' | 'lainnya';
  catatan: string;
}

export function TransactionForm({ transaction, open, onClose, onSuccess }: TransactionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    tanggal_transaksi: new Date().toISOString().split('T')[0],
    jenis: 'penerimaan',
    nilai: '',
    kategori: 'operasional',
    catatan: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        tanggal_transaksi: new Date(transaction.tanggalTransaksi).toISOString().split('T')[0],
        jenis: transaction.jenis,
        nilai: transaction.nilai.toString(),
        kategori: transaction.kategori,
        catatan: transaction.catatan || '',
      });
    } else {
      setFormData({
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        jenis: 'penerimaan',
        nilai: '',
        kategori: 'operasional',
        catatan: '',
      });
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = transaction
        ? `/api/transactions/${transaction.id}`
        : '/api/transactions';

      const response = await fetch(url, {
        method: transaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: transaction ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil ditambahkan',
          description: 'Data telah tersimpan',
        });
        onSuccess();
      } else {
        toast({
          title: 'Gagal menyimpan transaksi',
          description: data.error || 'Terjadi kesalahan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Gagal menyimpan transaksi',
        description: 'Terjadi kesalahan saat menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isIuranAnggota = formData.kategori === 'iuran anggota';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </DialogTitle>
          <DialogDescription>
            {transaction ? 'Edit data transaksi' : 'Tambahkan transaksi baru ke sistem'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal_transaksi">Tanggal Transaksi</Label>
            <Input
              id="tanggal_transaksi"
              type="date"
              value={formData.tanggal_transaksi}
              onChange={(e) =>
                setFormData({ ...formData, tanggal_transaksi: e.target.value })
              }
              disabled={isLoading}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-muted-foreground">
              Maksimal 90 hari ke belakang
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kategori">Kategori</Label>
            <Select
              value={formData.kategori}
              onValueChange={(value: any) =>
                setFormData({
                  ...formData,
                  kategori: value,
                  jenis: value === 'iuran anggota' ? 'penerimaan' : formData.jenis,
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="kategori">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iuran anggota">Iuran Anggota</SelectItem>
                <SelectItem value="operasional">Operasional</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenis">Jenis</Label>
            <Select
              value={formData.jenis}
              onValueChange={(value: any) =>
                setFormData({ ...formData, jenis: value })
              }
              disabled={isLoading || isIuranAnggota}
            >
              <SelectTrigger id="jenis">
                <SelectValue placeholder="Pilih jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="penerimaan">Penerimaan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
            {isIuranAnggota && (
              <p className="text-xs text-muted-foreground">
                Kategori "iuran anggota" otomatis berjenis penerimaan
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nilai">Nilai (Rp)</Label>
            <Input
              id="nilai"
              type="number"
              placeholder="100000"
              value={formData.nilai}
              onChange={(e) => setFormData({ ...formData, nilai: e.target.value })}
              disabled={isLoading}
              min="1"
              max="999999999"
              required
            />
            <p className="text-xs text-muted-foreground">
              Maksimal 9 digit, tanpa desimal
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan (Opsional)</Label>
            <Textarea
              id="catatan"
              placeholder="Keterangan tambahan..."
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : transaction ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
