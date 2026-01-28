'use client'

import { useEffect, useState } from 'react'
import { getDuesStatus, DuesData } from '@/app/actions/dues'
import DuesTable from './DuesTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function StatusIuranView() {
    const { user } = useAuth()
    const [data, setData] = useState<DuesData[]>([])
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState(new Date().getFullYear())

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
            <CardHeader>
                <CardTitle>Status Iuran Anggota {year}</CardTitle>
                <CardDescription>
                    Monitoring status pembayaran iuran bulanan anggota.
                </CardDescription>
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
