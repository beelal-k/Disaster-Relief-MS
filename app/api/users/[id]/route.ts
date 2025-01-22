import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';
import jwt from 'jsonwebtoken';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await User.findById(id);
    if (!currentUser || currentUser.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await req.json();
    if (!role) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    try {
        const user = await User.findById(params.id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Don't allow changing admin's role
        if (user.role === 'admin') {
            return NextResponse.json(
                { error: 'Cannot change admin role' },
                { status: 400 }
            );
        }

        user.role = role;
        await user.save();

        // Generate new token with updated role
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        return NextResponse.json({ user, token });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        );
    }
} 