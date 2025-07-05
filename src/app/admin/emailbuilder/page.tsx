'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Users, User, X, Mail, Eye, Image as ImageIcon, 
  GripVertical, Minimize2, Maximize2, Edit2, Search,
  Calendar, Clock, ChevronDown, ChevronUp, UserPlus,
  CheckSquare, Square, Filter, UserCheck
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { showAdminAlert, createLog, AdminAlertContainer } from '@/app/components/admin/AdminAlert';

type User = {
  id: string;
  name: string | null;
  email: string | null;
  emailNotifications: boolean;
  briefInterestUpdates: boolean;
  promotionalNotifications: boolean;
};

type EmailImage = {
  name: string;
  url: string;
};

type DragPosition = 'left' | 'right' | 'top' | 'bottom';

type EmailTag = {
  id: string;
  value: string;
  type: 'user' | 'email';
  userData?: User;
};

const UserSelectionModal = React.memo(({ 
  showUserModal, 
  setShowUserModal, 
  users, 
  modalSearchTerm, 
  setModalSearchTerm,
  emailTags,
  addTag,
  removeTag,
  handleBulkSelect,
  handleBulkUnselect,
  showAdminAlert,
  createLog
}: {
  showUserModal: boolean;
  setShowUserModal: (show: boolean) => void;
  users: User[];
  modalSearchTerm: string;
  setModalSearchTerm: (term: string) => void;
  emailTags: EmailTag[];
  addTag: (tag: EmailTag) => void;
  removeTag: (id: string) => void;
  handleBulkSelect: (type: 'all' | 'emailNotifications' | 'briefInterestUpdates' | 'promotionalNotifications') => void;
  handleBulkUnselect: (type: 'all' | 'emailNotifications' | 'briefInterestUpdates' | 'promotionalNotifications') => void;
  showAdminAlert: typeof showAdminAlert;
  createLog: typeof createLog;
}) => {
  console.log('[DEBUG] UserSelectionModal render - showUserModal:', showUserModal);
  console.log('[DEBUG] UserSelectionModal render - users length:', users?.length);
  console.log('[DEBUG] UserSelectionModal render - emailTags length:', emailTags?.length);

  // Add defensive check for users
  const safeUsers = users || [];
  
  // Memoize filtered users for modal to prevent re-renders
  const filteredModalUsers = useMemo(() => {
    if (!modalSearchTerm) return safeUsers;
    const searchLower = modalSearchTerm.toLowerCase();
    return safeUsers.filter(user => 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }, [safeUsers, modalSearchTerm]);

  // Add defensive check for emailTags
  const safeEmailTags = emailTags || [];
  
  // Memoize selected emails set with defensive check
  const selectedEmails = useMemo(() => 
    new Set(safeEmailTags.map(t => t.value)), 
    [safeEmailTags]
  );

  // Handle user toggle without closing modal
  const handleUserToggle = useCallback((user: User) => {
    if (!user.email) return;
    
    const isSelected = selectedEmails.has(user.email);
    console.log('[DEBUG] Toggling user:', user.email, 'Selected:', isSelected);
    
    if (isSelected) {
      const tagToRemove = safeEmailTags.find(t => t.value === user.email);
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
  }, [selectedEmails, safeEmailTags, addTag, removeTag]);

  // Handle select all in modal
  const handleModalSelectAll = useCallback(() => {
    const logs = [];
    logs.push(createLog('Selecting all visible users in modal'));
    
    let addedCount = 0;
    filteredModalUsers.forEach(user => {
      if (user.email && !selectedEmails.has(user.email)) {
        addTag({
          id: user.id,
          value: user.email,
          type: 'user',
          userData: user
        });
        addedCount++;
      }
    });
    
    logs.push(createLog(`Added ${addedCount} users`, { total: filteredModalUsers.length }));
    showAdminAlert('success', 'Select All', `Added ${addedCount} recipients`, logs);
  }, [filteredModalUsers, selectedEmails, addTag, createLog, showAdminAlert]);

  if (!showUserModal) {
    console.log('[DEBUG] UserSelectionModal not showing - showUserModal is false');
    return null;
  }

  console.log('[DEBUG] UserSelectionModal rendering modal');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => {
          console.log('[DEBUG] Modal backdrop clicked - closing modal');
          setShowUserModal(false);
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        >
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Select Recipients</h2>
              <button
                onClick={() => {
                  console.log('[DEBUG] Modal close button clicked');
                  setShowUserModal(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleModalSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Select All Visible
                </button>
                <button
                  onClick={() => handleBulkUnselect('all')}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <span className="text-sm text-gray-600">Quick filters:</span>
              <button
                onClick={() => handleBulkSelect('briefInterestUpdates')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
              >
                + Brief Updates
              </button>
              <button
                onClick={() => handleBulkSelect('promotionalNotifications')}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
              >
                + Promotional
              </button>
              <button
                onClick={() => handleBulkUnselect('briefInterestUpdates')}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
              >
                - Brief Updates
              </button>
              <button
                onClick={() => handleBulkUnselect('promotionalNotifications')}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
              >
                - Promotional
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            <div className="space-y-2">
              {filteredModalUsers.map(user => {
                const isSelected = user.email && selectedEmails.has(user.email);
                
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleUserToggle(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.name || 'Anonymous'}</div>
                        <div className="text-sm text-gray-600">{user.email || 'No email'}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {user.emailNotifications && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          Email On
                        </span>
                      )}
                      {user.briefInterestUpdates && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          Brief Updates
                        </span>
                      )}
                      {user.promotionalNotifications && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          Promotional
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {safeEmailTags.length} recipients selected • {filteredModalUsers.length} users shown
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

UserSelectionModal.displayName = 'UserSelectionModal';

export default function EmailBuilderPage() {
  const searchParams = useSearchParams();
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [isEditingFooter, setIsEditingFooter] = useState(false);
  const [emailTags, setEmailTags] = useState<EmailTag[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<DragPosition | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [images, setImages] = useState<EmailImage[]>([]);
  const [showImagePanel, setShowImagePanel] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  // Load users and footer on mount
  useEffect(() => {
    const loadData = async () => {
      const logs = [];
      try {
        logs.push(createLog('Starting data load...'));
        
        // Load users
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const data = await usersResponse.json() as { users: User[] };
          setUsers(data.users ?? []);
          setFilteredUsers(data.users ?? []);
          logs.push(createLog('Users loaded successfully', { count: data.users?.length ?? 0 }));
        } else {
          logs.push(createLog('Failed to load users', { status: usersResponse.status }));
        }

        // Load active footer
        const footerResponse = await fetch('/api/admin/email-footer');
        if (footerResponse.ok) {
          const footerData = await footerResponse.json();
          setFooter(footerData.content || getDefaultFooter());
          logs.push(createLog('Footer loaded successfully'));
        } else {
          setFooter(getDefaultFooter());
          logs.push(createLog('Using default footer'));
        }

        // Load images
        const imagesResponse = await fetch('/api/admin/email-images');
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          setImages(imagesData.images || []);
          logs.push(createLog('Images loaded successfully', { count: imagesData.images?.length ?? 0 }));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setFooter(getDefaultFooter());
        logs.push(createLog('Error loading data', { error: error instanceof Error ? error.message : 'Unknown error' }));
        showAdminAlert('error', 'Data Load Error', 'Failed to load some data', logs);
      }
    };
    void loadData();
  }, []);

  const getDefaultFooter = () => `
---
© 2025 DeepScholar - Your AI Research Companion
Visit us at: https://deepscholar.com
Unsubscribe: https://deepscholar.com/unsubscribe
  `.trim();

  // Handle URL parameters
  useEffect(() => {
    const recipients = searchParams.get('recipients');
    if (recipients && users.length > 0) {
      const recipientEmails = recipients.split(',').map(email => email.trim());
      
      recipientEmails.forEach(email => {
        const user = users.find(u => u.email === email);
        if (user) {
          addTag({
            id: user.id,
            value: user.email || user.name || email,
            type: 'user',
            userData: user
          });
        } else {
          addTag({
            id: `email-${Date.now()}-${email}`,
            value: email,
            type: 'email'
          });
        }
      });
    }
  }, [searchParams, users]);

  const addTag = useCallback((tag: EmailTag) => {
    console.log('[DEBUG] Adding tag:', tag);
    setEmailTags(prev => {
      // Don't add duplicates
      if (prev.some(t => t.value === tag.value)) {
        console.log('[DEBUG] Tag already exists:', tag.value);
        return prev;
      }
      console.log('[DEBUG] Tag added successfully:', tag.value);
      return [...prev, tag];
    });
  }, []);

  const removeTag = useCallback((id: string) => {
    console.log('[DEBUG] Removing tag with id:', id);
    setEmailTags(prev => prev.filter(tag => tag.id !== id));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Filter users based on input
    if (value.trim()) {
      const filtered = users.filter(user => {
        const nameMatch = user.name?.toLowerCase().includes(value.toLowerCase());
        const emailMatch = user.email?.toLowerCase().includes(value.toLowerCase());
        return nameMatch || emailMatch;
      });
      setFilteredUsers(filtered);
      setShowUserSelector(true);
    } else {
      setFilteredUsers(users);
      setShowUserSelector(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      const value = inputValue.trim();
      
      if (value) {
        // Check if it's a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(value)) {
          addTag({
            id: `email-${Date.now()}`,
            value,
            type: 'email'
          });
          setInputValue('');
        }
      }
    } else if (e.key === 'Backspace' && inputValue === '' && emailTags.length > 0) {
      // Remove the last tag when backspace is pressed on empty input
      removeTag(emailTags[emailTags.length - 1].id);
    }
  };

  const handleUserSelect = useCallback((user: User) => {
    console.log('[DEBUG] Selecting user:', user);
    if (user.email) {
      addTag({
        id: user.id,
        value: user.email,
        type: 'user',
        userData: user
      });
      setInputValue('');
      setShowUserSelector(false);
      
      // Focus back on input
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }
  }, [addTag]);

  const handleBulkSelect = useCallback((notificationType: 'all' | 'emailNotifications' | 'briefInterestUpdates' | 'promotionalNotifications') => {
    const logs = [];
    logs.push(createLog(`Bulk selecting users with: ${notificationType}`));
    
    let usersToAdd: User[] = [];
    
    switch (notificationType) {
      case 'all':
        usersToAdd = users.filter(u => u.email && u.emailNotifications);
        logs.push(createLog('Filtering all users with email notifications enabled', { totalUsers: users.length }));
        break;
      case 'emailNotifications':
        usersToAdd = users.filter(u => u.email && u.emailNotifications);
        logs.push(createLog('Filtering users with email notifications', { totalUsers: users.length }));
        break;
      case 'briefInterestUpdates':
        usersToAdd = users.filter(u => u.email && u.emailNotifications && u.briefInterestUpdates);
        logs.push(createLog('Filtering users with brief interest updates', { totalUsers: users.length }));
        break;
      case 'promotionalNotifications':
        usersToAdd = users.filter(u => u.email && u.emailNotifications && u.promotionalNotifications);
        logs.push(createLog('Filtering users with promotional notifications', { totalUsers: users.length }));
        break;
    }

    logs.push(createLog(`Found ${usersToAdd.length} users matching criteria`));

    // Add users that aren't already in the tags
    const existingEmails = new Set(emailTags.map(t => t.value));
    let addedCount = 0;
    
    usersToAdd.forEach(user => {
      if (user.email && !existingEmails.has(user.email)) {
        addTag({
          id: user.id,
          value: user.email,
          type: 'user',
          userData: user
        });
        addedCount++;
      }
    });

    logs.push(createLog(`Added ${addedCount} new recipients`, { 
      skipped: usersToAdd.length - addedCount,
      total: emailTags.length + addedCount 
    }));

    showAdminAlert(
      'success', 
      'Recipients Added', 
      `Added ${addedCount} recipients (${notificationType})`,
      logs
    );
  }, [users, emailTags, addTag]);

  const handleBulkUnselect = useCallback((notificationType: 'all' | 'emailNotifications' | 'briefInterestUpdates' | 'promotionalNotifications') => {
    const logs = [];
    const previousCount = emailTags.length;
    logs.push(createLog(`Bulk unselecting: ${notificationType}`, { previousCount }));

    setEmailTags(prev => {
      let filtered;
      switch (notificationType) {
        case 'all':
          filtered = [];
          break;
        case 'emailNotifications':
          filtered = prev.filter(tag => {
            if (tag.type === 'email') return true;
            return !tag.userData?.emailNotifications;
          });
          break;
        case 'briefInterestUpdates':
          filtered = prev.filter(tag => {
            if (tag.type === 'email') return true;
            return !tag.userData?.briefInterestUpdates;
          });
          break;
        case 'promotionalNotifications':
          filtered = prev.filter(tag => {
            if (tag.type === 'email') return true;
            return !tag.userData?.promotionalNotifications;
          });
          break;
        default:
          filtered = prev;
      }
      
      const removedCount = prev.length - filtered.length;
      logs.push(createLog(`Removed ${removedCount} recipients`, { remaining: filtered.length }));
      
      showAdminAlert(
        'info',
        'Recipients Removed',
        `Removed ${removedCount} recipients`,
        logs
      );
      
      return filtered;
    });
  }, [emailTags.length]);

  const handleSaveFooter = async () => {
    const logs = [];
    try {
      logs.push(createLog('Saving footer...'));
      const response = await fetch('/api/admin/email-footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: footer }),
      });
      
      if (response.ok) {
        setIsEditingFooter(false);
        logs.push(createLog('Footer saved successfully'));
        showAdminAlert('success', 'Footer Saved', 'Email footer has been updated', logs);
      } else {
        logs.push(createLog('Failed to save footer', { status: response.status }));
        showAdminAlert('error', 'Save Failed', 'Could not save footer', logs);
      }
    } catch (error) {
      console.error('Failed to save footer:', error);
      logs.push(createLog('Error saving footer', { error: error instanceof Error ? error.message : 'Unknown' }));
      showAdminAlert('error', 'Save Error', 'Failed to save footer', logs);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const logs = [];
    try {
      logs.push(createLog('Uploading image...', { fileName: file.name, size: file.size }));
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setImages(prev => [...prev, { name: data.name, url: data.url }]);
        logs.push(createLog('Image uploaded successfully', { url: data.url }));
        showAdminAlert('success', 'Image Uploaded', `${file.name} uploaded successfully`, logs);
      } else {
        logs.push(createLog('Upload failed', { status: response.status }));
        showAdminAlert('error', 'Upload Failed', 'Could not upload image', logs);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      logs.push(createLog('Upload error', { error: error instanceof Error ? error.message : 'Unknown' }));
      showAdminAlert('error', 'Upload Error', 'Failed to upload image', logs);
    } finally {
      setUploadingImage(false);
    }
  };

  const insertImageToEditor = (imageUrl: string) => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const imageTag = `\n![Image](${imageUrl})\n`;
      
      const newBody = body.substring(0, start) + imageTag + body.substring(end);
      setBody(newBody);
      
      // Set cursor position after the inserted image
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + imageTag.length;
        textarea.focus();
      }, 0);

      showAdminAlert('success', 'Image Inserted', 'Image added to email body', [
        createLog('Image inserted at position', { position: start, url: imageUrl })
      ]);
    }
  };

  const handleSendEmail = async () => {
    const logs = [];
    
    if (!header.trim() || !body.trim()) {
      showAdminAlert('warning', 'Missing Content', 'Please fill in both subject and body', [
        createLog('Validation failed', { hasHeader: !!header.trim(), hasBody: !!body.trim() })
      ]);
      return;
    }

    const recipients = emailTags.map(tag => tag.type === 'user' ? tag.id : tag.value);
    if (recipients.length === 0) {
      showAdminAlert('warning', 'No Recipients', 'Please select at least one recipient');
      return;
    }

    setIsLoading(true);
    logs.push(createLog('Preparing to send email', { 
      recipientCount: recipients.length,
      scheduled: showScheduler && !!scheduledFor 
    }));

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: header,
          body: body,
          footer: footer,
          recipients: recipients,
          scheduledFor: showScheduler && scheduledFor ? scheduledFor : null
        }),
      });

      if (response.ok) {
        const data = await response.json();
        logs.push(createLog('Email sent successfully', data));
        
        if (data.scheduled) {
          showAdminAlert('success', 'Email Scheduled', `Email scheduled for ${new Date(scheduledFor).toLocaleString()}`, logs);
        } else {
          showAdminAlert('success', 'Email Sent', `Email sent to ${recipients.length} recipients`, logs);
        }
        
        // Reset form
        setHeader('');
        setBody('');
        setEmailTags([]);
        setInputValue('');
        setScheduledFor('');
        setShowScheduler(false);
      } else {
        const error = await response.json();
        logs.push(createLog('Send failed', error));
        showAdminAlert('error', 'Send Failed', error.error || 'Failed to send email', logs);
      }
    } catch (error) {
      console.error('Send email error:', error);
      logs.push(createLog('Send error', { error: error instanceof Error ? error.message : 'Unknown' }));
      showAdminAlert('error', 'Send Error', 'Failed to send email. Please try again.', logs);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipientsText = () => {
    if (emailTags.length === 0) return 'No recipients selected';
    if (emailTags.length === 1) return emailTags[0].value;
    return `${emailTags.length} recipients selected`;
  };

  const getVisibleTags = () => {
    if (showAllTags || emailTags.length <= 6) {
      return emailTags;
    }
    return emailTags.slice(0, 6);
  };

  const hiddenTagsCount = emailTags.length - 6;

  // Memoize filtered users for modal to prevent re-renders
  const filteredModalUsers = useMemo(() => {
    if (!modalSearchTerm) return users;
    const searchLower = modalSearchTerm.toLowerCase();
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  }, [users, modalSearchTerm]);

  // Memoize selected emails set
  const selectedEmails = useMemo(() => 
    new Set(emailTags.map(t => t.value)), 
    [emailTags]
  );

  

  const PreviewPanel = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 overflow-auto custom-scrollbar" style={{ height: '100%' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Email Preview</h2>
        <button
          onClick={() => setShowPreview(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="bg-white p-6 rounded border">
          <div className="border-b pb-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">
              <strong>To:</strong> {getRecipientsText()}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <strong>Subject:</strong> {header || '[No Subject]'}
            </div>
            {showScheduler && scheduledFor && (
              <div className="text-sm text-gray-600 mb-2">
                <strong>Scheduled for:</strong> {new Date(scheduledFor).toLocaleString()}
              </div>
            )}
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {body || '[No content]'}
            {footer && (
              <>
                <br /><br />
                {footer}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSplitScreen = () => {
    if (!showPreview) return renderEditor();

    const splitClass = {
      left: 'grid-cols-2',
      right: 'grid-cols-2',
      top: 'grid-rows-2',
      bottom: 'grid-rows-2'
    }[previewPosition || 'right'];
    
    return (
      <div className={`grid ${splitClass} gap-4`} style={{ height: 'calc(100vh - 150px)' }}>
        {previewPosition === 'left' || previewPosition === 'top' ? (
          <>
            <PreviewPanel />
            <div style={{ height: '100%', overflowY: 'auto' }}>{renderEditor()}</div>
          </>
        ) : (
          <>
            <div style={{ height: '100%', overflowY: 'auto' }}>{renderEditor()}</div>
            <PreviewPanel />
          </>
        )}
      </div>
    );
  };

  const renderEditor = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipients
          </label>
          
          <div className="email-input-container">
            <div 
              className="border border-gray-300 rounded-lg px-2 py-1 flex flex-wrap items-center gap-1 min-h-[42px] relative"
              onClick={() => emailInputRef.current?.focus()}
            >
              {getVisibleTags().map(tag => (
                <div key={tag.id} className="email-tag">
                  <span>{tag.value}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag.id);
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {hiddenTagsCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllTags(!showAllTags);
                  }}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center gap-1"
                >
                  {showAllTags ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      +{hiddenTagsCount} more
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
              
              <input
                ref={emailInputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={emailTags.length ? "" : "Type email or search users..."}
                className="flex-1 min-w-[100px] border-none focus:outline-none focus:ring-0 py-1 px-1"
              />
              
              {/* Manage Recipients Button inside input */}
              <button
  onClick={(e) => {
    e.stopPropagation();
    console.log('[DEBUG] Manage Recipients button clicked');
    console.log('[DEBUG] Current showUserModal state:', showUserModal);
    setShowUserModal(true);
    console.log('[DEBUG] setShowUserModal(true) called');
  }}
  className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
>
  <UserCheck className="w-4 h-4" />
  Manage Recipients
</button>
            </div>

            {/* User suggestions dropdown */}
            {showUserSelector && filteredUsers.length > 0 && (
              <div className="email-suggestions">
                {filteredUsers.slice(0, 5).map(user => (
                  <div
                    key={user.id}
                    className="email-suggestion-item"
                    onClick={() => handleUserSelect(user)}
                  >
                    <User size={16} className="mr-2 text-gray-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user.name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                    </div>
                    <div className="flex gap-1">
                      {user.briefInterestUpdates && (
                        <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">B</span>
                      )}
                      {user.promotionalNotifications && (
                        <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">P</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick selection buttons */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleBulkSelect('all')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              Select All Active
            </button>
            <button
              onClick={() => handleBulkSelect('briefInterestUpdates')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
            >
              + Brief Interest
            </button>
            <button
              onClick={() => handleBulkSelect('promotionalNotifications')}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
            >
              + Promotional
            </button>
            <button
              onClick={() => handleBulkUnselect('all')}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Schedule Email */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="schedule-email"
              checked={showScheduler}
              onChange={(e) => setShowScheduler(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="schedule-email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Email
            </label>
          </div>
          
          {showScheduler && (
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Body with Image Panel */}
        <div className="flex gap-4" style={{ height: '500px' }}>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Body
            </label>
            <textarea
              ref={editorRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email content... (Supports Markdown)"
              className="w-full h-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
            />
          </div>
          
          {/* Image Panel */}
          {showImagePanel && (
            <div
              className="bg-gray-50 rounded-lg p-4 overflow-hidden"
              style={{ width: '250px', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-sm">Images</h3>
                <button
                  onClick={() => setShowImagePanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-col h-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>
                
                <div className="flex-1 overflow-y-auto space-y-2">
                  {images.map((image, idx) => (
                    <div
                      key={idx}
                      className="group relative cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => insertImageToEditor(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full rounded border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm">
                          Click to insert
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {!showImagePanel && (
            <button
              onClick={() => setShowImagePanel(true)}
              className="px-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Email Footer
            </label>
            <button
              onClick={() => setIsEditingFooter(!isEditingFooter)}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              {isEditingFooter ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {isEditingFooter ? (
            <div className="space-y-2">
              <textarea
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <button
                onClick={handleSaveFooter}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                Save Footer
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded border text-sm text-gray-600 whitespace-pre-wrap font-mono">
              {footer}
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSendEmail}
            disabled={isLoading || !header.trim() || !body.trim() || emailTags.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {showScheduler && scheduledFor ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>{isLoading ? 'Scheduling...' : 'Schedule Email'}</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>{isLoading ? 'Sending...' : 'Send Email'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AdminAlertContainer />
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Email Builder</h1>
          </div>

          {renderSplitScreen()}
          
          {/* Draggable Preview Button */}
          <motion.button
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => {
              const { x, y } = info.point;
              const windowWidth = window.innerWidth;
              const windowHeight = window.innerHeight;
              
              let position: DragPosition;
              if (x < windowWidth * 0.25) position = 'left';
              else if (x > windowWidth * 0.75) position = 'right';
              else if (y < windowHeight * 0.25) position = 'top';
              else position = 'bottom';
              
              setPreviewPosition(position);
              setShowPreview(true);
            }}
            onClick={() => setShowPreview(!showPreview)}
            whileDrag={{ scale: 1.1 }}
            className="preview-button"
          >
            <GripVertical className="preview-button-icon" />
            <Eye className="preview-button-icon" />
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </motion.button>
          
          {/* User Selection Modal */}
          <UserSelectionModal 
  showUserModal={showUserModal}
  setShowUserModal={setShowUserModal}
  users={users}
  modalSearchTerm={modalSearchTerm}
  setModalSearchTerm={setModalSearchTerm}
  emailTags={emailTags}
  addTag={addTag}
  removeTag={removeTag}
  handleBulkSelect={handleBulkSelect}
  handleBulkUnselect={handleBulkUnselect}
  showAdminAlert={showAdminAlert}
  createLog={createLog}
/>
        </div>

        <style jsx>{`
          .email-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background-color: #3b82f6;
            color: white;
            border-radius: 4px;
            font-size: 14px;
          }
          
          .email-tag button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            opacity: 0.7;
            transition: opacity 0.2s;
          }
          
          .email-tag button:hover {
            opacity: 1;
          }
          
          .email-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-top: 4px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-height: 200px;
            overflow-y: auto;
            z-index: 10;
          }
          
          .email-suggestion-item {
            padding: 8px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background-color 0.2s;
          }
          
          .email-suggestion-item:hover {
            background-color: #f3f4f6;
          }
          
          .email-input-container {
            position: relative;
          }
          
          .preview-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            z-index: 40;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .preview-button:hover {
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }
          
          .preview-button-icon {
            width: 20px;
            height: 20px;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </div>
    </>
  );
}