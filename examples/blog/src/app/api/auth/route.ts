import { admin } from '@/admin'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email } = body
  const token = await admin.auth.createToken(email)
  return NextResponse.json({ token })
}
