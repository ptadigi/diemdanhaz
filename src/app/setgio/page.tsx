'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Settings, Save, AlertCircle, LogOut, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import AuthGuard from '@/components/AuthGuard'
import SessionManager from '@/components/SessionManager'
import ClassStatsReport from '@/components/ClassStatsReport'

interface TimeSettings {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  isActive: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TimeSettings>({
    startHour: 19,
    startMinute: 10,
    endHour: 19,
    endMinute: 30,
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Đăng xuất thành công!');
        router.push('/admin');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Đăng xuất thất bại');
    }
  }

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('attendanceSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.log('Failed to parse saved settings')
      }
    }
  }, [])

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      localStorage.setItem('attendanceSettings', JSON.stringify(settings))
      
      // Broadcast settings update to all tabs
      if (typeof BroadcastChannel !== 'undefined') {
        const broadcastChannel = new BroadcastChannel('attendance_settings')
        broadcastChannel.postMessage({
          type: 'settings_updated',
          settings: settings
        })
        broadcastChannel.close()
      }
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Đã lưu cài đặt thành công!')
      } else {
        toast.error('Lưu server thất bại, nhưng đã lưu local!')
      }
    } catch (error) {
      toast.error('Lỗi kết nối, nhưng đã lưu local!')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const getCurrentStatus = () => {
    const vietnamTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
    const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
    const startMinutes = settings.startHour * 60 + settings.startMinute
    const endMinutes = settings.endHour * 60 + settings.endMinute
    
    if (!settings.isActive) return { status: 'inactive', text: 'Đã tắt', color: 'bg-gray-500' }
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return { status: 'active', text: 'ĐANG MỞ', color: 'bg-blue-500' }
    } else if (currentMinutes < startMinutes) {
      const untilStart = startMinutes - currentMinutes
      const hours = Math.floor(untilStart / 60)
      const minutes = untilStart % 60
      return { 
        status: 'waiting', 
        text: `Mở sau ${hours > 0 ? `${hours}h ${minutes}p` : `${minutes}p`}`, 
        color: 'bg-cyan-500' 
      }
    } else {
      return { status: 'closed', text: 'Đã đóng', color: 'bg-teal-600' }
    }
  }

  const currentStatus = getCurrentStatus()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-between items-center max-w-4xl mx-auto">
                <motion.div 
                  className="flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img 
                    src="/logohoclaixeaz.png" 
                    alt="Học Lái Xe AZ Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </motion.div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </Button>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                TRANG QUẢN LÝ
              </h1>
              <p className="text-gray-600 text-base">Hệ thống điểm danh Học Lái Xe AZ</p>
            </motion.div>

            <div className="space-y-6">
              {/* Trạng thái hiện tại */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Trạng Thái Hiện Tại
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {currentTime.toLocaleTimeString('vi-VN', { 
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'Asia/Ho_Chi_Minh'
                      })}
                    </p>
                    <p className="text-gray-600">
                      {currentTime.toLocaleDateString('vi-VN', { 
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        timeZone: 'Asia/Ho_Chi_Minh'
                      })}
                    </p>
                  </div>
                  <div className={`${currentStatus.color} text-white px-4 py-2 text-lg rounded-full`}>
                    {currentStatus.text}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Cài Đặt Khung Giờ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="text-base font-medium">
                    Kích hoạt hệ thống
                  </Label>
                  <button
                    id="isActive"
                    onClick={() => setSettings(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.isActive ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Thời gian bắt đầu</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="startHour" className="text-sm">Giờ</Label>
                        <Input
                          id="startHour"
                          type="number"
                          min="0"
                          max="23"
                          value={settings.startHour}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            startHour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                          }))}
                          className="text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="startMinute" className="text-sm">Phút</Label>
                        <Input
                          id="startMinute"
                          type="number"
                          min="0"
                          max="59"
                          value={settings.startMinute}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            startMinute: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                          }))}
                          className="text-center"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      {formatTime(settings.startHour, settings.startMinute)}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Thời gian kết thúc</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="endHour" className="text-sm">Giờ</Label>
                        <Input
                          id="endHour"
                          type="number"
                          min="0"
                          max="23"
                          value={settings.endHour}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            endHour: Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
                          }))}
                          className="text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="endMinute" className="text-sm">Phút</Label>
                        <Input
                          id="endMinute"
                          type="number"
                          min="0"
                          max="59"
                          value={settings.endMinute}
                          onChange={(e) => setSettings(prev => ({ 
                            ...prev, 
                            endMinute: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                          }))}
                          className="text-center"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      {formatTime(settings.endHour, settings.endMinute)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Cài đặt nhanh</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings({ startHour: 19, startMinute: 10, endHour: 19, endMinute: 30, isActive: true })}
                    >
                      19:10 - 19:30 (Mặc định)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings({ startHour: 0, startMinute: 0, endHour: 1, endMinute: 0, isActive: true })}
                    >
                      00:00 - 01:00 (Test)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings({ startHour: 8, startMinute: 0, endHour: 23, endMinute: 59, isActive: true })}
                    >
                      Cả ngày
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cài đặt sẽ được lưu trên trình duyệt và server. Hệ thống điểm danh sẽ tự động cập nhật trên tất cả các tab đang mở.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Lưu Cài Đặt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quản lý phiên điểm danh */}
            <SessionManager />
            
            {/* Báo cáo thống kê theo khóa */}
            <ClassStatsReport />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}