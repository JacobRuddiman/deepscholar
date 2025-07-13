//admin/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Mail, X, Save, Edit } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { getAdminUsers } from '@/server/actions/admin';
import { useRouter } from 'next/navigation';
import { useDeviceDetection } from '@/app/hooks/useDeviceDetection';
import MobileUsersPage from '@/app/components/admin/MobileUsersPage';

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

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
}

function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name ?? '',
    email: user.email ?? '',
    isAdmin: user.isAdmin,
    tokenBalance: user.tokenBalance
  });

  useEffect(() => {
    setFormData({
      name: user.name ?? '',
      email: user.email ?? '',
      isAdmin: user.isAdmin,
      tokenBalance: user.tokenBalance
    });
  }, [user]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="User name"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
          />

          <Input
            label="Token Balance"
            type="number"
            value={formData.tokenBalance.toString()}
            onChange={(e) => setFormData({ ...formData, tokenBalance: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
              Admin User
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { isMobile } = useDeviceDetection();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const result = await getAdminUsers({
          page: 1,
          limit: 100,
          search: '',
          filter: 'all',
          sortBy: 'name'
        });

        if (result.success && result.data) {
          setUsers(result.data.users);
          setError(null);
        } else {
          setError(result.error ?? 'Failed to fetch users');
        }
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, []);

  // Filter and search logic
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = (user.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' ||
                           (filterBy === 'admin' && user.isAdmin) ||
                           (filterBy === 'user' && !user.isAdmin);
      
      return matchesSearch && matchesFilter;
    });

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '');
        case 'email':
          return (a.email ?? '').localeCompare(b.email ?? '');
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'briefs':
          return b.briefCount - a.briefCount;
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        case 'tokens':
          return b.tokenBalance - a.tokenBalance;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
    
    // Reset selections when filters change
    setSelectedUsers(new Set());
    setSelectAll(false);
  }, [users, searchTerm, sortBy, filterBy]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(user => user.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === paginatedUsers.length);
  };

  // Action handlers
  const handleViewUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleEmailUser = (userEmail: string) => {
    // If users are selected, send all selected emails; otherwise just this user
    if (selectedUsers.size > 0) {
      const selectedUserEmails = users
        .filter(user => selectedUsers.has(user.id) && user.email)
        .map(user => user.email!)
        .join(',');
      
      if (selectedUserEmails) {
        const params = new URLSearchParams();
        params.set('recipients', selectedUserEmails);
        router.push(`/admin/emailbuilder?${params.toString()}`);
      }
    } else {
      const params = new URLSearchParams();
      params.set('recipients', userEmail);
      router.push(`/admin/emailbuilder?${params.toString()}`);
    }
  };

  const handleSaveUser = async (updatedUser: Partial<User>) => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...updatedUser }
            : user
        ));
        console.log('User updated successfully');
      } else {
        console.error('Failed to update user');
        alert('Failed to update user. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor user accounts</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor user accounts</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const hasSelectedUsers = selectedUsers.size > 0;

  // Use mobile version on mobile devices
  if (isMobile) {
    return (
      <MobileUsersPage
        users={users}
        onEmailUser={handleEmailUser}
        onEditUser={handleViewUser}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor user accounts</p>
      </div>

      {/* Selection Info */}
      {hasSelectedUsers && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-blue-800 font-medium">
            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected - Click any blue email button to send to all selected users
          </span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'email', label: 'Sort by Email' },
              { value: 'created', label: 'Sort by Created Date' },
              { value: 'briefs', label: 'Sort by Brief Count' },
              { value: 'reviews', label: 'Sort by Review Count' },
              { value: 'tokens', label: 'Sort by Token Balance' },
            ]}
          />
          
          <Select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            options={[
              { value: 'all', label: 'All Users' },
              { value: 'admin', label: 'Admins Only' },
              { value: 'user', label: 'Regular Users' },
            ]}
          />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredUsers.length} users found
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Briefs</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => {
              const isSelected = selectedUsers.has(user.id);
              return (
                <TableRow key={user.id} className={isSelected ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.image ? (
                          <img src={user.image} alt={user.name ?? 'User'} className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {(user.name ?? 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name ?? 'Anonymous'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{user.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isAdmin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {user.lastInteractionDate ? new Date(user.lastInteractionDate).toLocaleDateString() : 'Never'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{user.briefCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{user.reviewCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{user.tokenBalance}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size={isSelected ? "md" : "sm"}
                        onClick={() => handleEmailUser(user.email ?? '')}
                        disabled={!user.email}
                        className={isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
