'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScheduleSlot, updateScheduleSlot } from "@/app/actions/schedule"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, User, Phone, Trash2 } from "lucide-react"

const DAYS_MAP = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
const TIME_SLOTS = [
    { id: "Pagi", label: "Pagi", time: "06:00 - 08:00" },
    { id: "Sore", label: "Sore", time: "16:00 - 18:00" },
    { id: "Malam", label: "Malam", time: "19:00 - 21:00" }
]

interface ScheduleGridProps {
    initialData: ScheduleSlot[]
    isPengurus: boolean
    onUpdate?: () => void
}

export default function ScheduleGrid({ initialData, isPengurus, onUpdate }: ScheduleGridProps) {
    const router = useRouter() // Need to import useRouter
    const [selectedSlot, setSelectedSlot] = useState<{ day: number, slot: string } | null>(null)
    const [formData, setFormData] = useState({ userName: '', contact: '', status: 'vacant' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [open, setOpen] = useState(false)

    // Determine slot data
    const getSlotData = (day: number, slotId: string) => {
        return initialData.find(s => s.dayOfWeek === day && s.timeSlot === slotId)
    }

    const handleSlotClick = (day: number, slotId: string) => {
        if (!isPengurus) return

        const existing = getSlotData(day, slotId)
        setSelectedSlot({ day, slot: slotId })
        setFormData({
            userName: existing?.userName || '',
            contact: existing?.contact || '',
            status: existing?.status || 'vacant'
        })
        setOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSlot) return

        setIsSubmitting(true)
        try {
            const result = await updateScheduleSlot(selectedSlot.day, selectedSlot.slot, formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Jadwal diperbarui")
                setOpen(false)
                if (onUpdate) {
                    onUpdate()
                } else {
                    router.refresh()
                }
            }
        } catch (error) {
            toast.error("Gagal menyimpan jadwal")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedSlot) return
        if (!confirm("Hapus jadwal ini dan set slot menjadi Kosong?")) return

        setIsSubmitting(true)
        try {
            await updateScheduleSlot(selectedSlot.day, selectedSlot.slot, { status: 'vacant' })
            toast.success("Jadwal dihapus")
            setOpen(false)
            if (onUpdate) {
                onUpdate()
            } else {
                router.refresh()
            }
        } catch (error) {
            toast.error("Gagal menghapus jadwal")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {DAYS_MAP.map((dayName, index) => {
                    const dayNum = index + 1
                    return (
                        <div key={dayNum} className="space-y-4">
                            <div className="font-bold text-center py-2 bg-slate-100 dark:bg-slate-800 rounded">
                                {dayName}
                            </div>
                            <div className="space-y-3">
                                {TIME_SLOTS.map((slot) => {
                                    const data = getSlotData(dayNum, slot.id)
                                    const isOccupied = data?.status === 'occupied'
                                    const isCanceled = data?.status === 'canceled'

                                    return (
                                        <Card
                                            key={slot.id}
                                            className={`
                        cursor-pointer transition-all hover:shadow-md border-l-4
                        ${!isPengurus ? 'cursor-default' : ''}
                        ${isOccupied
                                                    ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
                                                    : isCanceled
                                                        ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                                                        : 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'}
                      `}
                                            onClick={() => handleSlotClick(dayNum, slot.id)}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-semibold text-muted-foreground">{slot.label}</span>
                                                    <span className="text-[10px] text-muted-foreground">{slot.time}</span>
                                                </div>

                                                {isOccupied ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1 text-sm font-bold truncate text-red-700 dark:text-red-400">
                                                            <User className="h-3 w-3" />
                                                            {data?.userName || "Booked"}
                                                        </div>
                                                    </div>
                                                ) : isCanceled ? (
                                                    <div className="text-sm font-bold text-orange-600 dark:text-orange-400 text-center">
                                                        BATAL
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-medium text-green-600 dark:text-green-400 text-center py-1">
                                                        {isPengurus ? <span className="flex items-center justify-center gap-1"><Plus className="h-3 w-3" />KOSONG</span> : "Kosong"}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit Jadwal: {selectedSlot ? DAYS_MAP[selectedSlot.day - 1] : ''} - {selectedSlot?.slot}
                        </DialogTitle>
                        <DialogDescription>
                            Isi detail penggunaan lapangan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="occupied">Terisi (Occupied)</SelectItem>
                                    <SelectItem value="canceled">Dibatalkan</SelectItem>
                                    <SelectItem value="vacant">Kosong (Vacant)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.status === 'occupied' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Nama Pengguna</Label>
                                    <Input
                                        placeholder="Nama anggota/tamu..."
                                        value={formData.userName}
                                        onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kontak (Opsional)</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="pl-8"
                                            placeholder="Nomor HP/WA..."
                                            value={formData.contact}
                                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <DialogFooter className="gap-2 sm:justify-between">
                            {formData.status !== 'vacant' && (
                                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Hapus
                                </Button>
                            )}
                            <div className="flex gap-2 justify-end w-full">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
