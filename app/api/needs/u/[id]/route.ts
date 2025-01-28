import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await getToken(req);
    const { id: userId } = await params;
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Find all needs created by the user
        const needs = await Need.find({ createdBy: userId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .populate('createdBy', 'email'); // Include creator's email

        return NextResponse.json(needs);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch needs' },
            { status: 500 }
        );
    }
}
