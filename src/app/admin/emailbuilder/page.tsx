'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, User, X, Mail, Eye } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type User = {
  id: string;
  name: string | null;
  email: string | null;
};

export default function EmailBuilderPage() {
  const searchParams = useSearchParams();
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(['all']);
  const [users, setUsers] = useState<User[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json() as { users: User[] };
          setUsers(data.users ?? []);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    void loadUsers();
  }, []);

  // Handle URL parameters for pre-selecting recipients
  useEffect(() => {
    const recipients = searchParams.get('recipients');
    if (recipients && users.length > 0) {
      const recipientEmails = recipients.split(',').map(email => email.trim());
      const matchingUserIds = users
        .filter(user => user.email && recipientEmails.includes(user.email))
        .map(user => user.id);
      
      if (matchingUserIds.length > 0) {
        setSelectedUsers(matchingUserIds);
      }
    }
  }, [searchParams, users]);

  const footer = `
---
© 2025 DeepScholar - Your AI Research Companion
Visit us at: https://deepscholar.com
Unsubscribe: https://deepscholar.com/unsubscribe
  `.trim();

  const handleUserToggle = (userId: string) => {
    if (userId === 'all') {
      setSelectedUsers(['all']);
    } else {
      const newSelection = selectedUsers.includes('all') 
        ? [userId]
        : selectedUsers.includes(userId)
          ? selectedUsers.filter(id => id !== userId)
          : [...selectedUsers.filter(id => id !== 'all'), userId];
      
      setSelectedUsers(newSelection.length === 0 ? ['all'] : newSelection);
    }
  };

  const handleSendEmail = async () => {
    if (!header.trim() || !body.trim()) {
      alert('Please fill in both header and body');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: header,
          body: body,
          footer: footer,
          recipients: selectedUsers.includes('all') ? 'all' : selectedUsers,
        }),
      });

      if (response.ok) {
        alert('Email sent successfully! Check console for email logs.');
        setHeader('');
        setBody('');
        setSelectedUsers(['all']);
      } else {
        const error = await response.json() as { error: string };
        alert(`Failed to send email: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to send email. Please try again.');
      console.error('Send email error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipientText = () => {
    if (selectedUsers.includes('all')) {
      return 'All users';
    }
    if (selectedUsers.length === 1) {
      const user = users.find(u => u.id === selectedUsers[0]);
      return user?.name ?? user?.email ?? 'Unknown user';
    }
    return `${selectedUsers.length} selected users`;
  };

  const fullEmailContent = `${header}\n\n${body}\n\n${footer}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Email Builder</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                previewMode 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{previewMode ? 'Edit' : 'Preview'}</span>
            </button>
          </div>
        </div>

        {previewMode ? (
          // Preview Mode
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
              <div className="bg-white p-6 rounded border">
                <div className="border-b pb-4 mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>To:</strong> {getRecipientText()}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Subject:</strong> {header || '[No Subject]'}
                  </div>
                </div>
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {fullEmailContent || 'No content'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-6">
            {/* Header/Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={header}
                onChange={(e) => setHeader(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter email content..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            {/* Footer Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer (Automatically Added)
              </label>
              <div className="bg-gray-50 p-3 rounded border text-sm text-gray-600 whitespace-pre-wrap font-mono">
                {footer}
              </div>
            </div>

            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients
              </label>
              <button
                onClick={() => setShowUserSelector(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>{getRecipientText()}</span>
              </button>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSendEmail}
                disabled={isLoading || !header.trim() || !body.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>{isLoading ? 'Sending...' : 'Send Email'}</span>
              </button>
            </div>
          </div>
        )}

        {/* User Selector Modal */}
        {showUserSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Recipients</h3>
                <button
                  onClick={() => setShowUserSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {/* All Users Option */}
                <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes('all')}
                    onChange={() => handleUserToggle('all')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">All Users</span>
                </label>

                <div className="border-t pt-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <User className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {user.name ?? 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email ?? 'No email'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUserSelector(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowUserSelector(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
