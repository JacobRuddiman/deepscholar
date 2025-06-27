// app/onboarding/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  Home, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Users, 
  TrendingUp,
  Zap,
  Globe,
  Brain,
  ChevronDown
} from 'lucide-react';
import { useDeviceDetection } from '@/app/hooks/useDeviceDetection';

export default function OnboardingPage() {
  const router = useRouter();
  const { isMobile } = useDeviceDetection();
  const [currentSection, setCurrentSection] = useState(0);
  const { scrollYProgress } = useScroll();
  
  // Parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0.3]);

  // Auto-scroll indicator
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floating animation variants
  const floatAnimation = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-blue-50/30 to-gray-50 overflow-x-hidden">
      {/* Navigation Bar */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.h1 
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              DeepScholar
            </motion.h1>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/home')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Home size={18} />
                <span className={isMobile ? "hidden" : ""}>Home</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/brief_upload')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload size={18} />
                <span className={isMobile ? "hidden" : ""}>Upload</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Animated Background Elements */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-40 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </motion.div>

        <div className="container mx-auto px-4 z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <Sparkles className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to DeepScholar
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Your gateway to AI-powered research insights. Discover, share, and collaborate
              on cutting-edge research with our community of scholars and innovators.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/brief_upload')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/briefs')}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                Browse Research
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-gray-400"
              >
                <ChevronDown size={32} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Video Section 1 */}
      <section className={`py-16 md:py-24 ${isMobile ? 'px-4' : ''}`}>
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 gap-12'} items-center`}
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                variants={floatAnimation}
                initial="initial"
                animate="animate"
                className="inline-block mb-4"
              >
                <Brain className="w-12 h-12 text-blue-600" />
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                AI-Powered Research Analysis
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Harness the power of advanced AI models to analyze and synthesize research
                from multiple sources. Our platform supports OpenAI, Anthropic, and Perplexity
                models to give you comprehensive insights.
              </p>
              
              <ul className="space-y-3 mb-6">
                <motion.li 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Lightning-fast research synthesis</span>
                </motion.li>
                <motion.li 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <Globe className="w-5 h-5 text-blue-500" />
                  <span>Access to global research databases</span>
                </motion.li>
                <motion.li 
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <Users className="w-5 h-5 text-green-500" />
                  <span>Collaborative research community</span>
                </motion.li>
              </ul>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/brief_upload')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Start Your Research
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 z-10" />
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ minHeight: isMobile ? '250px' : '400px' }}
                >
                  <source src="/videos/research-demo.mp4" type="video/mp4" />
                  {/* Placeholder - replace with your video */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <p className="text-white text-lg">Video 1 Placeholder</p>
                  </div>
                </video>
              </div>
              
              {/* Floating Stats */}
              <motion.div
                variants={floatAnimation}
                initial="initial"
                animate="animate"
                className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">10K+</p>
                    <p className="text-sm text-gray-600">Research Briefs</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Research Excellence
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides comprehensive tools and features to streamline
              your research workflow and maximize your impact.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'} gap-6`}
          >
            {[
              {
                icon: BookOpen,
                title: "Smart Organization",
                description: "Categorize and tag your research for easy discovery and retrieval.",
                color: "blue"
              },
              {
                icon: Users,
                title: "Collaborative Tools",
                description: "Share insights, get feedback, and collaborate with researchers worldwide.",
                color: "green"
              },
              {
                icon: TrendingUp,
                title: "Impact Tracking",
                description: "Monitor engagement, citations, and the reach of your research contributions.",
                color: "purple"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${feature.color}-100 mb-4`}
                >
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Video Section 2 */}
      <section className={`py-16 md:py-24 ${isMobile ? 'px-4' : ''}`}>
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 gap-12'} items-center`}
          >
            {/* Video First on Desktop, Second on Mobile */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`relative ${isMobile ? 'order-2' : ''}`}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-tl from-green-600/20 to-blue-600/20 z-10" />
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ minHeight: isMobile ? '250px' : '400px' }}
                >
                  <source src="/videos/collaboration-demo.mp4" type="video/mp4" />
                  {/* Placeholder - replace with your video */}
                  <div className="w-full h-full bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center">
                    <p className="text-white text-lg">Video 2 Placeholder</p>
                  </div>
                </video>
              </div>
              
              {/* Floating Card */}
              <motion.div
                variants={floatAnimation}
                initial="initial"
                animate="animate"
                className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">500+</p>
                    <p className="text-sm text-gray-600">Active Researchers</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={isMobile ? 'order-1' : ''}
            >
              <motion.div 
                variants={floatAnimation}
                initial="initial"
                animate="animate"
                className="inline-block mb-4"
              >
                <Sparkles className="w-12 h-12 text-yellow-500" />
              </motion.div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Join a Thriving Research Community
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Connect with researchers, academics, and innovators from around the world.
                Share your insights, get valuable feedback, and collaborate on groundbreaking
                research projects.
              </p>
              
              <div className="space-y-4 mb-6">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Upload Your Research</h4>
                    <p className="text-gray-600 text-sm">
                      Share your AI-generated insights and research findings with the community.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Get Feedback</h4>
                    <p className="text-gray-600 text-sm">
                      Receive reviews, ratings, and constructive feedback from peers.
                    </p>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Build Your Reputation</h4>
                    <p className="text-gray-600 text-sm">
                      Earn tokens, gain recognition, and establish yourself as a thought leader.
                    </p>
                  </div>
                </motion.div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/briefs')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Explore Research
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Research?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Join thousands of researchers who are already using DeepScholar to
              accelerate their research and expand their impact.
            </p>
            
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/brief_upload')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
              >
                <Upload size={20} />
                Upload Your First Brief
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/home')}
                className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-white rounded-lg hover:bg-white/10 transition-colors font-semibold"
              >
                <Home size={20} />
                Go to Homepage
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}