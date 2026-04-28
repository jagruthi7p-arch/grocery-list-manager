import { useState, useEffect } from 'react';
import api from '../../api/axios';

const CATEGORIES = ['Vegetables', 'Dairy', 'Snacks', 'Beverages', 'Meat', 'Bakery', 'Frozen', 'Personal Care', 'Other'];

const fmt = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleString(undefined, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

// Determine if a category is custom (not in the default list)
const isCustomCat = (cat) => cat && !CATEGORIES.includes(cat);

export default function ItemCard({ item, onToggle, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    name: item.name,
    category: isCustomCat(item.category) ? '__custom__' : (item.category || 'Other'),
    quantity: item.quantity,
  }));
  const [customCat, setCustomCat] = useState(isCustomCat(item.category) ? item.category : '');
  const [saving, setSaving] = useState(false);

  // Re-sync form when the item prop changes (e.g. after SSE pushes an update)
  useEffect(() => {
    if (!editing) {
      setForm({
        name: item.name,
        category: isCustomCat(item.category) ? '__custom__' : (item.category || 'Other'),
        quantity: item.quantity,
      });
      setCustomCat(isCustomCat(item.category) ? item.category : '');
    }
  }, [item, editing]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const category = form.category === '__custom__' ? (customCat.trim() || 'Other') : form.category;
      await api.put(`/items/${item._id}`, { ...form, category });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
        <div className="space-y-2">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                <option value="__custom__">Custom…</option>
              </select>
              {form.category === '__custom__' && (
                <input
                  type="text"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full border border-green-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>
            <input
              type="number"
              value={form.quantity}
              min={1}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3 ${item.isPurchased ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
      <input
        type="checkbox"
        checked={item.isPurchased}
        onChange={() => onToggle(item._id)}
        className="w-5 h-5 accent-green-600 cursor-pointer flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-800 ${item.isPurchased ? 'line-through text-gray-400' : ''}`}>
          {item.name}
        </p>
        <p className="text-xs text-gray-400">
          Qty: {item.quantity} · {item.category} · added by {item.addedBy?.name || 'Unknown'}
        </p>
        <p className="text-xs text-gray-300 mt-0.5">
          Added: {fmt(item.createdAt)}
          {item.isPurchased && item.purchasedAt && (
            <span className="text-green-500">
              {' '}· Purchased: {fmt(item.purchasedAt)}
              {item.purchasedBy?.name && ` by ${item.purchasedBy.name}`}
            </span>
          )}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-blue-400 hover:text-blue-600 text-sm"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item._id)}
          className="text-red-400 hover:text-red-600 text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
