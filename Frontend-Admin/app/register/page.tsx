"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    designation: "",
    agency: "",
    province: "",
    city: "",
    barangay: "",
    contactNumber: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle registration logic here
    console.log("Registration data:", formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-900" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-900">Register for ClimaTech AI</CardTitle>
            <p className="text-blue-700">Join the disaster management network</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation/Role</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency/Institution</Label>
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="border-blue-200 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Location Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">
                  Location Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, province: value })}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metro-manila">Metro Manila</SelectItem>
                        <SelectItem value="cebu">Cebu</SelectItem>
                        <SelectItem value="davao">Davao</SelectItem>
                        <SelectItem value="laguna">Laguna</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City/Municipality</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, city: value })}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quezon-city">Quezon City</SelectItem>
                        <SelectItem value="manila">Manila</SelectItem>
                        <SelectItem value="makati">Makati</SelectItem>
                        <SelectItem value="taguig">Taguig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Barangay</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, barangay: value })}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select Barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="barangay-1">Barangay 1</SelectItem>
                        <SelectItem value="barangay-2">Barangay 2</SelectItem>
                        <SelectItem value="barangay-3">Barangay 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">Contact Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Account Creation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">Account Creation</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="border-blue-200 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="border-blue-200 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 py-3 text-lg">
                Register
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
