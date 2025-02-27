'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type GetUsersParams = {
  query?: string;
  page?: number;
  limit?: number;
  orderBy?: 'name' | 'briefs' | 'reviews' | 'upvotes';
  orderDir?: 'asc' | 'desc';
};

export async function getUsers({
  query = '',
  page = 1,
  limit = 10,
  orderBy = 'name',
  orderDir = 'asc',
}: GetUsersParams) {
  try {
    // Build where clause for search
    const where: Prisma.UserWhereInput = query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : {};

    // Build orderBy clause
    let orderByClause: Prisma.UserOrderByWithRelationInput = { name: 'asc' };
    switch (orderBy) {
      case 'name':
        orderByClause = { name: orderDir };
        break;
      case 'briefs':
        orderByClause = { briefs: { _count: orderDir } };
        break;
      case 'reviews':
        orderByClause = { reviews: { _count: orderDir } };
        break;
      case 'upvotes':
        orderByClause = { briefUpvotes: { _count: orderDir } };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.user.count({ where });
    const pages = Math.ceil(total / limit);

    // Get users with related data
    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            briefs: true,
            reviews: true,
            briefUpvotes: true,
            savedBriefs: true,
          },
        },
        tokenBalance: {
          select: {
            balance: true,
          },
        },
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    return {
      success: true,
      data: {
        users,
        pagination: {
          total,
          pages,
          currentPage: page,
        },
      },
    };
  } catch (error) {
    console.error('Error in getUsers:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
} 