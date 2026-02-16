"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { axiosInstance } from "@/lib/axios"

const registerSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    password_confirmation: z.string(),
    client_id: z.number(),
    category_ids: z.array(z.number()).optional(),
}).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
})

interface ClientCategory {
    id: number;
    name: string;
    label: string;
}

interface CustomerRegisterFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CustomerRegisterForm({ className, ...props }: CustomerRegisterFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | null>(null)

    // Get client_id from URL
    const clientIdParam = searchParams.get('client_id')
    const clientId = clientIdParam ? parseInt(clientIdParam) : undefined

    // Fetch available client categories
    const { data: categories = [] } = useQuery<ClientCategory[]>({
        queryKey: ['client-categories'],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/client-categories')
            return data.data ?? data
        },
    })

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            client_id: clientId,
            category_ids: [],
        },
    })

    // Validate Client ID on mount
    React.useEffect(() => {
        if (!clientId || isNaN(clientId)) {
            setError("Invalid Invitation Link. Please contact support.")
        }
    }, [clientId])

    async function onSubmit(data: z.infer<typeof registerSchema>) {
        if (error) return

        setIsLoading(true)
        try {
            await authService.registerExternal(data)
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
        router.push("/auth/external/login")
    }

    if (error) {
        return (
            <div className="p-4 rounded-md bg-red-50 text-red-500 text-center border border-red-200">
                <p className="font-semibold">Registration Unavailable</p>
                <p className="text-sm mt-1">{error}</p>
            </div>
        )
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
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="name@company.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Hidden Client ID */}
                    <input type="hidden" {...form.register('client_id')} />

                    {/* Client Categories Selection */}
                    {categories.length > 0 && (
                        <FormField
                            control={form.control}
                            name="category_ids"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Client Categories</FormLabel>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Select the categories that apply to your company.
                                    </p>
                                    <div className="space-y-2">
                                        {categories.map((cat) => (
                                            <FormField
                                                key={cat.id}
                                                control={form.control}
                                                name="category_ids"
                                                render={({ field }) => {
                                                    const currentValues = field.value ?? [];
                                                    return (
                                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={currentValues.includes(cat.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            field.onChange([...currentValues, cat.id])
                                                                        } else {
                                                                            field.onChange(currentValues.filter((id) => id !== cat.id))
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="text-sm font-normal cursor-pointer">
                                                                {cat.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

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

                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        CREATE CUSTOMER ACCOUNT
                    </Button>
                </form>
            </Form>

            {/* Success Modal */}
            <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-blue-600">
                            Account Created!
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-600 dialog-desc">
                            Your customer account has been registered successfully.
                            <br /><br />
                            Your account is currently <strong>PENDING APPROVAL</strong>.
                            <br /><br />
                            Please check your email. We will notify you once your access is approved by DPSA Admin.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={handleCloseModal}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Return to Login
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
