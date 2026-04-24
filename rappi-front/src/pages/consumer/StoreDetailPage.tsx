import { useEffect, useState } from 'preact/hooks';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAxios } from '../../providers/AxiosProvider';
import { useToast } from '../../providers/ToastProvider';
import { useCart } from '../../providers/CartProvider';
import type { Product, StoreWithProducts } from '../../types';

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addItem, items } = useCart();

  const [store, setStore] = useState<StoreWithProducts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<StoreWithProducts>(`/api/stores/${id}`)
      .then(({ data }) => setStore(data))
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Error loading store', 'error'))
      .finally(() => setLoading(false));
  }, [axios, id]);

  const handleAddToCart = (product: Product) => {
    if (!store) return;
    addItem(product, store.id, store.name);
    showToast(`${product.name} added to cart`, 'success');
  };

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button onClick={() => navigate(-1)} class="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Back
          </button>
          <h1 class="text-xl font-semibold text-gray-800">{store.name}</h1>
          <span class={`text-xs px-2 py-1 rounded-full font-medium ${store.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
            {store.is_open ? 'Open' : 'Closed'}
          </span>
        </div>
        <Link to="/cart" class="relative text-sm text-purple-600 hover:underline">
          Cart
          {items.length > 0 && (
            <span class="absolute -top-2 -right-4 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Link>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-8">
        <h2 class="text-lg font-medium text-gray-800 mb-4">Products</h2>
        {store.products.length === 0 ? (
          <p class="text-gray-400">No products in this store.</p>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {store.products.map((product) => (
              <div key={product.id} class="bg-white rounded-2xl shadow p-4 flex justify-between items-center">
                <div>
                  <span class="font-medium text-gray-800">{product.name}</span>
                  <p class="text-purple-600 font-semibold">${product.price}</p>
                </div>
                {store.is_open && (
                  <button
                    onClick={() => handleAddToCart(product)}
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
