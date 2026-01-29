'use client'

import { useEffect, useState } from 'react'
import { getDuesStatus, DuesData } from '@/app/actions/dues'
import DuesTable from './DuesTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Calendar } from 'lucide-react'

// Generate years array: current year +/- 2 years
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).reverse()

export function StatusIuranView() {
    const { user } = useAuth()
    const [data, setData] = useState<DuesData[]>([])
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState(currentYear)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const result = await getDuesStatus(year)
                if (result.data) {
                    setData(result.data)
                }
            } catch (error) {
                console.error("Failed to fetch dues", error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchData()
        }
    }, [user, year])

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle>Status Iuran Anggota {year}</CardTitle>
                    <CardDescription>
                        <br />
                        1. Uang Kas dibayarkan paling lambat tanggal 26 setiap bulan nya dengan besaran Rp 50.000,-/bulan/orang (pengawas up) & Rp 25.000/bulan/orang (staff)<br />
                        2. Pembayaran dapat melalui cash atau rekening <strong>Bank Mandiri dengan nomor 1840003471412 a.n Rafika Nur Sofiani</strong><br />
                        3. Updating data akan dilakukan oleh pengelola dana, setelah uang diterima<br />
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select
                        value={year.toString()}
                        onValueChange={(val) => setYear(parseInt(val))}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <DuesTable
                    initialData={data}
                    year={year}
                    isPengurus={user?.role === 'pengurus'}
                />
            </CardContent>
        </Card>
    )
}

