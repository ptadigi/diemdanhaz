import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface TimeSettings {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  isActive: boolean
}

// 默认设置
const defaultSettings: TimeSettings = {
  startHour: 19,
  startMinute: 10,
  endHour: 19,
  endMinute: 30,
  isActive: true
}

// 内存存储（生产环境建议使用数据库）
let currentSettings: TimeSettings = { ...defaultSettings }
let lastLoadTime = 0
const CACHE_DURATION = 30000 // 30 seconds cache

// 从文件加载设置（带缓存）
async function loadSettingsFromFile(): Promise<TimeSettings> {
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

// 保存设置到文件
async function saveSettingsToFile(settings: TimeSettings): Promise<void> {
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
    const body: TimeSettings = await request.json()
    
    // 验证输入
    if (typeof body.startHour !== 'number' || 
        typeof body.startMinute !== 'number' ||
        typeof body.endHour !== 'number' ||
        typeof body.endMinute !== 'number' ||
        typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      )
    }

    // 验证时间范围
    if (body.startHour < 0 || body.startHour > 23 ||
        body.startMinute < 0 || body.startMinute > 59 ||
        body.endHour < 0 || body.endHour > 23 ||
        body.endMinute < 0 || body.endMinute > 59) {
      return NextResponse.json(
        { error: 'Thời gian không hợp lệ' },
        { status: 400 }
      )
    }

    // 更新设置
    currentSettings = {
      startHour: body.startHour,
      startMinute: body.startMinute,
      endHour: body.endHour,
      endMinute: body.endMinute,
      isActive: body.isActive
    }

    // 保存到文件
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