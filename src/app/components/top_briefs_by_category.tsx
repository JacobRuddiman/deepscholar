'use client';

import React, { useState } from 'react';
import BriefCard, { BriefCardProps } from './brief_card';

type CategoryBriefsProps = {
  categories: {
    name: string;
    briefs: BriefCardProps[];
  }[];
};

// Sample data for demonstration
const sampleCategories = [
  {
    name: 'Computer Science',
    briefs: [
      {
        id: '5',
        title: 'The Future of Edge Computing in IoT Environments',
        abstract: 'Analysis of how edge computing architectures are transforming IoT applications by reducing latency and improving real-time processing capabilities.',
        model: 'OpenAI',
        date: '2025-02-12',
        readTime: '6 min',
        category: 'Computer Science',
        views: 2187
      },
      {
        id: '6',
        title: 'Homomorphic Encryption: Computation on Encrypted Data',
        abstract: 'Exploring the latest advancements in homomorphic encryption that enable processing data while it remains encrypted, preserving privacy.',
        model: 'Anthropic',
        date: '2025-02-17',
        readTime: '8 min',
        category: 'Computer Science',
        views: 1982
      },
      {
        id: '7',
        title: 'Zero-Knowledge Proofs in Blockchain Authentication',
        abstract: 'How zero-knowledge proof systems are enhancing privacy and security in blockchain networks while maintaining verification capabilities.',
        model: 'Perplexity',
        date: '2025-02-19',
        readTime: '5 min',
        category: 'Computer Science',
        views: 1654
      }
    ]
  },
  {
    name: 'Medicine',
    briefs: [
      {
        id: '8',
        title: 'mRNA Delivery Systems: Beyond COVID-19 Vaccines',
        abstract: 'Review of how mRNA technology is being adapted for treatments beyond vaccines, including cancer therapies and genetic disorder interventions.',
        model: 'Perplexity',
        date: '2025-02-14',
        readTime: '7 min',
        category: 'Medicine',
        views: 3214
      },
      {
        id: '9',
        title: 'Precision Medicine in Neurological Disorders',
        abstract: 'Examining how personalized treatment approaches are improving outcomes for patients with complex neurological conditions.',
        model: 'OpenAI',
        date: '2025-02-11',
        readTime: '6 min',
        category: 'Medicine',
        views: 2876
      },
      {
        id: '10',
        title: 'AI-Assisted Diagnostic Imaging Accuracy',
        abstract: 'Analysis of recent studies comparing AI diagnostic systems with human radiologists across various medical imaging applications.',
        model: 'Anthropic',
        date: '2025-02-20',
        readTime: '9 min',
        category: 'Medicine',
        views: 2543
      }
    ]
  },
  {
    name: 'Environmental Science',
    briefs: [
      {
        id: '11',
        title: 'Carbon Capture Technologies: Comparative Efficiency Analysis',
        abstract: 'Evaluating the cost-effectiveness and scalability of emerging carbon capture methods for climate change mitigation.',
        model: 'OpenAI',
        date: '2025-02-13',
        readTime: '8 min',
        category: 'Environmental Science',
        views: 1876
      },
      {
        id: '12',
        title: 'Ocean Acidification: Impacts on Marine Ecosystems',
        abstract: 'Recent findings on how changing ocean chemistry affects biodiversity and ecosystem services in coastal waters.',
        model: 'Perplexity',
        date: '2025-02-16',
        readTime: '7 min',
        category: 'Environmental Science',
        views: 1654
      },
      {
        id: '13',
        title: 'Sustainable Urban Water Management Systems',
        abstract: 'Analysis of innovative approaches to water conservation, treatment, and distribution in rapidly growing urban environments.',
        model: 'Anthropic',
        date: '2025-02-18',
        readTime: '6 min',
        category: 'Environmental Science',
        views: 1432
      }
    ]
  }
];

const TopBriefsByCategory: React.FC<CategoryBriefsProps> = ({ categories = sampleCategories }) => {
  const [activeCategory, setActiveCategory] = useState(categories[0].name);
  
  const activeCategoryData = categories.find(cat => cat.name === activeCategory) || categories[0];
  
  return (
    <section className="py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Research by Category</h2>
      
      <div className="mb-5 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                activeCategory === category.name
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeCategoryData.briefs.map((brief) => (
          <BriefCard key={brief.id} {...brief} />
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <a href={`/category/${activeCategory.toLowerCase().replace(/\s+/g, '-')}`} 
           className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium">
          See all in {activeCategory}
        </a>
      </div>
    </section>
  );
};

export default TopBriefsByCategory;