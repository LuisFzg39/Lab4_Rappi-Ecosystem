import { useEffect, useState } from 'preact/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { useAxios } from '../../providers/AxiosProvider';
import { useUser } from '../../providers/UserProvider';
import useSupabase from '../../hooks/useSupabase';
import type { Order } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  Creado: 'bg-yellow-100 text-yellow-700',
  'En entrega': 'bg-indigo-100 text-indigo-700',
  Entregado: 'bg-green-100 text-green-700',
};

export function OrdersPage() {
  const axios = useAxios();
  const { auth, setAuth } = useUser();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');

  useEffect(() => {
    axios.get<Order[]>('/api/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch(() => { /* ignore transient errors */ })
      .finally(() => setLoading(false));
  }, [axios]);

  useEffect(() => {
    const channel = supabase.channel('orders:global');
    channel
      .on('broadcast', { event: 'order-taken' }, (message) => {
        console.log('[Realtime] order-taken received', message.payload);
        const payload = message.payload as { orderId: string };
        setOrders((prev) => prev.map((o) => (
          o.id === payload.orderId && o.status === 'Creado'
            ? { ...o, status: 'En entrega' }
            : o
        )));
      })
      .on('broadcast', { event: 'order-accepted' }, (message) => {
        console.log('[Realtime] order-accepted received', message.payload);
        const p = message.payload as Order;
        setOrders((prev) => prev.map((ord) => (ord.id === p.id ? p : ord)));
      })
      .on('broadcast', { event: 'order-delivered' }, (message) => {
        console.log('[Realtime] order-delivered received', message.payload);
        const p = message.payload as Order;
        setOrders((prev) => prev.map((ord) => (ord.id === p.id ? p : ord)));
      })
      .subscribe((status) => {
        console.log('[Realtime] orders:global (OrdersPage) status:', status);
        setLiveStatus(status === 'SUBSCRIBED' ? 'live' : status === 'CLOSED' ? 'offline' : 'connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button onClick={() => navigate('/stores')} class="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Stores
          </button>
          <h1 class="text-xl font-semibold text-gray-800">My Orders</h1>
        </div>
        <div class="flex items-center gap-3">
          <span class={`text-xs px-2 py-1 rounded-full ${liveStatus === 'live' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {liveStatus === 'live' ? 'Live' : 'Connecting...'}
          </span>
          <span class="text-sm text-gray-500">{auth?.user.name}</span>
          <button onClick={() => setAuth(null)} class="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <p class="text-gray-400 text-center">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p class="text-gray-400 text-center">No orders yet.</p>
        ) : (
          <div class="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} class="bg-white rounded-2xl shadow p-6">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-medium text-gray-800">{order.store_name}</h3>
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
                  {(order.status === 'En entrega' || order.status === 'Creado') && (
                    <Link
                      to={`/my-orders/${order.id}/tracking`}
                      class="text-sm text-purple-600 hover:underline font-medium"
                    >
                      Track Order
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
