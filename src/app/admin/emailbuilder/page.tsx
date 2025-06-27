'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, Users, User, X, Mail, Eye, Image as ImageIcon, 
  GripVertical, Minimize2, Maximize2, Edit2, Search
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type User = {
  id: string;
  name: string | null;
  email: string | null;
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
};

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
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  // Load users and footer on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load users
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const data = await usersResponse.json() as { users: User[] };
          setUsers(data.users ?? []);
          setFilteredUsers(data.users ?? []);
        }

        // Load active footer
        const footerResponse = await fetch('/api/admin/email-footer');
        if (footerResponse.ok) {
          const footerData = await footerResponse.json();
          setFooter(footerData.content || getDefaultFooter());
        } else {
          setFooter(getDefaultFooter());
        }

        // Load images
        const imagesResponse = await fetch('/api/admin/email-images');
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          setImages(imagesData.images || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setFooter(getDefaultFooter());
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
            type: 'user'
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

  const addTag = (tag: EmailTag) => {
    setEmailTags(prev => {
      // Don't add duplicates
      if (prev.some(t => t.value === tag.value)) return prev;
      return [...prev, tag];
    });
  };

  const removeTag = (id: string) => {
    setEmailTags(prev => prev.filter(tag => tag.id !== id));
  };

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

  const handleUserSelect = (user: User) => {
    if (user.email) {
      addTag({
        id: user.id,
        value: user.email,
        type: 'user'
      });
      setInputValue('');
      setShowUserSelector(false);
      
      // Focus back on input
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
    }
  };

  const handleSaveFooter = async () => {
    try {
      const response = await fetch('/api/admin/email-footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: footer }),
      });
      
      if (response.ok) {
        setIsEditingFooter(false);
        alert('Footer saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save footer:', error);
      alert('Failed to save footer');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setImages(prev => [...prev, { name: data.name, url: data.url }]);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
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
    }
  };

  const handleSendEmail = async () => {
    if (!header.trim() || !body.trim()) {
      alert('Please fill in both header and body');
      return;
    }

    const recipients = emailTags.map(tag => tag.type === 'user' ? tag.id : tag.value);
    if (recipients.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: header,
          body: body,
          footer: footer,
          recipients: recipients,
        }),
      });

      if (response.ok) {
        alert('Email sent successfully!');
        setHeader('');
        setBody('');
        setEmailTags([]);
        setInputValue('');
      } else {
        const error = await response.json();
        alert(`Failed to send email: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to send email. Please try again.');
      console.error('Send email error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipientsText = () => {
    if (emailTags.length === 0) return 'No recipients selected';
    if (emailTags.length === 1) return emailTags[0].value;
    return `${emailTags.length} recipients selected`;
  };

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

    const isHorizontal = previewPosition === 'left' || previewPosition === 'right';
    
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
              className="border border-gray-300 rounded-lg px-2 py-1 flex flex-wrap items-center gap-1"
              onClick={() => emailInputRef.current?.focus()}
            >
              {emailTags.map(tag => (
                <div key={tag.id} className="email-tag">
                  <span>{tag.value}</span>
                  <button onClick={() => removeTag(tag.id)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <input
                ref={emailInputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={emailTags.length ? "" : "Type email or search users..."}
                className="flex-1 min-w-[100px] border-none focus:outline-none focus:ring-0 py-1 px-1"
              />
            </div>

            {/* User suggestions dropdown */}
            {showUserSelector && filteredUsers.length > 0 && (
              <div className="email-suggestions">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="email-suggestion-item"
                    onClick={() => handleUserSelect(user)}
                  >
                    <User size={16} className="mr-2 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{user.name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <Mail className="w-4 h-4" />
            <span>{isLoading ? 'Sending...' : 'Send Email'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
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
      </div>
    </div>
  );
}