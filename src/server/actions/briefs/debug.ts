'use server';

import { prisma } from '@/lib/prisma';

export async function testDatabaseConnection() {
  try {
    // Test a simple query
    const count = await prisma.brief.count();
    console.log('Database connection test successful. Brief count:', count);
    return { success: true, count };
  } catch (error) {
    console.log('Database connection test failed:');
    console.log('Error type:', typeof error);
    if (error) {
      console.log('Error message:', String(error));
    }
    return { success: false, error: 'Database connection test failed' };
  }
}

export async function ensureLocalUser() {
  try {
    const userId = 'local-user-1';
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (existingUser) {
      console.log('Local user already exists:', userId);
      return { success: true, user: existingUser };
    }
    
    // Create local user if it doesn't exist
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: 'Local User',
        email: 'local@example.com',
        isSeedData: false,
      }
    });
    
    console.log('Local user created:', userId);
    return { success: true, user };
    
  } catch (error) {
    console.log('Failed to ensure local user:');
    console.log('Error type:', typeof error);
    if (error) {
      console.log('Error message:', String(error));
    }
    return { success: false, error: 'Failed to create local user' };
  }
}

export async function createTestBrief() {
  try {
    console.log('=== MINIMAL CREATE BRIEF TEST ===');
    
    // Ensure local user exists first
    const userResult = await ensureLocalUser();
    if (!userResult.success) {
      throw new Error('Failed to create local user');
    }
    
    // Create with absolute minimal data
    const brief = await prisma.brief.create({
      data: {
        title: "Test Brief",
        prompt: "Test Prompt",
        response: "Test Response",
        modelId: "cmd397kow008cuuog3gx4n7db", // Hardcoded model ID from logs
        userId: "local-user-1",
        viewCount: 0,
        published: true,
        isDraft: false,
        isActive: true,
        versionNumber: 1,
        isSeedData: false
      },
    });

    console.log('Test brief created successfully:', brief.id);
    return { success: true, data: brief };
    
  } catch (error) {
    console.log('Test create failed:');
    console.log('Error type:', typeof error);
    if (error) {
      try {
        console.log('Error message:', String(error));
      } catch (e) {
        console.log('Failed to convert error to string');
      }
    }
    return { success: false, error: 'Test create failed' };
  }
}