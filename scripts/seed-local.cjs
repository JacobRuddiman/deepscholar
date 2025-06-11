const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db"
    }
  }
});

async function seedLocalData() {
  console.log('🌱 Seeding local database...');

  try {
    // Create demo users
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'demo@localhost' },
        update: {},
        create: {
          id: 'local-user-1',
          name: 'Demo User',
          email: 'demo@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNFNUU3RUIiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjOUNBM0FGIi8+PC9zdmc+',
          emailVerified: new Date(),
          isAdmin: true,
          lastInteractionDate: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'sarah@localhost' },
        update: {},
        create: {
          id: 'local-user-2',
          name: 'Dr. Sarah Chen',
          email: 'sarah@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGM0Y0RjYiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzZCNzI4MCIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjNkI3MjgwIi8+PC9zdmc+',
          emailVerified: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'michael@localhost' },
        update: {},
        create: {
          id: 'local-user-3',
          name: 'Prof. Michael Rodriguez',
          email: 'michael@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNEQ0ZERjQiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzM3NEY2OCIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjMzc0RjY4Ii8+PC9zdmc+',
          emailVerified: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'alex@localhost' },
        update: {},
        create: {
          id: 'local-user-4',
          name: 'Dr. Alex Thompson',
          email: 'alex@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRUY5QzMiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzY1QTMwRCIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjNjVBMzBEIi8+PC9zdmc+',
          emailVerified: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'emma@localhost' },
        update: {},
        create: {
          id: 'local-user-5',
          name: 'Dr. Emma Wilson',
          email: 'emma@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGQ0U3RjMiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzk5MzNFQSIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjOTkzM0VBIi8+PC9zdmc+',
          emailVerified: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'david@localhost' },
        update: {},
        create: {
          id: 'local-user-6',
          name: 'Prof. David Kim',
          email: 'david@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRUY0RTIiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iI0Y1OTUwRiIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjRjU5NTBGIi8+PC9zdmc+',
          emailVerified: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'lisa@localhost' },
        update: {},
        create: {
          id: 'local-user-7',
          name: 'Dr. Lisa Martinez',
          email: 'lisa@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNGRUYyRjIiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iI0VGNDQ0NCIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjRUY0NDQ0Ii8+PC9zdmc+',
          emailVerified: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'james@localhost' },
        update: {},
        create: {
          id: 'local-user-8',
          name: 'Dr. James Brown',
          email: 'james@localhost',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNzUiIGN5PSI3NSIgcj0iNzUiIGZpbGw9IiNFQ0ZERjUiLz48Y2lyY2xlIGN4PSI3NSIgY3k9IjYwIiByPSIyNSIgZmlsbD0iIzEwQjk4MSIvPjxwYXRoIGQ9Ik03NSA5NUM5NSA5NSAxMTUgMTA1IDExNSAxMjVWMTUwSDM1VjEyNUMzNSAxMDUgNTUgOTUgNzUgOTVaIiBmaWxsPSIjMTBCOTgxIi8+PC9zdmc+',
          emailVerified: new Date(),
        },
      }),
    ]);

    console.log('✅ Created users:', users.map(u => u.name));

    // Create AI models
    const models = await Promise.all([
      prisma.researchAIModel.upsert({
        where: { name_version_provider: { name: 'GPT-4', version: '4.0', provider: 'openai' } },
        update: {},
        create: {
          id: 'model-1',
          name: 'GPT-4',
          provider: 'openai',
          version: '4.0',
        },
      }),
      prisma.researchAIModel.upsert({
        where: { name_version_provider: { name: 'Claude', version: '3.5', provider: 'anthropic' } },
        update: {},
        create: {
          id: 'model-2',
          name: 'Claude',
          provider: 'anthropic',
          version: '3.5',
        },
      }),
    ]);

    console.log('✅ Created models:', models.map(m => `${m.name} ${m.version}`));

    // Create categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Computer Science' },
        update: {},
        create: {
          id: 'cat-1',
          name: 'Computer Science',
          description: 'Computing and technology research',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Healthcare' },
        update: {},
        create: {
          id: 'cat-2',
          name: 'Healthcare',
          description: 'Medical and health-related research',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Climate Science' },
        update: {},
        create: {
          id: 'cat-3',
          name: 'Climate Science',
          description: 'Environmental and climate research',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Artificial Intelligence' },
        update: {},
        create: {
          id: 'cat-4',
          name: 'Artificial Intelligence',
          description: 'AI and machine learning research',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Biotechnology' },
        update: {},
        create: {
          id: 'cat-5',
          name: 'Biotechnology',
          description: 'Biological and biotechnology research',
        },
      }),
    ]);

    console.log('✅ Created categories:', categories.map(c => c.name));

    // Create sample briefs
    const briefs = await Promise.all([
      prisma.brief.upsert({
        where: { slug: 'advances-quantum-computing-review' },
        update: {},
        create: {
          id: 'brief-1',
          title: 'Advances in Quantum Computing: A Comprehensive Review',
          prompt: 'Provide a comprehensive review of recent advances in quantum computing, including breakthroughs in quantum supremacy and practical applications.',
          abstract: 'This research brief explores the latest developments in quantum computing, including recent breakthroughs in quantum supremacy and practical applications across various industries.',
          response: 'Quantum computing has made significant strides in recent years, with major tech companies and research institutions achieving remarkable milestones. This review examines the current state of quantum computing technology, recent breakthroughs, and emerging applications.',
          thinking: 'To provide a comprehensive overview, I analyzed recent papers from Nature, Science, and arXiv focusing on quantum computing developments.',
          slug: 'advances-quantum-computing-review',
          published: true,
          userId: users[0].id,
          modelId: models[0].id,
          viewCount: 1247,
          readTime: 8,
          accuracy: 4.6,
        },
      }),
      prisma.brief.upsert({
        where: { slug: 'ml-healthcare-applications' },
        update: {},
        create: {
          id: 'brief-2',
          title: 'Machine Learning in Healthcare: Current Applications and Future Prospects',
          prompt: 'Analyze how machine learning is transforming healthcare, from diagnostic imaging to drug discovery.',
          abstract: 'An analysis of how machine learning is transforming healthcare, from diagnostic imaging to drug discovery, with a focus on current applications and future potential.',
          response: 'Machine learning applications in healthcare have expanded rapidly, showing promising results in medical imaging, predictive analytics, and personalized medicine.',
          thinking: 'I focused on peer-reviewed studies and clinical trials to ensure accuracy in this sensitive domain.',
          slug: 'ml-healthcare-applications',
          published: true,
          userId: users[1].id,
          modelId: models[1].id,
          viewCount: 892,
          readTime: 12,
          accuracy: 4.8,
        },
      }),
      prisma.brief.upsert({
        where: { slug: 'climate-renewable-energy' },
        update: {},
        create: {
          id: 'brief-3',
          title: 'Climate Change Mitigation Through Renewable Energy Technologies',
          prompt: 'Examine the role of renewable energy technologies in addressing climate change challenges.',
          abstract: 'Examining the role of renewable energy technologies in addressing climate change challenges, with focus on current capabilities and future potential.',
          response: 'Renewable energy technologies have become increasingly cost-effective and efficient, offering viable solutions for climate change mitigation.',
          thinking: 'I analyzed IPCC reports, energy statistics, and recent technological developments.',
          slug: 'climate-renewable-energy',
          published: true,
          userId: users[2].id,
          modelId: models[0].id,
          viewCount: 634,
          readTime: 10,
          accuracy: 4.4,
        },
      }),
      prisma.brief.upsert({
        where: { slug: 'crispr-gene-editing-ethics' },
        update: {},
        create: {
          id: 'brief-4',
          title: 'CRISPR Gene Editing: Scientific Progress and Ethical Considerations',
          prompt: 'Analyze the current state of CRISPR gene editing technology, its applications, and the ethical implications.',
          abstract: 'A comprehensive analysis of CRISPR gene editing technology, covering recent scientific advances, therapeutic applications, and the complex ethical landscape surrounding genetic modification.',
          response: 'CRISPR-Cas9 technology has revolutionized genetic engineering, offering unprecedented precision in editing DNA.',
          thinking: 'I reviewed recent clinical trial data, ethical guidelines from major institutions, and regulatory frameworks.',
          slug: 'crispr-gene-editing-ethics',
          published: true,
          userId: users[3].id,
          modelId: models[1].id,
          viewCount: 456,
          readTime: 15,
          accuracy: 4.7,
        },
      }),
      prisma.brief.upsert({
        where: { slug: 'neural-networks-interpretability' },
        update: {},
        create: {
          id: 'brief-5',
          title: 'Neural Network Interpretability: Making AI Decisions Transparent',
          prompt: 'Explore methods for making neural network decisions more interpretable and transparent.',
          abstract: 'An exploration of techniques and methodologies for improving the interpretability of neural networks, addressing the black box problem in AI systems.',
          response: 'As neural networks become more complex and powerful, understanding their decision-making processes becomes increasingly difficult.',
          thinking: 'I synthesized recent research from top-tier conferences like NeurIPS, ICML, and ICLR.',
          slug: 'neural-networks-interpretability',
          published: true,
          userId: users[3].id,
          modelId: models[0].id,
          viewCount: 723,
          readTime: 11,
          accuracy: 4.5,
        },
      }),
      prisma.brief.upsert({
        where: { slug: 'personalized-medicine-genomics' },
        update: {},
        create: {
          id: 'brief-6',
          title: 'Personalized Medicine Through Genomics: Current State and Future Prospects',
          prompt: 'Examine how genomics is enabling personalized medicine approaches and the challenges ahead.',
          abstract: 'An analysis of how genomic technologies are transforming personalized medicine, from pharmacogenomics to precision oncology.',
          response: 'Genomics is revolutionizing medicine by enabling treatments tailored to individual genetic profiles.',
          thinking: 'I drew from recent clinical guidelines, genomic medicine literature, and implementation studies.',
          slug: 'personalized-medicine-genomics',
          published: true,
          userId: users[1].id,
          modelId: models[1].id,
          viewCount: 567,
          readTime: 13,
          accuracy: 4.6,
        },
      }),
    ]);

    console.log('✅ Created briefs:', briefs.map(b => b.title));

    // Create user token balances
    await Promise.all([
      prisma.userToken.upsert({
        where: { userId: users[0].id },
        update: {},
        create: {
          userId: users[0].id,
          balance: 100,
        },
      }),
      prisma.userToken.upsert({
        where: { userId: users[1].id },
        update: {},
        create: {
          userId: users[1].id,
          balance: 150,
        },
      }),
      prisma.userToken.upsert({
        where: { userId: users[2].id },
        update: {},
        create: {
          userId: users[2].id,
          balance: 75,
        },
      }),
      prisma.userToken.upsert({
        where: { userId: users[3].id },
        update: {},
        create: {
          userId: users[3].id,
          balance: 200,
        },
      }),
    ]);

    console.log('✅ Created user token balances');

    // Create initial token transactions
    await Promise.all([
      prisma.tokenTransaction.create({
        data: {
          userId: users[0].id,
          amount: 100,
          reason: 'Welcome bonus',
        },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: users[1].id,
          amount: 150,
          reason: 'Welcome bonus',
        },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: users[2].id,
          amount: 75,
          reason: 'Welcome bonus',
        },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId: users[3].id,
          amount: 200,
          reason: 'Welcome bonus',
        },
      }),
    ]);

    console.log('✅ Created welcome bonus transactions');

    // Connect briefs to categories
    await Promise.all([
      prisma.brief.update({
        where: { id: briefs[0].id },
        data: {
          categories: {
            connect: [{ id: categories[0].id }]
          }
        }
      }),
      prisma.brief.update({
        where: { id: briefs[1].id },
        data: {
          categories: {
            connect: [
              { id: categories[1].id },
              { id: categories[3].id }
            ]
          }
        }
      }),
      prisma.brief.update({
        where: { id: briefs[2].id },
        data: {
          categories: {
            connect: [{ id: categories[2].id }]
          }
        }
      }),
      prisma.brief.update({
        where: { id: briefs[3].id },
        data: {
          categories: {
            connect: [
              { id: categories[4].id },
              { id: categories[1].id }
            ]
          }
        }
      }),
      prisma.brief.update({
        where: { id: briefs[4].id },
        data: {
          categories: {
            connect: [
              { id: categories[3].id },
              { id: categories[0].id }
            ]
          }
        }
      }),
      prisma.brief.update({
        where: { id: briefs[5].id },
        data: {
          categories: {
            connect: [
              { id: categories[1].id },
              { id: categories[4].id }
            ]
          }
        }
      }),
    ]);

    console.log('✅ Connected briefs to categories');

    // Create reviews
    await Promise.all([
      prisma.review.upsert({
        where: { id: 'review-1' },
        update: {},
        create: {
          id: 'review-1',
          content: 'Excellent comprehensive overview of quantum computing developments. Very well researched and clearly explained.',
          rating: 5,
          briefId: briefs[0].id,
          userId: users[1].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-2' },
        update: {},
        create: {
          id: 'review-2',
          content: 'Good technical depth, though could use more discussion on practical implementation challenges.',
          rating: 4,
          briefId: briefs[0].id,
          userId: users[2].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-3' },
        update: {},
        create: {
          id: 'review-3',
          content: 'Fascinating read! The section on quantum supremacy was particularly enlightening.',
          rating: 5,
          briefId: briefs[0].id,
          userId: users[3].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-4' },
        update: {},
        create: {
          id: 'review-4',
          content: 'Great analysis of ML applications in healthcare. The examples provided are very relevant.',
          rating: 5,
          briefId: briefs[1].id,
          userId: users[2].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-5' },
        update: {},
        create: {
          id: 'review-5',
          content: 'Comprehensive coverage of the field. Would love to see more on regulatory challenges.',
          rating: 4,
          briefId: briefs[1].id,
          userId: users[0].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-6' },
        update: {},
        create: {
          id: 'review-6',
          content: 'Important topic well covered. The economic analysis is particularly valuable.',
          rating: 4,
          briefId: briefs[2].id,
          userId: users[1].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-7' },
        update: {},
        create: {
          id: 'review-7',
          content: 'Solid overview of renewable technologies. Could benefit from more recent data.',
          rating: 4,
          briefId: briefs[2].id,
          userId: users[3].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-8' },
        update: {},
        create: {
          id: 'review-8',
          content: 'Excellent balance of technical content and ethical considerations. Very thorough.',
          rating: 5,
          briefId: briefs[3].id,
          userId: users[0].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-9' },
        update: {},
        create: {
          id: 'review-9',
          content: 'The ethical discussion is particularly well done. Important considerations for the field.',
          rating: 5,
          briefId: briefs[3].id,
          userId: users[1].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-10' },
        update: {},
        create: {
          id: 'review-10',
          content: 'Great technical overview of interpretability methods. Very useful for practitioners.',
          rating: 4,
          briefId: briefs[4].id,
          userId: users[2].id,
        },
      }),
      prisma.review.upsert({
        where: { id: 'review-11' },
        update: {},
        create: {
          id: 'review-11',
          content: 'Comprehensive analysis of genomics in medicine. The implementation challenges section is spot-on.',
          rating: 5,
          briefId: briefs[5].id,
          userId: users[3].id,
        },
      }),
    ]);

    console.log('✅ Created comprehensive reviews');

    // Create upvotes for briefs
    await Promise.all([
      prisma.briefUpvote.upsert({
        where: { briefId_userId: { briefId: briefs[0].id, userId: users[1].id } },
        update: {},
        create: { briefId: briefs[0].id, userId: users[1].id },
      }),
      prisma.briefUpvote.upsert({
        where: { briefId_userId: { briefId: briefs[0].id, userId: users[2].id } },
        update: {},
        create: { briefId: briefs[0].id, userId: users[2].id },
      }),
      prisma.briefUpvote.upsert({
        where: { briefId_userId: { briefId: briefs[1].id, userId: users[0].id } },
        update: {},
        create: { briefId: briefs[1].id, userId: users[0].id },
      }),
      prisma.briefUpvote.upsert({
        where: { briefId_userId: { briefId: briefs[1].id, userId: users[2].id } },
        update: {},
        create: { briefId: briefs[1].id, userId: users[2].id },
      }),
    ]);

    console.log('✅ Created upvotes for briefs');

    // Create interactions from yesterday for testing CRON job
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // Set to noon yesterday

    // Create 5+ upvotes from yesterday for the first brief (demo user's brief)
    await Promise.all([
      prisma.briefUpvote.create({
        data: { 
          briefId: briefs[0].id, 
          userId: users[3].id,
          createdAt: yesterday
        },
      }),
      prisma.briefUpvote.create({
        data: { 
          briefId: briefs[0].id, 
          userId: users[4].id,
          createdAt: yesterday
        },
      }),
      prisma.briefUpvote.create({
        data: { 
          briefId: briefs[0].id, 
          userId: users[5].id,
          createdAt: yesterday
        },
      }),
    ]);

    // Create 2+ reviews from yesterday for the first brief
    await Promise.all([
      prisma.review.create({
        data: {
          content: 'Outstanding work on quantum computing! This really helped me understand the latest developments.',
          rating: 5,
          briefId: briefs[0].id,
          userId: users[4].id,
          createdAt: yesterday,
        },
      }),
      prisma.review.create({
        data: {
          content: 'Very informative and well-structured. Great contribution to the field.',
          rating: 4,
          briefId: briefs[0].id,
          userId: users[5].id,
          createdAt: yesterday,
        },
      }),
    ]);

    console.log('✅ Created yesterday interactions for testing CRON job');

    console.log('🎉 Local database seeded successfully!');
    console.log('');
    console.log('Demo User Credentials:');
    console.log('- Name: Demo User');
    console.log('- Email: demo@localhost');
    console.log('- You will be automatically logged in as this user in LOCAL mode');
    console.log('');
    console.log('You can now:');
    console.log('- View existing briefs');
    console.log('- Create new briefs');
    console.log('- Add reviews and upvotes');
    console.log('- All data persists in the local SQLite database');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLocalData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
