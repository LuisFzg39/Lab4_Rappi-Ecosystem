import { useEffect, useState } from 'preact/hooks';
import { Link, useNavigate } from 'react-router-dom';
import { useAxios } from '../../providers/AxiosProvider';
import { useUser } from '../../providers/UserProvider';
import { useToast } from '../../providers/ToastProvider';
import useSupabase from '../../hooks/useSupabase';
import type { Order } from '../../types';

export function AvailableOrdersPage() {
  const axios = useAxios();
  const { auth, setAuth } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const supabase = useSupabase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');

  useEffect(() => {
    setLoading(true);
    axios.get<Order[]>('/api/orders/available')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, [axios]);

  useEffect(() => {
    const channel = supabase.channel('orders:global');

    channel
      .on('broadcast', { event: 'order-created' }, (message) => {
        const newOrder = message.payload as Order;
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
        showToast(`New order from ${newOrder.consumer_name || 'customer'}!`, 'success');
      })
      .on('broadcast', { event: 'order-taken' }, (message) => {
        const payload = message.payload as { orderId: string };
        setOrders((prev) => prev.filter((o) => o.id !== payload.orderId));
      })
      .subscribe((status) => {
        setLiveStatus(status === 'SUBSCRIBED' ? 'live' : status === 'CLOSED' ? 'offline' : 'connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    try {
      await axios.patch(`/api/orders/${orderId}/accept`);

      const globalChannel = supabase.channel('orders:global');
      globalChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await globalChannel.send({
            type: 'broadcast',
            event: 'order-taken',
            payload: { orderId },
          });
          supabase.removeChannel(globalChannel);
        }
      });

      showToast('Order accepted! Redirecting to map...', 'success');
      navigate(`/deliveries/${orderId}/map`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error accepting order', 'error');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 class="text-xl font-semibold text-gray-800">Available Orders</h1>
        <div class="flex items-center gap-4">
          <span class={`text-xs px-2 py-1 rounded-full ${liveStatus === 'live' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {liveStatus === 'live' ? 'Live' : 'Connecting...'}
          </span>
          <Link to="/my-deliveries" class="text-sm text-amber-600 hover:underline">My Deliveries</Link>
          <span class="text-sm text-gray-500">{auth?.user.name}</span>
          <button onClick={() => setAuth(null)} class="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <p class="text-gray-400 text-center">Loading available orders...</p>
        ) : orders.length === 0 ? (
          <p class="text-gray-400 text-center">No available orders right now. Waiting for new orders...</p>
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
                    {order.destination_lat && order.destination_lng && (
                      <p class="text-xs text-indigo-500 mt-1">
                        Destination: {order.destination_lat.toFixed(4)}, {order.destination_lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={accepting === order.id}
                    class="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {accepting === order.id ? 'Accepting...' : 'Accept'}
                  </button>
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
                  <Link to={`/deliveries/${order.id}`} class="text-sm text-amber-600 hover:underline">
                    View Details
                  </Link>
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
