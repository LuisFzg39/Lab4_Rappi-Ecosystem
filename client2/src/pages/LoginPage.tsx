import { useState } from 'preact/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../providers/UserProvider';
import { useAxios } from '../providers/AxiosProvider';
import { useToast } from '../providers/ToastProvider';
import type { UserWithToken } from '../types';

export function LoginPage() {
  const { setAuth } = useUser();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post<UserWithToken>('/api/auth/login', { email, password });
      if (data.user.role !== 'store') {
        showToast('This app is for store owners only', 'error');
        return;
      }
      setAuth(data);
      navigate('/my-store');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error logging in', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="bg-white p-8 rounded-2xl shadow w-full max-w-sm">
        <h1 class="text-2xl font-semibold text-gray-800 mb-2 text-center">Store App</h1>
        <p class="text-sm text-gray-400 text-center mb-6">Manage your store</p>

        <form onSubmit={handleSubmit} class="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            required
          />
          <button
            type="submit"
            disabled={loading}
            class="bg-emerald-600 text-white rounded-lg py-2 font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>

        <p class="text-sm text-gray-500 text-center mt-4">
          Don't have a store?{' '}
          <Link to="/register" class="text-emerald-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
