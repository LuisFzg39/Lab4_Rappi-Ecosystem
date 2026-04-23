import { useState } from 'preact/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../providers/UserProvider';
import { useAxios } from '../providers/AxiosProvider';
import { useToast } from '../providers/ToastProvider';
import type { UserRole, UserWithToken } from '../types';

export function RegisterPage() {
  const { setAuth } = useUser();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [store_name, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post<UserWithToken>('/api/auth/register', {
        name,
        email,
        password,
        role,
        ...(role === 'store' && { store_name }),
      });
      setAuth(data);
      navigate('/stores');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error registering', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="bg-white p-8 rounded-2xl shadow w-full max-w-sm">
        <h1 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Create Account</h1>

        <form onSubmit={handleSubmit} class="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole((e.target as HTMLSelectElement).value as UserRole)}
            class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="consumer">Consumer</option>
            <option value="store">Store</option>
            <option value="delivery">Delivery</option>
          </select>

          {role === 'store' && (
            <input
              type="text"
              placeholder="Store name"
              value={store_name}
              onInput={(e) => setStoreName((e.target as HTMLInputElement).value)}
              class="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            class="bg-purple-600 text-white rounded-lg py-2 font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Register'}
          </button>
        </form>

        <p class="text-sm text-gray-500 text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" class="text-purple-600 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
