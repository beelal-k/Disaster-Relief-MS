import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User.model';
// @ts-ignore
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  await connectDB();
  
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) throw new Error('User not found');
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}