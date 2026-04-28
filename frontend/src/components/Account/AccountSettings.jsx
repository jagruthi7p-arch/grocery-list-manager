import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteForm, setDeleteForm] = useState({ password: '', confirm: '' });

  const [nameStatus, setNameStatus] = useState({ loading: false, error: '', success: '' });
  const [passStatus, setPassStatus] = useState({ loading: false, error: '', success: '' });
  const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: '' });

  const handleNameSave = async (e) => {
    e.preventDefault();
    setNameStatus({ loading: true, error: '', success: '' });
    try {
      const { data } = await api.put('/auth/profile', { name: nameForm.name });
      // Update stored user
      localStorage.setItem('user', JSON.stringify({ ...user, name: data.name, token: data.token }));
      localStorage.setItem('token', data.token);
      setNameStatus({ loading: false, error: '', success: 'Name updated!' });
    } catch (err) {
      setNameStatus({ loading: false, error: err.response?.data?.message || 'Failed to update name', success: '' });
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassStatus({ loading: true, error: '', success: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPassStatus({ loading: false, error: 'New passwords do not match', success: '' });
    }

    try {
      await api.put('/auth/profile', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPassStatus({ loading: false, error: '', success: 'Password updated! Please log in again.' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err) {
      setPassStatus({ loading: false, error: err.response?.data?.message || 'Failed to update password', success: '' });
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteForm.confirm !== 'DELETE') {
      return setDeleteStatus({ loading: false, error: 'Type DELETE to confirm' });
    }
    setDeleteStatus({ loading: true, error: '' });
    try {
      await api.delete('/auth/account', { data: { password: deleteForm.password } });
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteStatus({ loading: false, error: err.response?.data?.message || 'Failed to delete account' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <Link to="/dashboard" className="text-sm hover:underline">← Dashboard</Link>
        <h1 className="font-bold text-lg">Account Settings</h1>
        <span className="text-sm opacity-70">{user?.email}</span>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-10 space-y-8">

        {/* Change Name */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Display Name</h2>
          <p className="text-sm text-gray-500 mb-5">Update the name shown to your group members.</p>

          {nameStatus.error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{nameStatus.error}</p>}
          {nameStatus.success && <p className="bg-green-100 text-green-700 p-3 rounded-lg text-sm mb-4">{nameStatus.success}</p>}

          <form onSubmit={handleNameSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={nameForm.name}
                onChange={(e) => setNameForm({ name: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={nameStatus.loading || nameForm.name === user?.name}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
            >
              {nameStatus.loading ? 'Saving…' : 'Save Name'}
            </button>
          </form>
        </section>

        {/* Change Password */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Change Password</h2>
          <p className="text-sm text-gray-500 mb-5">You'll be logged out and asked to sign in again.</p>

          {passStatus.error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{passStatus.error}</p>}
          {passStatus.success && <p className="bg-green-100 text-green-700 p-3 rounded-lg text-sm mb-4">{passStatus.success}</p>}

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={passStatus.loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
            >
              {passStatus.loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Delete Account */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-red-200">
          <h2 className="text-lg font-semibold text-red-700 mb-1">Delete Account</h2>
          <p className="text-sm text-gray-500 mb-5">
            Permanently deletes your account, all groups you own, and all associated lists and items. This cannot be undone.
          </p>

          {deleteStatus.error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{deleteStatus.error}</p>}

          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={deleteForm.password}
                onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteForm.confirm}
                onChange={(e) => setDeleteForm({ ...deleteForm, confirm: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="DELETE"
              />
            </div>
            <button
              type="submit"
              disabled={deleteStatus.loading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
            >
              {deleteStatus.loading ? 'Deleting…' : 'Delete My Account'}
            </button>
          </form>
        </section>

      </main>
    </div>
  );
}
