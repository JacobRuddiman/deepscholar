//admin/api/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, isAdmin, tokenBalance } = body;

    // Update user in database
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name,
        email,
        isAdmin,
      },
    });

    // Update token balance if provided
    if (typeof tokenBalance === 'number') {
      await db.userToken.upsert({
        where: { userId: id },
        update: { balance: tokenBalance },
        create: { userId: id, balance: tokenBalance },
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
