import { useState } from 'preact/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../providers/UserProvider';
import { useAxios } from '../providers/AxiosProvider';
import { useToast } from '../providers/ToastProvider';
import { getHomeRoute } from '../utils/routes';
import type { UserRole, UserWithToken } from '../types';

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'consumer', label: 'Consumer', description: 'Browse stores and place orders' },
  { value: 'store', label: 'Store', description: 'Manage a store and its products' },
  { value: 'delivery', label: 'Delivery', description: 'Pick up and deliver orders' },
];

export function RegisterPage() {
  const { setAuth } = useUser();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name, email, password, role };
      if (role === 'store') {
        payload.store_name = storeName;
      }

      const { data } = await axios.post<UserWithToken>('/api/auth/register', payload);
      setAuth(data);
      navigate(getHomeRoute(data.user.role));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error registering', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div class="bg-white p-8 rounded-2xl shadow w-full max-w-md">
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

          <div>
            <label class="text-sm font-medium text-gray-700 mb-2 block">Account Type</label>
            <div class="flex flex-col gap-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  class={`text-left px-4 py-3 rounded-lg border transition-colors ${
                    role === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p class="font-medium text-gray-800">{option.label}</p>
                  <p class="text-xs text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {role === 'store' && (
            <input
              type="text"
              placeholder="Store name"
              value={storeName}
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
