/**
 * User Selector Component
 * 
 * Allows users to search and select user profiles for export
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, User, Mail, FileText, Calendar } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: {
    briefs: number;
    reviews: number;
  };
}

interface UserSelectorProps {
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  currentUserId?: string;
}

export default function UserSelector({ selectedUserId, onSelectUser, currentUserId }: UserSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?limit=50');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filteredUsers = users;
    
    // Filter by search query
    if (searchQuery) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filteredUsers;
  };

  const filteredUsers = getFilteredUsers();
  const currentUser = users.find(user => user.id === currentUserId);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* My Profile Button */}
      {currentUser && (
        <div className="mb-4">
          <button
            onClick={() => onSelectUser(currentUser.id)}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              selectedUserId === currentUser.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Export My Profile</h3>
                <p className="text-sm text-gray-600">
                  {currentUser.name} • {currentUser._count.briefs} briefs
                </p>
              </div>
              {selectedUserId === currentUser.id && (
                <div className="ml-auto">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">Or select another user</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
      </div>

      {/* User list */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                selectedUserId === user.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-medium text-gray-900 truncate">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{user._count.briefs} briefs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedUserId === user.id && (
                  <div className="ml-3 flex-shrink-0">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">
              {searchQuery 
                ? `No users found matching "${searchQuery}"`
                : 'No users available'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
