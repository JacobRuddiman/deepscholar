// briefs/page.tsx
'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  FileText,
  ExternalLink,
  ThumbsUp,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  MessageSquare,
  Award,
  User,
  Brain
} from "lucide-react";

import { markdownComponents } from "../components/brief_editor_utils";

// Define interfaces for our data types based on the schema
interface Source {
  id: string;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
}

interface UserInfo {
  id: string;
  name: string;
  image?: string;
}

interface ReviewAIModel {
  id: string;
  name: string;
  provider: string;
  version: string;
}

interface Review {
  id: string;
  content: string;
  rating: number;  // 1-5 star rating
  briefId: string;
  userId: string;
  author: UserInfo;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AIReview {
  id: string;
  content: string;
  rating: number;  // 1-5 star rating
  briefId: string;
  modelId: string;
  model: ReviewAIModel;
  requesterId?: string;  // Optional reference to user who requested the review
  requesterName?: string;
  helpfulCount: number;
  createdAt: string;
}

interface ResearchAIModel {
  id: string;
  name: string;
  provider: string;
  version: string;
}

interface BriefData {
  id: string;
  title: string;
  prompt: string;
  response: string;
  abstract?: string;
  thinking?: string;
  model: ResearchAIModel;
  author: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
    organization?: string;
  };
  categories: string[];
  sources: Source[];
  reviews: Review[];
  aiReviews: AIReview[];
  upvoteCount: number;
  savedCount: number;
  viewCount: number;
  readTime?: number;
  accuracy?: number;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
const groupSourcesByDomain = (sources: Source[]) => {
  const groups = new Map<string, Source[]>();
  
  sources.forEach(source => {
    if (!groups.has(source.domain)) {
      groups.set(source.domain, []);
    }
    groups.get(source.domain)?.push(source);
  });
  
  return groups;
};

const getUrlPath = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return url;
  }
};

const getFaviconUrl = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

// Define interface for the page props
interface BriefPageProps {
  brief: BriefData;
  owner: {
    name: string;
    avatar: string;
    role: string;
    organization?: string;
  };
  metadata: {
    viewCount: number;
    readTime: number;  // in minutes
    accuracy: number;  // as percentage
    published: string; // ISO date string
    lastUpdated: string | null; // ISO date string
    categories?: string[];
    tags?: string[];
    citationCount?: number;
    doi?: string; // Digital Object Identifier
  };
}

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function BriefPage({ brief }: { brief: BriefData }) {
  // State for collapsible sections
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(true);
  const [activeSourcesDomain, setActiveSourcesDomain] = useState<string | null>(null);
  
  // For demo purposes, using placeholder data if not provided
  const briefData: BriefData = brief || {
    id: "cl12345abcdef",
    title: "Understanding the Implications of Large Language Models on Society",
    prompt: "Analyze the potential societal impacts of large language models, considering ethical implications, bias concerns, and policy recommendations.",
    response: "## Introduction\n\nLarge Language Models (LLMs) represent a significant advancement in artificial intelligence...\n\n## Key Findings\n\n1. LLMs demonstrate both benefits and risks to society...\n\n## Discussion\n\nThe emergence of LLMs has raised important questions about the future of work, education, and information access...",
    abstract: "This brief examines the societal impact of large language models, focusing on ethical considerations, potential biases, and future policy directions.",
    thinking: "First, I'll consider the ethical implications of LLMs by analyzing their impact on privacy, information integrity, and human autonomy. Then, I'll examine known biases in these systems and their potential societal consequences. Finally, I'll outline policy approaches that could mitigate risks while preserving benefits.",
    model: {
      id: "model_123",
      name: "GPT-4",
      provider: "OpenAI",
      version: "v1.0"
    },
    author: {
      id: "user_456",
      name: "Dr. Jane Smith",
      avatar: "/api/placeholder/48/48",
      role: "AI Researcher",
      organization: "Stanford University"
    },
    categories: ["Artificial Intelligence", "Ethics", "Society"],
    sources: [
      {
        id: "src_1",
        title: "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?",
        url: "https://dl.acm.org/doi/10.1145/3442188.3445922",
        domain: "dl.acm.org"
      },
      {
        id: "src_2",
        title: "Language Models are Few-Shot Learners",
        url: "https://papers.nips.cc/paper/2020/hash/1457c0d6bfcb4967418bfb8ac142f64a-Abstract.html",
        domain: "papers.nips.cc"
      },
      {
        id: "src_3",
        title: "Ethical and social risks of harm from Language Models",
        url: "https://arxiv.org/abs/2112.04359",
        domain: "arxiv.org"
      },
      {
        id: "src_4",
        title: "Constitutional AI: Harmlessness from AI Feedback",
        url: "https://arxiv.org/abs/2212.08073",
        domain: "arxiv.org"
      }
    ],
    reviews: [
      {
        id: "rev_1",
        content: "Comprehensive analysis with balanced viewpoints. The exploration of ethical considerations is particularly well-researched, and the policy recommendations are both pragmatic and forward-thinking.",
        rating: 5,
        briefId: "cl12345abcdef",
        userId: "user_789",
        author: {
          id: "user_789",
          name: "Prof. Michael Johnson",
          image: "/api/placeholder/32/32"
        },
        helpfulCount: 24,
        createdAt: "2023-11-18T14:32:00Z",
        updatedAt: "2023-11-18T14:32:00Z"
      },
      {
        id: "rev_2",
        content: "Good overview but lacks some specific technical details about how these language models work. Would have appreciated more information on token encoding algorithms and attention mechanisms.",
        rating: 4,
        briefId: "cl12345abcdef",
        userId: "user_790",
        author: {
          id: "user_790",
          name: "Dr. Sarah Williams",
          image: "/api/placeholder/32/32"
        },
        helpfulCount: 8,
        createdAt: "2023-11-20T09:15:00Z",
        updatedAt: "2023-11-20T09:15:00Z"
      }
    ],
    aiReviews: [
      {
        id: "airev_1",
        content: "The brief provides a thorough examination of LLM societal impacts with strong supporting evidence. Minor improvements could include more quantitative data on specific risks. The ethical framework is sound and the analysis covers multiple stakeholder perspectives. Citation quality is excellent.",
        rating: 5,
        briefId: "cl12345abcdef",
        modelId: "model_789",
        model: {
          id: "model_789",
          name: "Claude",
          provider: "Anthropic",
          version: "3 Opus"
        },
        requesterId: "user_456",
        requesterName: "Dr. Jane Smith",
        helpfulCount: 42,
        createdAt: "2023-11-16T09:15:00Z"
      },
      {
        id: "airev_2",
        content: "This brief accurately captures the current state of LLM technology and presents a balanced view of potential societal impacts. The section on labor market disruption could benefit from more granular industry-specific analysis. References are comprehensive but some recent 2023 publications could be added to strengthen the argument on regulation approaches.",
        rating: 4,
        briefId: "cl12345abcdef",
        modelId: "model_456",
        model: {
          id: "model_456",
          name: "GPT-4",
          provider: "OpenAI",
          version: "Turbo"
        },
        helpfulCount: 18,
        createdAt: "2023-11-17T14:22:00Z"
      }
    ],
    upvoteCount: 87,
    savedCount: 32,
    viewCount: 1432,
    readTime: 7,
    accuracy: 92,
    slug: "understanding-llm-societal-implications",
    published: true,
    createdAt: "2023-11-15T00:00:00Z",
    updatedAt: "2023-12-02T00:00:00Z"
  };
  
  // Initialize active sources domain
  useEffect(() => {
    if (briefData.sources && briefData.sources.length > 0 && !activeSourcesDomain) {
      const sourceGroups = groupSourcesByDomain(briefData.sources);
      const domains = Array.from(sourceGroups.keys());
      if (domains.length > 0) {
        setActiveSourcesDomain(domains[0]);
      }
    }
  }, [briefData.sources, activeSourcesDomain]);

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="relative container mx-auto px-4 py-6 max-w-5xl">
        {/* Peer section - at the top */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="mb-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{briefData.viewCount.toLocaleString()} views</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{briefData.readTime} min read</span>
              </div>
              
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-600">{briefData.accuracy}% accuracy</span>
              </div>
              
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{briefData.upvoteCount} upvotes</span>
              </div>
              
              <div className="flex items-center">
                <Bookmark className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{briefData.savedCount} saves</span>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">Published {formatDate(briefData.createdAt)}</span>
              <span className="text-xs text-gray-500">Updated {formatDate(briefData.updatedAt)}</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content Container */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* Title and owner section */}
          <div className="flex flex-col md:flex-row border-b border-gray-200">
            {/* Title area (3/4 width) */}
            <div className="w-full md:w-3/4 p-6 md:border-r border-gray-200">
              <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-2">
                {briefData.title}
              </h1>
            </div>
            
            {/* Owner area (1/4 width) */}
            <div className="w-full md:w-1/4 p-6 bg-gray-50">
              <div className="flex items-start mb-2">
                <img 
                  src={briefData.author.avatar} 
                  alt={briefData.author.name}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">{briefData.author.name}</p>
                  {briefData.author.role && (
                    <p className="text-sm text-gray-600">{briefData.author.role}</p>
                  )}
                  {briefData.author.organization && (
                    <p className="text-xs text-gray-500 mt-1">{briefData.author.organization}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="p-8">
            {/* Abstract */}
            <div className="mb-8 border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold mb-4">Abstract</h2>
              <div className="prose max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize, rehypeRaw]}
                  components={markdownComponents}
                >
                  {briefData.abstract}
                </ReactMarkdown>
              </div>
            </div>

            {/* Research content */}
            <div className="prose max-w-none mb-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize, rehypeRaw]}
                components={markdownComponents}
              >
                {briefData.response}
              </ReactMarkdown>
            </div>
            
            {/* AI Thinking Process - Collapsible */}
            <div className="border border-gray-200 rounded-lg mb-8">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 rounded-t-lg"
                onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
              >
                <div className="flex items-center">
                  <Brain className="h-5 w-5 text-indigo-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-700">AI Thinking Process</h2>
                </div>
                <button className="text-gray-500 p-1" aria-label="Toggle thinking">
                  {isThinkingExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              
              {isThinkingExpanded && briefData.thinking && (
                <div className="p-4 bg-white rounded-b-lg">
                  <div className="prose max-w-none text-gray-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize, rehypeRaw]}
                      components={markdownComponents}
                    >
                      {briefData.thinking}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
            
            {/* Original Prompt - Collapsible */}
            <div className="border border-gray-200 rounded-lg mb-8">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 rounded-t-lg"
                onClick={() => setIsPromptExpanded(!isPromptExpanded)}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-700">Original Research Prompt</h2>
                </div>
                <button className="text-gray-500 p-1" aria-label="Toggle prompt">
                  {isPromptExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              
              {isPromptExpanded && (
                <div className="p-4 bg-white rounded-b-lg">
                  <div className="prose max-w-none">
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <p className="text-gray-700">{briefData.prompt}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata footer */}
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            {/* Sources */}
            <div className="mb-6">
              <div 
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
              >
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Sources</h3>
                <button className="text-gray-500 p-1" aria-label="Toggle sources">
                  {isSourcesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {isSourcesExpanded && (
                <div className="mb-6">
                  {briefData.sources && briefData.sources.length > 0 ? (
                    <div>
                      {/* Tabs */}
                      {(() => {
                        const sourceGroups = groupSourcesByDomain(briefData.sources);
                        const domains = Array.from(sourceGroups.keys());
                        
                        return (
                          <>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {domains.map(domain => (
                                <button
                                  key={domain}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSourcesDomain(domain);
                                  }}
                                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                    activeSourcesDomain === domain
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {domain}
                                  <span className="ml-1 text-xs">
                                    ({sourceGroups.get(domain)?.length})
                                  </span>
                                </button>
                              ))}
                            </div>
                            
                            {/* Source List */}
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {activeSourcesDomain && sourceGroups.get(activeSourcesDomain)?.map((source: Source, index: number) => {
                                const favicon = getFaviconUrl(activeSourcesDomain);
                                return (
                                  <div 
                                    key={index} 
                                    className="p-2 border rounded-md border-gray-200 text-sm break-words"
                                  >
                                    <div className="flex items-start gap-2">
                                      <img 
                                        src={favicon} 
                                        alt={`${activeSourcesDomain} favicon`}
                                        className="w-4 h-4 mt-1 flex-shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                      <LinkIcon className="text-gray-500 mt-1 flex-shrink-0 hidden" size={14} />
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium line-clamp-2">{source.title}</p>
                                        <a 
                                          href={source.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline block truncate"
                                          onClick={(e) => e.stopPropagation()}
                                          title={source.url}
                                        >
                                          {getUrlPath(source.url)}
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="py-3 text-center text-gray-500 text-sm">
                      <p>No sources found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Reviews */}
            <div className="mb-6">
              <div 
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => setIsReviewsExpanded(!isReviewsExpanded)}
              >
                <h3 className="text-sm font-semibold text-gray-500 uppercase">
                  Reviews ({briefData.reviews.length + briefData.aiReviews.length})
                </h3>
                <button className="text-gray-500 p-1" aria-label="Toggle reviews">
                  {isReviewsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {isReviewsExpanded && (
                <div>
                  {/* User Reviews */}
                  {briefData.reviews.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">User Reviews</h4>
                      <div className="space-y-3">
                        {briefData.reviews.map(review => (
                          <div key={review.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center">
                                <img 
                                  src={review.author.image || '/api/placeholder/32/32'} 
                                  alt={review.author.name}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                                <span className="font-medium text-gray-800">{review.author.name}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="flex items-center px-2 py-1 bg-yellow-100 rounded-full">
                                  <span className="text-sm text-yellow-700 font-medium mr-1">{review.rating}/5</span>
                                  <Award className="h-4 w-4 text-yellow-500" />
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{review.content}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatDate(review.createdAt)}
                              </span>
                              <div className="flex items-center text-xs text-gray-500">
                                <ThumbsUp className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{review.helpfulCount} found helpful</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* AI Reviews */}
                  {briefData.aiReviews.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">AI Reviews</h4>
                      <div className="space-y-3">
                        {briefData.aiReviews.map(review => (
                          <div key={review.id} className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center">
                                <Brain className="w-5 h-5 text-purple-500 mr-2" />
                                <div>
                                  <span className="font-medium text-gray-800">{review.model.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">({review.model.provider})</span>
                                  {review.requesterId && review.requesterName && (
                                    <span className="text-xs text-gray-500 ml-2"> • Requested by {review.requesterName}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="flex items-center px-2 py-1 bg-purple-100 rounded-full">
                                  <span className="text-sm text-purple-700 font-medium mr-1">{review.rating}/5</span>
                                  <Award className="h-4 w-4 text-purple-500" />
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{review.content}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {formatDate(review.createdAt)} • {review.model.version}
                              </span>
                              <div className="flex items-center text-xs text-gray-500">
                                <ThumbsUp className="h-3 w-3 mr-1 text-gray-400" />
                                <span>{review.helpfulCount} found helpful</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Model and Publication Info */}
            <div className="flex flex-col md:flex-row justify-between mb-6 pt-4 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Model</h3>
                <div className="flex items-center mb-4">
                  <span className="font-medium text-gray-700">{briefData.model.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({briefData.model.provider})</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Version</h3>
                <span className="text-gray-700">{briefData.model.version}</span>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Document Type</h3>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">Research Brief</span>
                </div>
              </div>
            </div>
            
            {/* Additional metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <div>
                {briefData.categories && briefData.categories.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {briefData.categories.map((category, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Unique Identifier Information */}
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Brief ID</h3>
                  <p className="text-sm font-mono text-gray-700">{briefData.id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Slug</h3>
                  <p className="text-sm text-gray-700">{briefData.slug}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}