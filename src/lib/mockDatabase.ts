// Mock database service for LOCAL mode
import { 
  generateMockBriefs, 
  generateMockModels, 
  generateMockCategories, 
  MOCK_USERS,
  LOCAL_USER 
} from './localMode';

// In-memory data store
let mockData = {
  users: MOCK_USERS,
  briefs: generateMockBriefs(),
  models: generateMockModels(),
  categories: generateMockCategories(),
  reviews: [
    {
      id: 'review-1',
      content: 'Excellent comprehensive overview of quantum computing developments. Very well researched and clearly explained.',
      rating: 5,
      briefId: 'brief-1',
      userId: 'local-user-2',
      helpfulCount: 12,
      createdAt: new Date('2024-03-16'),
      updatedAt: new Date('2024-03-16'),
    },
    {
      id: 'review-2',
      content: 'Great analysis of ML applications in healthcare. The examples provided are very relevant.',
      rating: 5,
      briefId: 'brief-2',
      userId: 'local-user-3',
      helpfulCount: 8,
      createdAt: new Date('2024-03-11'),
      updatedAt: new Date('2024-03-11'),
    },
  ],
  briefUpvotes: [
    { id: 'upvote-1', briefId: 'brief-1', userId: 'local-user-2', createdAt: new Date() },
    { id: 'upvote-2', briefId: 'brief-1', userId: 'local-user-3', createdAt: new Date() },
    { id: 'upvote-3', briefId: 'brief-2', userId: 'local-user-1', createdAt: new Date() },
  ],
  savedBriefs: [
    { id: 'saved-1', userId: 'local-user-1', briefId: 'brief-2', createdAt: new Date() },
  ],
  userTokens: [
    { id: 'token-1', userId: 'local-user-1', balance: 100, updatedAt: new Date() },
    { id: 'token-2', userId: 'local-user-2', balance: 150, updatedAt: new Date() },
    { id: 'token-3', userId: 'local-user-3', balance: 75, updatedAt: new Date() },
  ],
};

// Mock Prisma-like interface
export const mockDb = {
  user: {
    findMany: async (options?: any) => {
      let users = [...mockData.users];
      
      // Apply where clause
      if (options?.where) {
        users = users.filter((user: any) => {
          if (options.where.name?.contains) {
            return user.name?.toLowerCase().includes(options.where.name.contains.toLowerCase());
          }
          if (options.where.OR) {
            return options.where.OR.some((condition: any) => {
              if (condition.name?.contains) {
                return user.name?.toLowerCase().includes(condition.name.contains.toLowerCase());
              }
              if (condition.email?.contains) {
                return user.email?.toLowerCase().includes(condition.email.contains.toLowerCase());
              }
              return false;
            });
          }
          return true;
        });
      }

      // Apply include
      if (options?.include) {
        users = users.map((user: any) => {
          const enrichedUser = { ...user };
          
          if (options.include._count) {
            enrichedUser._count = {
              briefs: mockData.briefs.filter(b => b.userId === user.id && b.published).length,
              reviews: mockData.reviews.filter(r => r.userId === user.id).length,
              briefUpvotes: mockData.briefUpvotes.filter(u => u.userId === user.id).length,
              savedBriefs: mockData.savedBriefs.filter(s => s.userId === user.id).length,
            };
          }
          
          if (options.include.briefs) {
            enrichedUser.briefs = mockData.briefs
              .filter(b => b.userId === user.id && b.published)
              .map(brief => ({
                ...brief,
                reviews: mockData.reviews.filter(r => r.briefId === brief.id),
              }))
              .sort((a, b) => b.viewCount - a.viewCount)
              .slice(0, options.include.briefs.take || 10);
          }

          if (options.include.tokenBalance) {
            enrichedUser.tokenBalance = mockData.userTokens.find(t => t.userId === user.id) || null;
          }
          
          return enrichedUser;
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        // Handle complex ordering logic here if needed
      }

      // Apply pagination
      if (options?.skip || options?.take) {
        const skip = options.skip || 0;
        const take = options.take || users.length;
        users = users.slice(skip, skip + take);
      }

      return users;
    },

    findUnique: async (options: any) => {
      const user = mockData.users.find(u => u.id === options.where.id);
      if (!user) return null;

      let enrichedUser = { ...user };

      if (options?.include) {
        if (options.include._count) {
          enrichedUser._count = {
            briefs: mockData.briefs.filter(b => b.userId === user.id).length,
            reviews: mockData.reviews.filter(r => r.userId === user.id).length,
            briefUpvotes: mockData.briefUpvotes.filter(u => u.userId === user.id).length,
          };
        }

        if (options.include.briefs) {
          enrichedUser.briefs = mockData.briefs
            .filter(b => b.userId === user.id)
            .slice(0, options.include.briefs.take || 5);
        }
      }

      return enrichedUser;
    },

    count: async (options?: any) => {
      let users = mockData.users;
      
      if (options?.where) {
        users = users.filter((user: any) => {
          if (options.where.OR) {
            return options.where.OR.some((condition: any) => {
              if (condition.name?.contains) {
                return user.name?.toLowerCase().includes(condition.name.contains.toLowerCase());
              }
              if (condition.email?.contains) {
                return user.email?.toLowerCase().includes(condition.email.contains.toLowerCase());
              }
              return false;
            });
          }
          return true;
        });
      }
      
      return users.length;
    },

    create: async (options: any) => {
      const newUser = {
        id: `local-user-${Date.now()}`,
        ...options.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockData.users.push(newUser);
      return newUser;
    },
  },

  brief: {
    findMany: async (options?: any) => {
      let briefs = [...mockData.briefs];

      // Apply where clause
      if (options?.where) {
        briefs = briefs.filter((brief: any) => {
          if (options.where.published !== undefined) {
            return brief.published === options.where.published;
          }
          if (options.where.userId) {
            return brief.userId === options.where.userId;
          }
          if (options.where.title?.contains) {
            return brief.title.toLowerCase().includes(options.where.title.contains.toLowerCase());
          }
          return true;
        });
      }

      // Apply include
      if (options?.include) {
        briefs = briefs.map((brief: any) => {
          const enrichedBrief = { ...brief };
          
          if (options.include.author) {
            enrichedBrief.author = mockData.users.find(u => u.id === brief.userId);
          }
          
          if (options.include.model) {
            enrichedBrief.model = mockData.models.find(m => m.id === brief.modelId);
          }
          
          if (options.include.categories) {
            enrichedBrief.categories = mockData.categories.slice(0, 2); // Mock some categories
          }
          
          if (options.include.reviews) {
            enrichedBrief.reviews = mockData.reviews.filter(r => r.briefId === brief.id);
          }

          if (options.include._count) {
            enrichedBrief._count = {
              upvotes: mockData.briefUpvotes.filter(u => u.briefId === brief.id).length,
              reviews: mockData.reviews.filter(r => r.briefId === brief.id).length,
            };
          }
          
          return enrichedBrief;
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        if (options.orderBy.createdAt === 'desc') {
          briefs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (options.orderBy.viewCount === 'desc') {
          briefs.sort((a, b) => b.viewCount - a.viewCount);
        }
      }

      // Apply pagination
      if (options?.skip || options?.take) {
        const skip = options.skip || 0;
        const take = options.take || briefs.length;
        briefs = briefs.slice(skip, skip + take);
      }

      return briefs;
    },

    findUnique: async (options: any) => {
      const brief = mockData.briefs.find(b => 
        b.id === options.where.id || b.slug === options.where.slug
      );
      
      if (!brief) return null;

      let enrichedBrief = { ...brief };

      if (options?.include) {
        if (options.include.author) {
          enrichedBrief.author = mockData.users.find(u => u.id === brief.userId);
        }
        
        if (options.include.model) {
          enrichedBrief.model = mockData.models.find(m => m.id === brief.modelId);
        }
        
        if (options.include.categories) {
          enrichedBrief.categories = mockData.categories.slice(0, 2);
        }
        
        if (options.include.reviews) {
          enrichedBrief.reviews = mockData.reviews.filter(r => r.briefId === brief.id);
        }
      }

      return enrichedBrief;
    },

    count: async (options?: any) => {
      let briefs = mockData.briefs;
      
      if (options?.where) {
        briefs = briefs.filter((brief: any) => {
          if (options.where.published !== undefined) {
            return brief.published === options.where.published;
          }
          return true;
        });
      }
      
      return briefs.length;
    },

    create: async (options: any) => {
      const newBrief = {
        id: `brief-${Date.now()}`,
        slug: `brief-${Date.now()}`,
        viewCount: 0,
        published: true,
        ...options.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockData.briefs.push(newBrief);
      return newBrief;
    },

    update: async (options: any) => {
      const briefIndex = mockData.briefs.findIndex(b => b.id === options.where.id);
      if (briefIndex === -1) return null;

      mockData.briefs[briefIndex] = {
        ...mockData.briefs[briefIndex],
        ...options.data,
        updatedAt: new Date(),
      };

      return mockData.briefs[briefIndex];
    },
  },

  category: {
    findMany: async () => mockData.categories,
  },

  researchAIModel: {
    findMany: async () => mockData.models,
  },

  review: {
    aggregate: async (options: any) => {
      const reviews = mockData.reviews.filter(r => r.userId === options.where.userId);
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      return {
        _avg: { rating: avgRating },
      };
    },
  },
};

// Helper function to reset mock data
export function resetMockData() {
  mockData = {
    users: MOCK_USERS,
    briefs: generateMockBriefs(),
    models: generateMockModels(),
    categories: generateMockCategories(),
    reviews: [],
    briefUpvotes: [],
    savedBriefs: [],
    userTokens: [],
  };
}

// Helper function to add more mock data
export function addMockBrief(brief: any) {
  mockData.briefs.push({
    id: `brief-${Date.now()}`,
    slug: `brief-${Date.now()}`,
    viewCount: 0,
    published: true,
    ...brief,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
