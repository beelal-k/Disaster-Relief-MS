import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { User } from "@/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, UserCog, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface IUsersTableProps {
    users: User[]
    onEdit: (user: User, data: any) => Promise<void>
    onDelete: (user: User) => Promise<void>
    onMakeAdmin: (user: User) => Promise<void>
}

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
})

const UsersTable = ({ users, onEdit, onDelete, onMakeAdmin }: IUsersTableProps) => {
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [userToMakeAdmin, setUserToMakeAdmin] = useState<User | null>(null)
    const [userToEdit, setUserToEdit] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState<{
        delete?: boolean;
        makeAdmin?: boolean;
        edit?: boolean;
    }>({})

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: userToEdit?.name || "",
        },
    })

    const handleDelete = async (userId: string) => {
        if (!userId) return
        setIsLoading(prev => ({ ...prev, delete: true }))
        try {
            console.log(userId)
            await onDelete(userId)
        } finally {
            setIsLoading(prev => ({ ...prev, delete: false }))
            setUserToDelete(null)
        }
    }

    const handleMakeAdmin = async () => {
        if (!userToMakeAdmin) return
        setIsLoading(prev => ({ ...prev, makeAdmin: true }))
        try {
            await onMakeAdmin(userToMakeAdmin)
        } finally {
            setIsLoading(prev => ({ ...prev, makeAdmin: false }))
            setUserToMakeAdmin(null)
        }
    }

    const handleEdit = async (data: z.infer<typeof formSchema>) => {
        if (!userToEdit) return
        setIsLoading(prev => ({ ...prev, edit: true }))
        try {
            await onEdit(userToEdit, data)
            setUserToEdit(null)
            form.reset()
        } finally {
            setIsLoading(prev => ({ ...prev, edit: false }))
        }
    }

    return (
        <>
            <Table className="text-white">
                <TableCaption>A list of all users.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-white">Name</TableHead>
                        <TableHead className="text-white">Email</TableHead>
                        <TableHead className="text-white">Role</TableHead>
                        <TableHead className="text-white">Joined</TableHead>
                        <TableHead className="text-white text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user._id}>
                            <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                            <TableCell>{user.email || "N/A"}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        ref={(ref) => {
                                            if (!ref) return;
                                            ref.style.zIndex = "9999";
                                        }}
                                        align="end"
                                        className="z-[9999] bg-black/70 backdrop-blur-sm border-white/10 min-w-[8rem]"
                                        sideOffset={5}
                                    >
                                        <DropdownMenuItem
                                            className="text-white hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white"
                                            onClick={() => {
                                                setUserToEdit(user)
                                                form.setValue("name", user.name)
                                            }}
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-white hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white"
                                            onClick={() => handleDelete(user._id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                        {user.role !== "admin" && (
                                            <DropdownMenuItem
                                                className="text-white hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white"
                                                onClick={() => setUserToMakeAdmin(user)}
                                            >
                                                <UserCog className="mr-2 h-4 w-4" />
                                                Make Admin
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent className="bg-[#090909]/90 backdrop-blur-md border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            This action cannot be undone. This will permanently delete the user's account
                            and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 text-white hover:bg-red-600"
                            disabled={isLoading.delete}
                        >
                            {isLoading.delete ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Make Admin Confirmation Dialog */}
            <AlertDialog open={!!userToMakeAdmin} onOpenChange={() => setUserToMakeAdmin(null)}>
                <AlertDialogContent className="bg-[#090909]/90 backdrop-blur-md border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Make user an admin?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            This will give {userToMakeAdmin?.name} full administrative access to the platform.
                            Please make sure you trust this user with these permissions.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleMakeAdmin}
                            className="bg-white text-black hover:bg-white/90"
                            disabled={isLoading.makeAdmin}
                        >
                            {isLoading.makeAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit User Dialog */}
            <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
                <DialogContent className="bg-[#090909]/90 backdrop-blur-md border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit User</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Make changes to the user's profile here.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="bg-transparent border border-white/10 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="space-y-4">
                                <FormItem>
                                    <FormLabel className="text-white">Email</FormLabel>
                                    <Input
                                        type="email"
                                        value={userToEdit?.email}
                                        disabled
                                        className="bg-transparent border border-white/10 text-white/60 cursor-not-allowed"
                                    />
                                    <p className="text-sm text-white/60 mt-1">Email cannot be changed</p>
                                </FormItem>
                                <FormItem>
                                    <FormLabel className="text-white">Password</FormLabel>
                                    <Input
                                        type="password"
                                        value="••••••••"
                                        disabled
                                        className="bg-transparent border border-white/10 text-white/60 cursor-not-allowed"
                                    />
                                    <p className="text-sm text-white/60 mt-1">Password cannot be changed from here</p>
                                </FormItem>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={isLoading.edit}
                                    className="bg-white text-black hover:bg-white/90"
                                >
                                    {isLoading.edit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default UsersTable