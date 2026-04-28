import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupNameDraft, setGroupNameDraft] = useState('');

  useEffect(() => {
    api.get('/groups')
      .then(({ data }) => setGroups(data))
      .catch(() => setError('Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRenameGroup = async (groupId) => {
    if (!groupNameDraft.trim()) return;
    try {
      await api.put(`/groups/${groupId}`, { groupName: groupNameDraft.trim() });
      setGroups((prev) => prev.map((g) => g._id === groupId ? { ...g, groupName: groupNameDraft.trim() } : g));
      setEditingGroupId(null);
    } catch {
      setError('Failed to rename group');
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!confirm(`Delete "${groupName}" and all its lists?`)) return;
    try {
      await api.delete(`/groups/${groupId}`);
      setGroups((prev) => prev.filter((g) => g._id !== groupId));
    } catch {
      setError('Failed to delete group');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">🛒 Grocery List Manager</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Hi, {user?.name}</span>
          <Link
            to="/account"
            className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-lg transition"
          >
            Account
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="bg-yellow-400 hover:bg-yellow-300 text-green-900 text-sm font-medium px-3 py-1 rounded-lg transition"
            >
              Admin Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="bg-white text-green-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-green-50 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Groups</h2>
          <Link
            to="/groups/new"
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            + New Group
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && groups.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 text-lg mb-4">You haven&apos;t joined any groups yet.</p>
            <Link
              to="/groups/new"
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              Create your first group
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => {
            const isOwner = (group.createdBy?._id || group.createdBy) === user?._id;
            return (
              <div
                key={group._id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100"
              >
                {/* Name row with inline edit / action buttons */}
                <div className="flex items-center gap-2 mb-1">
                  {editingGroupId === group._id ? (
                    <>
                      <input
                        autoFocus
                        value={groupNameDraft}
                        onChange={(e) => setGroupNameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameGroup(group._id);
                          if (e.key === 'Escape') setEditingGroupId(null);
                        }}
                        className="flex-1 border border-green-400 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => handleRenameGroup(group._id)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/groups/${group._id}`}
                        className="flex-1 text-lg font-semibold text-gray-800 hover:text-green-700 truncate"
                      >
                        {group.groupName}
                      </Link>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => { setGroupNameDraft(group.groupName); setEditingGroupId(group._id); }}
                            className="text-blue-400 hover:text-blue-600 text-sm"
                            title="Rename"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group._id, group.groupName)}
                            className="text-red-400 hover:text-red-600 text-sm"
                            title="Delete group"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Created by {group.createdBy?.name}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
