import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    await connectDB();
  } catch {
    return NextResponse.json(
      { message: 'Database connection failed. Please try again later.' },
      { status: 503 }
    );
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json(
        { message: 'name, email, and password are required' },
        { status: 400 }
      );

    if (password.length < 6)
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      );

    const passwordHash = await hash(password, 12);
    await User.create({ name, email: email.toLowerCase(), passwordHash, provider: 'credentials' });

    return NextResponse.json({ message: 'Account created' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
