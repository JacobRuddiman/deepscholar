import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

// Helper function to format email-like console log
function logEmail(to: string, subject: string, body: string) {
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL NOTIFICATION');
  console.log('='.repeat(80));
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('-'.repeat(80));
  console.log(body);
  console.log('-'.repeat(80));
  console.log('Footer: © 2025 DeepScholar - Your AI Research Companion');
  console.log('Visit us at: https://deepscholar.com');
  console.log('='.repeat(80) + '\n');
}

async function promoteInteraction(userId?: string) {
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);
  
  console.log(`🔍 Checking users who haven't visited since ${threeDaysAgo.toISOString()}`);
  console.log(`📧 Excluding users who received promotion email since ${twoWeeksAgo.toISOString()}`);
  
  // Get users to check
  const users = userId 
    ? await db.user.findMany({ where: { id: userId } })
    : await db.user.findMany({ 
        where: { 
          email: { not: null }
        } 
      });
  
  console.log(`📊 Found ${users.length} users eligible for promotion email`);
  
  for (const user of users) {
    // Check if user hasn't visited in 3+ days
    // const hasntVisitedRecently = !user.lastInteractionDate || user.lastInteractionDate < threeDaysAgo;
    
    // Check if promotion email wasn't sent in last 2 weeks
    // const canSendPromotion = !user.lastPromotionEmailDate || user.lastPromotionEmailDate < twoWeeksAgo;
    
    // Temporarily send to all users for testing
    const hasntVisitedRecently = true;
    const canSendPromotion = true;
    
    if (hasntVisitedRecently && canSendPromotion) {
      // Generate promotion email
      const subject = `🔬 New research insights await you on DeepScholar`;
      
      let body = `Dear ${user.name ?? 'Researcher'},\n\n`;
      body += `We've missed you on DeepScholar! While you've been away, our community has been busy:\n\n`;
      
      // Get some recent stats to make it engaging
      const recentBriefsCount = await db.brief.count({
        where: {
          createdAt: {
            gte: threeDaysAgo
          }
        }
      });
      
      const recentReviewsCount = await db.review.count({
        where: {
          createdAt: {
            gte: threeDaysAgo
          }
        }
      });
      
      body += `📊 Recent Activity:\n`;
      body += `   • ${recentBriefsCount} new research briefs published\n`;
      body += `   • ${recentReviewsCount} new peer reviews added\n`;
      body += `   • Fresh insights across AI, healthcare, climate science, and more\n\n`;
      
      body += `🎯 What's waiting for you:\n`;
      body += `   • Discover cutting-edge AI research insights\n`;
      body += `   • Share your own research findings\n`;
      body += `   • Connect with fellow researchers\n`;
      body += `   • Earn tokens for your contributions\n\n`;
      
      body += `Don't let the latest breakthroughs pass you by. Visit DeepScholar today and dive back into the world of collaborative research!\n\n`;
      body += `Best regards,\nThe DeepScholar Team\n\n`;
      body += `P.S. Your research community is waiting for your unique insights!`;
      
      logEmail(user.email ?? `${user.name} (${user.id})`, subject, body);
      
      // Update the user's last promotion email date
      // await db.user.update({
      //   where: { id: user.id },
      //   data: { lastPromotionEmailDate: now }
      // });
      
      console.log(`✅ Promotion email logged for user ${user.name ?? user.email ?? user.id}`);
    } else {
      console.log(`⏭️  Skipping user ${user.name ?? user.email ?? user.id}: visited recently=${!hasntVisitedRecently}, can send promotion=${canSendPromotion}`);
    }
  }
}

// GET handler for CRON
export async function GET(request: NextRequest) {
  try {
    console.log('🕐 CRON: Promote Interaction started');
    await promoteInteraction();
    console.log('✅ CRON: Promote Interaction completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Promotion interaction emails processed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ CRON: Promote Interaction failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process promotion interaction emails' 
    }, { status: 500 });
  }
}

// POST handler for manual triggering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { userId?: string };
    const { userId } = body;
    
    console.log('🔧 MANUAL: Promote Interaction started', userId ? `for user ${userId}` : 'for all users');
    await promoteInteraction(userId);
    console.log('✅ MANUAL: Promote Interaction completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Promotion interaction emails processed manually',
      userId: userId ?? 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ MANUAL: Promote Interaction failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process promotion interaction emails' 
    }, { status: 500 });
  }
}
