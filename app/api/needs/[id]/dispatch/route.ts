import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { Resource } from '@/lib/db/models/Resource.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await getToken(req);
    const { id: paramId } = await params;
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {  eta } = await req.json();

    try {
        // Find the need
        const need = await Need.findById(paramId);
        if (!need) {
            return NextResponse.json({ error: 'Need not found' }, { status: 404 });
        }

        // Find available resources of the organization that match the need type
        const availableResource = await Resource.findOne({
            type: need.type,
            status: 'available',
        });

        if (!availableResource) {
            return NextResponse.json(
                { error: 'No matching resources available' },
                { status: 400 }
            );
        }

        // Update need status
        need.status = 'in-progress';
        need.eta = eta;
        await need.save();

        // Update resource status
        availableResource.status = 'in-transit';
        await availableResource.save();

        return NextResponse.json({
            message: 'Resource dispatched successfully',
            need,
            resource: availableResource,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to dispatch resource' },
            { status: 500 }
        );
    }
} 