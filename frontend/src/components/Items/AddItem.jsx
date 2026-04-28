import { useState } from 'react';
import api from '../../api/axios';

const CATEGORIES = ['Vegetables', 'Dairy', 'Snacks', 'Beverages', 'Meat', 'Bakery', 'Frozen', 'Personal Care', 'Other'];

export default function AddItem({ listId, onAdded }) {
  const [form, setForm] = useState({ name: '', category: 'Other', quantity: 1 });
  const [customCat, setCustomCat] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const val = e.target.name === 'quantity' ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const category = form.category === '__custom__'
      ? (customCat.trim() || 'Other')
      : form.category;
    setLoading(true);
    try {
      const { data } = await api.post('/items', { ...form, category, listId });
      onAdded(data);
      setForm({ name: '', category: 'Other', quantity: 1 });
      setCustomCat('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
      <h3 className="font-semibold text-gray-700 mb-4">Add New Item</h3>
      {error && <p className="bg-red-100 text-red-700 p-2 rounded text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Item name (e.g. Milk)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
            {form.category === '__custom__' && (
              <input
                type="text"
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                placeholder="Enter category name"
                required
                className="w-full border border-green-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
          </div>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            min={1}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Adding…' : 'Add to List'}
        </button>
      </form>
    </div>
  );
}
