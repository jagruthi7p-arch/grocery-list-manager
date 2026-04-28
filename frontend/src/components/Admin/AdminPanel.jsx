import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const TABS = ['Stats', 'Users', 'Groups', 'Lists'];

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    const { data } = await api.get('/admin/stats');
    setStats(data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  }, []);

  const fetchGroups = useCallback(async () => {
    const { data } = await api.get('/admin/groups');
    setGroups(data);
  }, []);

  const fetchLists = useCallback(async () => {
    const { data } = await api.get('/admin/lists');
    setLists(data);
  }, []);

  useEffect(() => {
    setError('');
    setLoading(true);
    const loaders = { Stats: fetchStats, Users: fetchUsers, Groups: fetchGroups, Lists: fetchLists };
    loaders[tab]().catch((e) => setError(e.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  }, [tab, fetchStats, fetchUsers, fetchGroups, fetchLists]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their data?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((u) => u.filter((x) => x._id !== id));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, role: data.role } : x)));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Delete this group and all its lists/items?')) return;
    try {
      await api.delete(`/admin/groups/${id}`);
      setGroups((g) => g.filter((x) => x._id !== id));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleDeleteList = async (id) => {
    if (!window.confirm('Delete this list and all its items?')) return;
    try {
      await api.delete(`/admin/lists/${id}`);
      setLists((l) => l.filter((x) => x._id !== id));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <Link to="/dashboard" className="text-sm hover:underline">← Dashboard</Link>
        <h1 className="font-bold text-lg">Admin Panel</h1>
        <span className="text-sm opacity-70">{user?.email}</span>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && <p className="text-gray-500 text-center py-10">Loading…</p>}
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>}

        {/* Stats */}
        {!loading && tab === 'Stats' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Users', value: stats.users, color: 'bg-blue-50 text-blue-700' },
              { label: 'Groups', value: stats.groups, color: 'bg-purple-50 text-purple-700' },
              { label: 'Lists', value: stats.lists, color: 'bg-green-50 text-green-700' },
              { label: 'Items', value: stats.items, color: 'bg-yellow-50 text-yellow-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-2xl p-6 shadow-sm ${color} text-center`}>
                <p className="text-4xl font-bold">{value}</p>
                <p className="text-sm font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {!loading && tab === 'Users' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={u._id === user._id}
                        className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {u._id !== user._id && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-center text-gray-400 py-8">No users found</p>}
          </div>
        )}

        {/* Groups */}
        {!loading && tab === 'Groups' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Group Name</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Members</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((g) => (
                  <tr key={g._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{g.groupName}</td>
                    <td className="px-4 py-3 text-gray-500">{g.createdBy?.name}<br /><span className="text-xs text-gray-400">{g.createdBy?.email}</span></td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {g.members.map((m) => (
                          <span key={m._id} className="bg-gray-100 rounded px-1.5 py-0.5 text-xs">{m.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(g.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteGroup(g._id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {groups.length === 0 && <p className="text-center text-gray-400 py-8">No groups found</p>}
          </div>
        )}

        {/* Lists */}
        {!loading && tab === 'Lists' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">List Name</th>
                  <th className="px-4 py-3 text-left">Group</th>
                  <th className="px-4 py-3 text-left">Created By</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lists.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{l.listName}</td>
                    <td className="px-4 py-3 text-gray-500">{l.groupId?.groupName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{l.createdBy?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.completedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {l.completedAt ? 'Completed' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteList(l._id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lists.length === 0 && <p className="text-center text-gray-400 py-8">No lists found</p>}
          </div>
        )}
      </main>
    </div>
  );
}
