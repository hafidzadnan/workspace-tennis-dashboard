'use client'

import { useEffect, useState } from 'react'
import { getWeeklySchedule, ScheduleSlot } from '@/app/actions/schedule'
import ScheduleGrid from './ScheduleGrid'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function JadwalLapanganView() {
    const { user } = useAuth()
    const [data, setData] = useState<ScheduleSlot[]>([])
    const [loading, setLoading] = useState(true)

    async function fetchData() {
        setLoading(true)
        try {
            const result = await getWeeklySchedule()
            if (result.data) {
                setData(result.data)
            }
        } catch (error) {
            console.error("Failed to fetch schedule", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Jadwal Lapangan Mingguan</CardTitle>
                <CardDescription>
                    Jadwal penggunaan lapangan Tennis (Senin - Minggu).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScheduleGrid
                    initialData={data}
                    isPengurus={user?.role === 'pengurus'}
                    onUpdate={fetchData}
                />
            </CardContent>
        </Card>
    )
}
