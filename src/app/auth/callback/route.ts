import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const search = url.search
  const target = new URL(`/auth/callback/handle${search}`, url.origin)
  return NextResponse.redirect(target)
}
