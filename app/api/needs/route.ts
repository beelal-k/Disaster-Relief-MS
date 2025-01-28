import { connectDB } from '@/lib/db/mongoose';
import { Need } from '@/lib/db/models/Need.model';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api';

export async function GET(req: NextRequest) {
  await connectDB();
  const { id } = await getToken(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const query: any = {};

    // If status=active, fetch all needs that are not completed
    if (status === 'pending') {
      query.status = { $ne: 'completed' };
    }

    const needs = await Need.find(query)
      .populate('createdBy', 'email')
      .populate('dispatches')
      .sort({ createdAt: -1 });

    return NextResponse.json(needs);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch needs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { id } = await getToken(req);
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const need = await Need.create({
      ...data,
      createdBy: id,
      status: 'pending'
    });

    return NextResponse.json(need);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create need' },
      { status: 500 }
    );
  }
}