// app/components/brief/MobileBriefDetail.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, 
  Bookmark,
  BookmarkCheck,
  Share2,
  ChevronDown,
  ChevronUp,
  Star,
  Eye,
  Clock,
  ArrowLeft,
  MoreVertical,
  Edit,
  Trash2,
  X,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileBriefDetailProps {
  brief: any; // Use your Brief type
  isOwner: boolean;
  onUpvote: () => void;
  onSave: () => void;
  onDelete: () => void;
  onReview: (content: string, rating: number) => void;
  isUpvoted: boolean;
  isSaved: boolean;
  upvoteCount: number;
}

export default function MobileBriefDetail({
  brief,
  isOwner,
  onUpvote,
  onSave,
  onDelete,
  onReview,
  isUpvoted,
  isSaved,
  upvoteCount
}: MobileBriefDetailProps) {
  const router = useRouter();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    sources: false,
    reviews: false
  });
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this research brief: ${brief.title}`;
    
    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(brief.title)}`,
      email: `mailto:?subject=${encodeURIComponent(brief.title)}&body=${encodeURIComponent(text + '\n\n' + url)}`
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      // Show toast notification
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }
    
    setShowShareMenu(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-20">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onSave}
              className={`p-2 ${isSaved ? 'text-blue-600' : 'text-gray-600'}`}
            >
              {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
            
            <button
              onClick={() => setShowShareMenu(true)}
              className="p-2 text-gray-600"
            >
              <Share2 size={20} />
            </button>
            
            {isOwner && (
              <button
                onClick={() => setShowMoreMenu(true)}
                className="p-2 text-gray-600"
              >
                <MoreVertical size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Title and Meta */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{brief.title}</h1>
          
          {brief.abstract && (
            <p className="text-gray-600 mb-4">{brief.abstract}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center">
              <Eye size={16} className="mr-1" />
              {brief.viewCount} views
            </span>
            <span className="flex items-center">
              <Clock size={16} className="mr-1" />
              {brief.readTime || Math.ceil(brief.response.split(' ').length / 200)} min
            </span>
            <span>{formatDate(brief.createdAt)}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {brief.categories.map((category: any) => (
              <span
                key={category.id}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg mb-4">
          <button
            onClick={() => toggleSection('content')}
            className="w-full p-4 flex items-center justify-between"
          >
            <h2 className="font-semibold text-gray-900">Content</h2>
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
          <div className="bg-white rounded-lg mb-4">
            <button
              onClick={() => toggleSection('sources')}
              className="w-full p-4 flex items-center justify-between"
            >
              <h2 className="font-semibold text-gray-900">
                Sources ({brief.sources.length})
              </h2>
              {expandedSections.sources ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.sources && (
              <div className="px-4 pb-4 space-y-3">
                {brief.sources.map((source: any) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <ExternalLink size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-blue-600">{source.title}</span>
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
            className="w-full p-4 flex items-center justify-between"
          >
            <h2 className="font-semibold text-gray-900">
              Reviews ({brief.reviews.length})
            </h2>
            {expandedSections.reviews ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.reviews && (
            <div className="px-4 pb-4">
              {!isOwner && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full mb-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Write Review
                </button>
              )}
              
              <div className="space-y-3">
                {brief.reviews.map((review: any) => (
                  <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{review.author.name || 'Anonymous'}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.content}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatDate(review.createdAt)}</p>
                  </div>
                ))}
                
                {brief.reviews.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No reviews yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onUpvote}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 ${
              isUpvoted ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <ThumbsUp size={20} />
            <span>{upvoteCount} Upvotes</span>
          </button>
        </div>
      )}

      {/* More Menu Modal */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowMoreMenu(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    router.push(`/briefs/${brief.id}/edit`);
                  }}
                  className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg"
                >
                  <Edit size={20} className="text-gray-600" />
                  <span>Edit Brief</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (confirm('Are you sure you want to delete this brief?')) {
                      onDelete();
                    }
                  }}
                  className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 rounded-lg text-red-600"
                >
                  <Trash2 size={20} />
                  <span>Delete Brief</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Menu Modal */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowShareMenu(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-4">Share Brief</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', color: 'text-green-500' },
                    { id: 'twitter', label: 'Twitter', color: 'text-blue-400' },
                    { id: 'facebook', label: 'Facebook', color: 'text-blue-600' },
                    { id: 'linkedin', label: 'LinkedIn', color: 'text-blue-700' },
                    { id: 'email', label: 'Email', color: 'text-gray-600' },
                    { id: 'copy', label: 'Copy Link', color: 'text-gray-600' },
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handleShare(platform.id)}
                      className="flex flex-col items-center p-3 hover:bg-gray-50 rounded-lg"
                    >
                      <div className={`w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center ${platform.color}`}>
                        {/* Add platform icons here */}
                      </div>
                      <span className="text-xs mt-2">{platform.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowReviewForm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Write Review</h3>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="p-2"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          size={28}
                          className={star <= reviewRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Review</label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    placeholder="Share your thoughts..."
                  />
                </div>
                
                <button
                  onClick={() => {
                    onReview(reviewContent, reviewRating);
                    setShowReviewForm(false);
                    setReviewContent('');
                    setReviewRating(5);
                  }}
                  disabled={!reviewContent.trim()}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
