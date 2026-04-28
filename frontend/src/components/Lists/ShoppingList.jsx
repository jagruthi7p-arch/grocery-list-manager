import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '../../api/axios';
import AddItem from '../Items/AddItem';
import ItemCard from '../Items/ItemCard';

const CATEGORIES = ['Vegetables', 'Dairy', 'Snacks', 'Beverages', 'Meat', 'Bakery', 'Frozen', 'Personal Care', 'Other'];

export default function ShoppingList() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const prevUnpurchasedRef = useRef(null);
  const sseRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    api.get(`/lists/${id}`)
      .then(({ data }) => setList(data))
      .catch(() => setError('Failed to load list'));

    api.get(`/items/list/${id}`)
      .then(({ data }) => setItems(data))
      .catch(() => setError('Failed to load items'))
      .finally(() => setLoading(false));

    // SSE for real-time updates
    const sse = new EventSource(`/api/items/stream/${id}?token=${token}`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (payload.type === 'init') {
        setItems(payload.items);
      } else if (payload.type === 'add') {
        setItems((prev) => [...prev, payload.item]);
      } else if (payload.type === 'update') {
        setItems((prev) => prev.map((i) => (i._id === payload.item._id ? payload.item : i)));
      } else if (payload.type === 'delete') {
        setItems((prev) => prev.filter((i) => i._id !== payload.itemId));
      } else if (payload.type === 'listStatus') {
        setList((prev) => prev ? { ...prev, completedAt: payload.completedAt } : prev);
      }
    };

    return () => sse.close();
  }, [id]);

  const handleItemAdded = (item) => {
    setItems((prev) => [...prev, item]);
    setShowAdd(false);
  };

  const handleToggle = async (itemId) => {
    try {
      const { data } = await api.patch(`/items/${itemId}/purchased`);
      setItems((prev) => prev.map((i) => (i._id === data._id ? data : i)));
    } catch {
      setError('Failed to update item');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`/items/${itemId}`);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch {
      setError('Failed to delete item');
    }
  };

  // Group items by category, including any custom ones
  // Normalise category keys so case/spacing differences don't split the same custom category
  const normKey = (cat) => (cat || 'Other').trim();
  const grouped = items.reduce((acc, item) => {
    const cat = normKey(item.category);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Known categories first (excluding 'Other'), then custom categories alphabetically, then 'Other' last
  const knownSet = new Set(CATEGORIES);
  const sortedGroupKeys = [
    ...CATEGORIES.filter((c) => c !== 'Other' && grouped[c]),
    ...Object.keys(grouped).filter((c) => !knownSet.has(c)).sort(),
    ...(grouped['Other'] ? ['Other'] : []),
  ];

  const unpurchasedCount = items.filter((i) => !i.isPurchased).length;

  // Trigger celebration when all items become purchased
  useEffect(() => {
    if (items.length === 0) { prevUnpurchasedRef.current = 0; return; }
    const prev = prevUnpurchasedRef.current;
    if (prev !== null && prev > 0 && unpurchasedCount === 0) {
      setShowDoneModal(true);
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
    }
    prevUnpurchasedRef.current = unpurchasedCount;
  }, [unpurchasedCount, items.length]);

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <Link to={list?.groupId ? `/groups/${list.groupId}` : '/dashboard'} className="text-sm hover:underline">
          ← Back
        </Link>
        <h1 className="font-bold text-lg">{list?.listName || 'Shopping List'}</h1>
        <div className="text-right">
          <span className="text-sm bg-green-600 px-3 py-1 rounded-full">
            {unpurchasedCount} remaining
          </span>
          {list?.completedAt && (
            <p className="text-xs text-green-200 mt-1">
              ✓ Completed {new Date(list.completedAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</p>}

        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">{items.length} total items</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            {showAdd ? 'Cancel' : '+ Add Item'}
          </button>
        </div>

        {showAdd && (
          <div className="mb-6">
            <AddItem listId={id} onAdded={handleItemAdded} />
          </div>
        )}

        {items.length === 0 && !showAdd && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-400 mb-4">No items yet. Add your first item!</p>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg"
            >
              + Add Item
            </button>
          </div>
        )}

        {sortedGroupKeys.map((category) => (
          <section key={category} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</h2>
            <div className="space-y-2">
              {grouped[category].map((item) => (
                <ItemCard
                  key={item._id}
                  item={item}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* All-done celebration modal */}
      {showDoneModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center animate-bounce-once">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">List Complete!</h2>
            <p className="text-gray-500 mb-6">
              Everything in <span className="font-semibold text-green-700">{list?.listName}</span> has been purchased. Great job!
            </p>
            <button
              onClick={() => setShowDoneModal(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
