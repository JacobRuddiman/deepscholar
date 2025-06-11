"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  CreditCard, 
  Check, 
  Star,
  TrendingUp,
  History,
  ShoppingCart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  getUserTokenBalance,
  getUserTokenTransactions,
  createTokenPurchase,
  getTokenPackages,
  getUserPurchases
} from '@/server/actions/tokens';
import ErrorPopup from '../components/error_popup';
type TokenTransaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  brief?: {
    id: string;
    title: string;
    slug: string | null;
  } | null;
};

type TokenPurchase = {
  id: string;
  packageName: string;
  tokensAmount: number;
  priceUSD: number;
  status: string;
  createdAt: Date;
};

export default function TokensPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [tokenPackages, setTokenPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'purchase' | 'history' | 'transactions'>('purchase');

  useEffect(() => {
    loadTokenData();
  }, []);

  const loadTokenData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [balanceResult, transactionsResult, purchasesResult, packagesResult] = await Promise.all([
        getUserTokenBalance(),
        getUserTokenTransactions(50),
        getUserPurchases(),
        getTokenPackages(),
      ]);

      if (balanceResult.success) {
        setBalance(balanceResult.balance);
      }

      if (transactionsResult.success) {
        setTransactions(transactionsResult.data);
      }

      if (purchasesResult.success) {
        setPurchases(purchasesResult.data);
      }

      // Set token packages (getTokenPackages returns the array directly)
      setTokenPackages(packagesResult);
    } catch (error) {
      setError('Failed to load token data. Please try again later.');
      console.error('Error loading token data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setIsPurchasing(true);
      setError(null);

      const result = await createTokenPurchase(packageId);

      if (result.success) {
        // Refresh data
        await loadTokenData();
        setActiveTab('history');
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (error) {
      setError('Purchase failed. Please try again.');
      console.error('Purchase error:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ErrorPopup
        isVisible={!!error}
        message={error ?? ''}
        onClose={() => setError(null)}
        autoClose={true}
      />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Token Management</h1>
        <p className="text-gray-600 text-lg">
          Purchase tokens to publish briefs and unlock premium features
        </p>
      </div>

      {/* Current Balance */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Current Balance</h2>
            <div className="flex items-center">
              <Coins className="w-8 h-8 mr-3" />
              <span className="text-4xl font-bold">{balance}</span>
              <span className="text-xl ml-2">tokens</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 mb-1">Welcome, {session?.user?.name || 'Demo User'}!</p>
            <p className="text-blue-200 text-sm">
              Use tokens to publish briefs (5 tokens) and earn rewards for engagement
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b mb-8">
        <div className="flex space-x-6">
          {[
            { id: 'purchase', label: 'Purchase Tokens', icon: ShoppingCart },
            { id: 'history', label: 'Purchase History', icon: History },
            { id: 'transactions', label: 'Transaction History', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-sm font-medium relative flex items-center ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'purchase' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Choose a Token Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tokenPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative bg-white rounded-lg shadow-md p-6 border-2 transition-all hover:shadow-lg ${
                  pkg.popular ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-blue-600">{pkg.tokens}</span>
                    <span className="text-gray-500 ml-1">tokens</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold">${pkg.price}</span>
                    <span className="text-gray-500 text-sm ml-1">USD</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">{pkg.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-xs text-gray-500 mb-2">Value breakdown:</div>
                    <div className="text-xs text-gray-600">
                      • {Math.floor(pkg.tokens / 5)} brief publications
                    </div>
                    <div className="text-xs text-gray-600">
                      • ${(pkg.price / pkg.tokens).toFixed(3)} per token
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isPurchasing}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      pkg.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {isPurchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              How Tokens Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-red-600 mb-2">Costs</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Publishing a brief: 5 tokens</li>
                  <li>• AI review request: 10 tokens</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-600 mb-2">Rewards</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Writing a review: 3 tokens</li>
                  <li>• Giving an upvote: 1 token</li>
                  <li>• Marking review helpful: 1 token</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Benefits</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Encourage quality content</li>
                  <li>• Reward community engagement</li>
                  <li>• Support platform sustainability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Purchase History</h2>
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No purchases yet</p>
              <button
                onClick={() => setActiveTab('purchase')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Purchase your first token package
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{purchase.packageName}</h3>
                      <p className="text-gray-600">
                        {purchase.tokensAmount} tokens • ${purchase.priceUSD}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(purchase.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        purchase.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : purchase.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {purchase.status === 'completed' && <Check className="w-3 h-3 mr-1 inline" />}
                        {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{transaction.reason}</h3>
                      {transaction.brief && (
                        <p className="text-gray-600 text-sm">
                          Related to: {transaction.brief.title}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </span>
                      <span className="text-gray-500 ml-1">tokens</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
