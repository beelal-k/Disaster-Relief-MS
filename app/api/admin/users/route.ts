import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';
// @ts-ignore
import bcrypt from 'bcryptjs';

// GET all users (Admin only)
export async function GET(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Check if the requester is an admin
        const admin = await User.findById(id);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await User.find()
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 }); // Sort by newest first

        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST create new user (Admin only)
export async function POST(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Check if the requester is an admin
        const admin = await User.findById(id);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, password, name, role } = await req.json();

        // Validate required fields
        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            email,
            password: hashedPassword,
            name,
            role
        });

        // Return user without password
        const userWithoutPassword = {
            _id: newUser._id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };

        return NextResponse.json(userWithoutPassword);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        );
    }
}

// PATCH update user (Admin only)
export async function PATCH(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Check if the requester is an admin
        const admin = await User.findById(id);
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, updates } = await req.json();
        if (!userId || !updates) {
            return NextResponse.json(
                { error: 'User ID and updates are required' },
                { status: 400 }
            );
        }

        // Don't allow updating password through this route
        if (updates.password) {
            delete updates.password;
        }

        // Find and update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE user (Admin only)
export async function DELETE(req: NextRequest) {
    try {
        const token = await getToken(req);
        if (!token || token.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { userId } = await req.json();

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
