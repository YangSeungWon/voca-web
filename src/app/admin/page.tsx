'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, MessageSquare, BarChart3, Trash2, Search, LogOut, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  createdAt: string;
  wordCount: number;
}

interface Feedback {
  id: string;
  userId: string | null;
  email: string | null;
  type: string;
  message: string;
  createdAt: string;
  ip: string | null;
}

interface Stats {
  users: { total: number; today: number; thisWeek: number };
  words: { total: number; today: number };
  feedback: { total: number; byType: Record<string, number> };
}

type Tab = 'stats' | 'users' | 'feedback';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbacksTotal, setFeedbacksTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Check existing session
  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const { token: newToken } = await res.json();
        setToken(newToken);
        sessionStorage.setItem('adminToken', newToken);
        setIsLoggedIn(true);
        setPassword('');
      } else {
        setLoginError('Invalid password');
      }
    } catch {
      setLoginError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('adminToken');
  };

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUsersTotal(data.total);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery]);

  const fetchFeedbacks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feedback?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks);
        setFeedbacksTotal(data.total);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn && token) {
      if (activeTab === 'stats') fetchStats();
      else if (activeTab === 'users') fetchUsers();
      else if (activeTab === 'feedback') fetchFeedbacks();
    }
  }, [isLoggedIn, token, activeTab, fetchStats, fetchUsers, fetchFeedbacks]);

  const handleDeleteUser = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setFeedbacks(feedbacks.filter(f => f.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8">
            <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              {loginError && (
                <p className="text-red-400 text-sm mb-4">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'stats' as Tab, label: 'Statistics', icon: BarChart3 },
              { id: 'users' as Tab, label: 'Users', icon: Users },
              { id: 'feedback' as Tab, label: 'Feedback', icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Total Users</div>
              <div className="text-3xl font-bold">{stats.users.total}</div>
              <div className="text-green-400 text-sm mt-2">+{stats.users.today} today</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Total Words</div>
              <div className="text-3xl font-bold">{stats.words.total}</div>
              <div className="text-green-400 text-sm mt-2">+{stats.words.today} today</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">New Users (7d)</div>
              <div className="text-3xl font-bold">{stats.users.thisWeek}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-1">Total Feedback</div>
              <div className="text-3xl font-bold">{stats.feedback.total}</div>
              <div className="text-sm mt-2 text-gray-400">
                {Object.entries(stats.feedback.byType).map(([type, count]) => (
                  <span key={type} className="mr-3">{type}: {count}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Search */}
            <div className="mb-6 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  placeholder="Search by email..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
                {usersTotal} users total
              </div>
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Words</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.email}</div>
                        <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                      </td>
                      <td className="px-4 py-3">{user.wordCount}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        {deleteConfirm === user.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
                {feedbacksTotal} feedbacks total
              </div>
              <div className="divide-y divide-gray-700">
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="p-4 hover:bg-gray-750">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            fb.type === 'bug' ? 'bg-red-900/50 text-red-400' :
                            fb.type === 'suggestion' ? 'bg-blue-900/50 text-blue-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {fb.type}
                          </span>
                          <span className="text-gray-500 text-sm">{formatDate(fb.createdAt)}</span>
                          {fb.email && (
                            <span className="text-gray-400 text-sm">{fb.email}</span>
                          )}
                        </div>
                        <p className="text-gray-200 whitespace-pre-wrap">{fb.message}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          {fb.userId ? `User: ${fb.userId}` : 'Anonymous'} | IP: {fb.ip || 'unknown'}
                        </div>
                      </div>
                      <div>
                        {deleteConfirm === fb.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteFeedback(fb.id)}
                              className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(fb.id)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {feedbacks.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No feedback yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        )}
      </main>
    </div>
  );
}
