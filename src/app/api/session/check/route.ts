import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Mã phiên không hợp lệ', valid: false },
        { status: 400 }
      )
    }

    const now = new Date()
    
    // Tìm session trong database
    const session = await db.diemDanhSession.findFirst({
      where: {
        sessionCode: code,
        isActive: true,
        startTime: {
          lte: now
        },
        endTime: {
          gte: now
        }
      }
    })

    if (!session) {
      return NextResponse.json({
        valid: false,
        error: 'Mã phiên không tồn tại hoặc đã hết hạn'
      })
    }

    return NextResponse.json({
      valid: true,
      sessionId: session.id,
      sessionCode: session.sessionCode,
      title: session.title,
      endTime: session.endTime
    })

  } catch (error) {
    console.error('Check session error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống', valid: false },
      { status: 500 }
    )
  }
}