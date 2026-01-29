'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { updateDuesStatus, DuesData } from "@/app/actions/dues"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

interface DuesTableProps {
    initialData: DuesData[]
    year: number
    isPengurus: boolean
}

export default function DuesTable({ initialData, year, isPengurus }: DuesTableProps) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

    const handleStatusChange = async (memberId: string, monthIndex: number, newStatus: string) => {
        const key = `${memberId}-${monthIndex}`
        setLoadingMap(prev => ({ ...prev, [key]: true }))

        try {
            const result = await updateDuesStatus(memberId, year, monthIndex + 1, newStatus)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Status updated")
            }
        } catch (error) {
            toast.error("Failed to update status")
        } finally {
            setLoadingMap(prev => ({ ...prev, [key]: false }))
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px] sticky left-0 bg-background z-10">Nama Anggota</TableHead>
                        <TableHead className="text-right min-w-[130px]">Besaran Iuran</TableHead>
                        {MONTHS.map((month) => (
                            <TableHead key={month} className="text-center min-w-[80px]">{month}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialData.map((member) => (
                        <TableRow key={member.memberId}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                                {member.memberName}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm border-r">
                                {new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(member.defaultIuran)}
                            </TableCell>
                            {MONTHS.map((_, index) => {
                                const monthNum = index + 1
                                const status = member.dues[monthNum]?.status || 'belum'
                                const isLoading = loadingMap[`${member.memberId}-${index}`]

                                return (
                                    <TableCell key={index} className="p-2 text-center">
                                        {isPengurus ? (
                                            <Select
                                                defaultValue={status}
                                                onValueChange={(val) => handleStatusChange(member.memberId, index, val)}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger
                                                    className={`h-8 w-20 mx-auto ${status === 'lunas'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200'
                                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                                                        }`}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <SelectValue />
                                                    )}
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="belum">Belum</SelectItem>
                                                    <SelectItem value="lunas">Lunas</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className={`
                        px-2 py-1 rounded text-xs font-semibold inline-block
                        ${status === 'lunas'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
                      `}>
                                                {status === 'lunas' ? 'LUNAS' : 'BELUM'}
                                            </div>
                                        )}
                                    </TableCell>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
