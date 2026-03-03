import React from 'react';

const MemberDetailsModal = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Member Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="text-base font-medium">{member.user?.firstName || member.user?.username}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Username</div>
            <div className="text-base">{member.user?.username}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-base">{member.user?.email || '—'}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Role</div>
              <div className="text-base capitalize">{member.role}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="text-base capitalize">{member.status}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Joined</div>
            <div className="text-base">{new Date(member.joinedAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Close</button>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsModal;
