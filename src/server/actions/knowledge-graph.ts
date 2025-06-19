'use server';

import { prisma } from "@/lib/prisma";

export interface KnowledgeNode {
  id: string;
  type: 'brief' | 'author' | 'category' | 'source' | 'model';
  label: string;
  size: number;
  color: string;
  metadata: {
    [key: string]: any;
  };
}

export interface KnowledgeConnection {
  source: string;
  target: string;
  type: 'authored' | 'categorized' | 'cited' | 'similar' | 'collaborated' | 'reviewed';
  strength: number;
  label?: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  connections: KnowledgeConnection[];
  stats: {
    totalBriefs: number;
    totalAuthors: number;
    totalCategories: number;
    totalSources: number;
    totalConnections: number;
  };
}

// Color schemes for different node types
const NODE_COLORS = {
  brief: '#3B82F6',      // Blue
  author: '#10B981',     // Green
  category: '#F59E0B',   // Amber
  source: '#8B5CF6',     // Purple
  model: '#EC4899',      // Pink
};

// Generate color variations based on properties
function generateNodeColor(type: string, intensity: number = 1): string {
  const baseColor = NODE_COLORS[type as keyof typeof NODE_COLORS] || '#6B7280';
  
  // Adjust opacity based on intensity
  const opacity = Math.max(0.3, Math.min(1, intensity));
  
  // Convert hex to rgba
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Calculate node size based on connections and importance
function calculateNodeSize(type: string, connections: number, metadata: any): number {
  const baseSize = {
    brief: 15,
    author: 20,
    category: 25,
    source: 12,
    model: 18,
  };

  const base = baseSize[type as keyof typeof baseSize] || 15;
  const connectionBonus = Math.min(connections * 2, 30);
  
  // Additional size factors based on metadata
  let metadataBonus = 0;
  if (type === 'brief' && metadata.viewCount) {
    metadataBonus = Math.min(metadata.viewCount / 10, 20);
  } else if (type === 'author' && metadata.briefCount) {
    metadataBonus = Math.min(metadata.briefCount * 3, 25);
  } else if (type === 'category' && metadata.briefCount) {
    metadataBonus = Math.min(metadata.briefCount * 2, 20);
  }

  return base + connectionBonus + metadataBonus;
}

// Calculate similarity between briefs based on shared categories and sources
function calculateBriefSimilarity(brief1: any, brief2: any): number {
  const categories1 = new Set(brief1.categories.map((c: any) => c.name));
  const categories2 = new Set(brief2.categories.map((c: any) => c.name));
  const sources1 = new Set(brief1.sources.map((s: any) => s.url));
  const sources2 = new Set(brief2.sources.map((s: any) => s.url));

  const sharedCategories = [...categories1].filter(c => categories2.has(c)).length;
  const sharedSources = [...sources1].filter(s => sources2.has(s)).length;
  const totalCategories = categories1.size + categories2.size;
  const totalSources = sources1.size + sources2.size;

  const categorySimilarity = totalCategories > 0 ? (sharedCategories * 2) / totalCategories : 0;
  const sourceSimilarity = totalSources > 0 ? (sharedSources * 2) / totalSources : 0;

  return (categorySimilarity + sourceSimilarity) / 2;
}

export async function getKnowledgeGraph(options: {
  includeAuthors?: boolean;
  includeSources?: boolean;
  includeModels?: boolean;
  maxNodes?: number;
  minConnections?: number;
} = {}) {
  try {
    const {
      includeAuthors = true,
      includeSources = true,
      includeModels = true,
      maxNodes = 200,
      minConnections = 1,
    } = options;

    console.log('Fetching knowledge graph data with options:', options);

    // Fetch all published briefs with related data
    const briefs = await prisma.brief.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: {
                briefs: true,
                reviews: true,
              },
            },
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        sources: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
        model: {
          select: {
            id: true,
            name: true,
            provider: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            upvotes: true,
            savedBy: true,
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: maxNodes / 2, // Reserve space for other node types
    });

    const nodes: KnowledgeNode[] = [];
    const connections: KnowledgeConnection[] = [];
    const nodeIds = new Set<string>();

    // Create brief nodes
    briefs.forEach(brief => {
      const briefId = `brief-${brief.id}`;
      nodeIds.add(briefId);
      
      nodes.push({
        id: briefId,
        type: 'brief',
        label: brief.title.length > 30 ? brief.title.substring(0, 30) + '...' : brief.title,
        size: calculateNodeSize('brief', 0, {
          viewCount: brief.viewCount,
          reviewCount: brief._count.reviews,
          upvoteCount: brief._count.upvotes,
        }),
        color: generateNodeColor('brief', brief.viewCount / 100),
        metadata: {
          fullTitle: brief.title,
          viewCount: brief.viewCount,
          reviewCount: brief._count.reviews,
          upvoteCount: brief._count.upvotes,
          savedCount: brief._count.savedBy,
          createdAt: brief.createdAt,
          abstract: brief.abstract,
        },
      });
    });

    // Create author nodes and connections
    if (includeAuthors) {
      const authorMap = new Map<string, any>();
      
      briefs.forEach(brief => {
        if (!authorMap.has(brief.author.id)) {
          authorMap.set(brief.author.id, {
            ...brief.author,
            briefIds: [],
          });
        }
        authorMap.get(brief.author.id)!.briefIds.push(`brief-${brief.id}`);
      });

      authorMap.forEach(author => {
        if (author.briefIds.length >= minConnections) {
          const authorId = `author-${author.id}`;
          nodeIds.add(authorId);
          
          nodes.push({
            id: authorId,
            type: 'author',
            label: author.name || 'Anonymous',
            size: calculateNodeSize('author', author.briefIds.length, {
              briefCount: author._count.briefs,
              reviewCount: author._count.reviews,
            }),
            color: generateNodeColor('author', author.briefIds.length / 5),
            metadata: {
              briefCount: author._count.briefs,
              reviewCount: author._count.reviews,
              image: author.image,
            },
          });

          // Create authored connections
          author.briefIds.forEach((briefId: string) => {
            connections.push({
              source: authorId,
              target: briefId,
              type: 'authored',
              strength: 1,
              label: 'authored',
            });
          });
        }
      });
    }

    // Create category nodes and connections
    const categoryMap = new Map<string, any>();
    
    briefs.forEach(brief => {
      brief.categories.forEach(category => {
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            ...category,
            briefIds: [],
          });
        }
        categoryMap.get(category.id)!.briefIds.push(`brief-${brief.id}`);
      });
    });

    categoryMap.forEach(category => {
      if (category.briefIds.length >= minConnections) {
        const categoryId = `category-${category.id}`;
        nodeIds.add(categoryId);
        
        nodes.push({
          id: categoryId,
          type: 'category',
          label: category.name,
          size: calculateNodeSize('category', category.briefIds.length, {
            briefCount: category.briefIds.length,
          }),
          color: generateNodeColor('category', category.briefIds.length / 10),
          metadata: {
            briefCount: category.briefIds.length,
          },
        });

        // Create categorized connections
        category.briefIds.forEach((briefId: string) => {
          connections.push({
            source: categoryId,
            target: briefId,
            type: 'categorized',
            strength: 0.8,
            label: 'categorized as',
          });
        });
      }
    });

    // Create source nodes and connections
    if (includeSources) {
      const sourceMap = new Map<string, any>();
      
      briefs.forEach(brief => {
        brief.sources.forEach(source => {
          if (!sourceMap.has(source.id)) {
            sourceMap.set(source.id, {
              ...source,
              briefIds: [],
            });
          }
          sourceMap.get(source.id)!.briefIds.push(`brief-${brief.id}`);
        });
      });

      sourceMap.forEach(source => {
        if (source.briefIds.length >= minConnections) {
          const sourceId = `source-${source.id}`;
          nodeIds.add(sourceId);
          
          nodes.push({
            id: sourceId,
            type: 'source',
            label: source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title,
            size: calculateNodeSize('source', source.briefIds.length, {}),
            color: generateNodeColor('source', source.briefIds.length / 3),
            metadata: {
              fullTitle: source.title,
              url: source.url,
              citationCount: source.briefIds.length,
            },
          });

          // Create cited connections
          source.briefIds.forEach((briefId: string) => {
            connections.push({
              source: briefId,
              target: sourceId,
              type: 'cited',
              strength: 0.6,
              label: 'cites',
            });
          });
        }
      });
    }

    // Create model nodes and connections
    if (includeModels) {
      const modelMap = new Map<string, any>();
      
      briefs.forEach(brief => {
        if (!modelMap.has(brief.model.id)) {
          modelMap.set(brief.model.id, {
            ...brief.model,
            briefIds: [],
          });
        }
        modelMap.get(brief.model.id)!.briefIds.push(`brief-${brief.id}`);
      });

      modelMap.forEach(model => {
        if (model.briefIds.length >= minConnections) {
          const modelId = `model-${model.id}`;
          nodeIds.add(modelId);
          
          nodes.push({
            id: modelId,
            type: 'model',
            label: `${model.provider} ${model.name}`,
            size: calculateNodeSize('model', model.briefIds.length, {}),
            color: generateNodeColor('model', model.briefIds.length / 10),
            metadata: {
              provider: model.provider,
              name: model.name,
              briefCount: model.briefIds.length,
            },
          });

          // Create model connections
          model.briefIds.forEach((briefId: string) => {
            connections.push({
              source: modelId,
              target: briefId,
              type: 'authored',
              strength: 0.4,
              label: 'generated by',
            });
          });
        }
      });
    }

    // Create similarity connections between briefs
    for (let i = 0; i < briefs.length; i++) {
      for (let j = i + 1; j < briefs.length; j++) {
        const similarity = calculateBriefSimilarity(briefs[i], briefs[j]);
        
        if (similarity > 0.3) { // Only connect if similarity is above threshold
          connections.push({
            source: `brief-${briefs[i]!.id}`,
            target: `brief-${briefs[j]!.id}`,
            type: 'similar',
            strength: similarity,
            label: `${Math.round(similarity * 100)}% similar`,
          });
        }
      }
    }

    // Calculate statistics
    const stats = {
      totalBriefs: briefs.length,
      totalAuthors: includeAuthors ? new Set(briefs.map(b => b.author.id)).size : 0,
      totalCategories: categoryMap.size,
      totalSources: includeSources ? new Set(briefs.flatMap(b => b.sources.map(s => s.id))).size : 0,
      totalConnections: connections.length,
    };

    console.log(`Generated knowledge graph with ${nodes.length} nodes and ${connections.length} connections`);

    return {
      success: true,
      data: {
        nodes: nodes.slice(0, maxNodes),
        connections,
        stats,
      } as KnowledgeGraphData,
    };
  } catch (error) {
    console.error('Error fetching knowledge graph:', error);
    return {
      success: false,
      error: 'Failed to fetch knowledge graph data',
      data: {
        nodes: [],
        connections: [],
        stats: {
          totalBriefs: 0,
          totalAuthors: 0,
          totalCategories: 0,
          totalSources: 0,
          totalConnections: 0,
        },
      } as KnowledgeGraphData,
    };
  }
}

// Get focused subgraph around a specific node
export async function getFocusedKnowledgeGraph(
  nodeId: string,
  nodeType: string,
  depth: number = 2
) {
  try {
    // Implementation for focused view around a specific node
    // This would show immediate connections and their connections
    // For now, return the full graph with highlighting
    const fullGraph = await getKnowledgeGraph();
    
    if (!fullGraph.success) {
      return fullGraph;
    }

    // Filter to nodes within specified depth of the focus node
    const focusedNodes = new Set<string>();
    const focusedConnections: KnowledgeConnection[] = [];
    
    // Add the focus node
    focusedNodes.add(nodeId);
    
    // Add nodes at each depth level
    for (let currentDepth = 0; currentDepth < depth; currentDepth++) {
      const currentLevelNodes = new Set(focusedNodes);
      
      fullGraph.data.connections.forEach(conn => {
        if (currentLevelNodes.has(conn.source)) {
          focusedNodes.add(conn.target);
          focusedConnections.push(conn);
        } else if (currentLevelNodes.has(conn.target)) {
          focusedNodes.add(conn.source);
          focusedConnections.push(conn);
        }
      });
    }

    // Filter nodes to only include focused ones
    const filteredNodes = fullGraph.data.nodes.filter(node => 
      focusedNodes.has(node.id)
    );

    return {
      success: true,
      data: {
        nodes: filteredNodes,
        connections: focusedConnections,
        stats: {
          ...fullGraph.data.stats,
          totalConnections: focusedConnections.length,
        },
      } as KnowledgeGraphData,
    };
  } catch (error) {
    console.error('Error fetching focused knowledge graph:', error);
    return {
      success: false,
      error: 'Failed to fetch focused knowledge graph data',
      data: {
        nodes: [],
        connections: [],
        stats: {
          totalBriefs: 0,
          totalAuthors: 0,
          totalCategories: 0,
          totalSources: 0,
          totalConnections: 0,
        },
      } as KnowledgeGraphData,
    };
  }
}
