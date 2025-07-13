'use client';

import React, { useState } from 'react';
import { Search, Filter, Mail, Edit, MoreVertical, Users as UsersIcon, Crown, Calendar, MessageSquare, FileText, Coins } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  isAdmin: boolean;
  createdAt: string;
  lastInteractionDate?: string;
  briefCount: number;
  reviewCount: number;
  tokenBalance: number;
}

interface MobileUsersPageProps {
  users: User[];
  onEmailUser: (userEmail: string) => void;
  onEditUser: (user: User) => void;
}

export default function MobileUsersPage({ users, onEmailUser, onEditUser }: MobileUsersPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' ||
                         (filterBy === 'admin' && user.isAdmin) ||
                         (filterBy === 'user' && !user.isAdmin);
    
    return matchesSearch && matchesFilter;
  });

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleEmailSelected = () => {
    const selectedUserEmails = users
      .filter(user => selectedUsers.has(user.id) && user.email)
      .map(user => user.email!)
      .join(',');
    
    if (selectedUserEmails) {
      onEmailUser(selectedUserEmails);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <UsersIcon className="w-6 h-6" />
          <h1 className="text-xl font-bold">Users Management</h1>
        </div>
        <p className="text-purple-100 text-sm">Manage and monitor user accounts</p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>{filteredUsers.length} users</span>
          </div>
          {selectedUsers.size > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span>{selectedUsers.size} selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="flex-1 py-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="user">Regular Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleEmailSelected}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Email All</span>
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => {
          const isSelected = selectedUsers.has(user.id);
          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl p-4 border transition-all ${
                isSelected 
                  ? 'border-blue-300 bg-blue-50 shadow-md' 
                  : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              {/* User Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectUser(user.id)}
                    className="absolute top-0 left-0 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 z-10"
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl flex items-center justify-center ml-6">
                    {user.image ? (
                      <img src={user.image} alt={user.name ?? 'User'} className="w-12 h-12 rounded-xl" />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {(user.name ?? 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {user.isAdmin && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-yellow-800" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user.name ?? 'Anonymous User'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.isAdmin 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>

                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <FileText className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{user.briefCount}</p>
                  <p className="text-xs text-gray-500">Briefs</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <MessageSquare className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{user.reviewCount}</p>
                  <p className="text-xs text-gray-500">Reviews</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Coins className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{user.tokenBalance}</p>
                  <p className="text-xs text-gray-500">Tokens</p>
                </div>
              </div>

              {/* User Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <span>
                  Last seen: {user.lastInteractionDate ? new Date(user.lastInteractionDate).toLocaleDateString() : 'Never'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => onEditUser(user)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={() => onEmailUser(user.email ?? '')}
                  disabled={!user.email}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
