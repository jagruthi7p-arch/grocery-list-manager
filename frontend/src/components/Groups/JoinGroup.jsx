import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('joining'); // 'joining' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    if (!user) {
      // Not logged in — redirect to login and return here after
      navigate(`/login?redirect=/join/${inviteCode}`, { replace: true });
      return;
    }

    api.post(`/groups/join/${inviteCode}`)
      .then(({ data }) => {
        setGroupId(data.group._id);
        setMessage(data.message === 'Already a member'
          ? `You're already a member of "${data.group.groupName}".`
          : `You've joined "${data.group.groupName}"!`);
        setStatus('success');
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || 'Invalid or expired invite link.');
        setStatus('error');
      });
  }, [inviteCode, user, navigate]);

  if (status === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-600 text-lg">Joining group…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invite Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <Link
            to="/dashboard"
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome!</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Open Group
        </button>
      </div>
    </div>
  );
}
