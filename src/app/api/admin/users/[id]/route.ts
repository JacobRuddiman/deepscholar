//admin/api/users/[id]/route.ts

import { NextRequest } from 'next/server';
import { db } from '@/server/db';
import { apiSuccess, apiError, requireAdmin, isApiError } from '@/lib/api-response';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (isApiError(session)) return session;

    const { id } = await params;
    const body = await request.json();
    const { name, email, isAdmin, tokenBalance } = body;

    const updatedUser = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          name,
          email,
          isAdmin,
        },
      });

      // Update token balance atomically with a transaction record
      if (typeof tokenBalance === 'number') {
        const current = await tx.userToken.findUnique({ where: { userId: id } });
        const oldBalance = current?.balance ?? 0;
        const diff = tokenBalance - oldBalance;

        await tx.userToken.upsert({
          where: { userId: id },
          update: { balance: tokenBalance },
          create: { userId: id, balance: tokenBalance },
        });

        if (diff !== 0) {
          await tx.tokenTransaction.create({
            data: {
              userId: id,
              amount: diff,
              reason: `Admin adjustment by ${session.user.id}`,
            },
          });
        }
      }

      return user;
    });

    return apiSuccess({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', String(error));
    return apiError('Failed to update user', 500);
  }
}
