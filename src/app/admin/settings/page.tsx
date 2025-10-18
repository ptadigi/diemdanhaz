'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Clock, 
  Save,
  ArrowLeft,
  Bell,
  Database,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SystemSettings {
  defaultSessionDuration: number
  autoEndSession: boolean
  notificationEmail: string
  syncInterval: number
  enableNotifications: boolean
  maintenanceMode: boolean
  googleSheetsEnabled: boolean
  backupEnabled: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings>({
    defaultSessionDuration: 20,
    autoEndSession: true,
    notificationEmail: '',
    syncInterval: 5,
    enableNotifications: false,
    maintenanceMode: false,
    googleSheetsEnabled: true,
    backupEnabled: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchSettings()
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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Lỗi khi tải cài đặt')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Lưu cài đặt thành công!')
      } else {
        toast.error('Lỗi khi lưu cài đặt')
      }
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt')
    } finally {
      setIsSaving(false)
    }
  }

  const testGoogleSheetsConnection = async () => {
    try {
      // Test kết nối ZAI SDK và Google Sheets
      const response = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          toast.success('✅ Kết nối thành công! ZAI SDK và Google Sheets sẵn sàng.')
          console.log('Connection test result:', result.data)
        } else {
          toast.error(`❌ Lỗi: ${result.error}`)
        }
      } else {
        const error = await response.json()
        toast.error(`❌ Lỗi kết nối: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Connection test error:', error)
      toast.error('❌ Lỗi kết nối: ' + (error as Error).message)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin/dashboard')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Cài đặt hệ thống
                </h1>
                <p className="text-sm text-slate-600">
                  Cấu hình thời gian và thiết lập hệ thống
                </p>
              </div>
            </div>
            
            <Button
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu cài đặt
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Cài đặt phiên điểm danh
                </CardTitle>
                <CardDescription>
                  Cấu hình mặc định cho các phiên điểm danh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="duration">Thời lượng mặc định (phút)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={settings.defaultSessionDuration}
                    onChange={(e) => setSettings({
                      ...settings, 
                      defaultSessionDuration: parseInt(e.target.value) || 20
                    })}
                    min="5"
                    max="120"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoEnd">Tự động kết thúc phiên</Label>
                    <p className="text-sm text-slate-600">
                      Tự động kết thúc phiên khi hết thời gian
                    </p>
                  </div>
                  <Switch
                    id="autoEnd"
                    checked={settings.autoEndSession}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      autoEndSession: checked
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Cài đặt thông báo
                </CardTitle>
                <CardDescription>
                  Cấu hình hệ thống thông báo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email thông báo</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => setSettings({
                      ...settings, 
                      notificationEmail: e.target.value
                    })}
                    placeholder="admin@hoclaixeaz.com"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableNotifications">Bật thông báo</Label>
                    <p className="text-sm text-slate-600">
                      Gửi thông báo khi có sự kiện quan trọng
                    </p>
                  </div>
                  <Switch
                    id="enableNotifications"
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      enableNotifications: checked
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Database Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Cài đặt dữ liệu
                </CardTitle>
                <CardDescription>
                  Cấu hình đồng bộ và sao lưu dữ liệu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="syncInterval">Chu kỳ đồng bộ (phút)</Label>
                  <Input
                    id="syncInterval"
                    type="number"
                    value={settings.syncInterval}
                    onChange={(e) => setSettings({
                      ...settings, 
                      syncInterval: parseInt(e.target.value) || 5
                    })}
                    min="1"
                    max="60"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="backupEnabled">Bật sao lưu tự động</Label>
                    <p className="text-sm text-slate-600">
                      Tự động sao lưu dữ liệu hàng ngày
                    </p>
                  </div>
                  <Switch
                    id="backupEnabled"
                    checked={settings.backupEnabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      backupEnabled: checked
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Cài đặt hệ thống
                </CardTitle>
                <CardDescription>
                  Cấu hình bảo mật và bảo trì
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="googleSheetsEnabled">Google Sheets API</Label>
                    <p className="text-sm text-slate-600">
                      Bật đồng bộ với Google Sheets
                    </p>
                  </div>
                  <Switch
                    id="googleSheetsEnabled"
                    checked={settings.googleSheetsEnabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      googleSheetsEnabled: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Chế độ bảo trì</Label>
                    <p className="text-sm text-slate-600">
                      Tạm thời vô hiệu hóa hệ thống
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({
                      ...settings, 
                      maintenanceMode: checked
                    })}
                  />
                </div>

                {settings.googleSheetsEnabled && (
                  <div className="pt-2">
                    <Button
                      onClick={testGoogleSheetsConnection}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Kiểm tra kết nối ZAI SDK & Google Sheets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Status Alert */}
        {settings.maintenanceMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Alert>
              <AlertDescription className="text-orange-600">
                ⚠️ Hệ thống đang ở chế độ bảo trì. Người dùng sẽ không thể truy cập trang điểm danh.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>
    </div>
  )
}