import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { Dispatch } from '@/lib/db/models/Dispatch.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id: userId } = await getToken(req);
    const needId = (await params).id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { eta, resourceAmount } = await req.json();

        console.log(eta, resourceAmount);

        if (!eta || !resourceAmount) {
            return NextResponse.json(
                { error: 'ETA and resource amount are required' },
                { status: 400 }
            );
        }

        // Find the need
        const need = await Need.findById(needId);
        if (!need) {
            return NextResponse.json(
                { error: 'Need not found' },
                { status: 404 }
            );
        }

        // Check if the need is already completed
        if (need.status === 'completed') {
            return NextResponse.json(
                { error: 'Need is already completed' },
                { status: 400 }
            );
        }

        // Create a new dispatch
        const dispatch = await Dispatch.create({
            need: need._id,
            eta,
            resourceAmount,
            status: 'dispatched'
        });

        // Update the need
        need.status = 'resources-dispatched';
        need.dispatches.push(dispatch._id);
        await need.save();

        return NextResponse.json({
            message: 'Resources dispatched successfully',
            dispatch
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to dispatch resources' },
            { status: 500 }
        );
    }
}

// Mark dispatch as reached
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await connectDB();
    const { id: userId } = await getToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { dispatchId } = await req.json();

        if (!dispatchId) {
            return NextResponse.json(
                { error: 'Dispatch ID is required' },
                { status: 400 }
            );
        }

        // Find the need and dispatch
        const need = await Need.findById(params.id);
        if (!need) {
            return NextResponse.json(
                { error: 'Need not found' },
                { status: 404 }
            );
        }

        const dispatch = await Dispatch.findById(dispatchId);
        if (!dispatch) {
            return NextResponse.json(
                { error: 'Dispatch not found' },
                { status: 404 }
            );
        }

        // Update dispatch status
        dispatch.status = 'reached';
        await dispatch.save();

        // Update need status and fulfilled quantity
        need.fulfilledQuantity += dispatch.resourceAmount;
        if (need.fulfilledQuantity >= need.requiredQuantity) {
            need.status = 'completed';
        }
        await need.save();

        return NextResponse.json({
            message: 'Dispatch marked as reached',
            dispatch,
            need
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update dispatch status' },
            { status: 500 }
        );
    }
} 