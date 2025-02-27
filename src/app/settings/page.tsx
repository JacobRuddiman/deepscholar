"use client";

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Coins, 
  Shield, 
  ChevronRight,
  Edit2,
  Save,
  X,
  AlertCircle
} from 'lucide-react';

type SettingsSection = 'profile' | 'notifications' | 'tokens' | 'account';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    image: session?.user?.image || '',
  });

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    briefUpdates: true,
    reviewNotifications: true,
    tokenAlerts: true,
  });

  // Token transaction history (mock data)
  const [tokenHistory] = useState([
    { id: 1, date: '2024-03-20', amount: 100, reason: 'Brief creation' },
    { id: 2, date: '2024-03-19', amount: -50, reason: 'AI Review request' },
    { id: 3, date: '2024-03-18', amount: 500, reason: 'Token purchase' },
  ]);

  const handleProfileUpdate = async () => {
    try {
      // TODO: Implement profile update API call
      setNotification({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update profile' });
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      // TODO: Implement notification preferences update API call
      setNotification({ type: 'success', message: 'Notification preferences updated!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update notification preferences' });
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'notifications', label: 'Notification Preferences', icon: Bell },
    { id: 'tokens', label: 'Token Management', icon: Coins },
    { id: 'account', label: 'Account Security', icon: Shield },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={18} />
            {notification.message}
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Settings Navigation */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4">
            <nav>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as SettingsSection)}
                  className={`w-full flex items-center justify-between p-3 rounded-md mb-2 ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <section.icon className="mr-3" size={18} />
                    <span>{section.label}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="col-span-9">
      <div className="bg-white rounded-lg shadow-md p-6">
            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Profile Settings</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    {isEditing ? (
                      <>
                        <Save size={18} className="mr-1" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit2 size={18} className="mr-1" />
                        Edit
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Picture
                    </label>
                    <div className="flex items-center">
                      <img
                        src={profileForm.image || '/default-avatar.png'}
                        alt="Profile"
                        className="w-16 h-16 rounded-full"
                      />
                      {isEditing && (
                        <button className="ml-4 text-blue-600 text-sm hover:underline">
                          Change Picture
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notification Preferences */}
            {activeSection === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">
                        Receive important updates via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailNotifications}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            emailNotifications: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div>
                      <h3 className="font-medium">Brief Updates</h3>
                      <p className="text-sm text-gray-500">
                        Get notified about updates to your briefs
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.briefUpdates}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            briefUpdates: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div>
                      <h3 className="font-medium">Review Notifications</h3>
                      <p className="text-sm text-gray-500">
                        Notifications about new reviews on your briefs
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.reviewNotifications}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            reviewNotifications: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div>
                      <h3 className="font-medium">Token Alerts</h3>
                      <p className="text-sm text-gray-500">
                        Get notified about token balance and transactions
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.tokenAlerts}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            tokenAlerts: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <button
                    onClick={handleNotificationUpdate}
                    className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </motion.div>
            )}

            {/* Token Management */}
            {activeSection === 'tokens' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Token Management</h2>
                
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Current Balance</h3>
                      <p className="text-3xl font-bold text-blue-600">550 Tokens</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                      Purchase Tokens
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                  <div className="bg-white rounded-lg border">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tokenHistory.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.date}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.reason}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Account Security */}
            {activeSection === 'account' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Account Security</h2>
                
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Connected Accounts</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img src="/google-icon.png" alt="Google" className="w-6 h-6 mr-2" />
                        <span>Google Account</span>
                      </div>
                      <span className="text-green-600 text-sm">Connected</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Account Deletion</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Delete Account
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Sign Out</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Sign out of your account on this device. You will need to sign in again to access your account.
                    </p>
          <button
                      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Sign Out
          </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Download Your Data</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Download a copy of your data, including your briefs, reviews, and account information.
                    </p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Request Data Export
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 