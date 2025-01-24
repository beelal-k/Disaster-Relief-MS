import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { Stock } from '@/lib/db/models/Stock.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await getToken(req);
    const { id: paramId } = await params;
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { quantity } = await req.json();
    const need = await Need.findById(paramId);

    if (!need) {
        return NextResponse.json(
            { error: 'Need not found' },
            { status: 404 }
        );
    }

    // Check if we have enough stock
    const stock = await Stock.findOne({ type: need.type });
    if (!stock || stock.quantity < quantity) {
        return NextResponse.json(
            { error: 'Insufficient stock' },
            { status: 400 }
        );
    }

    try {
        // Update stock
        stock.quantity -= quantity;
        await stock.save();

        // Update need
        need.fulfilledQuantity += quantity;
        if (need.fulfilledQuantity >= need.requiredQuantity) {
            need.status = 'resolved';
        } else if (need.status === 'pending') {
            need.status = 'in-progress';
        }
        await need.save();

        return NextResponse.json(need);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fulfill need' },
            { status: 400 }
        );
    }
} 