'use client';

import React from 'react';
import BriefCard, { BriefCardProps } from './brief_card';

type PopularBriefsProps = {
  briefs: BriefCardProps[];
};

// Sample data for demonstration
const sampleBriefs: BriefCardProps[] = [
  {
    id: '1',
    title: 'Quantum Computing Impact on Modern Cryptography',
    abstract: 'A detailed analysis of how quantum computing advancements will affect current cryptographic methods and the steps being taken to develop quantum-resistant algorithms.',
    model: 'OpenAI',
    date: '2025-02-10',
    readTime: '7 min',
    category: 'Computer Science',
    views: 4893,
    featured: true
  },
  {
    id: '2',
    title: 'The Evolution of Protein Folding Algorithms',
    abstract: 'Examining the latest advancements in computational methods for predicting protein structures and how they contribute to drug discovery and treatment development.',
    model: 'Anthropic',
    date: '2025-02-15',
    readTime: '5 min',
    category: 'Biology',
    views: 3217
  },
  {
    id: '3',
    title: 'Climate Model Accuracy: A 50-Year Retrospective',
    abstract: 'Analyzing the historical accuracy of climate prediction models from the 1970s to present day, with insights into their improving precision and remaining challenges.',
    model: 'Perplexity',
    date: '2025-02-21',
    readTime: '8 min',
    category: 'Environmental Science',
    views: 2954
  },
  {
    id: '4',
    title: 'Neural Networks in Financial Market Prediction',
    abstract: 'Exploring how deep learning models are being applied to financial forecasting and the ethical considerations of algorithmic trading systems.',
    model: 'OpenAI',
    date: '2025-02-18',
    readTime: '6 min',
    category: 'Finance',
    views: 3752
  }
];

const PopularBriefs: React.FC<PopularBriefsProps> = ({ briefs = sampleBriefs }) => {
  return (
    <section className="py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Popular Research Insights</h2>
        <a href="/browse" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View all
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {briefs.map((brief) => (
          <BriefCard key={brief.id} {...brief} />
        ))}
      </div>
    </section>
  );
};

export default PopularBriefs;