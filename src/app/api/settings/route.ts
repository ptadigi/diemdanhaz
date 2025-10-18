import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface SystemSettings {
  defaultSessionDuration: number
  autoEndSession: boolean
  notificationEmail: string
  syncInterval: number
  enableNotifications: boolean
  maintenanceMode: boolean
  googleSheetsEnabled: boolean
  backupEnabled: boolean
  // Legacy time settings
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  isActive: boolean
}

// Default settings
const defaultSettings: SystemSettings = {
  defaultSessionDuration: 20,
  autoEndSession: true,
  notificationEmail: '',
  syncInterval: 5,
  enableNotifications: false,
  maintenanceMode: false,
  googleSheetsEnabled: true,
  backupEnabled: true,
  // Legacy time settings
  startHour: 19,
  startMinute: 10,
  endHour: 19,
  endMinute: 30,
  isActive: true
}

// Memory storage (production should use database)
let currentSettings: SystemSettings = { ...defaultSettings }
let lastLoadTime = 0
const CACHE_DURATION = 30000 // 30 seconds cache

// Load settings from file (with cache)
async function loadSettingsFromFile(): Promise<SystemSettings> {
  const now = Date.now()
  
  // Use cached settings if available and not expired
  if (currentSettings && (now - lastLoadTime) < CACHE_DURATION) {
    return currentSettings
  }

  try {
    const settingsPath = join(process.cwd(), 'data', 'settings.json')
    
    if (existsSync(settingsPath)) {
      const settingsData = JSON.parse(readFileSync(settingsPath, 'utf8'))
      currentSettings = { ...defaultSettings, ...settingsData }
      lastLoadTime = now
    }
  } catch (error) {
    console.log('Using default settings, could not load from file')
  }
  return currentSettings
}

// Save settings to file
async function saveSettingsToFile(settings: SystemSettings): Promise<void> {
  try {
    const dataDir = join(process.cwd(), 'data')
    await mkdir(dataDir, { recursive: true })
    
    const settingsPath = join(dataDir, 'settings.json')
    await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    console.log('Settings saved to file:', settings)
    
    // Update cache
    currentSettings = settings
    lastLoadTime = Date.now()
  } catch (error) {
    console.error('Error saving settings to file:', error)
  }
}

export async function GET() {
  try {
    const settings = await loadSettingsFromFile()
    
    // Add cache headers
    return NextResponse.json({
      success: true,
      settings: settings,
      message: 'Lấy cài đặt thành công'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30', // 30 seconds cache
        'ETag': JSON.stringify(settings)
      }
    })
  } catch (error) {
    console.error('GET settings error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Partial<SystemSettings> = await request.json()
    
    // Validate input
    if (body.defaultSessionDuration !== undefined && (typeof body.defaultSessionDuration !== 'number' || body.defaultSessionDuration < 5 || body.defaultSessionDuration > 120)) {
      return NextResponse.json(
        { error: 'Thời lượng phiên không hợp lệ (5-120 phút)' },
        { status: 400 }
      )
    }

    if (body.syncInterval !== undefined && (typeof body.syncInterval !== 'number' || body.syncInterval < 1 || body.syncInterval > 60)) {
      return NextResponse.json(
        { error: 'Chu kỳ đồng bộ không hợp lệ (1-60 phút)' },
        { status: 400 }
      )
    }

    if (body.notificationEmail !== undefined && typeof body.notificationEmail !== 'string') {
      return NextResponse.json(
        { error: 'Email thông báo không hợp lệ' },
        { status: 400 }
      )
    }

    // Validate time settings if provided
    if (body.startHour !== undefined && (body.startHour < 0 || body.startHour > 23)) {
      return NextResponse.json(
        { error: 'Giờ bắt đầu không hợp lệ' },
        { status: 400 }
      )
    }

    if (body.startMinute !== undefined && (body.startMinute < 0 || body.startMinute > 59)) {
      return NextResponse.json(
        { error: 'Phút bắt đầu không hợp lệ' },
        { status: 400 }
      )
    }

    if (body.endHour !== undefined && (body.endHour < 0 || body.endHour > 23)) {
      return NextResponse.json(
        { error: 'Giờ kết thúc không hợp lệ' },
        { status: 400 }
      )
    }

    if (body.endMinute !== undefined && (body.endMinute < 0 || body.endMinute > 59)) {
      return NextResponse.json(
        { error: 'Phút kết thúc không hợp lệ' },
        { status: 400 }
      )
    }

    // Update settings
    currentSettings = {
      ...currentSettings,
      ...body
    }

    // Save to file
    await saveSettingsToFile(currentSettings)

    return NextResponse.json({
      success: true,
      settings: currentSettings,
      message: 'Cập nhật cài đặt thành công'
    })

  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json(
      { error: 'Lỗi hệ thống' },
      { status: 500 }
    )
  }
}