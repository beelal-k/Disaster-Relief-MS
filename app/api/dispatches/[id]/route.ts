import { connectDB } from '@/lib/db/mongoose';
import { Dispatch } from '@/lib/db/models/Dispatch.model';
import { Need } from '@/lib/db/models/Need.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id: userId } = await getToken(req);
    const { id } = await params;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { status } = await req.json();

        if (!status || !['reached', 'cancelled'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        const dispatch = await Dispatch.findById(id);
        if (!dispatch) {
            return NextResponse.json(
                { error: 'Dispatch not found' },
                { status: 404 }
            );
        }

        // Update dispatch status
        dispatch.status = status;
        await dispatch.save();

        // If the dispatch is marked as reached, update the need's fulfilled quantity
        if (status === 'reached') {
            const need = await Need.findById(dispatch.need);
            if (need) {
                need.fulfilledQuantity += dispatch.resourceAmount;
                if (need.fulfilledQuantity >= need.requiredQuantity) {
                    need.status = 'completed';
                }
                await need.save();
            }
        }

        return NextResponse.json({
            message: `Dispatch marked as ${status}`,
            dispatch
        });
    } catch (error: any) {
        console.log(error);
        return NextResponse.json(
            { error: error.message || 'Failed to update dispatch status' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const dispatch = await Dispatch.findById(id);
        return NextResponse.json(dispatch);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dispatch' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const dispatch = await Dispatch.findByIdAndDelete(id);
        return NextResponse.json(dispatch);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to delete dispatch' },
            { status: 500 }
        );
    }
}
