"use client"

import { useEffect, useState } from "react"
import { User } from "@/types"
import UsersTable from "./UsersTable"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"

const Users = () => {
    const [users, setUsers] = useState<User[]>([])
    const { toast } = useToast()

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`/api/admin/users`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            setUsers(res.data.users)
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to fetch users",
                variant: "destructive"
            })
            return Promise.reject(error)
        }
    }

    const handleEdit = async (user: User, data: any) => {
        try {
            await axios.patch(`/api/admin/users`, {
                userId: user._id,
                updates: data
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            await fetchUsers()
            toast({
                title: "Success",
                description: "User updated successfully"
            })
            return Promise.resolve()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update user",
                variant: "destructive"
            })
            return Promise.reject(error)
        }
    }

    const handleDelete = async (userId: string) => {
        try {
            await axios.delete(`/api/admin/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            await fetchUsers()
            toast({
                title: "Success",
                description: "User deleted successfully"
            })
            return Promise.resolve()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to delete user",
                variant: "destructive"
            })
            return Promise.reject(error)
        }
    }

    const handleMakeAdmin = async (user: User) => {
        try {
            await axios.patch(`/api/admin/users`, {
                userId: user._id,
                updates: { role: 'admin' }
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })
            await fetchUsers()
            toast({
                title: "Success",
                description: `${user.name || user.email} is now an admin`
            })
            return Promise.resolve()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to make user admin",
                variant: "destructive"
            })
            return Promise.reject(error)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    return (
        <div className="space-y-6 p-5">
            <h1 className="text-3xl font-bold text-white">Users</h1>
            <UsersTable
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMakeAdmin={handleMakeAdmin}
            />
        </div>
    )
}

export default Users