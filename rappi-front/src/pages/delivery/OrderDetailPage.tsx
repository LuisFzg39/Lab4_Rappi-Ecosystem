import { useEffect, useState } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { useAxios } from '../../providers/AxiosProvider';
import { useToast } from '../../providers/ToastProvider';
import type { Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  Creado: 'bg-yellow-100 text-yellow-700',
  'En entrega': 'bg-indigo-100 text-indigo-700',
  Entregado: 'bg-green-100 text-green-700',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    axios.get<Order>(`/api/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch((err: unknown) => showToast(err instanceof Error ? err.message : 'Error loading order', 'error'))
      .finally(() => setLoading(false));
  }, [axios, id]);

  const handleAccept = async () => {
    if (!order) return;
    setAccepting(true);
    try {
      const { data } = await axios.patch<Order>(`/api/orders/${order.id}/accept`);
      setOrder(data);
      showToast('Order accepted!', 'success');
      navigate(`/deliveries/${order.id}/map`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error accepting order', 'error');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-gray-400">Loading order details...</p>
      </div>
    );
  }

  if (!order) return null;

  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button onClick={() => navigate(-1)} class="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Back
          </button>
          <h1 class="text-xl font-semibold text-gray-800">Order Details</h1>
        </div>
        <span class={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {order.status}
        </span>
      </header>

      <main class="max-w-2xl mx-auto px-6 py-8">
        <div class="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
          <div>
            <p class="text-sm text-gray-500">Store</p>
            <p class="font-medium text-gray-800">{order.store_name}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Customer</p>
            <p class="font-medium text-gray-800">{order.consumer_name}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Date</p>
            <p class="font-medium text-gray-800">{new Date(order.created_at).toLocaleString()}</p>
          </div>

          <div class="border-t border-gray-100 pt-4">
            <h3 class="font-medium text-gray-800 mb-2">Items</h3>
            {order.items.map((item) => (
              <div key={item.id} class="flex justify-between text-sm py-1">
                <span class="text-gray-600">{item.quantity}x {item.product_name}</span>
                <span class="text-gray-800">${item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div class="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span class="text-lg font-semibold text-gray-800">Total: ${total}</span>
            {order.status === 'Creado' && !order.delivery_id && (
              <button
                onClick={handleAccept}
                disabled={accepting}
                class="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {accepting ? 'Accepting...' : 'Accept Order'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
