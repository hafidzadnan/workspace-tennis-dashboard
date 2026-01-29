'use server'

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"

export type MemberData = {
    id: string
    name: string
    email: string
    statusKeanggotaan: string
    defaultIuran: number
    joinedAt: Date
    hasAccount: boolean  // Whether the member has a linked user account
}

// Get all members (Pengurus only)
export async function getMembers() {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    if (user.role !== 'pengurus') {
        return { error: "Forbidden: Only Pengurus can view member list" }
    }

    try {
        const members = await prisma.member.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                statusKeanggotaan: true,
                defaultIuran: true,
                joinedAt: true,
                userId: true,
                profileId: true,
            }
        })

        const data: MemberData[] = members.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email ?? '',
            statusKeanggotaan: member.statusKeanggotaan,
            defaultIuran: member.defaultIuran,
            joinedAt: member.joinedAt,
            hasAccount: !!member.userId
        }))

        return { data }
    } catch (error) {
        console.error("Error fetching members:", error)
        return { error: "Failed to fetch members" }
    }
}

// Create a new member (Pengurus only)
export async function createMember(data: {
    name: string
    email: string
    defaultIuran: number
    statusKeanggotaan?: string
}) {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    if (user.role !== 'pengurus') {
        return { error: "Forbidden: Only Pengurus can create members" }
    }

    // Validate required fields
    if (!data.name || !data.email) {
        return { error: "Name and email are required" }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
        return { error: "Invalid email format" }
    }

    try {
        // Check if email already exists
        const existing = await prisma.member.findFirst({
            where: { email: data.email }
        })

        if (existing) {
            return { error: "Email already registered" }
        }

        const member = await prisma.member.create({
            data: {
                name: data.name,
                email: data.email,
                defaultIuran: data.defaultIuran || 100000,
                statusKeanggotaan: data.statusKeanggotaan || 'aktif'
            }
        })

        revalidatePath('/anggota-akses')
        return { success: true, member }
    } catch (error) {
        console.error("Error creating member:", error)
        return { error: "Failed to create member" }
    }
}

// Update a member (Pengurus only)
export async function updateMember(id: string, data: {
    name?: string
    email?: string
    defaultIuran?: number
    statusKeanggotaan?: string
}) {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    if (user.role !== 'pengurus') {
        return { error: "Forbidden: Only Pengurus can update members" }
    }

    try {
        // If email is being updated, check for duplicates
        if (data.email) {
            const existing = await prisma.member.findFirst({
                where: {
                    email: data.email,
                    NOT: { id }
                }
            })

            if (existing) {
                return { error: "Email already registered by another member" }
            }
        }

        const member = await prisma.member.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email }),
                ...(data.defaultIuran !== undefined && { defaultIuran: data.defaultIuran }),
                ...(data.statusKeanggotaan && { statusKeanggotaan: data.statusKeanggotaan })
            }
        })

        revalidatePath('/anggota-akses')
        return { success: true, member }
    } catch (error) {
        console.error("Error updating member:", error)
        return { error: "Failed to update member" }
    }
}

// Create a user account for a member (Pengurus only)
export async function createMemberAccount(memberId: string, password: string) {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }

    if (user.role !== 'pengurus') {
        return { error: "Forbidden: Only Pengurus can create accounts" }
    }

    // Validate password
    if (!password || password.length < 6) {
        return { error: "Password must be at least 6 characters" }
    }

    try {
        // Get member data
        const member = await prisma.member.findUnique({
            where: { id: memberId }
        })

        if (!member) {
            return { error: "Member not found" }
        }

        if (!member.email) {
            return { error: "Member must have an email to create account" }
        }

        // Check if member already has an account
        if (member.profileId || member.userId) {
            return { error: "Member already has an account" }
        }

        // Check if email already exists in User table
        const existingUser = await prisma.user.findUnique({
            where: { email: member.email }
        })

        if (existingUser) {
            return { error: "An account with this email already exists" }
        }

        // Hash the password using bcryptjs
        const bcrypt = await import('bcryptjs')
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user in legacy User table (works without Edge Function)
        const newUser = await prisma.user.create({
            data: {
                email: member.email,
                password: hashedPassword,
                name: member.name
            }
        })

        // Link member to user
        await prisma.member.update({
            where: { id: memberId },
            data: { userId: newUser.id }
        })

        // Create role for the new user (anggota by default)
        await prisma.role.create({
            data: {
                userId: newUser.id,
                roleName: 'anggota'
            }
        })

        revalidatePath('/anggota-akses')
        return { success: true, userId: newUser.id }
    } catch (error) {
        console.error("Error creating member account:", error)
        return { error: "Failed to create account" }
    }
}

