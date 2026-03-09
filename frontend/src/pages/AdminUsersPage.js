import React, { useEffect, useMemo, useState } from 'react';
import { TrashIcon, PencilSquareIcon, UserGroupIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = ['guest', 'player', 'captain', 'field_owner', 'admin'];
const FILTER_ROLE_OPTIONS = ['player', 'captain', 'field_owner', 'admin'];
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const formatRole = (role) => role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
const getStatusBadgeClass = (status) => {
  if (status === 'active') return 'bg-green-100 text-green-800';
  if (status === 'inactive') return 'bg-gray-100 text-gray-700';
  if (status === 'suspended') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
};
const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};
const getRoleBadgeClass = (role) => {
  if (role === 'admin') return 'bg-red-100 text-red-800';
  if (role === 'field_owner') return 'bg-blue-100 text-blue-800';
  if (role === 'captain') return 'bg-emerald-100 text-emerald-800';
  if (role === 'guest') return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-800';
};
const resolveAvatarUrl = (rawAvatar) => {
  if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
  if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
  const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'player',
    status: 'active',
    avatarUrl: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emailVerified: false,
    password: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userService.getAllUsers();
      const list = Array.isArray(response.data) ? response.data : [];
      setUsers(list);
    } catch (err) {
      setError(err?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleMatched = roleFilter === 'all' || u.role === roleFilter;
      if (!roleMatched) return false;
      if (!term) return true;
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      return (
        String(u.username || '').toLowerCase().includes(term) ||
        String(u.email || '').toLowerCase().includes(term) ||
        fullName.includes(term)
      );
    });
  }, [users, roleFilter, search]);

  const handleDelete = async (targetUser) => {
    if (Number(targetUser.id) === Number(currentUser?.id)) {
      setError('You cannot delete your own admin account.');
      return;
    }

    const confirmed = window.confirm(`Delete user "${targetUser.username}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(targetUser.id);
      setError('');
      setNotice('');
      await userService.deleteUser(targetUser.id);
      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      setNotice(`Deleted user ${targetUser.username}.`);
    } catch (err) {
      setError(err?.error || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (targetUser) => {
    setError('');
    setNotice('');
    setEditingUser(targetUser);
    setEditForm({
      username: targetUser.username || '',
      email: targetUser.email || '',
      firstName: targetUser.firstName || '',
      lastName: targetUser.lastName || '',
      phone: targetUser.phone || '',
      role: targetUser.role || 'player',
      status: targetUser.status || 'active',
      avatarUrl: targetUser.avatarUrl || '',
      dateOfBirth: targetUser.dateOfBirth || '',
      gender: targetUser.gender || '',
      address: targetUser.address || '',
      emailVerified: Boolean(targetUser.emailVerified),
      password: ''
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSavingId(editingUser.id);
      setError('');
      setNotice('');

      await userService.updateUser(editingUser.id, {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        status: editForm.status,
        avatarUrl: editForm.avatarUrl.trim(),
        dateOfBirth: editForm.dateOfBirth || null,
        gender: editForm.gender || null,
        address: editForm.address.trim(),
        emailVerified: Boolean(editForm.emailVerified),
        password: editForm.password
      });

      setUsers((prev) =>
        prev.map((item) =>
          item.id === editingUser.id
            ? {
                ...item,
                username: editForm.username.trim(),
                email: editForm.email.trim(),
                firstName: editForm.firstName.trim(),
                lastName: editForm.lastName.trim(),
                phone: editForm.phone.trim(),
                role: editForm.role,
                status: editForm.status,
                avatarUrl: editForm.avatarUrl.trim(),
                dateOfBirth: editForm.dateOfBirth || null,
                gender: editForm.gender || null,
                address: editForm.address.trim(),
                emailVerified: Boolean(editForm.emailVerified)
              }
            : item
        )
      );
      setNotice(`Updated user ${editForm.username.trim()}.`);
      closeEditModal();
    } catch (err) {
      setError(err?.error || 'Failed to update user information');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          View all users, edit their roles, delete accounts, and filter by role.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {notice}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username, email, or name"
          className="md:col-span-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
        >
          <option value="all">All Roles</option>
          {FILTER_ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {formatRole(role)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <UserGroupIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">No users found</p>
                    <p className="text-xs text-gray-500 mt-1">Try changing search text or role filter.</p>
                  </td>
                </tr>
              )}

              {filteredUsers.map((u) => {
                const isSaving = savingId === u.id;
                const isDeleting = deletingId === u.id;
                const isCurrentUser = Number(u.id) === Number(currentUser?.id);

                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveAvatarUrl(u.avatarUrl)}
                          alt={`${u.username} avatar`}
                          className="h-9 w-9 rounded-full object-cover border border-gray-200 bg-gray-100"
                          onError={(e) => {
                            const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                            if (e.currentTarget.src !== fallbackUrl) {
                              e.currentTarget.src = fallbackUrl;
                            }
                          }}
                        />
                        <div>
                          <div className="font-semibold">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username}</div>
                          <div className="text-xs text-gray-500">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="font-medium text-gray-800">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClass(u.role)}`}>
                        {formatRole(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(u.status)}`}>
                        {formatStatus(u.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="relative inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => setOpenActionMenuId((prev) => (prev === u.id ? null : u.id))}
                          disabled={isDeleting || isSaving}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          aria-label="Open actions"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>

                        {openActionMenuId === u.id && (
                          <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                openEditModal(u);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                              Edit Info
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting || isSaving || isCurrentUser}
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleDelete(u);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 inline-flex items-center gap-2 disabled:opacity-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="min-h-full flex items-start justify-center py-4 sm:py-8">
            <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
              <p className="text-xs text-gray-500 mt-1">Update full user profile data, including optional password reset.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-72px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {formatRole(role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email Verified</label>
                  <label className="inline-flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.emailVerified)}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, emailVerified: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Mark email as verified</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Not set</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Avatar URL</label>
                <input
                  type="text"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <textarea
                  rows={3}
                  value={editForm.address}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password (optional)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingId === editingUser.id}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {savingId === editingUser.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
