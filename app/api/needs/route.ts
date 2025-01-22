import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function GET() {
  await connectDB();
  const needs = await Need.find().populate('createdBy', 'email role');
  return NextResponse.json(needs);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const {id} = await getToken(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, description, urgency, location } = await req.json();
  
  const newNeed = await Need.create({
    type,
    description,
    urgency,
    location,
    createdBy: id  
  });

  return NextResponse.json(newNeed);
}