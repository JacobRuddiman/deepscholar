/**
 * Enhanced API Documentation Component
 * 
 * Interactive API documentation with switchable examples
 */

'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Code, ExternalLink } from 'lucide-react';

interface ApiExample {
  title: string;
  description: string;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, string>;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: any;
  };
}

interface ApiEndpoint {
  name: string;
  description: string;
  endpoint: string;
  examples: ApiExample[];
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    name: 'Brief Export',
    description: 'Export individual research briefs in various formats',
    endpoint: '/api/export/brief/[id]',
    examples: [
      {
        title: 'Export Brief as PDF',
        description: 'Export a research brief as a PDF document with references',
        request: {
          method: 'GET',
          url: '/api/export/brief/brief-123?format=pdf&includeReferences=true&includeMetadata=false',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="AI_Research_Brief_2025-06-18.pdf"',
            'Content-Length': '245760'
          },
          body: '[PDF Binary Data]'
        }
      },
      {
        title: 'Export Brief as Markdown',
        description: 'Export a research brief as GitHub-compatible markdown',
        request: {
          method: 'GET',
          url: '/api/export/brief/brief-123?format=markdown&includeReferences=true&includeMetadata=true',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': 'attachment; filename="AI_Research_Brief_2025-06-18.md"',
            'Content-Length': '12847'
          },
          body: `# AI Research Brief: Machine Learning Applications

**Author:** Dr. Sarah Johnson
**Model:** GPT-4 (OpenAI)
**Created:** 6/18/2025

---

## Abstract

This research brief explores the latest applications of machine learning...

## Content

Machine learning has revolutionized various industries...

## References

1. "Deep Learning Fundamentals" - [Nature AI](https://nature.com/ai/article1)
2. "Neural Networks in Practice" - [MIT Research](https://mit.edu/research/nn)`
        }
      },
      {
        title: 'Export Brief as JSON',
        description: 'Export a research brief as structured JSON data',
        request: {
          method: 'GET',
          url: '/api/export/brief/brief-123?format=json&includeReferences=true&includeMetadata=true',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="AI_Research_Brief_2025-06-18.json"',
            'Content-Length': '8934'
          },
          body: {
            id: 'brief-123',
            title: 'AI Research Brief: Machine Learning Applications',
            abstract: 'This research brief explores the latest applications...',
            content: 'Machine learning has revolutionized various industries...',
            author: {
              id: 'user-456',
              name: 'Dr. Sarah Johnson',
              email: 'sarah.johnson@university.edu'
            },
            model: {
              name: 'GPT-4',
              provider: 'OpenAI',
              version: '4.0'
            },
            categories: ['Machine Learning', 'AI Research', 'Technology'],
            statistics: {
              viewCount: 1247,
              upvotes: 89,
              createdAt: '2025-06-18T10:30:00Z',
              updatedAt: '2025-06-18T10:30:00Z'
            },
            references: [
              {
                id: 'ref-1',
                highlightedText: 'Deep learning fundamentals',
                source: {
                  title: 'Nature AI Research',
                  url: 'https://nature.com/ai/article1'
                }
              }
            ]
          }
        }
      }
    ]
  },
  {
    name: 'User Profile Export',
    description: 'Export user profiles with statistics and brief history',
    endpoint: '/api/export/user/[id]',
    examples: [
      {
        title: 'Export User Profile as JSON',
        description: 'Export complete user profile data as JSON',
        request: {
          method: 'GET',
          url: '/api/export/user/user-456?format=json&includeMetadata=true',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="User_Profile_Dr_Sarah_Johnson_2025-06-18.json"',
            'Content-Length': '3456'
          },
          body: {
            id: 'user-456',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@university.edu',
            joinedAt: '2024-01-15T09:00:00Z',
            statistics: {
              briefsCreated: 23,
              reviewsWritten: 45,
              upvotesReceived: 234,
              tokenBalance: 1500
            },
            briefs: [
              {
                id: 'brief-123',
                title: 'AI Research Brief: Machine Learning Applications',
                abstract: 'This research brief explores...',
                createdAt: '2025-06-18T10:30:00Z',
                viewCount: 1247,
                upvotes: 89
              }
            ]
          }
        }
      },
      {
        title: 'Export User Profile as CSV',
        description: 'Export user profile data in CSV format for analysis',
        request: {
          method: 'GET',
          url: '/api/export/user/user-456?format=csv&includeMetadata=false',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="User_Profile_Dr_Sarah_Johnson_2025-06-18.csv"',
            'Content-Length': '234'
          },
          body: `ID,Name,Email,Joined,Briefs Created,Reviews Written,Upvotes Received,Token Balance
user-456,Dr. Sarah Johnson,sarah.johnson@university.edu,2024-01-15T09:00:00.000Z,23,45,234,1500`
        }
      },
      {
        title: 'Export User Profile as PDF',
        description: 'Export user profile as a formatted PDF document',
        request: {
          method: 'GET',
          url: '/api/export/user/user-456?format=pdf&includeMetadata=true',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="User_Profile_Dr_Sarah_Johnson_2025-06-18.pdf"',
            'Content-Length': '156789'
          },
          body: '[PDF Binary Data]'
        }
      }
    ]
  },
  {
    name: 'Search Results Export',
    description: 'Export search results with filters and metadata',
    endpoint: '/api/export/search',
    examples: [
      {
        title: 'Export Search Results as CSV',
        description: 'Export search results in CSV format for data analysis',
        request: {
          method: 'GET',
          url: '/api/export/search?query=machine%20learning&format=csv&includeMetadata=true',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="Search_Results_machine_learning_2025-06-18.csv"',
            'Content-Length': '5678'
          },
          body: `Rank,ID,Title,Author,Created,Relevance Score,Abstract
1,brief-123,AI Research Brief: Machine Learning Applications,Dr. Sarah Johnson,2025-06-18T10:30:00.000Z,0.95,This research brief explores the latest applications...
2,brief-124,Deep Learning in Healthcare,Dr. Michael Chen,2025-06-17T14:20:00.000Z,0.87,An analysis of deep learning applications in medical diagnosis...`
        }
      },
      {
        title: 'Export Search Results as JSON',
        description: 'Export search results with full metadata as JSON',
        request: {
          method: 'GET',
          url: '/api/export/search?query=machine%20learning&format=json&includeMetadata=true',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="Search_Results_machine_learning_2025-06-18.json"',
            'Content-Length': '12456'
          },
          body: {
            query: 'machine learning',
            filters: {
              category: 'AI Research',
              dateRange: 'last_month'
            },
            totalResults: 47,
            results: [
              {
                id: 'brief-123',
                title: 'AI Research Brief: Machine Learning Applications',
                abstract: 'This research brief explores the latest applications...',
                author: 'Dr. Sarah Johnson',
                createdAt: '2025-06-18T10:30:00Z',
                relevanceScore: 0.95
              },
              {
                id: 'brief-124',
                title: 'Deep Learning in Healthcare',
                abstract: 'An analysis of deep learning applications...',
                author: 'Dr. Michael Chen',
                createdAt: '2025-06-17T14:20:00Z',
                relevanceScore: 0.87
              }
            ],
            searchMetadata: {
              executedAt: '2025-06-18T15:45:00Z',
              executionTime: 234,
              page: 1,
              limit: 50
            }
          }
        }
      },
      {
        title: 'Export Search Results as HTML',
        description: 'Export search results as a formatted HTML report',
        request: {
          method: 'GET',
          url: '/api/export/search?query=machine%20learning&format=html&includeMetadata=false',
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY',
            'Content-Type': 'application/json'
          }
        },
        response: {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': 'attachment; filename="Search_Results_machine_learning_2025-06-18.html"',
            'Content-Length': '8934'
          },
          body: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Search Results: machine learning</title>
    <style>/* CSS styles */</style>
</head>
<body>
    <h1>Search Results: "machine learning"</h1>
    <p><strong>Total Results:</strong> 47</p>
    <div class="results">
        <div class="result-item">
            <h3>1. AI Research Brief: Machine Learning Applications</h3>
            <p>This research brief explores the latest applications...</p>
            <div class="result-meta">Author: Dr. Sarah Johnson | Created: 6/18/2025</div>
        </div>
    </div>
</body>
</html>`
        }
      }
    ]
  }
];

export default function ApiDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [selectedExample, setSelectedExample] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const currentEndpoint = API_ENDPOINTS[selectedEndpoint];
  const currentExample = currentEndpoint?.examples[selectedExample];

  if (!currentEndpoint || !currentExample) {
    return <div>Loading...</div>;
  }

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateCurlCommand = (example: ApiExample) => {
    const headers = Object.entries(example.request.headers || {})
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(' \\\n  ');
    
    return `curl -X ${example.request.method} "${window.location.origin}${example.request.url}" \\
  ${headers}`;
  };

  const nextExample = () => {
    setSelectedExample((prev) => (prev + 1) % currentEndpoint.examples.length);
  };

  const prevExample = () => {
    setSelectedExample((prev) => (prev - 1 + currentEndpoint.examples.length) % currentEndpoint.examples.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Code className="w-5 h-5" />
        API Documentation
      </h2>
      
      <p className="text-gray-600 mb-6">
        Access your data programmatically using our REST API. Perfect for automation and integration.
      </p>

      {/* Endpoint Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select API Endpoint
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {API_ENDPOINTS.map((endpoint, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedEndpoint(index);
                setSelectedExample(0);
              }}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedEndpoint === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{endpoint.name}</div>
              <div className="text-xs text-gray-600 mt-1">{endpoint.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Basic API Format for Selected Endpoint */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-2">API Format for {currentEndpoint.name}</h3>
        <div className="bg-gray-900 rounded p-3 text-sm font-mono text-gray-100">
          {currentEndpoint.endpoint.includes('[id]') ? (
            <>
              <div className="text-green-400">GET {currentEndpoint.endpoint}?format=[format]&includeReferences=[true|false]&includeMetadata=[true|false]</div>
              <div className="text-blue-300 mt-1">Authorization: Bearer YOUR_API_KEY</div>
              <div className="text-yellow-300 mt-1">Content-Type: application/json</div>
            </>
          ) : (
            <>
              <div className="text-green-400">GET {currentEndpoint.endpoint}?query=[search_terms]&format=[format]&includeReferences=[true|false]&includeMetadata=[true|false]</div>
              <div className="text-blue-300 mt-1">Authorization: Bearer YOUR_API_KEY</div>
              <div className="text-yellow-300 mt-1">Content-Type: application/json</div>
            </>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {currentEndpoint.endpoint.includes('[id]') ? (
            <>
              Replace <code className="bg-gray-200 px-1 rounded">[id]</code> with the specific ID and <code className="bg-gray-200 px-1 rounded">[format]</code> with: pdf, markdown, html, json, csv, docx, txt
            </>
          ) : (
            <>
              Replace <code className="bg-gray-200 px-1 rounded">[search_terms]</code> with your query and <code className="bg-gray-200 px-1 rounded">[format]</code> with: csv, json, html, pdf
            </>
          )}
        </div>
      </div>

      {/* Export Options Explanation */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-3">Export Options Explained</h3>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-blue-800 text-sm mb-1">References (includeReferences)</h4>
            <p className="text-sm text-blue-700">
              <strong>What it includes:</strong> Source citations and links that support the research brief content. 
              This includes academic papers, articles, and websites that were referenced during brief creation, 
              along with specific highlighted text that links to each source.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <em>Example: "[1] Nature AI Research - Deep Learning Fundamentals" with highlighted text "neural networks have shown remarkable progress"</em>
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 text-sm mb-1">Metadata (includeMetadata)</h4>
            <p className="text-sm text-blue-700">
              <strong>What it includes:</strong> Technical details about the export such as creation timestamps, 
              AI model information (GPT-4, Claude, etc.), author details, view counts, upvotes, categories, 
              and system-generated statistics.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <em>Example: "Created: 2025-06-18, Model: GPT-4 (OpenAI), Views: 1,247, Categories: [AI Research, Technology]"</em>
            </p>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
          <strong>Tip:</strong> Enable both options for complete exports suitable for research and archival purposes. 
          Disable both for clean, content-only exports.
        </div>
      </div>

      {/* Example Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            API Examples ({selectedExample + 1} of {currentEndpoint.examples.length})
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={prevExample}
              disabled={currentEndpoint.examples.length <= 1}
              className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextExample}
              disabled={currentEndpoint.examples.length <= 1}
              className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-1">{currentExample.title}</h3>
          <p className="text-sm text-blue-700">{currentExample.description}</p>
        </div>
      </div>

      {/* Request Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Request</h4>
          <button
            onClick={() => copyToClipboard(generateCurlCommand(currentExample), 'curl')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <Copy className="w-4 h-4" />
            {copiedSection === 'curl' ? 'Copied!' : 'Copy cURL'}
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
          <div className="text-green-400 mb-2">
            {currentExample.request.method} {currentExample.request.url}
          </div>
          {Object.entries(currentExample.request.headers || {}).map(([key, value]) => (
            <div key={key} className="text-blue-300">
              {key}: <span className="text-yellow-300">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Response Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Response</h4>
          <button
            onClick={() => copyToClipboard(JSON.stringify(currentExample.response.body, null, 2), 'response')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <Copy className="w-4 h-4" />
            {copiedSection === 'response' ? 'Copied!' : 'Copy Response'}
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
          <div className="text-green-400 mb-2">
            HTTP {currentExample.response.status}
          </div>
          {Object.entries(currentExample.response.headers || {}).map(([key, value]) => (
            <div key={key} className="text-blue-300">
              {key}: <span className="text-yellow-300">{value}</span>
            </div>
          ))}
          <div className="mt-3 text-gray-300">
            <pre className="whitespace-pre-wrap">
              {typeof currentExample.response.body === 'string' 
                ? currentExample.response.body 
                : JSON.stringify(currentExample.response.body, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
        <p className="text-sm text-gray-600 mb-3">
          All API requests require authentication. Include your API key in the Authorization header.
        </p>
        
        <h4 className="font-medium text-gray-900 mb-2">Rate Limits</h4>
        <p className="text-sm text-gray-600 mb-3">
          API requests are limited to 10 exports per day per user. Contact support for higher limits.
        </p>

        <div className="flex items-center gap-2 text-sm text-blue-600">
          <ExternalLink className="w-4 h-4" />
          <a href="/docs/api" className="hover:text-blue-800">
            View Full API Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
