/**
 * System and User Management Page
 * 
 * This page provides comprehensive user management functionality including:
 * - Display of both admin users and citizen users from ClimaTech-User database
 * - Search and filter capabilities
 * - Add new user functionality with form validation
 * - User permissions management
 * - System health monitoring
 * - Audit logs and system settings
 * 
 * Data Sources:
 * - Admin users: Local admin_users collection (mock data for now)
 * - Citizen users: Fetched from ClimaTech-User database via API
 * 
 * Features:
 * - Real-time user search and filtering
 * - Modal dialog for adding new users
 * - Role-based permission assignment
 * - User status management (active/inactive)
 * - Integrated system statistics
 */

"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Users,
  Activity,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  UserPlus,
  Download,
  Upload,
  RefreshCw,
  Server,
  HardDrive,
  X,
} from "lucide-react"
import { type AdminUser } from "@/lib/mongodb"

export default function AdminPage() {
  const [selectedUser, setSelectedUser] = useState("")
  const [systemMaintenance, setSystemMaintenance] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  
  // User action states
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUserForAction, setSelectedUserForAction] = useState<AdminUser | null>(null)

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    agency: "",
    permissions: [] as string[],
  })

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.role || !newUser.agency) {
        alert('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(prev => [...prev, data.user])
        setIsAddUserDialogOpen(false)
        setNewUser({ name: "", email: "", role: "", agency: "", permissions: [] })
        alert('User created successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    }
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setNewUser(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }))
  }

  // User action handlers
  const handleViewUser = (user: AdminUser) => {
    setSelectedUserForAction(user)
    setIsViewUserDialogOpen(true)
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUserForAction(user)
    setIsEditUserDialogOpen(true)
  }

  const handleToggleUserStatus = async (user: AdminUser) => {
    try {
      const newStatus = user.status === "active" ? "inactive" : "active"
      
      // Update local state immediately for better UX
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ))
      
      // In a real implementation, you would make an API call here
      // await fetch(`/api/admin/users/${user.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // })
      
      alert(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully!`)
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Failed to update user status')
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Update local state immediately for better UX
      setUsers(prev => prev.filter(u => u.id !== user.id))
      
      // In a real implementation, you would make an API call here
      // await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      
      alert('User deleted successfully!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role.toLowerCase().includes(roleFilter.toLowerCase())
    return matchesSearch && matchesRole
  })

  const availablePermissions = [
    "view_data",
    "create_alerts", 
    "manage_protocols",
    "update_weather",
    "update_seismic",
    "local_alerts",
    "admin_access"
  ]

  const systemStats = [
    { label: "Total Users", value: users.length.toString(), change: "+12", icon: Users },
    { label: "Active Sessions", value: "89", change: "+5", icon: Activity },
    { label: "System Uptime", value: "99.8%", change: "+0.1%", icon: Server },
    { label: "Data Storage", value: "2.4 TB", change: "+150 GB", icon: HardDrive },
  ]

  const systemHealth = [
    { component: "Weather API", status: "operational", uptime: "99.9%", response: "120ms" },
    { component: "Seismic Monitoring", status: "operational", uptime: "99.7%", response: "85ms" },
    { component: "Power Grid API", status: "maintenance", uptime: "98.5%", response: "200ms" },
    { component: "Emergency Alerts", status: "operational", uptime: "100%", response: "50ms" },
    { component: "AI Prediction Engine", status: "operational", uptime: "99.2%", response: "300ms" },
  ]

  const auditLogs = [
    {
      id: "AUD-001",
      timestamp: "2024-01-31 14:30:25",
      user: "Admin User",
      action: "User Created",
      details: "Created new user account for Maria Santos (PAGASA)",
      severity: "info",
    },
    {
      id: "AUD-002",
      timestamp: "2024-01-31 13:45:12",
      user: "Juan Dela Cruz",
      action: "Alert Issued",
      details: "Flood warning alert issued for Marikina River Basin",
      severity: "warning",
    },
    {
      id: "AUD-003",
      timestamp: "2024-01-31 12:15:08",
      user: "System",
      action: "Backup Completed",
      details: "Automated daily backup completed successfully",
      severity: "info",
    },
    {
      id: "AUD-004",
      timestamp: "2024-01-31 11:30:45",
      user: "Roberto Garcia",
      action: "Data Export",
      details: "Exported seismic data for January 2024",
      severity: "info",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "operational":
        return "bg-green-100 text-green-800"
      case "inactive":
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">System and User Management</h1>
            <p className="text-blue-600 mt-1">System administration and user management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch checked={systemMaintenance} onCheckedChange={setSystemMaintenance} id="maintenance" />
              <label htmlFor="maintenance" className="text-sm font-medium text-red-600">
                Maintenance Mode
              </label>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh System
            </Button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemStats.map((stat, index) => (
            <Card key={index} className="border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change} from last week</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-blue-50">
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              User Management
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              System Health
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              System Settings
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-3">
                <Input 
                  placeholder="Search users..." 
                  className="border-blue-200" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px] border-blue-200">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="coordinator">Emergency Coordinator</SelectItem>
                    <SelectItem value="analyst">Weather Analyst</SelectItem>
                    <SelectItem value="specialist">Seismic Specialist</SelectItem>
                    <SelectItem value="citizen">Citizen User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={newUser.role} onValueChange={(value: string) => setNewUser(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Emergency Coordinator">Emergency Coordinator</SelectItem>
                          <SelectItem value="Weather Analyst">Weather Analyst</SelectItem>
                          <SelectItem value="Seismic Specialist">Seismic Specialist</SelectItem>
                          <SelectItem value="LGU Coordinator">LGU Coordinator</SelectItem>
                          <SelectItem value="System Administrator">System Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agency">Agency *</Label>
                      <Select value={newUser.agency} onValueChange={(value: string) => setNewUser(prev => ({ ...prev, agency: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NDRRMC">NDRRMC</SelectItem>
                          <SelectItem value="PAGASA">PAGASA</SelectItem>
                          <SelectItem value="PHIVOLCS">PHIVOLCS</SelectItem>
                          <SelectItem value="Manila LGU">Manila LGU</SelectItem>
                          <SelectItem value="Quezon City LGU">Quezon City LGU</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availablePermissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={newUser.permissions.includes(permission)}
                              onCheckedChange={(checked: boolean) => handlePermissionChange(permission, checked as boolean)}
                            />
                            <Label htmlFor={permission} className="text-sm">{permission}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddUser} className="flex-1">
                        Create User
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddUserDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-blue-600">Loading users...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-blue-900">{user.name}</h3>
                              <p className="text-sm text-blue-600">{user.email}</p>
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
                                <span>
                                  {user.role} - {user.agency}
                                </span>
                                <span>Last login: {user.lastLogin}</span>
                                <Badge variant="outline" className="text-xs">
                                  {user.userType === 'citizen' ? 'Citizen User' : 'Admin User'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(user.permissions ?? []).map((permission, index) => (
                                  <Badge key={index} variant="outline" className="border-blue-200 text-blue-700 text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(user.status ?? 'active')}>
                            {(user.status ?? 'active').toUpperCase()}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-200 text-blue-700 bg-transparent"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-200 text-blue-700 bg-transparent"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-200 text-blue-700 bg-transparent"
                              onClick={() => handleToggleUserStatus(user)}
                            >
                              {user.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-200 text-red-700 bg-transparent"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6">
              {systemHealth.map((component, index) => (
                <Card key={index} className="border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Server className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">{component.component}</h3>
                          <p className="text-sm text-blue-600">System component monitoring</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-900">{component.uptime}</div>
                          <div className="text-xs text-blue-600">Uptime</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-900">{component.response}</div>
                          <div className="text-xs text-blue-600">Response Time</div>
                        </div>
                        <Badge className={getStatusColor(component.status)}>{component.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Backup Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Automatic Backup</label>
                    <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Backup Frequency</label>
                    <Select>
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Create Backup
                    </Button>
                    <Button variant="outline" className="border-blue-200 text-blue-700 flex-1 bg-transparent">
                      <Upload className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Alert Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Alert Level</label>
                    <Select>
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alert Timeout (minutes)</label>
                    <Input type="number" defaultValue="30" className="border-blue-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emergency Contact</label>
                    <Input defaultValue="911" className="border-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PAGASA API Endpoint</label>
                    <Input defaultValue="https://api.pagasa.dost.gov.ph" className="border-blue-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PHIVOLCS API Endpoint</label>
                    <Input defaultValue="https://api.phivolcs.dost.gov.ph" className="border-blue-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Rate Limit (requests/hour)</label>
                    <Input type="number" defaultValue="1000" className="border-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Timeout (hours)</label>
                    <Input type="number" defaultValue="8" className="border-blue-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password Policy</label>
                    <Select>
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="Select policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (8 characters)</SelectItem>
                        <SelectItem value="medium">Medium (12 characters + symbols)</SelectItem>
                        <SelectItem value="strong">Strong (16 characters + complexity)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Two-Factor Authentication</label>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-3">
                <Input placeholder="Search logs..." className="border-blue-200" />
                <Select>
                  <SelectTrigger className="w-[180px] border-blue-200">
                    <SelectValue placeholder="Filter by severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="border-blue-200 text-blue-700 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <Card key={log.id} className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-blue-900">{log.action}</h4>
                            <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>User: {log.user}</span>
                              <span>Time: {log.timestamp}</span>
                            </div>
                          </div>
                          <Badge className={getSeverityColor(log.severity)}>{log.severity.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View User Dialog */}
      <Dialog open={isViewUserDialogOpen} onOpenChange={setIsViewUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUserForAction && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">{selectedUserForAction.name}</h3>
                  <p className="text-sm text-blue-600">{selectedUserForAction.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Role:</label>
                  <p className="text-gray-900">{selectedUserForAction.role}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Agency:</label>
                  <p className="text-gray-900">{selectedUserForAction.agency}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Status:</label>
                  <Badge className={getStatusColor(selectedUserForAction.status ?? 'active')}>
                    {(selectedUserForAction.status ?? 'active').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="font-medium text-gray-700">User Type:</label>
                  <Badge variant="outline">
                    {selectedUserForAction.userType === 'citizen' ? 'Citizen User' : 'Admin User'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Last Login:</label>
                <p className="text-gray-900">{selectedUserForAction.lastLogin}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Permissions:</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selectedUserForAction.permissions ?? []).map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewUserDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUserForAction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={selectedUserForAction.name}
                  onChange={(e) => setSelectedUserForAction(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={selectedUserForAction.email}
                  onChange={(e) => setSelectedUserForAction(prev => 
                    prev ? { ...prev, email: e.target.value } : null
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={selectedUserForAction.role} 
                  onValueChange={(value: string) => setSelectedUserForAction(prev => 
                    prev ? { ...prev, role: value } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emergency Coordinator">Emergency Coordinator</SelectItem>
                    <SelectItem value="Weather Analyst">Weather Analyst</SelectItem>
                    <SelectItem value="Seismic Specialist">Seismic Specialist</SelectItem>
                    <SelectItem value="LGU Coordinator">LGU Coordinator</SelectItem>
                    <SelectItem value="System Administrator">System Administrator</SelectItem>
                    <SelectItem value="Citizen">Citizen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Agency</Label>
                <Select 
                  value={selectedUserForAction.agency} 
                  onValueChange={(value: string) => setSelectedUserForAction(prev => 
                    prev ? { ...prev, agency: value } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NDRRMC">NDRRMC</SelectItem>
                    <SelectItem value="PAGASA">PAGASA</SelectItem>
                    <SelectItem value="PHIVOLCS">PHIVOLCS</SelectItem>
                    <SelectItem value="Manila LGU">Manila LGU</SelectItem>
                    <SelectItem value="Quezon City LGU">Quezon City LGU</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    // In real implementation, make API call to update user
                    alert('User updated successfully!')
                    setIsEditUserDialogOpen(false)
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditUserDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
