import { connectDB } from '@/lib/db/mongoose';
import { Stock } from '@/lib/db/models/Stock.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

// Get all stock
export async function GET(req: NextRequest) {
    await connectDB();
    const stock = await Stock.find().sort({ type: 1 });
    return NextResponse.json(stock);
}

// Add or update stock
export async function POST(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, quantity } = await req.json();

    try {
        // Try to update existing stock first
        const existingStock = await Stock.findOne({ type });
        if (existingStock) {
            existingStock.quantity += quantity;
            await existingStock.save();
            return NextResponse.json(await Stock.find().sort({ type: 1 }));
        }

        // Create new stock if it doesn't exist
        await Stock.create({ type, quantity });
        return NextResponse.json(await Stock.find().sort({ type: 1 }));
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update stock' },
            { status: 400 }
        );
    }
}

// Update stock quantity
export async function PATCH(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, quantity } = await req.json();

    try {
        const stock = await Stock.findOne({ type });
        if (!stock) {
            return NextResponse.json(
                { error: 'Stock not found' },
                { status: 404 }
            );
        }

        stock.quantity = quantity;
        await stock.save();
        return NextResponse.json(await Stock.find().sort({ type: 1 }));
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update stock' },
            { status: 400 }
        );
    }
} 