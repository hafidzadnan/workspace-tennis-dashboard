'use client'

import { useEffect, useState } from 'react'
import { getMembers, createMember, updateMember, createMemberAccount, MemberData } from '@/app/actions/members'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, UserCheck, UserX, Users, UserPlus } from "lucide-react"

export function MemberManagement() {
    const [members, setMembers] = useState<MemberData[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<MemberData | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [accountPassword, setAccountPassword] = useState('')

    // Form state for new member
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        defaultIuran: 100000,
        statusKeanggotaan: 'aktif'
    })

    // Form state for editing member
    const [editMember, setEditMember] = useState({
        name: '',
        email: '',
        defaultIuran: 100000,
        statusKeanggotaan: 'aktif'
    })

    const fetchMembers = async () => {
        setLoading(true)
        try {
            const result = await getMembers()
            if (result.data) {
                setMembers(result.data)
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Failed to fetch members")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMembers()
    }, [])

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await createMember(newMember)
            if (result.success) {
                toast.success("Anggota berhasil ditambahkan")
                setIsAddDialogOpen(false)
                setNewMember({ name: '', email: '', defaultIuran: 100000, statusKeanggotaan: 'aktif' })
                fetchMembers()
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Gagal menambahkan anggota")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMember) return

        setIsSubmitting(true)

        try {
            const result = await updateMember(selectedMember.id, editMember)
            if (result.success) {
                toast.success("Anggota berhasil diperbarui")
                setIsEditDialogOpen(false)
                setSelectedMember(null)
                fetchMembers()
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Gagal memperbarui anggota")
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditDialog = (member: MemberData) => {
        setSelectedMember(member)
        setEditMember({
            name: member.name,
            email: member.email,
            defaultIuran: member.defaultIuran,
            statusKeanggotaan: member.statusKeanggotaan
        })
        setIsEditDialogOpen(true)
    }

    const openCreateAccountDialog = (member: MemberData) => {
        setSelectedMember(member)
        setAccountPassword('')
        setIsCreateAccountDialogOpen(true)
    }

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMember) return

        setIsSubmitting(true)

        try {
            const result = await createMemberAccount(selectedMember.id, accountPassword)
            if (result.success) {
                toast.success("Akun berhasil dibuat! User dapat login dengan email dan password yang diberikan.")
                setIsCreateAccountDialogOpen(false)
                setSelectedMember(null)
                setAccountPassword('')
                fetchMembers()
            } else if (result.error) {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Gagal membuat akun")
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Anggota & Akses
                    </CardTitle>
                    <CardDescription>
                        Kelola data anggota dan akun login.
                    </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Anggota
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Anggota Baru</DialogTitle>
                            <DialogDescription>
                                Isi data anggota baru. Email wajib diisi untuk keperluan pembuatan akun.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama *</Label>
                                <Input
                                    id="name"
                                    placeholder="Nama lengkap"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="defaultIuran">Besaran Iuran (Rp)</Label>
                                <Input
                                    id="defaultIuran"
                                    type="number"
                                    min="0"
                                    max="999999999"
                                    value={newMember.defaultIuran}
                                    onChange={(e) => setNewMember({ ...newMember, defaultIuran: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status Keanggotaan</Label>
                                <Select
                                    value={newMember.statusKeanggotaan}
                                    onValueChange={(val) => setNewMember({ ...newMember, statusKeanggotaan: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aktif">Aktif</SelectItem>
                                        <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Besaran Iuran</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Akun</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        Belum ada data anggota.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.email || '-'}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatCurrency(member.defaultIuran)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.statusKeanggotaan === 'aktif' ? 'default' : 'secondary'}>
                                                {member.statusKeanggotaan === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.hasAccount ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <UserCheck className="h-4 w-4" />
                                                    <span className="text-xs">Terhubung</span>
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <UserX className="h-4 w-4" />
                                                    <span className="text-xs">Belum</span>
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {!member.hasAccount && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openCreateAccountDialog(member)}
                                                        className="text-xs"
                                                    >
                                                        <UserPlus className="h-3 w-3 mr-1" />
                                                        Buat Akun
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(member)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Anggota</DialogTitle>
                            <DialogDescription>
                                Perbarui data anggota.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditMember} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Nama *</Label>
                                <Input
                                    id="edit-name"
                                    placeholder="Nama lengkap"
                                    value={editMember.name}
                                    onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email *</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    placeholder="email@example.com"
                                    value={editMember.email}
                                    onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-defaultIuran">Besaran Iuran (Rp)</Label>
                                <Input
                                    id="edit-defaultIuran"
                                    type="number"
                                    min="0"
                                    max="999999999"
                                    value={editMember.defaultIuran}
                                    onChange={(e) => setEditMember({ ...editMember, defaultIuran: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status Keanggotaan</Label>
                                <Select
                                    value={editMember.statusKeanggotaan}
                                    onValueChange={(val) => setEditMember({ ...editMember, statusKeanggotaan: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aktif">Aktif</SelectItem>
                                        <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Create Account Dialog */}
                <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Buat Akun untuk {selectedMember?.name}</DialogTitle>
                            <DialogDescription>
                                Masukkan password untuk akun baru. Email yang akan digunakan: <strong>{selectedMember?.email}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="account-password">Password *</Label>
                                <Input
                                    id="account-password"
                                    type="password"
                                    placeholder="Minimal 6 karakter"
                                    value={accountPassword}
                                    onChange={(e) => setAccountPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Password ini harus disampaikan ke anggota untuk login.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateAccountDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting || accountPassword.length < 6}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Akun"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
