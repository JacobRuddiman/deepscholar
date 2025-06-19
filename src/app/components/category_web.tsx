"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getCategoryNetwork, CategoryNetworkData, CategoryNode, CategoryConnection } from '@/server/actions/categories';

interface NetworkVisualizationProps {
  className?: string;
  width?: number;
  height?: number;
}

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function CategoryNetworkVisualization({ 
  className = "", 
  width, 
  height 
}: NetworkVisualizationProps) {
  const [networkData, setNetworkData] = useState<CategoryNetworkData>({ nodes: [], connections: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: width || 400, height: height || 300 });
  
  // Physics simulation state
  const nodePositions = useRef<Map<string, NodePosition>>(new Map());
  const isDragging = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await getCategoryNetwork();
        
        if (result.success) {
          setNetworkData(result.data);
          initializeNodePositions(result.data.nodes);
        } else {
          setError(result.error || 'Failed to load network data');
        }
      } catch (err) {
        setError('Failed to load network data');
        console.error('Error fetching network data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle responsive sizing
  useEffect(() => {
    if (!width || !height) {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({
            width: width || rect.width || 400,
            height: height || rect.height || 300,
          });
        }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [width, height]);

  // Initialize node positions randomly
  const initializeNodePositions = (nodes: CategoryNode[]) => {
    const positions = new Map<string, NodePosition>();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    nodes.forEach(node => {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
      
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius * Math.random(),
        y: centerY + Math.sin(angle) * radius * Math.random(),
        vx: 0,
        vy: 0,
      });
    });
    
    nodePositions.current = positions;
  };

  // Physics simulation
  const updatePhysics = () => {
    if (networkData.nodes.length === 0) return;

    const positions = nodePositions.current;
    const damping = 0.9;
    const repulsion = 5000; // Increased to spread nodes more
    const attraction = 0.05; // Decreased to reduce pulling
    const centerForce = 0.005; // Softer center force

    // Apply forces
    networkData.nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      // Center force
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      pos.vx += (centerX - pos.x) * centerForce;
      pos.vy += (centerY - pos.y) * centerForce;

      // Repulsion from other nodes
      networkData.nodes.forEach(otherNode => {
        if (node.id === otherNode.id) return;
        
        const otherPos = positions.get(otherNode.id);
        if (!otherPos) return;

        const dx = pos.x - otherPos.x;
        const dy = pos.y - otherPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = repulsion / (distance * distance);
        pos.vx += (dx / distance) * force;
        pos.vy += (dy / distance) * force;
      });
    });

    // Attraction along connections
    networkData.connections.forEach(connection => {
      const sourcePos = positions.get(connection.source);
      const targetPos = positions.get(connection.target);
      
      if (!sourcePos || !targetPos) return;

      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const force = attraction * distance;
      
      sourcePos.vx += (dx / distance) * force;
      sourcePos.vy += (dy / distance) * force;
      targetPos.vx -= (dx / distance) * force;
      targetPos.vy -= (dy / distance) * force;
    });

    // Update positions
    networkData.nodes.forEach(node => {
      if (isDragging.current === node.id) return; // Don't update dragged node
      
      const pos = positions.get(node.id);
      if (!pos) return;

      pos.vx *= damping;
      pos.vy *= damping;
      
      pos.x += pos.vx;
      pos.y += pos.vy;

      // Boundary constraints
      const nodeRadius = getNodeRadius(node);
      pos.x = Math.max(nodeRadius, Math.min(dimensions.width - nodeRadius, pos.x));
      pos.y = Math.max(nodeRadius, Math.min(dimensions.height - nodeRadius, pos.y));
    });
  };

  // Get node radius based on count
  const getNodeRadius = (node: CategoryNode): number => {
    const baseRadius = 20;
    const maxRadius = 50;
    const maxCount = Math.max(...networkData.nodes.map(n => n.count));
    return baseRadius + (node.count / maxCount) * (maxRadius - baseRadius);
  };

  // Render the network
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw connections
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    networkData.connections.forEach(connection => {
      const sourcePos = nodePositions.current.get(connection.source);
      const targetPos = nodePositions.current.get(connection.target);
      
      if (!sourcePos || !targetPos) return;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.stroke();
    });

    // Draw nodes
    networkData.nodes.forEach(node => {
      const pos = nodePositions.current.get(node.id);
      if (!pos) return;

      const radius = getNodeRadius(node);
      
      // Draw node circle
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // No border or text
    });
  };

  // Animation loop
  const animate = () => {
    updatePhysics();
    render();
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (networkData.nodes.length > 0) {
      initializeNodePositions(networkData.nodes);
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [networkData, dimensions]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find clicked node
    for (const node of networkData.nodes) {
      const pos = nodePositions.current.get(node.id);
      if (!pos) continue;

      const radius = getNodeRadius(node);
      const distance = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
      
      if (distance <= radius) {
        isDragging.current = node.id;
        dragOffset.current = {
          x: mouseX - pos.x,
          y: mouseY - pos.y,
        };
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pos = nodePositions.current.get(isDragging.current);
    if (pos) {
      pos.x = mouseX - dragOffset.current.x;
      pos.y = mouseY - dragOffset.current.y;
      pos.vx = 0;
      pos.vy = 0;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = null;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: dimensions.width, height: dimensions.height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center text-red-500 ${className}`} style={{ width: dimensions.width, height: dimensions.height }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ width: dimensions.width, height: dimensions.height }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Legend */}
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded text-xs">
        <div className="font-semibold mb-1">Category Network</div>
        <div>Node size = Article count</div>
        <div>Connections = Shared categories</div>
      </div>
    </div>
  );
}
