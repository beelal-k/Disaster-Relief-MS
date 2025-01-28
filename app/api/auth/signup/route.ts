import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/lib/db/models/User.model';
import { NextResponse } from 'next/server';
// @ts-ignore
import bcrypt from 'bcryptjs';
// @ts-ignore
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  await connectDB();
  
  const { email, password, role, name } = await req.json();
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ 
    email, 
    password: hashedPassword, 
    role,
    name
  });

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
      role: user.role,
      name: user.name
    }
  });
}