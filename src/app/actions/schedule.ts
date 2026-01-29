'use server'

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

export type ScheduleSlot = {
    dayOfWeek: number // 1=Mon, 7=Sun
    timeSlot: string // "pagi", "sore", "malam" (lowercase)
    status: string // "vacant", "occupied", "canceled"
    userName: string | null
    contact: string | null
}

const TIME_SLOTS = ["pagi", "sore", "malam"]
const DAYS = [1, 2, 3, 4, 5, 6, 7]

export async function getWeeklySchedule() {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    try {
        const schedules = await prisma.courtSchedule.findMany()

        // Fill in gaps with vacant slots
        const fullSchedule: ScheduleSlot[] = []

        DAYS.forEach(day => {
            TIME_SLOTS.forEach(slot => {
                const existing = schedules.find(s => s.dayOfWeek === day && s.timeSlot === slot)
                if (existing) {
                    fullSchedule.push({
                        dayOfWeek: existing.dayOfWeek,
                        timeSlot: existing.timeSlot,
                        status: existing.status,
                        userName: existing.userName,
                        contact: existing.contact
                    })
                } else {
                    fullSchedule.push({
                        dayOfWeek: day,
                        timeSlot: slot,
                        status: 'vacant',
                        userName: null,
                        contact: null
                    })
                }
            })
        })

        return { data: fullSchedule }
    } catch (error) {
        console.error("Error fetching schedule:", error)
        return { error: "Failed to fetch schedule" }
    }
}

export async function updateScheduleSlot(
    dayOfWeek: number,
    timeSlot: string,
    data: {
        status: string,
        userName?: string,
        contact?: string
    }
) {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    // Check permissions (Pengurus only)
    if (user.role !== 'pengurus') {
        return { error: "Forbidden: Only Pengurus can manage schedule" }
    }

    try {
        // If setting to vacant, clear user data
        if (data.status === 'vacant') {
            data.userName = ""
            data.contact = ""
        }

        await prisma.courtSchedule.upsert({
            where: {
                dayOfWeek_timeSlot: {
                    dayOfWeek,
                    timeSlot
                }
            },
            update: {
                status: data.status,
                userName: data.userName,
                contact: data.contact,
                updatedBy: user.name || user.email
            },
            create: {
                dayOfWeek,
                timeSlot,
                status: data.status,
                userName: data.userName,
                contact: data.contact,
                updatedBy: user.name || user.email
            }
        })

        revalidatePath('/') // Revalidate home/dashboard
        return { success: true }
    } catch (error) {
        console.error("Error updating schedule:", error)
        return { error: "Failed to update schedule" }
    }
}
