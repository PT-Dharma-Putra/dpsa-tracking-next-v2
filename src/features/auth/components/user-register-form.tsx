"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { authService } from "@/features/auth/api/auth-service"
import { cn } from "@/lib/utils"

const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    password_confirmation: z.string(),
    role: z.string().min(1, "Please select a role"),
    divisi: z.string().min(1, "Please select a division"),
}).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
})

interface UserRegisterFormProps extends React.HTMLAttributes<HTMLDivElement> { }

// Backend expects Title Case, but we display UPPERCASE
const ALLOWED_ROLES = [
    'Marketing', 'Studio', 'Gudang', 'Produksi',
    'Keuangan', 'Quality Control', 'PPIC',
    'Pincab', 'Corsec', 'Purchasing'
]

const ALLOWED_DIVISIONS = [
    'DPSA', 'KJAS', 'SSDA', 'SDB', 'UISA',
    'DCA', 'BACY', 'SMB', 'KPSA', 'ASD'
]

export function UserRegisterForm({ className, ...props }: UserRegisterFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false)

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            divisi: "",
        },
    })

    async function onSubmit(data: z.infer<typeof registerSchema>) {
        setIsLoading(true)
        try {
            await authService.registerInternal(data)
            // On success, show modal instead of toast + redirect
            setShowSuccessModal(true)
        } catch (error: any) {
            toast.error("Registration failed", {
                description: error.response?.data?.message || "Something went wrong",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCloseModal = () => {
        setShowSuccessModal(false)
        router.push("/auth/internal/login")
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Work Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="name@dharmaputrainterior.co.id" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ROLE</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="SELECT ROLE" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ALLOWED_ROLES.map((role) => (
                                                <SelectItem key={role} value={role}>{role.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="divisi"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>DIVISI</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="SELECT DIVISI" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ALLOWED_DIVISIONS.map((div) => (
                                                <SelectItem key={div} value={div}>{div}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password_confirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        REGISTER ACCOUNT
                    </Button>
                </form>
            </Form>

            {/* Success Modal */}
            <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-orange-600">
                            Registration Successful!
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-600 dialog-desc">
                            Your account has been created successfully.
                            <br /><br />
                            <strong>Important:</strong> You cannot login immediately. Your account is currently <strong>PENDING APPROVAL</strong> by the Administrator.
                            <br /><br />
                            Please check your email/WhatsApp periodically. You will be notified once your account is active.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={handleCloseModal}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            I Understand, Back to Login
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
