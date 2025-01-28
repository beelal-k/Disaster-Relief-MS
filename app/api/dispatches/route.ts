import { connectDB } from '@/lib/db/mongoose';
import { Dispatch } from '@/lib/db/models/Dispatch.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function GET(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dispatches = await Dispatch.find()
            .populate({
                path: 'need',
                select: 'type description location requiredQuantity createdBy',
                populate: {
                    path: 'createdBy',
                    select: 'email'
                }
            })
            .sort({ dispatchedAt: -1 });

        return NextResponse.json(dispatches);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dispatches' },
            { status: 500 }
        );
    }
} 