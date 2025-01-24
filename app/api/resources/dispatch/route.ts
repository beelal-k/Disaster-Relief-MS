import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function POST(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { needId, eta } = await req.json();

    // Validate required fields
    if (!needId || !eta) {
        return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
        );
    }

    try {
        // Check if the need exists and is still pending
        const need = await Need.findById(needId);
        if (!need) {
            return NextResponse.json(
                { error: 'Need not found' },
                { status: 404 }
            );
        }

        if (need.status !== 'pending') {
            return NextResponse.json(
                { error: 'This need is already being handled' },
                { status: 400 }
            );
        }

        // Update the need status and assign it to the organization
        need.status = 'in-progress';
        need.eta = eta;
        need.fulfilledQuantity = 0;
        await need.save();

        return NextResponse.json({
            message: 'Resources dispatched successfully',
            need
        });
    } catch (error: any) {
        console.error('Error dispatching resources:', error);
        return NextResponse.json(
            { error: 'Failed to dispatch resources' },
            { status: 500 }
        );
    }
} 