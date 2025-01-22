import { connectDB } from '@/lib/db/mongoose';
import { Resource } from '@/lib/db/models/Resource.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function GET(req: NextRequest) {
  await connectDB();
  const resources = await Resource.find().populate('organization', 'name');
  return NextResponse.json(resources);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { id } = await getToken(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, quantity, status, location } = await req.json();

  const newResource = await Resource.create({
    type,
    quantity,
    status,
    location,
    organization: id
  });

  return NextResponse.json(newResource);
}

export async function PATCH(req: NextRequest) {
  await connectDB();
  const { id } = await getToken(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { resourceId, status } = await req.json();

  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  // Only allow organization members or admins to update status
  if (resource.organization.toString() !== id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  resource.status = status;
  await resource.save();

  return NextResponse.json(resource);
}