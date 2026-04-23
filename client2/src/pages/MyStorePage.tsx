import { useEffect, useState } from 'preact/hooks';
import { Link } from 'react-router-dom';
import { useAxios } from '../providers/AxiosProvider';
import { useUser } from '../providers/UserProvider';
import { useToast } from '../providers/ToastProvider';
import type { StoreWithProducts } from '../types';

export function MyStorePage() {
  const axios = useAxios();
  const { auth, setAuth } = useUser();
  const { showToast } = useToast();

  const [store, setStore] = useState<StoreWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);

  const fetchStore = () => {
    axios.get<{ id: string }>('/api/stores/mine')
      .then(({ data }) => axios.get<StoreWithProducts>(`/api/stores/${data.id}`))
      .then(({ data }) => setStore(data))
      .catch(() => showToast('Could not load store', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStore(); }, [axios]);

  const toggleOpen = async () => {
    if (!store) return;
    try {
      const { data } = await axios.patch(`/api/stores/${store.id}`, {
        is_open: !store.is_open,
      });
      setStore({ ...store, is_open: data.is_open });
      showToast(data.is_open ? 'Store opened' : 'Store closed', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error updating store', 'error');
    }
  };

  const handleAddProduct = async (e: Event) => {
    e.preventDefault();
    if (!store) return;
    setAddingProduct(true);
    try {
      const { data } = await axios.post(`/api/stores/${store.id}/products`, {
        name: productName,
        price: parseFloat(productPrice),
      });
      setStore({ ...store, products: [...store.products, data] });
      setProductName('');
      setProductPrice('');
      showToast('Product created', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error creating product', 'error');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!store) return;
    try {
      await axios.delete(`/api/stores/${store.id}/products/${productId}`);
      setStore({ ...store, products: store.products.filter((p) => p.id !== productId) });
      showToast('Product deleted', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error deleting product', 'error');
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-gray-400">Loading your store...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-red-500">Store not found.</p>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold text-gray-800">{store.name}</h1>
          <span class={`text-xs px-2 py-1 rounded-full font-medium ${store.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
            {store.is_open ? 'Open' : 'Closed'}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <button
            onClick={toggleOpen}
            class={`text-sm px-3 py-1 rounded-lg font-medium transition-colors ${store.is_open ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
          >
            {store.is_open ? 'Close Store' : 'Open Store'}
          </button>
          <Link to="/orders" class="text-sm text-emerald-600 hover:underline">Orders</Link>
          <span class="text-sm text-gray-500">{auth?.user.name}</span>
          <button onClick={() => setAuth(null)} class="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
        <section class="bg-white rounded-2xl shadow p-6">
          <h2 class="text-lg font-medium text-gray-800 mb-4">Add Product</h2>
          <form onSubmit={handleAddProduct} class="flex gap-3">
            <input
              type="text"
              placeholder="Product name"
              value={productName}
              onInput={(e) => setProductName((e.target as HTMLInputElement).value)}
              class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
            <input
              type="number"
              placeholder="Price"
              value={productPrice}
              onInput={(e) => setProductPrice((e.target as HTMLInputElement).value)}
              class="w-32 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
              min="0"
              step="0.01"
            />
            <button
              type="submit"
              disabled={addingProduct}
              class="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </form>
        </section>

        <section>
          <h2 class="text-lg font-medium text-gray-800 mb-4">Products</h2>
          {store.products.length === 0 ? (
            <p class="text-gray-400">No products yet.</p>
          ) : (
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {store.products.map((product) => (
                <div key={product.id} class="bg-white rounded-2xl shadow p-4 flex justify-between items-center">
                  <div>
                    <span class="font-medium text-gray-800">{product.name}</span>
                    <p class="text-emerald-600 font-semibold">${product.price}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    class="text-red-400 hover:text-red-600 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
