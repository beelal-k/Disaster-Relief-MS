import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User.model';
import { NextResponse } from 'next/server';
// @ts-ignore
import bcrypt from 'bcryptjs';
// @ts-ignore
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  await connectDB();
  
  const { email, password } = await req.json();
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  );

  return NextResponse.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role
    }
  });
}