import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Global variable to store session code (in production, use Redis or database)
let sessionCode: string | null = null
let sessionStartTime: Date | null = null

export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
    
    // Get settings from file or database
    let startHour = 19, startMinute = 10, endHour = 19, endMinute = 30, isActive = true
    
    try {
      const settingsPath = join(process.cwd(), 'data', 'settings.json')
      
      if (existsSync(settingsPath)) {
        const settingsData = JSON.parse(readFileSync(settingsPath, 'utf8'))
        startHour = settingsData.startHour || 19
        startMinute = settingsData.startMinute || 10
        endHour = settingsData.endHour || 19
        endMinute = settingsData.endMinute || 30
        isActive = settingsData.isActive !== false
      }
    } catch (error) {
      console.log('Using default settings')
    }
    
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // Check if within attendance window
    if (!isActive || currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return NextResponse.json(
        { error: `Ngoài khung giờ điểm danh (${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')})` },
        { status: 403 }
      )
    }

    // Generate new session code if not exists or expired
    if (!sessionCode || !sessionStartTime || 
        (now.getTime() - sessionStartTime.getTime()) > 20 * 60 * 1000) { // 20 minutes
      
      sessionCode = Math.floor(100000 + Math.random() * 900000).toString()
      sessionStartTime = now

      // Send code to webhook
      try {
        const webhookData = {
          action: 'session_code_generated',
          code: sessionCode,
          startTime: now.toISOString(),
          ngayDiemDanh: now.toLocaleDateString('vi-VN'),
          gioDiemDanh: now.toLocaleTimeString('vi-VN'),
          spreadsheetId: '1AKhYZrbgo7tq5ZrexHBeXJO_8hry8tWa1hJWWlu40JM',
          sessionDuration: '20 phút'
        }

        await fetch('https://n8n.phamthanh.net/webhook/diemdanh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        })
      } catch (webhookError) {
        console.error('Webhook error:', webhookError)
      }
    }

    return NextResponse.json({
      success: true,
      code: sessionCode,
      startTime: sessionStartTime?.toISOString(),
      message: 'Mã phiên điểm danh đã được tạo'
    })

  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const now = new Date()
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
    
    // Get settings from file or database
    let startHour = 19, startMinute = 10, endHour = 19, endMinute = 30, isActive = true
    
    try {
      const settingsPath = join(process.cwd(), 'data', 'settings.json')
      
      if (existsSync(settingsPath)) {
        const settingsData = JSON.parse(readFileSync(settingsPath, 'utf8'))
        startHour = settingsData.startHour || 19
        startMinute = settingsData.startMinute || 10
        endHour = settingsData.endHour || 19
        endMinute = settingsData.endMinute || 30
        isActive = settingsData.isActive !== false
      }
    } catch (error) {
      console.log('Using default settings')
    }
    
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    // Check if session is still valid
    const isValidSession = sessionCode && sessionStartTime && 
                         (now.getTime() - sessionStartTime.getTime()) < 20 * 60 * 1000 &&
                         isActive && currentMinutes >= startMinutes && currentMinutes <= endMinutes

    return NextResponse.json({
      hasActiveSession: isValidSession,
      code: isValidSession ? sessionCode : null,
      startTime: sessionStartTime?.toISOString()
    })

  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}