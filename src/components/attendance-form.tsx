'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, User, Phone, CreditCard, CheckCircle, AlertCircle, Calendar, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceData {
  cccd: string
  hoTen: string
  soDienThoai: string
  khoa: string
}

interface StudentInfo {
  row: number
  stt: string
  ngayDk: string
  hoTen: string
  ngaySinh: string
  cccd?: string
  soDienThoai?: string
  hang?: string
  tinhTrang?: string
  khuVuc?: string
  khoa: string
}

export default function AttendanceForm() {
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
  const [sessionCode, setSessionCode] = useState<string>('') // Mã cố định cho phiên
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = new Date(prev)
        newTime.setSeconds(newTime.getSeconds() + 1)
        return newTime
      })
      
      // Check attendance window using settings
      const checkAttendanceWindow = async () => {
        try {
          const response = await fetch('/api/settings')
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              const settings = data.settings
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
          }
        } catch (error) {
          console.log('Failed to check attendance window')
          // Fallback to default time window
          const vietnamTime = new Date(currentTime.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))
          const hours = vietnamTime.getHours()
          const minutes = vietnamTime.getMinutes()
          const currentMinutes = hours * 60 + minutes
          
          const startMinutes = 19 * 60 + 10 // 19:10
          const endMinutes = 19 * 60 + 30   // 19:30
          
          const isOpen = currentMinutes >= startMinutes && currentMinutes <= endMinutes
          setIsAttendanceOpen(isOpen)
          
          if (currentMinutes < startMinutes) {
            const untilStart = startMinutes - currentMinutes
            setTimeRemaining(`Mở sau ${Math.floor(untilStart / 60)}h ${untilStart % 60}p`)
          } else if (currentMinutes > endMinutes) {
            setTimeRemaining('Đã đóng')
          } else {
            setTimeRemaining('ĐANG MỞ')
          }
        }
      }
      
      checkAttendanceWindow()
    }, 1000)

    return () => clearInterval(timer)
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

  const sendSessionCodeToWebhook = async (code: string) => {
    try {
      const webhookData = {
        action: 'session_code_generated',
        sessionCode: code,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 phút
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

  const showSuccessPopup = () => {
    setShowSuccessModal(true)
    // Tự động đóng sau 5 giây
    setTimeout(() => {
      setShowSuccessModal(false)
    }, 5000)
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

    setIsSubmitting(true)

    try {
      // Kiểm tra session với database
      const sessionResponse = await fetch('/api/session/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: attendanceCode
        }),
      })

      const sessionData = await sessionResponse.json()

      if (!sessionResponse.ok || !sessionData.valid) {
        toast.error(sessionData.error || 'Mã điểm danh không hợp lệ hoặc đã hết hạn!')
        return
      }

      // Nếu session hợp lệ, tiếp tục điểm danh
      const response = await fetch('/api/attendance/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentInfo,
          code: attendanceCode,
          formData,
          sessionId: sessionData.sessionId
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Hiển thị popup chúc mừng thay vì toast thông thường
        showSuccessPopup()
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Clock ở giữa - rộng bằng form */}
          <motion.div variants={itemVariants} className="text-center">
            <div className={`inline-flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl w-full ${
              isAttendanceOpen 
                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <div className="text-6xl md:text-7xl font-bold text-white tabular-nums">
                {currentTime.toLocaleTimeString('vi-VN', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'Asia/Ho_Chi_Minh'
                })}
              </div>
              <div className="text-xl md:text-2xl text-white mt-2 font-medium">
                {currentTime.toLocaleDateString('vi-VN', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  timeZone: 'Asia/Ho_Chi_Minh'
                })}
              </div>
              <Badge variant={isAttendanceOpen ? "default" : "secondary"} className="mt-4 text-lg px-4 py-2">
                {timeRemaining}
              </Badge>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
              HỆ THỐNG ĐIỂM DANH
            </h1>
            <p className="text-gray-600">Học Lái Xe AZ</p>
          </motion.div>

          {/* Form */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  {currentStep === 1 ? (
                    <>
                      <User className="w-5 h-5" />
                      Xác Thực Thông Tin
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Nhập Mã Điểm Danh
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-red-100">
                  {currentStep === 1 
                    ? 'Vui lòng điền đầy đủ và chính xác thông tin cá nhân'
                    : 'Nhập mã 6 số mà giáo viên đang công bố trên Zoom'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {currentStep === 1 ? (
                  <form onSubmit={handleVerifyInfo} className="space-y-6">
                    {/* ID Card Number */}
                    <div className="space-y-2">
                      <Label htmlFor="cccd" className="flex items-center gap-2 text-sm font-medium">
                        <CreditCard className="w-4 h-4" />
                        Số CCCD/CMND
                      </Label>
                      <Input
                        id="cccd"
                        type="text"
                        placeholder="Nhập số CCCD/CMND"
                        value={formData.cccd}
                        onChange={(e) => handleInputChange('cccd', e.target.value)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        disabled={!isAttendanceOpen || isSubmitting}
                      />
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="hoTen" className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4" />
                        Họ và Tên
                      </Label>
                      <Input
                        id="hoTen"
                        type="text"
                        placeholder="Nhập họ và tên đầy đủ"
                        value={formData.hoTen}
                        onChange={(e) => handleInputChange('hoTen', e.target.value)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        disabled={!isAttendanceOpen || isSubmitting}
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="soDienThoai" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="w-4 h-4" />
                        Số Điện Thoại
                      </Label>
                      <Input
                        id="soDienThoai"
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        value={formData.soDienThoai}
                        onChange={(e) => handleInputChange('soDienThoai', e.target.value)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        disabled={!isAttendanceOpen || isSubmitting}
                      />
                    </div>

                    {/* Course Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="khoa" className="text-sm font-medium">
                        Chọn Khóa Học
                      </Label>
                      <Select
                        value={formData.khoa}
                        onValueChange={(value) => handleInputChange('khoa', value)}
                        disabled={!isAttendanceOpen || isSubmitting}
                      >
                        <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Chọn khóa học" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="K15">Khóa 15</SelectItem>
                          <SelectItem value="K16">Khóa 16</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Alert Messages */}
                    <AnimatePresence>
                      {!isAttendanceOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert className="border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              Hiện tại chưa đến giờ điểm danh. {timeRemaining}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.div
                      whileHover={isAttendanceOpen && !isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={isAttendanceOpen && !isSubmitting ? { scale: 0.98 } : {}}
                    >
                      <Button
                        type="submit"
                        disabled={!isAttendanceOpen || isSubmitting}
                        className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Xác Thông Tin
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmitCode} className="space-y-6">
                    {/* Student Info */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3">Thông tin học viên:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-green-700"><strong>Họ tên:</strong> {studentInfo?.hoTen}</p>
                          <p className="text-green-700"><strong>Ngày sinh:</strong> {studentInfo?.ngaySinh || 'N/A'}</p>
                          <p className="text-green-700"><strong>CCCD:</strong> {studentInfo?.cccd || 'N/A'}</p>
                          <p className="text-green-700"><strong>Số ĐT:</strong> {studentInfo?.soDienThoai || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-green-700"><strong>Hạng:</strong> {studentInfo?.hang || 'N/A'}</p>
                          <p className="text-green-700"><strong>TT:</strong> {studentInfo?.tinhTrang || 'N/A'}</p>
                          <p className="text-green-700"><strong>Khu vực:</strong> {studentInfo?.khuVuc || 'N/A'}</p>
                          <p className="text-green-700"><strong>Khóa:</strong> {studentInfo?.khoa}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-green-600 text-sm"><strong>Ngày ĐK:</strong> {studentInfo?.ngayDk || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Code Input */}
                    <div className="space-y-2">
                      <Label htmlFor="code" className="flex items-center gap-2 text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        Mã Điểm Danh (6 số)
                      </Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="Nhập mã 6 số"
                        value={attendanceCode}
                        onChange={(e) => setAttendanceCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-2xl font-bold tracking-widest transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        maxLength={6}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.div
                      whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Điểm Danh
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {/* Back Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(1)
                        setStudentInfo(null)
                        setAttendanceCode('')
                      }}
                      className="w-full"
                    >
                      Quay lại
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Popup Thành Công */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                {/* Icon thành công */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>

                {/* Nội dung thông báo */}
                <div className="space-y-3">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
                  >
                    Bạn đã điểm danh thành công!
                  </motion.h2>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 text-lg leading-relaxed"
                  >
                    Cảm ơn bạn đã lựa chọn AZ,<br />
                    chúc bạn có một buổi học hiệu quả!
                  </motion.p>
                </div>

                {/* Nút đóng */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3"
                  >
                    Đã hiểu!
                  </Button>
                  <p className="text-sm text-gray-500">
                    Popup sẽ tự động đóng sau 5 giây
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}