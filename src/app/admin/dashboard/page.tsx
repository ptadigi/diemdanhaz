'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  Settings, 
  BarChart3, 
  TestTube,
  Database,
  ArrowRight,
  LogOut,
  Eye,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface DashboardStats {
  totalStudents: number
  todayAttendance: number
  activeSession: boolean
  lastSync: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todayAttendance: 0,
    activeSession: false,
    lastSync: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) {
        router.push('/admin')
        return
      }
    } catch (error) {
      router.push('/admin')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Đã đăng xuất!')
      router.push('/admin')
    } catch (error) {
      toast.error('Lỗi khi đăng xuất!')
    }
  }

  const menuItems = [
    {
      title: 'Quản lý phiên điểm danh',
      description: 'Tạo và quản lý các phiên điểm danh',
      icon: Calendar,
      href: '/admin/session',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Thống kê báo cáo',
      description: 'Xem thống kê và báo cáo điểm danh',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình thời gian và thiết lập',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Test Google Sheets API',
      description: 'Kiểm tra kết nối và thao tác Google Sheets',
      icon: TestTube,
      href: '/admin/test-sheets',
      color: 'from-orange-500 to-red-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/favicon.png" 
                alt="Học Lái Xe AZ Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/logohoclaixeaz.png';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Dashboard Quản trị
                </h1>
                <p className="text-sm text-slate-600">
                  Hệ thống điểm danh Học Lái Xe AZ
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Tổng học viên</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Điểm danh hôm nay</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.todayAttendance}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Trạng thái phiên</p>
                  <Badge variant={stats.activeSession ? "default" : "secondary"}>
                    {stats.activeSession ? "Đang hoạt động" : "Đã đóng"}
                  </Badge>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Đồng bộ cuối</p>
                  <p className="text-sm text-slate-900">{stats.lastSync || 'Chưa có'}</p>
                </div>
                <Database className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Menu Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${item.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => router.push(item.href)}
                      className="w-full"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Xem trang điểm danh
                </Button>
                
                <Button
                  onClick={fetchStats}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Làm mới thống kê
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}