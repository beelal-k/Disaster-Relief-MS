import { connectDB } from "@/lib/db/mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/api";
import { User } from "@/lib/db/models/User.model";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = await getToken(req);
        const { id: userId } = await params;
        if (!token || token.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();


        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent deleting the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return NextResponse.json({
                    error: 'Cannot delete the last admin user'
                }, { status: 400 });
            }
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            message: 'User deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to delete user'
        }, { status: 500 });
    }
}