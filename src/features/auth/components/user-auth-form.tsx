"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { authService } from "@/features/auth/api/auth-service"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

// Schema for Login
const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

// Schema for 2FA
const otpSchema = z.object({
    otp: z.string().min(6, { message: "OTP must be 6 characters" }),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    onSuccessRedirect?: string
}

export function UserAuthForm({ className, onSuccessRedirect = "/dashboard/all", ...props }: UserAuthFormProps) {
    const router = useRouter()
    const { setAuth } = useAuthStore()
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [requires2FA, setRequires2FA] = React.useState<boolean>(false)
    const [userId, setUserId] = React.useState<number | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const [showPassword, setShowPassword] = React.useState<boolean>(false)

    // Login Form Hook
    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    // OTP Form Hook
    const otpForm = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
        },
    })

    // Handle Login Submit
    async function onLoginSubmit(data: z.infer<typeof loginSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const response = await authService.login(data)

            // Check if 2FA is required
            if ('requires_2fa' in response.data && response.data.requires_2fa) {
                setRequires2FA(true)
                setUserId(response.data.user_id)
                toast.info(response.message || "Please enter the OTP sent to your device.")
            }
            // User logged in directly
            else if ('access_token' in response.data) {
                setAuth(response.data.user, response.data.access_token)
                toast.success("Login successful")
                const redirectPath = onSuccessRedirect === "/dashboard"
                    ? (response.data.user.role === 'Client' ? "/dashboard/external" : "/dashboard/all")
                    : onSuccessRedirect;
                router.push(redirectPath)
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Invalid email or password."
            setError(msg)
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle OTP Submit
    async function onOtpSubmit(data: z.infer<typeof otpSchema>) {
        if (!userId) return

        setIsLoading(true)
        setError(null)
        try {
            const response = await authService.verify2FA({
                user_id: userId,
                otp: data.otp
            })

            if (response.status === 'success') {
                setAuth(response.data.user, response.data.access_token)
                toast.success("Authentication successful")
                const redirectPath = onSuccessRedirect === "/dashboard"
                    ? (response.data.user.role === 'Client' ? "/dashboard/external" : "/dashboard/all")
                    : onSuccessRedirect;
                router.push(redirectPath)
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Invalid OTP Code"
            setError(msg)
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    // Render OTP Form
    if (requires2FA) {
        return (
            <div className={cn("grid gap-6", className)} {...props}>
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                        <div className="flex flex-col items-center justify-center space-y-2 text-center">
                            <h3 className="font-semibold text-lg">Enter OTP</h3>
                            <p className="text-sm text-muted-foreground">Please enter the 6-digit code sent to your WhatsApp/Email.</p>
                        </div>
                        <FormField
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem className="flex justify-center">
                                    <FormControl>
                                        <InputOTP maxLength={6} {...field}>
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Verify Code
                        </Button>
                        <Button
                            variant="ghost"
                            type="button"
                            className="w-full"
                            onClick={() => setRequires2FA(false)}
                        >
                            Back to Login
                        </Button>
                    </form>
                </Form>
            </div>
        )
    }

    // Render Login Form
    return (
        <div className={cn("grid gap-6", className)} {...props}>
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="name@example.com" type="email" autoCapitalize="none" autoComplete="email" autoCorrect="off" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="••••••••"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            className="pr-10"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Sign In
                    </Button>
                </form>
            </Form>
        </div>
    )
}
