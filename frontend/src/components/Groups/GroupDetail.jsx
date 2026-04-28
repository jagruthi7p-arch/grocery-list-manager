import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState('');
  const [editingListId, setEditingListId] = useState(null);
  const [listNameDraft, setListNameDraft] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/groups/${id}`), api.get(`/lists/group/${id}`)])
      .then(([g, l]) => {
        setGroup(g.data);
        setLists(l.data);
      })
      .catch(() => setError('Failed to load group'))
      .finally(() => setLoading(false));
  }, [id]);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const inviteUrl = group?.inviteCode ? `${appUrl}/join/${group.inviteCode}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { data } = await api.post(`/groups/${id}/invite`);
      setGroup((prev) => ({ ...prev, inviteCode: data.inviteCode }));
    } catch {
      setError('Failed to regenerate invite link');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRenameGroup = async () => {
    if (!groupNameDraft.trim()) return;
    try {
      await api.put(`/groups/${id}`, { groupName: groupNameDraft.trim() });
      setGroup((prev) => ({ ...prev, groupName: groupNameDraft.trim() }));
      setEditingGroupName(false);
    } catch {
      setError('Failed to rename group');
    }
  };

  const handleRenameList = async (listId) => {
    if (!listNameDraft.trim()) return;
    try {
      await api.put(`/lists/${listId}`, { listName: listNameDraft.trim() });
      setLists((prev) => prev.map((l) => l._id === listId ? { ...l, listName: listNameDraft.trim() } : l));
      setEditingListId(null);
    } catch {
      setError('Failed to rename list');
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/lists', { listName: newListName, groupId: id });
      setLists([data, ...lists]);
      setNewListName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create list');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Delete this list?')) return;
    try {
      await api.delete(`/lists/${listId}`);
      setLists(lists.filter((l) => l._id !== listId));
    } catch {
      setError('Failed to delete list');
    }
  };

  const handleKick = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this group?`)) return;
    try {
      await api.delete(`/groups/${id}/members/${memberId}`);
      setGroup((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m._id !== memberId),
      }));
    } catch {
      setError('Failed to remove member');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Delete this group and all its lists?')) return;
    try {
      await api.delete(`/groups/${id}`);
      navigate('/dashboard');
    } catch {
      setError('Failed to delete group');
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (!group) return <div className="p-8 text-red-600">Group not found</div>;

  const isOwner = group.createdBy?._id === user?._id || group.createdBy === user?._id;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <Link to="/dashboard" className="text-sm hover:underline">← Dashboard</Link>
        {isOwner && editingGroupName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={groupNameDraft}
              onChange={(e) => setGroupNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameGroup(); if (e.key === 'Escape') setEditingGroupName(false); }}
              className="bg-green-600 text-white border border-green-400 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none w-48"
            />
            <button onClick={handleRenameGroup} className="text-xs bg-white text-green-700 px-2 py-1 rounded-lg">Save</button>
            <button onClick={() => setEditingGroupName(false)} className="text-xs text-green-200">✕</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg">{group.groupName}</h1>
            {isOwner && (
              <button
                onClick={() => { setGroupNameDraft(group.groupName); setEditingGroupName(true); }}
                className="text-green-300 hover:text-white text-xs transition"
                title="Rename group"
              >
                ✎
              </button>
            )}
          </div>
        )}
        {isOwner && (
          <button onClick={handleDeleteGroup} className="text-red-200 hover:text-red-100 text-sm">
            Delete Group
          </button>
        )}
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</p>}

        {/* Members */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Members</h2>
          <div className="space-y-2">
            {group.members.map((m) => {
              const isYou = m._id === user?._id;
              const isCreator = m._id === (group.createdBy?._id || group.createdBy);
              return (
                <div key={m._id} className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-900">{m.name}</span>
                    {isYou && <span className="text-xs text-green-600 bg-green-200 px-2 py-0.5 rounded-full">you</span>}
                    {isCreator && <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">owner</span>}
                  </div>
                  {isOwner && !isYou && !isCreator && (
                    <button
                      onClick={() => handleKick(m._id, m.name)}
                      className="text-xs text-red-400 hover:text-red-600 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Invite Link */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Invite Link</h2>
          <p className="text-sm text-gray-500 mb-4">
            Share this link with anyone — they&apos;ll join the group automatically when they open it.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-gray-50 truncate"
            />
            <button
              onClick={handleCopy}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          {isOwner && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="mt-3 text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-50"
            >
              {regenerating ? 'Regenerating…' : '↺ Regenerate link (invalidates old link)'}
            </button>
          )}
        </section>

        {/* Shopping Lists */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Shopping Lists</h2>

          <form onSubmit={handleCreateList} className="flex gap-3 mb-6">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              required
              placeholder="New list name…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              + Add List
            </button>
          </form>

          {lists.length === 0 && <p className="text-gray-400 text-sm">No lists yet. Create one above.</p>}

          <div className="space-y-3">
            {lists.map((list) => (
              <div key={list._id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:bg-gray-50">
                {editingListId === list._id ? (
                  <div className="flex items-center gap-2 flex-1 mr-3">
                    <input
                      autoFocus
                      value={listNameDraft}
                      onChange={(e) => setListNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRenameList(list._id); if (e.key === 'Escape') setEditingListId(null); }}
                      className="flex-1 border border-green-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button onClick={() => handleRenameList(list._id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Save</button>
                    <button onClick={() => setEditingListId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <Link to={`/lists/${list._id}`} className="font-medium text-gray-800 hover:text-green-700">
                      📋 {list.listName}
                      <span className="block text-xs text-gray-400 font-normal mt-0.5">
                        Created: {fmtDate(list.createdAt)}
                      </span>
                      {list.completedAt && (
                        <span className="block text-xs text-green-600 font-normal">
                          ✓ Completed: {fmtDate(list.completedAt)}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={() => { setListNameDraft(list.listName); setEditingListId(list._id); }}
                      className="text-gray-300 hover:text-green-600 text-xs transition ml-1"
                      title="Rename list"
                    >
                      ✎
                    </button>
                  </div>
                )}
                {editingListId !== list._id && (
                  <button
                    onClick={() => handleDeleteList(list._id)}
                    className="text-red-400 hover:text-red-600 text-sm ml-4 flex-shrink-0"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
