import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { Resource } from '@/lib/db/models/Resource.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, eta } = await req.json();

    try {
        // Find the need
        const need = await Need.findById(params.id);
        if (!need) {
            return NextResponse.json({ error: 'Need not found' }, { status: 404 });
        }

        // Find available resources of the organization that match the need type
        const availableResource = await Resource.findOne({
            organization: organizationId,
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
        need.assignedTo = organizationId;
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