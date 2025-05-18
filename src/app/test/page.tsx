'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Plus, User, FileText, Star, ClipboardCheck } from 'lucide-react';

// Sample user data - would be fetched from API in real implementation
const userData = {
  name: "Dr. Jane Smith",
  title: "Associate Professor",
  institution: "University of Technology",
  bio: "Research focus on computational linguistics and natural language processing with 15+ years of experience in academic publishing.",
  briefs: {
    total: 38,
    public: 24,
    private: 14
  },
  reviews: {
    total: 87,
    manual: 53,
    ai: 34,
    history: [
      { id: 1, title: "Computational Analysis of Language Patterns", score: 4.5, date: "2023-10-15", isAI: false },
      { id: 2, title: "Machine Learning in Education", score: 3.8, date: "2023-09-22", isAI: true },
      { id: 3, title: "Natural Language Processing Frameworks", score: 4.9, date: "2023-08-17", isAI: false },
      { id: 4, title: "Semantic Analysis Techniques", score: 4.2, date: "2023-07-30", isAI: true },
      { id: 5, title: "Linguistic Corpus Development", score: 4.7, date: "2023-06-12", isAI: false },
      { id: 6, title: "Neural Networks for Text Classification", score: 3.5, date: "2023-05-28", isAI: true },
    ]
  },
  trustScore: 4.3,
};

const ProfilePage = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [breathingCard, setBreathingCard] = useState(0);
  
  // Breathing effect for cards
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathingCard(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Trust score diamond renderer
  const renderTrustScore = (score) => {
    const diamonds = [];
    const fullScore = Math.floor(score);
    const hasPartial = score % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullScore) {
        diamonds.push(
          <div key={i} className="w-5 h-5 transform rotate-45 bg-blue-600 mx-1"></div>
        );
      } else if (i === fullScore && hasPartial) {
        const percent = Math.round((score % 1) * 100);
        diamonds.push(
          <div key={i} className="relative w-5 h-5 transform rotate-45 bg-gray-200 mx-1">
            <div 
              className="absolute top-0 left-0 bg-blue-600 h-full" 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        );
      } else {
        diamonds.push(
          <div key={i} className="w-5 h-5 transform rotate-45 bg-gray-200 mx-1"></div>
        );
      }
    }
    return diamonds;
  };

  // Handle card click
  const toggleCardExpand = (card) => {
    if (activeCard === card) {
      setActiveCard(null);
    } else {
      setActiveCard(card);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Main container with constellation layout */}
      <div className="relative max-w-6xl mx-auto">
        
        {/* Central profile card - hexagonal style with clip path */}
        <div className="relative bg-white border border-gray-200 shadow-md p-8 mx-auto mb-16 max-w-2xl transform hover:translate-y-[-5px] transition-transform duration-300"
          style={{
            clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            paddingBottom: "4rem",
            paddingTop: "4rem"
          }}>
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-none flex items-center justify-center">
              <User size={48} className="text-gray-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-1">{userData.name}</h1>
          <h2 className="text-blue-600 text-center mb-4">{userData.title}</h2>
          <p className="text-center text-gray-500 mb-3">{userData.institution}</p>
          
          <div className="max-w-md mx-auto text-center mb-4">
            <p className="text-sm text-gray-700">{userData.bio}</p>
          </div>
        </div>
        
        {/* Stats cards constellation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto relative">
          {/* Expanded card overlay - this will cover other cards when active */}
          {activeCard && (
            <div className="absolute inset-0 bg-gray-50 z-10 transition-all duration-500 ease-in-out"></div>
          )}
          
          {/* Briefs Card */}
          <div 
            className={`bg-white border border-gray-200 shadow-md p-6 cursor-pointer transform transition-all duration-300 
              ${breathingCard === 0 ? 'scale-105' : 'scale-100'} 
              ${activeCard === 'briefs' ? 'md:col-span-3 z-20' : activeCard ? 'opacity-0' : 'z-0'}`}
            style={{ 
              clipPath: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onClick={() => toggleCardExpand('briefs')}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <FileText size={18} className="mr-2 text-blue-600" />
                Briefs
              </h3>
              {activeCard === 'briefs' ? (
                <X size={18} className="text-gray-500 cursor-pointer" />
              ) : (
                <Plus size={18} className="text-gray-500" />
              )}
            </div>
            
            <div className="text-center my-4">
              <div className="text-4xl font-bold relative group">
                {userData.briefs.total}
                {/* Hidden breakdown on hover with transition */}
                <div 
                  className="absolute left-0 right-0 bottom-full mb-2 bg-white shadow-lg border border-gray-100 p-2 
                  opacity-0 group-hover:opacity-100 -z-10 group-hover:z-10 text-sm transform translate-y-2 
                  group-hover:translate-y-0 transition-all duration-300 ease-in-out"
                >
                  <div className="flex justify-between items-center">
                    <span>Public:</span>
                    <span className="font-bold text-blue-600">{userData.briefs.public}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Private:</span>
                    <span className="font-bold">{userData.briefs.private}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm">Total Briefs</p>
            </div>
            
            {/* Expanded content */}
            {activeCard === 'briefs' && (
              <div className="mt-6 pt-6 border-t border-gray-200 transform transition-all duration-500 ease-in-out">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold mb-2">Public Briefs</h4>
                    <div className="relative h-2 bg-gray-200 w-full">
                      <div 
                        className="absolute h-2 bg-blue-600 transition-all duration-1000 ease-in-out" 
                        style={{ width: `${(userData.briefs.public / userData.briefs.total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm mt-1">{userData.briefs.public} ({Math.round((userData.briefs.public / userData.briefs.total) * 100)}%)</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-2">Private Briefs</h4>
                    <div className="relative h-2 bg-gray-200 w-full">
                      <div 
                        className="absolute h-2 bg-gray-500 transition-all duration-1000 ease-in-out" 
                        style={{ width: `${(userData.briefs.private / userData.briefs.total) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm mt-1">{userData.briefs.private} ({Math.round((userData.briefs.private / userData.briefs.total) * 100)}%)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Reviews Card */}
          <div 
            className={`bg-white border border-gray-200 shadow-md p-6 cursor-pointer transform transition-all duration-300 
              ${breathingCard === 1 ? 'scale-105' : 'scale-100'} 
              ${activeCard === 'reviews' ? 'md:col-span-3 z-20' : activeCard ? 'opacity-0' : 'z-0'}`}
            style={{ 
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 85%)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onClick={() => toggleCardExpand('reviews')}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <ClipboardCheck size={18} className="mr-2 text-blue-600" />
                Reviews
              </h3>
              {activeCard === 'reviews' ? (
                <X size={18} className="text-gray-500 cursor-pointer" />
              ) : (
                <button 
                  className="text-blue-600 text-xs px-2 py-1 border border-blue-600 transition-all duration-300 ease-in-out hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReviewHistory(!showReviewHistory);
                  }}
                >
                  {showReviewHistory ? 'Hide History' : 'Show History'}
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-gray-200 pr-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{userData.reviews.manual}</p>
                  <p className="text-gray-500 text-sm">Manual</p>
                </div>
              </div>
              <div className="pl-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{userData.reviews.ai}</p>
                  <p className="text-gray-500 text-sm">AI-Assisted</p>
                </div>
              </div>
            </div>
            
            {/* Expanded content */}
            {activeCard === 'reviews' && (
              <div className="mt-6 pt-6 border-t border-gray-200 transform transition-all duration-500 ease-in-out">
                <div className="grid grid-cols-1 gap-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2">Review Distribution</h4>
                    <div className="h-6 bg-gray-200 w-full relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-1000 ease-in-out" 
                        style={{ width: `${(userData.reviews.manual / userData.reviews.total) * 100}%` }}
                      ></div>
                      <div className="absolute top-0 left-0 h-full w-full flex">
                        <div style={{ width: `${(userData.reviews.manual / userData.reviews.total) * 100}%` }} className="flex items-center justify-center">
                          <span className="text-xs text-white font-bold">Manual</span>
                        </div>
                        <div style={{ width: `${(userData.reviews.ai / userData.reviews.total) * 100}%` }} className="flex items-center justify-center">
                          <span className="text-xs text-gray-700 font-bold">AI</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="text-blue-600 border border-blue-600 py-2 px-4 w-full transition-all duration-300 ease-in-out hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReviewHistory(!showReviewHistory);
                    }}
                  >
                    {showReviewHistory ? 'Hide Review History' : 'Show Review History'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Trust Score Card */}
          <div 
            className={`bg-white border border-gray-200 shadow-md p-6 cursor-pointer transform transition-all duration-300 
              ${breathingCard === 2 ? 'scale-105' : 'scale-100'} 
              ${activeCard === 'trust' ? 'md:col-span-3 z-20' : activeCard ? 'opacity-0' : 'z-0'}`}
            style={{ 
              clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%, 0 15%)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onClick={() => toggleCardExpand('trust')}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg flex items-center">
                <Star size={18} className="mr-2 text-blue-600" />
                Trust Score
              </h3>
              {activeCard === 'trust' ? (
                <X size={18} className="text-gray-500 cursor-pointer" />
              ) : (
                <Plus size={18} className="text-gray-500" />
              )}
            </div>
            
            <div className="text-center my-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">{userData.trustScore.toFixed(1)}</div>
              <div className="flex justify-center items-center">
                {renderTrustScore(userData.trustScore)}
              </div>
            </div>
            
            {/* Expanded content */}
            {activeCard === 'trust' && (
              <div className="mt-6 pt-6 border-t border-gray-200 transform transition-all duration-500 ease-in-out">
                <p className="text-sm text-gray-700 mb-4">
                  Trust Score is calculated based on the quality and quantity of peer reviews,
                  consistency of ratings, and community feedback.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-bold mb-2">Rating Consistency</h4>
                    <div className="relative h-2 bg-gray-200 w-full overflow-hidden">
                      <div className="absolute h-2 bg-blue-600 w-0 transition-all duration-1000 ease-in-out" 
                        style={{ width: '80%', animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-right text-sm mt-1">4.0/5.0</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-2">Review Quality</h4>
                    <div className="relative h-2 bg-gray-200 w-full overflow-hidden">
                      <div className="absolute h-2 bg-blue-600 w-0 transition-all duration-1000 ease-in-out" 
                        style={{ width: '92%', animationDelay: '0.4s' }}></div>
                    </div>
                    <p className="text-right text-sm mt-1">4.5/5.0</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Side drawer toggle */}
        <div className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 shadow-md">
          <button 
            className="p-2 text-blue-600 flex items-center justify-center transition-colors duration-300 ease-in-out hover:bg-blue-50"
            onClick={() => setShowDrawer(!showDrawer)}
          >
            <ChevronRight 
              size={24} 
              className={`transform transition-transform duration-500 ease-in-out ${showDrawer ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
        
        {/* Side drawer */}
        <div 
          className={`fixed right-0 top-0 h-full bg-white border-l border-gray-200 shadow-lg w-64 transform transition-transform duration-500 ease-in-out ${showDrawer ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ zIndex: 1000 }}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Additional Info</h3>
              <X 
                size={18} 
                className="text-gray-500 cursor-pointer transition-colors duration-300 ease-in-out hover:text-gray-700" 
                onClick={() => setShowDrawer(false)}
              />
            </div>
            
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h4 className="text-sm font-bold mb-2">Recent Activity</h4>
                <p className="text-sm text-gray-700">Last active 2 days ago</p>
              </div>
              
              <div className="border-b border-gray-100 pb-4">
                <h4 className="text-sm font-bold mb-2">Member Since</h4>
                <p className="text-sm text-gray-700">May 2018</p>
              </div>
              
              <div>
                <h4 className="text-sm font-bold mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 transition-all duration-300 ease-in-out hover:bg-blue-200">NLP</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 transition-all duration-300 ease-in-out hover:bg-blue-200">Computational Linguistics</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 transition-all duration-300 ease-in-out hover:bg-blue-200">Machine Learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden review history with improved transitions */}
        {showReviewHistory && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center z-50 transition-all duration-500 ease-in-out"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowReviewHistory(false)}
          >
            <div 
              className="bg-white w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6 transform transition-all duration-500 ease-in-out scale-100" 
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">Review History</h3>
                <X 
                  size={20} 
                  className="text-gray-500 cursor-pointer transition-colors duration-300 ease-in-out hover:text-gray-700" 
                  onClick={() => setShowReviewHistory(false)}
                />
              </div>
              
              <div className="space-y-4">
                {userData.reviews.history.map((review, index) => (
                  <div 
                    key={review.id} 
                    className="border-b border-gray-100 pb-4 grid grid-cols-12 gap-2 opacity-0 transform translate-y-4"
                    style={{ 
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
                      '@keyframes fadeInUp': {
                        '0%': { opacity: 0, transform: 'translateY(20px)' },
                        '100%': { opacity: 1, transform: 'translateY(0)' }
                      }
                    }}
                  >
                    <div className="col-span-7">
                      <h4 className="font-bold text-sm">{review.title}</h4>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-none">
                        {review.isAI ? 'AI Review' : 'Manual Review'}
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end items-center">
                      <div className="flex items-center">
                        <span className="font-bold mr-1">{review.score.toFixed(1)}</span>
                        <Star size={14} className="text-blue-600 fill-current" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
      
              <div className="mt-6 text-center">
                <button 
                  className="text-blue-600 border border-blue-600 py-2 px-6 transition-all duration-300 ease-in-out hover:bg-blue-50"
                  onClick={() => setShowReviewHistory(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;