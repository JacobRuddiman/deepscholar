// app/components/settings/MobileSettings.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Coins, 
  Shield, 
  ChevronRight,
  Edit2,
  Save,
  X,
  AlertCircle,
  ArrowLeft,
  Check
} from 'lucide-react';
import { getUserTokenBalance, getUserTokenTransactions } from '@/server/actions/tokens';
import { getProfileImageSrc, profileImageClasses } from '@/lib/profileUtils';
import { useTooltipSettings } from '@/app/components/TooltipProvider';

type SettingsSection = 'main' | 'profile' | 'notifications' | 'tokens' | 'account';

export default function MobileSettings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Tooltip settings
  const { settings: tooltipSettings, updateSettings: updateTooltipSettings } = useTooltipSettings();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
    image: session?.user?.image ?? '',
  });

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    briefInterestUpdates: true,
    promotionalNotifications: true,
  });

  // Token data state
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenTransactions, setTokenTransactions] = useState<any[]>([]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load notification preferences
        const response = await fetch('/api/settings/notifications');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.preferences) {
            setNotificationPrefs(data.preferences);
          }
        }

        // Load token data
        const [balanceResult, transactionsResult] = await Promise.all([
          getUserTokenBalance(),
          getUserTokenTransactions(3) // Less for mobile
        ]);

        if (balanceResult.success) {
          setTokenBalance(balanceResult.balance);
        }

        if (transactionsResult.success) {
          setTokenTransactions(transactionsResult.data);
        }
      } catch (error) {
        console.error('Failed to load settings data:', error);
      }
    };

    void loadData();
  }, []);

  const handleProfileUpdate = async () => {
    try {
      // TODO: Implement profile update API call
      setNotification({ type: 'success', message: 'Profile updated!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update profile' });
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPrefs),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Preferences saved!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: 'Failed to save preferences' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save preferences' });
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User, description: 'Manage your profile information' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Control how we contact you' },
    { id: 'tokens', label: 'Tokens', icon: Coins, description: 'View balance and transactions' },
    { id: 'account', label: 'Security', icon: Shield, description: 'Account security settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 left-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <div className="flex items-center">
              {notification.type === 'success' ? <Check size={18} className="mr-2" /> : <AlertCircle size={18} className="mr-2" />}
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-20">
        <div className="flex items-center">
          {activeSection !== 'main' && (
            <button
              onClick={() => setActiveSection('main')}
              className="p-2 -ml-2 mr-2"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-xl font-semibold">
            {activeSection === 'main' ? 'Settings' : sections.find(s => s.id === activeSection)?.label}
          </h1>
        </div>
      </div>

      {/* Main Menu */}
      {activeSection === 'main' && (
        <div className="p-4 space-y-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as SettingsSection)}
              className="w-full bg-white rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <section.icon size={20} className="text-gray-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">{section.label}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* Profile Settings */}
      {activeSection === 'profile' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <img
                  src={getProfileImageSrc(profileForm.image || null, session?.user?.id, session?.user?.email)}
                  alt="Profile"
                  className="w-24 h-24 rounded-full"
                />
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full">
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <button
                onClick={handleProfileUpdate}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeSection === 'notifications' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 space-y-4">
            {/* Master Toggle */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Master control for all emails
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailNotifications}
                    onChange={(e) => {
                      const isEnabled = e.target.checked;
                      setNotificationPrefs({
                        ...notificationPrefs,
                        emailNotifications: isEnabled,
                        briefInterestUpdates: isEnabled ? notificationPrefs.briefInterestUpdates : false,
                        promotionalNotifications: isEnabled ? notificationPrefs.promotionalNotifications : false,
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Sub-options */}
            <div className={`space-y-4 ${!notificationPrefs.emailNotifications ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-medium text-gray-900">Brief Updates</h3>
                  <p className="text-sm text-gray-500">Interactions on your briefs</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.briefInterestUpdates}
                  disabled={!notificationPrefs.emailNotifications}
                  onChange={(e) => setNotificationPrefs({
                    ...notificationPrefs,
                    briefInterestUpdates: e.target.checked,
                  })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-medium text-gray-900">Platform Updates</h3>
                  <p className="text-sm text-gray-500">News and features</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.promotionalNotifications}
                  disabled={!notificationPrefs.emailNotifications}
                  onChange={(e) => setNotificationPrefs({
                    ...notificationPrefs,
                    promotionalNotifications: e.target.checked,
                  })}
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>

          {/* Tooltips */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 pr-4">
                <h3 className="font-medium text-gray-900">Help Tooltips</h3>
                <p className="text-sm text-gray-500">Show helpful hints</p>
              </div>
              <input
                type="checkbox"
                checked={tooltipSettings.enabled}
                onChange={(e) => {
                  updateTooltipSettings({ enabled: e.target.checked });
                }}
                className="w-5 h-5"
              />
            </div>

            {tooltipSettings.enabled && (
              <div>
                <label className="text-sm text-gray-600">Delay: {(tooltipSettings.delay / 1000).toFixed(1)}s</label>
                <input
                  type="range"
                  min="500"
                  max="3000"
                  step="500"
                  value={tooltipSettings.delay}
                  onChange={(e) => updateTooltipSettings({ delay: parseInt(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleNotificationUpdate}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            Save Preferences
          </button>
        </div>
      )}

      {/* Token Management */}
      {activeSection === 'tokens' && (
        <div className="p-4 space-y-4">
          <div className="bg-blue-600 text-white rounded-lg p-6">
            <h3 className="text-sm opacity-90">Current Balance</h3>
            <p className="text-3xl font-bold mt-1">{tokenBalance} Tokens</p>
            <button 
              onClick={() => router.push('/tokens')}
              className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Purchase Tokens
            </button>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Recent Transactions</h3>
            {tokenTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {tokenTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{transaction.reason}.</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button 
              onClick={() => router.push('/tokens')}
              className="w-full mt-4 text-blue-600 text-sm font-medium"
            >
              View All Transactions →
            </button>
          </div>
        </div>
      )}

      {/* Account Security */}
      {activeSection === 'account' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-lg p-4 space-y-4">
            <div className="pb-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Connected Accounts</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">G</span>
                  </div>
                  <span>Google Account</span>
                </div>
                <span className="text-green-600 text-sm">Connected</span>
              </div>
            </div>

            <button 
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="w-full py-3 text-red-600 font-medium"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-4">
            <button className="w-full py-3 text-blue-600 font-medium text-left">
              Download Your Data
            </button>
            <button className="w-full py-3 text-red-600 font-medium text-left">
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
