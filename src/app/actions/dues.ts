'use server'

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

export type DuesData = {
    memberId: string
    memberName: string
    statusKeanggotaan: string
    dues: {
        [key: number]: { // month 1-12
            status: string
            nilaiIuran: number
        }
    }
}

export async function getDuesStatus(year: number) {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    try {
        // Fetch all members
        const members = await prisma.member.findMany({
            where: {
                statusKeanggotaan: 'aktif'
            },
            orderBy: {
                name: 'asc'
            },
            include: {
                dues: {
                    where: {
                        year: year
                    }
                }
            }
        })

        // Transform data for UI
        const data: DuesData[] = members.map(member => {
            const duesMap: { [key: number]: { status: string, nilaiIuran: number } } = {}

            member.dues.forEach(d => {
                duesMap[d.month] = {
                    status: d.status,
                    nilaiIuran: d.nilaiIuran
                }
            })

            return {
                memberId: member.id,
                memberName: member.name,
                statusKeanggotaan: member.statusKeanggotaan,
                dues: duesMap
            }
        })

        return { data }
    } catch (error) {
        console.error("Error fetching dues:", error)
        return { error: "Failed to fetch dues data" }
    }
}

export async function updateDuesStatus(memberId: string, year: number, month: number, status: string) {
    const user = await getCurrentUser()

    if (!user) return { error: "Unauthorized" }

    if (user.role !== 'pengurus') {
        return { error: "Forbidden: Only Pengurus can update dues" }
    }

    try {
        await prisma.duesStatus.upsert({
            where: {
                memberId_year_month: {
                    memberId,
                    year,
                    month
                }
            },
            update: {
                status,
                updatedBy: user.name || user.email
            },
            create: {
                memberId,
                year,
                month,
                status,
                nilaiIuran: 0, // Default value, can be enhanced later to take input
                updatedBy: user.name || user.email
            }
        })

        revalidatePath('/status-iuran')
        return { success: true }
    } catch (error) {
        console.error("Error updating dues:", error)
        return { error: "Failed to update dues status" }
    }
}
