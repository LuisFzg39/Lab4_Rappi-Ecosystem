import { useEffect, useState } from 'preact/hooks';
import { Link } from 'react-router-dom';
import { useAxios } from '../../providers/AxiosProvider';
import { useUser } from '../../providers/UserProvider';
import type { Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  'En entrega': 'bg-indigo-100 text-indigo-700',
  Entregado: 'bg-green-100 text-green-700',
};

export function MyDeliveriesPage() {
  const axios = useAxios();
  const { setAuth } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get<Order[]>('/api/orders/delivering')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, [axios]);

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <Link to="/available" class="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Available
          </Link>
          <h1 class="text-xl font-semibold text-gray-800">My Deliveries</h1>
        </div>
        <button onClick={() => setAuth(null)} class="text-sm text-red-500 hover:underline">
          Logout
        </button>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <p class="text-gray-400 text-center">Loading deliveries...</p>
        ) : orders.length === 0 ? (
          <p class="text-gray-400 text-center">No deliveries yet.</p>
        ) : (
          <div class="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} class="bg-white rounded-2xl shadow p-6">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-medium text-gray-800">{order.store_name}</h3>
                    <p class="text-sm text-gray-500">Customer: {order.consumer_name}</p>
                    <p class="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span class={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
                <div class="flex flex-col gap-1">
                  {order.items.map((item) => (
                    <div key={item.id} class="flex justify-between text-sm">
                      <span class="text-gray-600">{item.quantity}x {item.product_name}</span>
                      <span class="text-gray-800">${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div class="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                  {order.status === 'En entrega' && (
                    <Link
                      to={`/deliveries/${order.id}/map`}
                      class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Open Delivery Map
                    </Link>
                  )}
                  {order.status === 'Entregado' && (
                    <span class="text-sm text-green-600 font-medium">Delivered</span>
                  )}
                  <span class="font-semibold text-gray-800">
                    Total: ${order.items.reduce((s, i) => s + i.price * i.quantity, 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
