import React, { useEffect, useMemo, useRef, useState } from 'react';
import userService from '../services/userService';
import { AnimatedStatValue, ConfirmationModal, ImagePreviewModal, useDialog } from '../components/ui';
import { EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const ROLES = ['player', 'captain', 'field_owner', 'admin'];
const STATUSES = ['active', 'inactive', 'suspended'];
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE_PATH = '/uploads/profile/default_profile.jpg';

const statusBadgeClass = (status) => {
  if (status === 'active') return 'bg-green-100 text-green-700';
  if (status === 'suspended') return 'bg-red-100 text-red-700';
  return 'bg-gray-200 text-gray-700';
};

const roleBadgeClass = (role) => {
  if (role === 'admin') return 'bg-blue-100 text-blue-700';
  if (role === 'field_owner') return 'bg-amber-100 text-amber-700';
  if (role === 'captain') return 'bg-violet-100 text-violet-700';
  return 'bg-slate-100 text-slate-700';
};

const formatRoleLabel = (role) =>
  String(role || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const resolveAvatarUrl = (user) => {
  const rawAvatar = user?.avatarUrl || user?.avatar_url;
  if (!rawAvatar) return `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
  if (/^https?:\/\//i.test(rawAvatar)) return rawAvatar;
  const normalizedPath = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'player', status: 'active' });
  const { confirm } = useDialog();
  const actionMenuRef = useRef(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setFlash({ type: 'error', message: error.error || 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!openMenuUserId) return undefined;

    const handlePointerDown = (event) => {
      if (!actionMenuRef.current?.contains(event.target)) {
        setOpenMenuUserId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [openMenuUserId]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => (user.status || 'active') === 'active').length,
      admins: users.filter((user) => user.role === 'admin').length,
      suspended: users.filter((user) => user.status === 'suspended').length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
      const matchText =
        !keyword ||
        String(user.username || '').toLowerCase().includes(keyword) ||
        String(user.email || '').toLowerCase().includes(keyword) ||
        fullName.includes(keyword);
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter;
      return matchText && matchRole && matchStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const handleDelete = async (userId, username) => {
    setOpenMenuUserId(null);
    const confirmed = await confirm(`Delete user @${username}? This cannot be undone.`, { title: 'Delete User' });
    if (!confirmed) return;

    try {
      setSavingUserId(userId);
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setFlash({ type: 'success', message: 'User deleted successfully.' });
    } catch (error) {
      setFlash({ type: 'error', message: error.error || 'Failed to delete user.' });
    } finally {
      setSavingUserId(null);
    }
  };

  const openEditModal = (user) => {
    setOpenMenuUserId(null);
    setEditUser(user);
    setEditForm({
      role: user.role || 'player',
      status: user.status || 'active'
    });
  };

  const closeEditModal = () => {
    if (savingUserId) return;
    setEditUser(null);
  };

  const openViewModal = (user) => {
    if (openMenuUserId === user.id) return;
    setViewUser(user);
  };

  const closeViewModal = () => {
    setViewUser(null);
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editUser?.id) return;

    try {
      setSavingUserId(editUser.id);
      const response = await userService.updateUser(editUser.id, editForm);
      const updatedUser = response.data || {};
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editUser.id
            ? {
                ...user,
                role: updatedUser.role || editForm.role,
                status: updatedUser.status || editForm.status
              }
            : user
        )
      );
      setFlash({ type: 'success', message: 'User updated successfully.' });
      setEditUser(null);
    } catch (error) {
      setFlash({ type: 'error', message: error.error || 'Failed to update user.' });
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50/70 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 ring-1 ring-indigo-100">
            Admin Users
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">Manage Users</h1>
          <p className="mt-2 text-sm text-slate-600">Update roles, account status, and remove users with a cleaner overview.</p>
        </div>
        </div>
      </div>

      {flash && (
        <div className={`rounded-md border px-4 py-3 text-sm ${flash.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {flash.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
          <AnimatedStatValue value={stats.total} className="mt-1 text-2xl font-bold text-gray-900" />
        </div>
        <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Active</p>
          <AnimatedStatValue value={stats.active} className="mt-1 text-2xl font-bold text-green-700" />
        </div>
        <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100/70 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Admins</p>
          <AnimatedStatValue value={stats.admins} className="mt-1 text-2xl font-bold text-blue-700" />
        </div>
        <div className="rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-red-100/70 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Suspended</p>
          <AnimatedStatValue value={stats.suspended} className="mt-1 text-2xl font-bold text-red-700" />
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username, email, or name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full table-fixed divide-y divide-gray-200 text-sm">
          <colgroup>
            <col className="w-[340px]" />
            <col className="w-[380px]" />
            <col className="w-[170px]" />
            <col className="w-[150px]" />
            <col className="w-[110px]" />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3.5 text-left text-[13px] font-semibold tracking-wide text-gray-700">User</th>
              <th className="px-5 py-3.5 text-left text-[13px] font-semibold tracking-wide text-gray-700">Email</th>
              <th className="px-5 py-3.5 text-center text-[13px] font-semibold tracking-wide text-gray-700">Role</th>
              <th className="px-5 py-3.5 text-center text-[13px] font-semibold tracking-wide text-gray-700">Status</th>
              <th className="px-5 py-3.5 text-center text-[13px] font-semibold tracking-wide text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-500">Loading users...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-500">No users found with current filters.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSaving = savingUserId === user.id;
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                const status = user.status || 'active';

                return (
                  <tr
                    key={user.id}
                    className="group cursor-pointer align-middle transition-colors hover:bg-gray-50/90"
                    onClick={() => openViewModal(user)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openViewModal(user);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={resolveAvatarUrl(user)}
                          alt={`${fullName} avatar`}
                          className="h-9 w-9 rounded-full border border-gray-200 bg-gray-100 object-cover"
                          onError={(event) => {
                            const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                            if (event.currentTarget.src !== fallbackUrl) {
                              event.currentTarget.src = fallbackUrl;
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold leading-5 text-gray-900">{fullName}</p>
                          <p className="truncate text-[13px] text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      <p className="truncate text-sm text-gray-700">{user.email}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${roleBadgeClass(user.role)}`}>
                        {formatRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadgeClass(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div
                        className="relative inline-flex items-center justify-center"
                        ref={openMenuUserId === user.id ? actionMenuRef : null}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label={`Open actions for ${fullName}`}
                          aria-expanded={openMenuUserId === user.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuUserId((current) => (current === user.id ? null : user.id));
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60"
                          disabled={isSaving}
                        >
                          <EllipsisVerticalIcon className="h-4.5 w-4.5" />
                        </button>

                        {openMenuUserId === user.id && (
                          <div className="absolute right-0 top-12 z-20 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/70">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditModal(user);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <PencilSquareIcon className="h-4 w-4 text-green-600" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(user.id, user.username);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={Boolean(editUser)}
        title={editUser ? (`${editUser.firstName || ''} ${editUser.lastName || ''}`.trim() || editUser.username) : 'Edit User'}
        message={editUser ? `Update @${editUser.username}'s role and account status.` : ''}
        badgeLabel="Edit User"
        confirmLabel={editUser && savingUserId === editUser.id ? 'Saving...' : 'Save Changes'}
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleSaveEdit}
        onClose={closeEditModal}
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700">Role</span>
            <select
              name="role"
              value={editForm.role}
              onChange={handleEditFormChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700">Status</span>
            <select
              name="status"
              value={editForm.status}
              onChange={handleEditFormChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatRoleLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(viewUser)}
        title={viewUser ? (`${viewUser.firstName || ''} ${viewUser.lastName || ''}`.trim() || viewUser.username) : 'User Details'}
        message={viewUser ? `View account information for @${viewUser.username}.` : ''}
        badgeLabel="User Details"
        confirmLabel="Close"
        showCancel={false}
        variant="default"
        onConfirm={closeViewModal}
        onClose={closeViewModal}
      >
        {viewUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <img
                src={resolveAvatarUrl(viewUser)}
                alt={`${viewUser.username} avatar`}
                className="h-16 w-16 cursor-zoom-in rounded-full border border-gray-200 bg-white object-cover transition hover:scale-[1.03]"
                onClick={() =>
                  setPreviewImage({
                    url: resolveAvatarUrl(viewUser),
                    title: `${`${viewUser.firstName || ''} ${viewUser.lastName || ''}`.trim() || viewUser.username} image`
                  })
                }
                onError={(event) => {
                  const fallbackUrl = `${API_ORIGIN}${DEFAULT_PROFILE_PATH}`;
                  if (event.currentTarget.src !== fallbackUrl) {
                    event.currentTarget.src = fallbackUrl;
                  }
                }}
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-gray-900">
                  {`${viewUser.firstName || ''} ${viewUser.lastName || ''}`.trim() || viewUser.username}
                </p>
                <p className="truncate text-sm text-gray-500">@{viewUser.username}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
                <p className="mt-2 break-all text-sm text-gray-700">{viewUser.email || 'No email'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Role</p>
                <p className="mt-2 text-sm font-semibold text-gray-700">{formatRoleLabel(viewUser.role)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</p>
                <p className="mt-2 text-sm font-semibold text-gray-700">{formatRoleLabel(viewUser.status || 'active')}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</p>
                <p className="mt-2 text-sm text-gray-700">{viewUser.phone || 'No phone number'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date of Birth</p>
                <p className="mt-2 text-sm text-gray-700">{viewUser.dateOfBirth || viewUser.date_of_birth || 'Not set'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Address</p>
                <p className="mt-2 text-sm text-gray-700">{viewUser.address || 'No address'}</p>
              </div>
            </div>
          </div>
        )}
      </ConfirmationModal>

      <ImagePreviewModal
        open={Boolean(previewImage)}
        imageUrl={previewImage?.url}
        title={previewImage?.title || 'User image'}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default AdminUsersPage;
