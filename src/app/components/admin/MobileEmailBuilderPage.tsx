'use client';

import React, { useState } from 'react';
import { Send, Users, User, X, Mail, Eye, Image as ImageIcon, Edit2, Search, Calendar, UserCheck, CheckSquare, Square } from 'lucide-react';

interface EmailTag {
  id: string;
  value: string;
  type: 'user' | 'email';
  userData?: {
    id: string;
    name: string | null;
    email: string | null;
    emailNotifications: boolean;
    briefInterestUpdates: boolean;
    promotionalNotifications: boolean;
  };
}

interface MobileEmailBuilderPageProps {
  onSendEmail: (data: {
    subject: string;
    body: string;
    footer: string;
    recipients: string[];
    scheduledFor?: string;
  }) => void;
  users: Array<{
    id: string;
    name: string | null;
    email: string | null;
    emailNotifications: boolean;
    briefInterestUpdates: boolean;
    promotionalNotifications: boolean;
  }>;
  images: Array<{
    name: string;
    url: string;
  }>;
  onUploadImage: (file: File) => void;
  defaultFooter: string;
}

export default function MobileEmailBuilderPage({ 
  onSendEmail, 
  users, 
  images, 
  onUploadImage, 
  defaultFooter 
}: MobileEmailBuilderPageProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState(defaultFooter);
  const [emailTags, setEmailTags] = useState<EmailTag[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'recipients' | 'schedule'>('compose');

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ??
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const selectedEmails = new Set(emailTags.map(t => t.value));

  const addTag = (tag: EmailTag) => {
    if (!emailTags.some(t => t.value === tag.value)) {
      setEmailTags(prev => [...prev, tag]);
    }
  };

  const removeTag = (id: string) => {
    setEmailTags(prev => prev.filter(tag => tag.id !== id));
  };

  const handleUserToggle = (user: typeof users[0]) => {
    if (!user.email) return;
    
    const isSelected = selectedEmails.has(user.email);
    if (isSelected) {
      const tagToRemove = emailTags.find(t => t.value === user.email);
      if (tagToRemove) {
        removeTag(tagToRemove.id);
      }
    } else {
      addTag({
        id: user.id,
        value: user.email,
        type: 'user',
        userData: user
      });
    }
  };

  const handleBulkSelect = (type: 'all' | 'briefInterestUpdates' | 'promotionalNotifications') => {
    let usersToAdd = users.filter(u => u.email && u.emailNotifications);
    
    if (type === 'briefInterestUpdates') {
      usersToAdd = usersToAdd.filter(u => u.briefInterestUpdates);
    } else if (type === 'promotionalNotifications') {
      usersToAdd = usersToAdd.filter(u => u.promotionalNotifications);
    }

    usersToAdd.forEach(user => {
      if (user.email && !selectedEmails.has(user.email)) {
        addTag({
          id: user.id,
          value: user.email,
          type: 'user',
          userData: user
        });
      }
    });
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim() || emailTags.length === 0) {
      alert('Please fill in subject, body, and select at least one recipient');
      return;
    }

    onSendEmail({
      subject,
      body,
      footer,
      recipients: emailTags.map(tag => tag.value),
      scheduledFor: showScheduler && scheduledFor ? scheduledFor : undefined
    });

    // Reset form
    setSubject('');
    setBody('');
    setEmailTags([]);
    setScheduledFor('');
    setShowScheduler(false);
  };

  const insertImage = (imageUrl: string) => {
    const imageTag = `\n![Image](${imageUrl})\n`;
    setBody(prev => prev + imageTag);
    setShowImages(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Mail className="w-6 h-6" />
          <h1 className="text-xl font-bold">Email Builder</h1>
        </div>
        <p className="text-blue-100 text-sm">Create and send emails to users</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>{emailTags.length} recipients</span>
          </div>
          {showScheduler && scheduledFor && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Scheduled</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setActiveTab('compose')}
            className={`p-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'compose' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Compose
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            className={`p-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'recipients' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Recipients
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`p-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'schedule' 
                ? 'bg-green-100 text-green-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Schedule
          </button>
        </div>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="space-y-4">
          {/* Subject */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Body */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Email Body
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowImages(!showImages)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {showImages && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Images</h4>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, idx) => (
                    <div
                      key={idx}
                      className="relative cursor-pointer hover:opacity-80"
                      onClick={() => insertImage(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                        <span className="text-white opacity-0 hover:opacity-100 text-xs">
                          Insert
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email content... (Supports Markdown)"
              rows={12}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
            />
          </div>

          {/* Footer */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Footer
            </label>
            <textarea
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h3>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="bg-white p-4 rounded border">
                  <div className="border-b pb-3 mb-3">
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>To:</strong> {emailTags.length} recipients
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Subject:</strong> {subject || '[No Subject]'}
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-gray-900">
                    {body || '[No content]'}
                    {footer && (
                      <>
                        <br /><br />
                        <div className="text-gray-600">{footer}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recipients Tab */}
      {activeTab === 'recipients' && (
        <div className="space-y-4">
          {/* Selected Recipients */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected Recipients ({emailTags.length})
              </h3>
              <button
                onClick={() => setEmailTags([])}
                className="text-red-600 text-sm hover:text-red-700"
              >
                Clear All
              </button>
            </div>
            
            {emailTags.length > 0 ? (
              <div className="space-y-2">
                {emailTags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">
                        {tag.userData?.name ?? 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-600">{tag.value}</div>
                    </div>
                    <button
                      onClick={() => removeTag(tag.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No recipients selected</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Select</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleBulkSelect('all')}
                className="p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                All Active Users
              </button>
              <button
                onClick={() => handleBulkSelect('briefInterestUpdates')}
                className="p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors text-sm font-medium"
              >
                Brief Updates
              </button>
              <button
                onClick={() => handleBulkSelect('promotionalNotifications')}
                className="p-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                Promotional
              </button>
              <button
                onClick={() => setShowUserModal(true)}
                className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <UserCheck className="w-4 h-4 inline mr-2" />
                Browse Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Schedule Email</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="schedule-toggle"
                  checked={showScheduler}
                  onChange={(e) => setShowScheduler(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="schedule-toggle" className="text-sm font-medium text-gray-700">
                  Schedule for later
                </label>
              </div>
              
              {showScheduler && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              {!showScheduler && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-700 text-sm">
                    Email will be sent immediately when you click Send
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <button
          onClick={handleSend}
          disabled={!subject.trim() || !body.trim() || emailTags.length === 0}
          className="w-full flex items-center justify-center space-x-2 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {showScheduler && scheduledFor ? (
            <>
              <Calendar className="w-5 h-5" />
              <span>Schedule Email</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send Email</span>
            </>
          )}
        </button>
      </div>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Users</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
              <div className="space-y-2">
                {filteredUsers.map(user => {
                  const isSelected = user.email && selectedEmails.has(user.email);
                  
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleUserToggle(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name ?? 'Anonymous'}</div>
                          <div className="text-sm text-gray-600">{user.email ?? 'No email'}</div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        {user.briefInterestUpdates && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            Brief
                          </span>
                        )}
                        {user.promotionalNotifications && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            Promo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="text-sm text-gray-600">
                {emailTags.length} recipients selected • {filteredUsers.length} users shown
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
