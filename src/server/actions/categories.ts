'use server';

import { prisma } from "@/lib/prisma";

export interface CategoryNode {
  id: string;
  categories: string[];
  count: number;
  color: string;
}

export interface CategoryConnection {
  source: string;
  target: string;
}

export interface CategoryNetworkData {
  nodes: CategoryNode[];
  connections: CategoryConnection[];
}

// Generate a consistent color based on category combination
function generateNodeColor(categories: string[]): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#6B7280', '#DC2626'
  ];
  
  // Create a simple hash from the sorted category names
  const sortedCategories = [...categories].sort();
  const hash = sortedCategories.join('').split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
}

// Check if two nodes should be connected (share at least one category)
function nodesShareCategories(node1: CategoryNode, node2: CategoryNode): boolean {
  return node1.categories.some(cat => node2.categories.includes(cat));
}

export async function getCategoryNetwork() {
  try {
    console.log('Fetching category network data');
    
    // Get all published briefs with their categories
    const briefs = await prisma.brief.findMany({
      where: {
        published: true,
      },
      include: {
        categories: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`Found ${briefs.length} published briefs`);

    // Group briefs by category combinations
    const categoryGroups = new Map<string, CategoryNode>();
    
    briefs.forEach(brief => {
      const categoryNames = brief.categories
        .map(cat => cat.name)
        .sort(); // Sort to ensure consistent grouping
      
      if (categoryNames.length === 0) return; // Skip briefs with no categories
      
      const key = categoryNames.join('|');
      
      if (categoryGroups.has(key)) {
        const existing = categoryGroups.get(key)!;
        existing.count++;
      } else {
        categoryGroups.set(key, {
          id: key,
          categories: categoryNames,
          count: 1,
          color: generateNodeColor(categoryNames),
        });
      }
    });

    const nodes = Array.from(categoryGroups.values());
    
    // Generate connections between nodes that share categories
    const connections: CategoryConnection[] = [];
    const processedPairs = new Set<string>();
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        // Create a unique identifier for this pair
        const pairId = [node1.id, node2.id].sort().join('<->');
        
        if (!processedPairs.has(pairId) && nodesShareCategories(node1, node2)) {
          connections.push({
            source: node1.id,
            target: node2.id,
          });
          processedPairs.add(pairId);
        }
      }
    }

    console.log(`Generated ${nodes.length} nodes and ${connections.length} connections`);

    return {
      success: true,
      data: {
        nodes,
        connections,
      } as CategoryNetworkData,
    };
  } catch (error) {
    console.error('Error fetching category network:', error);
    return {
      success: false,
      error: 'Failed to fetch category network data',
      data: {
        nodes: [],
        connections: [],
      } as CategoryNetworkData,
    };
  }
}