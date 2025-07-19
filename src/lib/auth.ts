import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export interface AuthUser {
  id: number
  email: string
  name: string | null
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, process.env.NEXTAUTH_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as AuthUser
  } catch {
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !(await verifyPassword(password, user.password))) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
} 