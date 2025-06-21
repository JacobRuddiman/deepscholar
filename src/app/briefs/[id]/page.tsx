// app/briefs/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getBriefBySlug, toggleBriefUpvote, toggleBriefSave, addBriefReview, deleteBriefReview, deleteBrief } from '@/server/actions/briefs';
import ErrorPopup from '@/app/components/error_popup';
import HelpfulButton from '@/app/components/helpful_button';
import { useDeviceDetection } from '@/app/hooks/useDeviceDetection';
import { 
  ThumbsUp, 
  MessageSquare, 
  Clock, 
  Loader2,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Eye,
  Star,
  User,
  Calendar,
  Tag,
  ExternalLink,
  Share2,
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';

// Keep the existing Brief type definition
type Brief = {
  id: string;
  title: string;
  abstract: string | null;
  response: string;
  thinking: string | null;
  slug: string;
  viewCount: number;
  readTime: number | null;
  accuracy: number | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: { id: string; name: string }[];
  sources: { id: string; title: string; url: string }[];
  upvotes: { id: string; userId: string }[];
  savedBy: { id: string; userId: string }[];
  reviews: {
    id: string;
    content: string;
    rating: number;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      image: string | null;
    };
    upvotes: { id: string; userId: string }[];
    helpfulMarks: { id: string; userId: string }[];
  }[];
  aiReviews: {
    id: string;
    content: string;
    rating: number;
    createdAt: Date;
    model: {
      id: string;
      name: string;
      provider: string;
    };
  }[];
  model: {
    id: string;
    name: string;
    provider: string;
    version: string;
  };
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export default function BriefPage() {
  const params = useParams();
  const id = params.id as string;
  const { isMobile, isTablet } = useDeviceDetection();
  
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canInteract, setCanInteract] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Mobile-specific states
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    abstract: true,
    content: true,
    sources: false,
    reviews: false,
    aiReviews: false
  });

  // Keep all existing useEffect and handler functions...
  useEffect(() => {
    if (id) {
      loadBrief().catch(console.error);
    }

    const timer = setTimeout(() => {
      setCanInteract(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [id]);

  // Keep all existing functions (loadBrief, handleUpvote, etc.)
  const loadBrief = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getBriefBySlug(id);
      
      if (!result.success) {
        setError(result.error ?? 'Failed to load brief');
        return;
      }

      if (result.data) {
        setBrief(result.data as unknown as Brief);
        const briefData = result.data as unknown as Brief;
        setUpvoteCount(briefData.upvotes?.length ?? 0);
        
        const currentUserId = 'local-user-1';
        const hasUpvoted = briefData.upvotes?.some(upvote => upvote.userId === currentUserId) ?? false;
        setIsUpvoted(hasUpvoted);
        
        const hasSaved = briefData.savedBy?.some(save => save.userId === currentUserId) ?? false;
        setIsSaved(hasSaved);

        if (briefData.author.id !== currentUserId) {
          const viewedBriefs = JSON.parse(localStorage.getItem('viewedBriefs') ?? '[]') as string[];
          const viewKey = `${currentUserId}-${id}`;
          if (!viewedBriefs.includes(viewKey)) {
            viewedBriefs.push(viewKey);
            localStorage.setItem('viewedBriefs', JSON.stringify(viewedBriefs));
          }
        }
      }
    } catch (error) {
      setError('Failed to load brief. Please try again later.');
      console.error('Error loading brief:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!brief) return;
    
    try {
      const result = await toggleBriefUpvote(brief.id);
      if (result.success && result.upvoted !== undefined) {
        setIsUpvoted(result.upvoted);
        setUpvoteCount(prev => result.upvoted ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const handleSave = async () => {
    if (!brief) return;
    
    try {
      const result = await toggleBriefSave(brief.id);
      if (result.success && result.saved !== undefined) {
        setIsSaved(result.saved);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!brief || !reviewContent.trim()) return;
    
    try {
      setIsSubmittingReview(true);
      const result = await addBriefReview(brief.id, reviewContent, reviewRating);
      
      if (result.success) {
        await loadBrief();
        setShowReviewForm(false);
        setReviewContent('');
        setReviewRating(5);
      } else {
        setError(result.error ?? 'Failed to submit review');
      }
    } catch (error) {
      setError('Failed to submit review. Please try again.');
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      const result = await deleteBriefReview(reviewId);
      
      if (result.success) {
        await loadBrief();
      } else {
        setError(result.error ?? 'Failed to delete review');
      }
    } catch (error) {
      setError('Failed to delete review. Please try again.');
      console.error('Error deleting review:', error);
    }
  };

  const handleDeleteBrief = async () => {
    if (!brief) return;
    if (!confirm('Are you sure you want to delete this brief? This action cannot be undone.')) return;
    
    try {
      const result = await deleteBrief(brief.id);
      
      if (result.success) {
        window.location.href = '/my-briefs';
      } else {
        setError(result.error ?? 'Failed to delete brief');
      }
    } catch (error) {
      setError('Failed to delete brief. Please try again.');
      console.error('Error deleting brief:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!brief && !isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Brief not found
        </div>
      </div>
    );
  }

  if (!brief) {
    return null;
  }

  const averageRating = brief.reviews.length > 0 
    ? brief.reviews.reduce((sum, review) => sum + review.rating, 0) / brief.reviews.length 
    : null;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-20">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold truncate flex-1 mr-4">{brief.title}</h1>
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="p-2 text-gray-600"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Actions Menu */}
        {showMobileActions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setShowMobileActions(false)}>
            <div className="bg-white w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Actions</h2>
                <button onClick={() => setShowMobileActions(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                {brief.author.id !== 'local-user-1' && (
                  <>
                    <button
                      onClick={async () => {
                        if (!canInteract) {
                          setError("You've got to read it first!");
                          return;
                        }
                        await handleUpvote();
                        setShowMobileActions(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg ${
                        isUpvoted ? 'bg-blue-50 text-blue-600' : 'bg-gray-50'
                      }`}
                    >
                      <ThumbsUp size={20} />
                      <span>Upvote ({upvoteCount})</span>
                    </button>
                    
                    <button
                      onClick={async () => {
                        await handleSave();
                        setShowMobileActions(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg ${
                        isSaved ? 'bg-green-50 text-green-600' : 'bg-gray-50'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </>
                )}

                {brief.author.id === 'local-user-1' && (
                  <>
                    <button
                      onClick={() => {
                        window.location.href = `/briefs/${brief.id}/edit`;
                      }}
                      className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-600 rounded-lg"
                    >
                      <Edit size={20} />
                      <span>Edit Brief</span>
                    </button>
                    <button
                      onClick={handleDeleteBrief}
                      className="w-full flex items-center space-x-3 p-3 bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 size={20} />
                      <span>Delete Brief</span>
                    </button>
                  </>
                )}

                <button 
                  onClick={() => {
                    setShowSharePopup(true);
                    setShowMobileActions(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="p-4 space-y-4">
          {/* Brief Info */}
          <div className="bg-white rounded-lg p-4">
            <h1 className="text-xl font-bold mb-3">{brief.title}</h1>
            
            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-3">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {brief.author.name ?? 'Anonymous'}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(brief.createdAt)}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {brief.viewCount} views
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {brief.readTime ?? calculateReadTime(brief.response)} min
              </span>
            </div>

            {averageRating && (
              <div className="flex items-center mb-3">
                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                <span className="text-sm">{averageRating.toFixed(1)} ({brief.reviews.length} reviews)</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {brief.categories.map((category) => (
                <span
                  key={category.id}
                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium"
                >
                  {category.name}
                </span>
              ))}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Generated by <span className="font-medium">{brief.model.provider} {brief.model.name}</span>
              </p>
            </div>
          </div>

          {/* Abstract */}
          {brief.abstract && (
            <div className="bg-white rounded-lg">
              <button
                onClick={() => toggleSection('abstract')}
                className="w-full flex items-center justify-between p-4"
              >
                <h2 className="text-lg font-semibold">Abstract</h2>
                {expandedSections.abstract ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.abstract &&  (
                <div className="px-4 pb-4">
                  <p className="text-gray-700">{brief.abstract}</p>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-lg">
            <button
              onClick={() => toggleSection('content')}
              className="w-full flex items-center justify-between p-4"
            >
              <h2 className="text-lg font-semibold">Content</h2>
              {expandedSections.content ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.content && (
              <div className="px-4 pb-4">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: brief.response }}
                />
              </div>
            )}
          </div>

          {/* Sources */}
          {brief.sources.length > 0 && (
            <div className="bg-white rounded-lg">
              <button
                onClick={() => toggleSection('sources')}
                className="w-full flex items-center justify-between p-4"
              >
                <h2 className="text-lg font-semibold">Sources ({brief.sources.length})</h2>
                {expandedSections.sources ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.sources && (
                <div className="px-4 pb-4 space-y-2">
                  {brief.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-blue-600 text-sm truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-lg">
            <button
              onClick={() => toggleSection('reviews')}
              className="w-full flex items-center justify-between p-4"
            >
              <h2 className="text-lg font-semibold">Reviews ({brief.reviews.length})</h2>
              {expandedSections.reviews ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.reviews && (
              <div className="px-4 pb-4">
                {brief.author.id !== 'local-user-1' && (
                  <button
                    onClick={() => {
                      if (!canInteract) {
                        setError("You've got to read it first!");
                        return;
                      }
                      setShowReviewForm(!showReviewForm);
                    }}
                    className="w-full mb-4 bg-blue-600 text-white py-2 rounded-lg"
                  >
                    Write Review
                  </button>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className={`w-8 h-8 ${
                              star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            <Star className="w-full h-full fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                      <textarea
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        rows={4}
                        placeholder="Share your thoughts..."
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview || !reviewContent.trim()}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                      >
                        {isSubmittingReview && <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />}
                        Submit
                      </button>
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-3">
                  {brief.reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            {review.author.image ? (
                              <img 
                                src={review.author.image} 
                                alt={review.author.name ?? 'User'} 
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-3 h-3 text-gray-600" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{review.author.name ?? 'Anonymous'}</span>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{review.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                        {review.author.id === 'local-user-1' && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {brief.reviews.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      {brief.author.id !== 'local-user-1' ? 'No reviews yet. Be the first!' : 'No reviews yet.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Reviews */}
          {brief.aiReviews.length > 0 && (
            <div className="bg-white rounded-lg">
              <button
                onClick={() => toggleSection('aiReviews')}
                className="w-full flex items-center justify-between p-4"
              >
                <h2 className="text-lg font-semibold">AI Analysis ({brief.aiReviews.length})</h2>
                {expandedSections.aiReviews ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.aiReviews && (
                <div className="px-4 pb-4 space-y-3">
                  {brief.aiReviews.map((aiReview) => (
                    <div key={aiReview.id} className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-blue-800 text-sm">
                          {aiReview.model.provider} {aiReview.model.name}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= aiReview.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{aiReview.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Popup */}
        <ErrorPopup
          isVisible={!!error}
          message={error ?? ''}
          onClose={() => setError(null)}
          autoClose={true}
          autoCloseDelay={5000}
        />

        {/* Share Popup */}
        {showSharePopup && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSharePopup(false)}
          >
            <div 
              className="bg-white rounded-lg p-6 m-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Share this Brief</h3>
              <div className="grid grid-cols-3 gap-4">
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
                >
                  <MessageCircle className="w-8 h-8 text-green-500" />
                  <span className="text-sm mt-1">WhatsApp</span>
                </a>
                <a 
                  href={`mailto:?subject=Check out this brief&body=${encodeURIComponent(window.location.href)}`}
                  className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
                >
                  <Mail className="w-8 h-8 text-red-500" />
                  <span className="text-sm mt-1">Email</span>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
                >
                  <Facebook className="w-8 h-8 text-blue-600" />
                  <span className="text-sm mt-1">Facebook</span>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
                >
                  <Twitter className="w-8 h-8 text-blue-400" />
                  <span className="text-sm mt-1">Twitter</span>
                </a>
                <a 
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
                >
                  <Linkedin className="w-8 h-8 text-blue-700" />
                  <span className="text-sm mt-1">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop/Tablet Layout (keep existing layout with minor responsive improvements)
  return (
    <div className={`container mx-auto px-4 py-8 ${isTablet ? 'max-w-4xl' : 'max-w-4xl'}`}>
      {/* Keep existing desktop layout but add responsive classes */}
      <ErrorPopup
        isVisible={!!error}
        message={error ?? ''}
        onClose={() => setError(null)}
        autoClose={true}
        autoCloseDelay={5000}
      />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className={`flex ${isTablet ? 'flex-col space-y-4' : 'justify-between items-start'} mb-4`}>
          <div className="flex-1">
            <h1 className={`${isTablet ? 'text-2xl' : 'text-3xl'} font-bold mb-4`}>{brief.title}</h1>
            
            {brief.abstract && (
              <p className={`${isTablet ? 'text-base' : 'text-lg'} text-gray-600 mb-4`}>{brief.abstract}</p>
            )}

            <div className={`flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4`}>
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {brief.author.name ?? 'Anonymous'}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(brief.createdAt)}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {brief.viewCount} views
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {brief.readTime ?? calculateReadTime(brief.response)} min read
              </span>
              {averageRating && (
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  {averageRating.toFixed(1)} ({brief.reviews.length} reviews)
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {brief.categories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium flex items-center"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {category.name}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className={`flex ${isTablet ? 'flex-row space-x-2' : 'flex-col space-y-2'} ${isTablet ? '' : 'ml-4'}`}>
            {brief.author.id !== 'local-user-1' && (
              <>
                <button
                  onClick={async () => {
                    if (!canInteract) {
                      setError("You've got to read it first!");
                      return;
                    }
                    await handleUpvote();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isUpvoted 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{upvoteCount}</span>
                </button>
                
                <button
                  onClick={handleSave}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isSaved 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              </>
            )}

            {brief.author.id === 'local-user-1' && (
              <>
                <button
                  onClick={() => window.location.href = `/briefs/${brief.id}/edit`}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDeleteBrief}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            )}

            <button 
              onClick={() => setShowSharePopup(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Generated by <span className="font-medium">{brief.model.provider} {brief.model.name}</span>
            {brief.model.version && <span> (v{brief.model.version})</span>}
          </p>
        </div>
      </motion.div>

      {/* Keep rest of the desktop layout... */}
      {/* Content, Sources, Reviews sections remain the same but with responsive adjustments */}
      
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div 
            className={`prose ${isTablet ? 'prose-sm' : 'prose-lg'} max-w-none`}
            dangerouslySetInnerHTML={{ __html: brief.response }}
          />
        </div>
      </motion.div>

      {/* Sources */}
      {brief.sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold mb-4">Sources</h3>
          <div className="space-y-2">
            {brief.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
                <span className="text-blue-600 hover:underline">{source.title}</span>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Keep existing reviews section but make it responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className={`flex ${isTablet ? 'flex-col space-y-4' : 'justify-between items-center'} mb-4`}>
          <h3 className="text-xl font-semibold">Reviews ({brief.reviews.length})</h3>
          {brief.author.id !== 'local-user-1' && (
            <button
              onClick={() => {
                if (!canInteract) {
                  setError("You've got to read it first!");
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`w-6 h-6 ${
                      star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
                rows={4}
                placeholder="Share your thoughts about this brief..."
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || !reviewContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmittingReview && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Review
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {brief.reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-lg border">
              <div className={`flex ${isTablet ? 'flex-col space-y-2' : 'justify-between items-start'} mb-2`}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {review.author.image ? (
                      <img 
                        src={review.author.image} 
                        alt={review.author.name ?? 'User'} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <span className="font-medium">{review.author.name ?? 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 mb-3">{review.content}</p>
              <div className="flex justify-between items-center">
                <div>
                  {review.author.id === 'local-user-1' && (
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
                <HelpfulButton
                  reviewId={review.id}
                  helpfulCount={review.helpfulMarks?.length ?? 0}
                  isMarkedHelpful={review.helpfulMarks?.some(mark => mark.userId === 'local-user-1') ?? false}
                  onUpdate={async () => {
                    try {
                      await loadBrief();
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                  onError={(error) => setError(error)}
                />
              </div>
            </div>
          ))}
          
          {brief.reviews.length === 0 && brief.author.id !== 'local-user-1' && (
            <p className="text-gray-500 text-center py-8">
              No reviews yet. Be the first to review this brief!
            </p>
          )}
          {brief.reviews.length === 0 && brief.author.id === 'local-user-1' && (
            <p className="text-gray-500 text-center py-8">
              No reviews yet.
            </p>
          )}
        </div>
      </motion.div>

      {/* AI Reviews */}
      {brief.aiReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold mb-4">AI Analysis</h3>
          <div className="space-y-4">
            {brief.aiReviews.map((aiReview) => (
              <div key={aiReview.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className={`flex ${isTablet ? 'flex-col space-y-2' : 'justify-between items-start'} mb-2`}>
                  <span className="font-medium text-blue-800">
                    {aiReview.model.provider} {aiReview.model.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= aiReview.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(aiReview.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700">{aiReview.content}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Share Popup */}
      {showSharePopup && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowSharePopup(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 m-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Share this Brief</h3>
            <div className="grid grid-cols-3 gap-4">
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
              >
                <MessageCircle className="w-8 h-8 text-green-500" />
                <span className="text-sm mt-1">WhatsApp</span>
              </a>
              <a 
                href={`mailto:?subject=Check out this brief&body=${encodeURIComponent(window.location.href)}`}
                className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
              >
                <Mail className="w-8 h-8 text-red-500" />
                <span className="text-sm mt-1">Email</span>
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
              >
                <Facebook className="w-8 h-8 text-blue-600" />
                <span className="text-sm mt-1">Facebook</span>
              </a>
              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
              >
                <Twitter className="w-8 h-8 text-blue-400" />
                <span className="text-sm mt-1">Twitter</span>
              </a>
              <a 
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2 hover:bg-gray-100 rounded"
              >
                <Linkedin className="w-8 h-8 text-blue-700" />
                <span className="text-sm mt-1">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}