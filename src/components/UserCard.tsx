'use client';

import { motion } from 'framer-motion';
import { Book, MessageSquare, ThumbsUp, Bookmark, Coins } from 'lucide-react';
import Link from 'next/link';

type UserCardProps = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
    _count: {
      briefs: number;
      reviews: number;
      briefUpvotes: number;
      savedBriefs: number;
    };
    tokenBalance?: {
      balance: number;
    } | null;
  };
};

export default function UserCard({ user }: UserCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <img
            src={user.image || '/default-avatar.png'}
            alt={user.name || 'User'}
            className="w-16 h-16 rounded-full border-2 border-blue-100"
          />
          <div className="ml-4">
            <Link href={`/users/${user.id}`}>
              <h3 className="text-xl font-semibold hover:text-blue-600 transition-colors">
                {user.name || 'Anonymous User'}
              </h3>
            </Link>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {user.tokenBalance && (
          <div className="text-center">
            <div className="flex items-center justify-center bg-blue-50 rounded-full w-12 h-12 mb-1">
              <Coins className="text-blue-600 w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">{user.tokenBalance.balance}</p>
            <p className="text-xs text-gray-500">Tokens</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Book className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-semibold text-gray-800">{user._count.briefs}</p>
          <p className="text-xs text-gray-600">Briefs</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <MessageSquare className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-semibold text-gray-800">{user._count.reviews}</p>
          <p className="text-xs text-gray-600">Reviews</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <ThumbsUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-semibold text-gray-800">{user._count.briefUpvotes}</p>
          <p className="text-xs text-gray-600">Upvotes</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Bookmark className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <p className="text-lg font-semibold text-gray-800">{user._count.savedBriefs}</p>
          <p className="text-xs text-gray-600">Saved</p>
        </div>
      </div>
    </motion.div>
  );
} 