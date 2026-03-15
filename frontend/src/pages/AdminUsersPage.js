import React, { useEffect, useMemo, useState } from 'react';
import userService from '../services/userService';
import { useDialog } from '../components/ui';

const ROLES = ['player', 'captain', 'field_owner', 'admin'];
const STATUSES = ['active', 'inactive', 'suspended'];

const statusBadgeClass = (status) => {
  if (status === 'active') return 'bg-green-100 text-green-700';
  if (status === 'suspended') return 'bg-red-100 text-red-700';
  return 'bg-gray-200 text-gray-700';
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { confirm } = useDialog();

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

  const handleRoleChange = async (userId, role) => {
    try {
      setSavingUserId(userId);
      await userService.updateUser(userId, { role });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
      setFlash({ type: 'success', message: 'User role updated.' });
    } catch (error) {
      setFlash({ type: 'error', message: error.error || 'Failed to update user role.' });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleStatusChange = async (userId, status) => {
    try {
      setSavingUserId(userId);
      await userService.updateUser(userId, { status });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status } : user)));
      setFlash({ type: 'success', message: 'User status updated.' });
    } catch (error) {
      setFlash({ type: 'error', message: error.error || 'Failed to update user status.' });
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDelete = async (userId, username) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-1 text-sm text-gray-600">Update roles, account status, and remove users.</p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {flash && (
        <div className={`rounded-md border px-4 py-3 text-sm ${flash.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {flash.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Admins</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{stats.admins}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Suspended</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{stats.suspended}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
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

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">User</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading users...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No users found with current filters.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSaving = savingUserId === user.id;
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
                const status = user.status || 'active';

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{fullName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={isSaving}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={status}
                          disabled={isSaving}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          className="rounded-md border border-gray-300 px-2 py-1"
                        >
                          {STATUSES.map((item) => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleDelete(user.id, user.username)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {isSaving ? 'Working...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
