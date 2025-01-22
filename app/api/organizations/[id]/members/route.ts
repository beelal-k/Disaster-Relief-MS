import { connectDB } from '@/lib/db/mongoose';
import { Organization } from '@/lib/db/models/Organization.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

// Get organization members
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await connectDB();
    const organization = await Organization.findById(params.id)
        .populate('members', 'email role')
        .select('members');

    if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(organization.members);
}

// Add member to organization
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId } = await req.json();
    const organization = await Organization.findById(params.id);

    if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Only admin can add members
    if (organization.admin.toString() !== id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is already a member
    if (organization.members.includes(memberId)) {
        return NextResponse.json(
            { error: 'User is already a member' },
            { status: 400 }
        );
    }

    organization.members.push(memberId);
    await organization.save();
    await organization.populate('members', 'email role');

    return NextResponse.json(organization.members);
}

// Remove member from organization
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    await connectDB();
    const { id } = await getToken(req);
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId } = await req.json();
    const organization = await Organization.findById(params.id);

    if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Only admin can remove members
    if (organization.admin.toString() !== id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin cannot be removed
    if (memberId === organization.admin.toString()) {
        return NextResponse.json(
            { error: 'Cannot remove organization admin' },
            { status: 400 }
        );
    }

    organization.members = organization.members.filter(
        (member: any) => member.toString() !== memberId
    );
    await organization.save();
    await organization.populate('members', 'email role');

    return NextResponse.json(organization.members);
} 