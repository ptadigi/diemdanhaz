'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ZaiCard } from '@/components/ui/zai-card'
import { ZaiStatusBadge } from '@/components/ui/zai-status-badge'
import ZaiInput from '@/components/ui/zai-input'
import ZaiButton from '@/components/ui/zai-button'
import { 
  Clock, 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Shield,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceData {
  cccd: string
  hoTen: string
  soDienThoai: string
  khoa: string
}

interface StudentInfo {
  id: string
  hoTen: string
  khoa: string
  lop: string
  email?: string
  soDienThoai?: string
}

// Animation variants
  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    
    fadeInUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    
    fadeInRight: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
    
    buttonHover: {
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    
    buttonTap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    },
    
    cardHover: {
      y: -4,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  }

export default function ZaiAttendanceForm() {
  const [formData, setFormData] = useState<AttendanceData>({
    cccd: '',
    hoTen: '',
    soDienThoai: '',
    khoa: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(1) // 1: thông tin, 2: nhập mã
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [attendanceCode, setAttendanceCode] = useState('')
  const [sessionCode, setSessionCode] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // Update current time every second
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = new Date(prev)
        newTime.setSeconds(newTime.getSeconds() + 1)
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Check attendance window every 30 seconds with caching
  useEffect(() => {
    let lastSettings: any = null
    let lastFetchTime = 0
    const CACHE_DURATION = 30000 // 30 seconds

    const checkAttendanceWindow = async () => {
      const now = Date.now()
      
      // Use cached settings if available and not expired
      if (lastSettings && (now - lastFetchTime) < CACHE_DURATION) {
        updateAttendanceStatus(lastSettings)
        return
      }

      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            lastSettings = data.settings
            lastFetchTime = now
            localStorage.setItem('attendanceSettings', JSON.stringify(data.settings))
            updateAttendanceStatus(data.settings)
          }
        }
      } catch (error) {
        console.log('Failed to check attendance window, using cached settings')
        const cachedSettings = localStorage.getItem('attendanceSettings')
        if (cachedSettings) {
          try {
            const settings = JSON.parse(cachedSettings)
            updateAttendanceStatus(settings)
          } catch (parseError) {
            console.log('Failed to parse cached settings')
            setIsAttendanceOpen(false)
            setTimeRemaining('Lỗi cấu hình')
          }
        } else {
          console.log('No cached settings available')
          setIsAttendanceOpen(false)
          setTimeRemaining('Lỗi kết nối')
        }
      }
    }
    
    const updateAttendanceStatus = (settings: any) => {
      const vietnamTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
      const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
      const startMinutes = settings.startHour * 60 + settings.startMinute
      const endMinutes = settings.endHour * 60 + settings.endMinute
      
      const isOpen = settings.isActive && currentMinutes >= startMinutes && currentMinutes <= endMinutes
      setIsAttendanceOpen(isOpen)
      
      if (!settings.isActive) {
        setTimeRemaining('Hệ thống đã tắt')
      } else if (currentMinutes < startMinutes) {
        const untilStart = startMinutes - currentMinutes
        const hours = Math.floor(untilStart / 60)
        const minutes = untilStart % 60
        setTimeRemaining(`Mở sau ${hours > 0 ? `${hours}h ${minutes}p` : `${minutes}p`}`)
      } else if (currentMinutes > endMinutes) {
        setTimeRemaining('Đã đóng')
      } else {
        setTimeRemaining('ĐANG MỞ')
      }
    }
    
    // Check immediately on mount
    checkAttendanceWindow()
    
    // Then check every 30 seconds
    const interval = setInterval(checkAttendanceWindow, 30000)
    
    return () => clearInterval(interval)
  }, [currentTime])

  // Tạo mã phiên khi bắt đầu giờ điểm danh
  useEffect(() => {
    if (isAttendanceOpen && !sessionCode) {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString()
      setSessionCode(newCode)
      
      // Gửi mã phiên qua webhook ngay khi tạo
      sendSessionCodeToWebhook(newCode)
    } else if (!isAttendanceOpen && sessionCode) {
      setSessionCode('')
    }
  }, [isAttendanceOpen, sessionCode])

  // Listen for settings updates from admin page (optimized)
  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null
    
    try {
      broadcastChannel = new BroadcastChannel('attendance_settings')
      
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'settings_updated') {
          console.log('Settings updated from admin page:', event.data.settings)
          const vietnamTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
          const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes()
          const settings = event.data.settings
          const startMinutes = settings.startHour * 60 + settings.startMinute
          const endMinutes = settings.endHour * 60 + settings.endMinute
          
          const isOpen = settings.isActive && currentMinutes >= startMinutes && currentMinutes <= endMinutes
          setIsAttendanceOpen(isOpen)
          
          if (!settings.isActive) {
            setTimeRemaining('Hệ thống đã tắt')
          } else if (currentMinutes < startMinutes) {
            const untilStart = startMinutes - currentMinutes
            const hours = Math.floor(untilStart / 60)
            const minutes = untilStart % 60
            setTimeRemaining(`Mở sau ${hours > 0 ? `${hours}h ${minutes}p` : `${minutes}p`}`)
          } else if (currentMinutes > endMinutes) {
            setTimeRemaining('Đã đóng')
          } else {
            setTimeRemaining('ĐANG MỞ')
          }
        }
      }
    } catch (error) {
      console.log('BroadcastChannel not supported, skipping real-time updates')
    }
    
    return () => {
      if (broadcastChannel) {
        broadcastChannel.close()
      }
    }
  }, [currentTime])

  const sendSessionCodeToWebhook = async (code: string) => {
    try {
      const webhookData = {
        action: 'session_code_generated',
        sessionCode: code,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        message: 'Mã điểm danh phiên mới đã được tạo'
      }

      await fetch('https://n8n.phamthanh.net/webhook/diemdanh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })
    } catch (error) {
      console.error('Error sending session code to webhook:', error)
    }
  }

  const handleInputChange = (field: keyof AttendanceData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVerifyInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAttendanceOpen) {
      toast.error('Chưa đến giờ điểm danh!')
      return
    }

    // Validate form
    if (!formData.cccd || !formData.hoTen || !formData.soDienThoai || !formData.khoa) {
      toast.error('Vui lòng điền đầy đủ thông tin!')
      return
    }

    // Validate phone number
    const phoneRegex = /(0[3-9][0-9]{8})/
    if (!phoneRegex.test(formData.soDienThoai)) {
      toast.error('Số điện thoại không hợp lệ!')
      return
    }

    // Validate ID card number
    if (formData.cccd.length < 9 || formData.cccd.length > 12) {
      toast.error('Số CCCD không hợp lệ!')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setStudentInfo(result.studentInfo)
        setCurrentStep(2)
        toast.success('Xác thực thông tin thành công! Vui lòng nhập mã điểm danh.')
      } else {
        toast.error(result.error || 'Xác thực thất bại!')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!attendanceCode || attendanceCode.length !== 6) {
      toast.error('Mã điểm danh phải có 6 chữ số!')
      return
    }

    if (attendanceCode !== sessionCode) {
      toast.error('Mã điểm danh không chính xác! Vui lòng nhập lại.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/attendance/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentInfo,
          code: attendanceCode,
          formData
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Điểm danh thành công! ${result.message}`)
        // Reset form
        setFormData({
          cccd: '',
          hoTen: '',
          soDienThoai: '',
          khoa: ''
        })
        setCurrentStep(1)
        setStudentInfo(null)
        setAttendanceCode('')
      } else {
        toast.error(result.error || 'Điểm danh thất bại!')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
    setStudentInfo(null)
    setAttendanceCode('')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                duration: 0.6,
                staggerChildren: 0.1
              }
            }
          }}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div 
            className="text-center space-y-4"
            variants={animations.fadeInUp}
          >
            <motion.div 
              className="inline-flex items-center justify-center mb-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img 
                src="/logohoclaixeaz.png" 
                alt="Học Lái Xe AZ Logo" 
                className="h-16 w-auto object-contain"
              />
            </motion.div>
            
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              HỆ THỐNG ĐIỂM DANH
            </h1>
            <p className="text-gray-600 text-base">Học Lái Xe AZ</p>
          </motion.div>

          {/* Clock Widget */}
          <motion.div variants={animations.fadeInUp}>
            <ZaiCard variant="glass" hover={false} className="text-center">
              <div className="space-y-4">
                <motion.div 
                  className={`inline-flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl w-full ${
                    isAttendanceOpen 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}
                  whileHover={isAttendanceOpen ? { scale: 1.02 } : undefined}
                >
                  <div className="text-5xl md:text-6xl font-bold text-white tabular-nums">
                    {currentTime.toLocaleTimeString('vi-VN', { 
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'Asia/Ho_Chi_Minh'
                    })}
                  </div>
                  <div className="text-lg md:text-xl text-white mt-2 font-medium">
                    {currentTime.toLocaleDateString('vi-VN', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      timeZone: 'Asia/Ho_Chi_Minh'
                    })}
                  </div>
                </motion.div>
                
                <ZaiStatusBadge 
                  status={isAttendanceOpen ? 'success' : 'neutral'} 
                  size="lg"
                  pulse={isAttendanceOpen}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {timeRemaining}
                  </div>
                </ZaiStatusBadge>
              </div>
            </ZaiCard>
          </motion.div>

          {/* Main Form */}
          <motion.div variants={animations.fadeInUp}>
            <ZaiCard variant="elevated" padding="xl">
              <AnimatePresence mode="wait">
                {currentStep === 1 ? (
                  <motion.div
                    key="step1"
                    initial={animations.fadeInRight.initial}
                    animate={animations.fadeInRight.animate}
                    exit={animations.fadeInRight.exit}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-6">
                      {/* Step Header */}
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Xác Thực Thông Tin</h2>
                        <p className="text-gray-600">Vui lòng điền đầy đủ và chính xác thông tin cá nhân</p>
                      </div>

                      {/* Alert if attendance is closed */}
                      <AnimatePresence>
                        {!isAttendanceOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Alert className="border-amber-200 bg-amber-50">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-800">
                                {timeRemaining === 'Hệ thống đã tắt' 
                                  ? 'Hệ thống điểm danh đã tắt. Vui lòng liên hệ quản trị viên.'
                                  : 'Chưa đến giờ điểm danh. Vui lòng quay lại vào thời gian cho phép.'
                                }
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Form */}
                      <form onSubmit={handleVerifyInfo} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <ZaiInput
                            label="Số CCCD/CMND"
                            leftIcon={<CreditCard className="w-4 h-4" />}
                            placeholder="Nhập số CCCD/CMND"
                            value={formData.cccd}
                            onChange={(e) => handleInputChange('cccd', e.target.value)}
                            disabled={!isAttendanceOpen || isSubmitting}
                          />

                          <ZaiInput
                            label="Họ và Tên"
                            leftIcon={<User className="w-4 h-4" />}
                            placeholder="Nhập họ và tên đầy đủ"
                            value={formData.hoTen}
                            onChange={(e) => handleInputChange('hoTen', e.target.value)}
                            disabled={!isAttendanceOpen || isSubmitting}
                          />

                          <ZaiInput
                            label="Số Điện Thoại"
                            leftIcon={<Phone className="w-4 h-4" />}
                            placeholder="Nhập số điện thoại"
                            value={formData.soDienThoai}
                            onChange={(e) => handleInputChange('soDienThoai', e.target.value)}
                            disabled={!isAttendanceOpen || isSubmitting}
                          />

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Chọn Khóa Học
                            </label>
                            <Select
                              value={formData.khoa}
                              onValueChange={(value) => handleInputChange('khoa', value)}
                              disabled={!isAttendanceOpen || isSubmitting}
                            >
                              <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Chọn khóa học" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="K15">Khóa 15</SelectItem>
                                <SelectItem value="K16">Khóa 16</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <ZaiButton
                          type="submit"
                          variant="primary"
                          size="lg"
                          fullWidth
                          loading={isSubmitting}
                          disabled={!isAttendanceOpen || isSubmitting}
                          leftIcon={<Shield className="w-5 h-5" />}
                        >
                          {isSubmitting ? 'Đang xác thực...' : 'Xác thực thông tin'}
                        </ZaiButton>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={animations.scaleIn.initial}
                    animate={animations.scaleIn.animate}
                    exit={animations.scaleIn.exit}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-6">
                      {/* Step Header */}
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Nhập Mã Điểm Danh</h2>
                        <p className="text-gray-600">Nhập mã 6 số mà giáo viên đang công bố</p>
                      </div>

                      {/* Student Info Card */}
                      {studentInfo && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <ZaiCard variant="outlined" className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-blue-800">
                                <CheckCircle className="w-5 h-5" />
                                <h3 className="font-semibold">Thông tin học viên:</h3>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                    <span className="text-sm font-medium text-gray-600">Họ tên:</span>
                                    <span className="text-sm font-semibold text-gray-900">{studentInfo.hoTen}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                    <span className="text-sm font-medium text-gray-600">Ngày sinh:</span>
                                    <span className="text-sm text-gray-900">{studentInfo.ngaySinh || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                    <span className="text-sm font-medium text-gray-600">CCCD:</span>
                                    <span className="text-sm text-gray-900">{studentInfo.cccd || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-medium text-gray-600">Số ĐT:</span>
                                    <span className="text-sm text-gray-900">{studentInfo.soDienThoai || 'N/A'}</span>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                    <span className="text-sm font-medium text-gray-600">Hạng:</span>
                                    <span className="text-sm text-gray-900">{studentInfo.hang || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                    <span className="text-sm font-medium text-gray-600">TT:</span>
                                    <span className="text-sm text-gray-900">{studentInfo.tinhTrang || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                                    <span className="text-sm font-medium text-gray-600">Khu vực:</span>
                                    <span className="text-sm text-gray-900">{studentInfo.khuVuc || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-medium text-gray-600">Khóa:</span>
                                    <span className="text-sm text-gray-900">{studentInfo.khoa}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="pt-3 border-t border-blue-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-600">Ngày ĐK:</span>
                                  <span className="text-sm text-blue-700 font-medium">{studentInfo.ngayDk || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </ZaiCard>
                        </motion.div>
                      )}

                      {/* Code Input Form */}
                      <form onSubmit={handleSubmitCode} className="space-y-6">
                        <ZaiInput
                          label="Mã Điểm Danh (6 số)"
                          leftIcon={<Shield className="w-4 h-4" />}
                          placeholder="Nhập mã 6 số"
                          value={attendanceCode}
                          onChange={(e) => setAttendanceCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          disabled={isSubmitting}
                          maxLength={6}
                          helperText="Mã điểm danh có 6 chữ số, được giáo viên công bố trên lớp"
                        />

                        <div className="flex gap-4">
                          <ZaiButton
                            type="button"
                            variant="outline"
                            size="lg"
                            fullWidth
                            onClick={handleBack}
                            disabled={isSubmitting}
                            leftIcon={<ArrowLeft className="w-5 h-5" />}
                          >
                            Quay lại
                          </ZaiButton>
                          
                          <ZaiButton
                            type="submit"
                            variant="success"
                            size="lg"
                            fullWidth
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            leftIcon={<Zap className="w-5 h-5" />}
                          >
                            {isSubmitting ? 'Đang xử lý...' : 'Điểm danh'}
                          </ZaiButton>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ZaiCard>
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="text-center space-y-4"
            variants={animations.fadeInUp}
          >
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Hệ thống hoạt động</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })}</span>
              </div>
            </div>
            
            <ZaiButton 
              variant="ghost" 
              size="sm"
              onClick={() => window.open('/setgio', '_blank')}
            >
              Quản trị hệ thống
            </ZaiButton>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}