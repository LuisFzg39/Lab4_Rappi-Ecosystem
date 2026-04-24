import { useEffect, useState } from 'preact/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { useAxios } from '../../providers/AxiosProvider';
import { useUser } from '../../providers/UserProvider';
import { useCart } from '../../providers/CartProvider';
import type { Store } from '../../types';

export function StoresPage() {
  const axios = useAxios();
  const { auth, setAuth } = useUser();
  const { items } = useCart();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<Store[]>('/api/stores')
      .then(({ data }) => setStores(data))
      .finally(() => setLoading(false));
  }, [axios]);

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 class="text-xl font-semibold text-gray-800">Stores</h1>
        <div class="flex items-center gap-4">
          <Link to="/my-orders" class="text-sm text-purple-600 hover:underline">My Orders</Link>
          <Link to="/cart" class="relative text-sm text-purple-600 hover:underline">
            Cart
            {items.length > 0 && (
              <span class="absolute -top-2 -right-4 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
          <span class="text-sm text-gray-500">{auth?.user.name}</span>
          <button onClick={() => setAuth(null)} class="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <p class="text-gray-400 text-center">Loading stores...</p>
        ) : stores.length === 0 ? (
          <p class="text-gray-400 text-center">No stores available.</p>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stores.map((store) => (
              <div
                key={store.id}
                onClick={() => navigate(`/stores/${store.id}`)}
                class="bg-white rounded-2xl shadow p-5 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow"
              >
                <h2 class="text-lg font-medium text-gray-800">{store.name}</h2>
                <span class={`text-xs px-2 py-1 rounded-full font-medium ${store.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                  {store.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
