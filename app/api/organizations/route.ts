import { connectDB } from '@/lib/db/mongoose';
import { Organization } from '@/lib/db/models/Organization.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

// Get all organizations or search by name
export async function GET(req: NextRequest) {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');

    let query = {};
    if (search) {
        query = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        };
    }

    const organizations = await Organization.find(query)
        .populate('admin', 'email')
        .populate('members', 'email')
        .sort({ createdAt: -1 });

    return NextResponse.json(organizations);
}

// Create a new organization
export async function POST(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

    try {
        const organization = await Organization.create({
            ...data,
            admin: id,
            members: [id]
        });

        await organization.populate('admin', 'email');
        await organization.populate('members', 'email');

        return NextResponse.json(organization);
    } catch (error: any) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return NextResponse.json(
                { error: `An organization with this ${field} already exists` },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// Update an organization
export async function PATCH(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, ...updateData } = await req.json();

    const organization = await Organization.findById(organizationId);
    if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Only admin can update organization details
    if (organization.admin.toString() !== id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Don't allow updating admin or members through this route
    delete updateData.admin;
    delete updateData.members;

    Object.assign(organization, updateData);
    await organization.save();

    await organization.populate('admin', 'email');
    await organization.populate('members', 'email');

    return NextResponse.json(organization);
}

// Delete an organization
export async function DELETE(req: NextRequest) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId } = await req.json();

    const organization = await Organization.findById(organizationId);
    if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Only admin can delete organization
    if (organization.admin.toString() !== id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await organization.deleteOne();
    return NextResponse.json({ message: 'Organization deleted successfully' });
} 