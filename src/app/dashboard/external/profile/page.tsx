"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { axiosInstance } from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Lock, Save, Loader2, KeyRound } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [passwords, setPasswords] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: ""
    })

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwords.new_password !== passwords.new_password_confirmation) {
            toast.error("Konfirmasi password baru tidak cocok")
            return
        }

        setIsLoading(true)
        try {
            await axiosInstance.post("/change-password", passwords)
            toast.success("Password berhasil diubah")
            setPasswords({
                current_password: "",
                new_password: "",
                new_password_confirmation: ""
            })
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal mengubah password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 shadow-sm border border-orange-200">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">User Profile</h1>
                    <p className="text-muted-foreground text-sm">Manage your personal information and security settings.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Account Info */}
                <Card className="md:col-span-1 border-neutral-200 shadow-sm overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-orange-500 to-amber-600" />
                    <CardHeader className="relative pt-0 -mt-12 items-center">
                        <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
                             <div className="h-full w-full bg-orange-50 text-orange-600 font-bold text-3xl flex items-center justify-center uppercase">
                                {user?.name?.substring(0, 2) || 'CL'}
                            </div>
                        </div>
                        <CardTitle className="mt-4 text-center">{user?.name}</CardTitle>
                        <CardDescription className="text-center">{user?.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-md shadow-sm text-neutral-500">
                                <KeyRound className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Account Role</p>
                                <p className="text-sm font-semibold text-neutral-700">{user?.role || 'Client'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Form */}
                <Card className="md:col-span-2 border-neutral-200 shadow-sm">
                    <CardHeader className="border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-orange-600" />
                            <CardTitle className="text-lg">Change Password</CardTitle>
                        </div>
                        <CardDescription>Secure your account by updating your password regularly.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input 
                                    id="current_password"
                                    type="password"
                                    required
                                    value={passwords.current_password}
                                    onChange={e => setPasswords({...passwords, current_password: e.target.value})}
                                    className="bg-neutral-50 border-neutral-200 focus:bg-white"
                                    placeholder="Enter your current password"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="new_password">New Password</Label>
                                    <Input 
                                        id="new_password"
                                        type="password"
                                        required
                                        value={passwords.new_password}
                                        onChange={e => setPasswords({...passwords, new_password: e.target.value})}
                                        className="bg-neutral-50 border-neutral-200 focus:bg-white"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                                    <Input 
                                        id="confirm_password"
                                        type="password"
                                        required
                                        value={passwords.new_password_confirmation}
                                        onChange={e => setPasswords({...passwords, new_password_confirmation: e.target.value})}
                                        className="bg-neutral-50 border-neutral-200 focus:bg-white"
                                        placeholder="Repeat new password"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 px-8 transition-all hover:scale-[1.02]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Update Password
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
