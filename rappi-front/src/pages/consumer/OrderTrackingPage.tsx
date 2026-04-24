import { useEffect, useState, useRef } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAxios } from '../../providers/AxiosProvider';
import { useToast } from '../../providers/ToastProvider';
import useSupabase from '../../hooks/useSupabase';
import type { Order, LatLng } from '../../types';
import 'leaflet/dist/leaflet.css';

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const STATUS_COLORS: Record<string, string> = {
  Creado: 'bg-yellow-100 text-yellow-700',
  'En entrega': 'bg-indigo-100 text-indigo-700',
  Entregado: 'bg-green-100 text-green-700',
};

function DeliveryMarker({ position }: { position: LatLng }) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
    }
  }, [position.lat, position.lng]);

  return (
    <Marker
      ref={(r: L.Marker | null) => { markerRef.current = r; }}
      position={[position.lat, position.lng]}
      icon={deliveryIcon}
    >
      <Popup>Delivery driver</Popup>
    </Marker>
  );
}

function MapFollower({ position }: { position: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo([position.lat, position.lng], { animate: true, duration: 0.5 });
    }
  }, [position?.lat, position?.lng]);
  return null;
}

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const supabase = useSupabase();

  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelStatus, setChannelStatus] = useState('connecting');
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    axios.get<Order>(`/api/orders/${id}`)
      .then(({ data }) => {
        setOrder(data);
        if (data.delivery_lat && data.delivery_lng) {
          setDeliveryPos({ lat: data.delivery_lat, lng: data.delivery_lng });
          setInitialCenter([data.delivery_lat, data.delivery_lng]);
        } else if (data.destination_lat && data.destination_lng) {
          setInitialCenter([data.destination_lat, data.destination_lng]);
        } else {
          setInitialCenter([3.4516, -76.532]);
        }
      })
      .catch(() => showToast('Error loading order', 'error'))
      .finally(() => setLoading(false));
  }, [axios, id]);

  useEffect(() => {
    if (!id) return;

    const trackingChannel = supabase.channel(`order:${id}`);

    trackingChannel
      .on('broadcast', { event: 'position-update' }, (message) => {
        const p = message.payload as { lat: number; lng: number };
        if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
          setDeliveryPos({ lat: p.lat, lng: p.lng });
        }
      })
      .subscribe((status) => {
        setChannelStatus(status === 'SUBSCRIBED' ? 'connected' : status === 'CLOSED' ? 'disconnected' : 'connecting');

        if (status === 'SUBSCRIBED') {
          setTimeout(() => {
            trackingChannel.send({
              type: 'broadcast',
              event: 'request-position',
              payload: { orderId: id, timestamp: Date.now() },
            }).then((r: unknown) => console.log('[Consumer] request-position sent:', r));
          }, 300);
        }
      });

    const globalChannel = supabase.channel('orders:global');
    globalChannel
      .on('broadcast', { event: 'order-accepted' }, (message) => {
        const p = message.payload as Order;
        if (!p || p.id !== id) return;
        setOrder(p);
        showToast('A delivery driver accepted your order!', 'success');
      })
      .on('broadcast', { event: 'order-delivered' }, (message) => {
        const p = message.payload as Order;
        if (!p || p.id !== id) return;
        setOrder(p);
        showToast('Your order has been delivered!', 'success');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(trackingChannel);
      supabase.removeChannel(globalChannel);
    };
  }, [id, supabase]);

  if (loading || !initialCenter) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-gray-400">Loading tracking...</p>
      </div>
    );
  }

  if (!order) return null;

  const destination: LatLng | null =
    order.destination_lat && order.destination_lng
      ? { lat: order.destination_lat, lng: order.destination_lng }
      : null;

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button onClick={() => navigate('/my-orders')} class="text-gray-400 hover:text-gray-600 text-sm">
            &larr; My Orders
          </button>
          <h1 class="text-xl font-semibold text-gray-800">Order Tracking</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class={`text-xs px-2 py-1 rounded-full ${channelStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {channelStatus === 'connected' ? 'Live' : 'Connecting...'}
          </span>
          <span class={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
            {order.status}
          </span>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-6">
        <div class="bg-white rounded-2xl shadow p-4 mb-4">
          <div class="flex justify-between items-center mb-3">
            <div>
              <h3 class="font-medium text-gray-800">{order.store_name}</h3>
              <p class="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
            </div>
            <span class="text-sm font-semibold text-gray-800">
              Total: ${order.items.reduce((s, i) => s + i.price * i.quantity, 0)}
            </span>
          </div>

          {order.status === 'En entrega' && !deliveryPos && (
            <p class="text-sm text-indigo-600 mb-3">Waiting for delivery driver location...</p>
          )}

          {deliveryPos && order.status === 'En entrega' && (
            <p class="text-xs text-gray-500">
              Driver at: {deliveryPos.lat.toFixed(5)}, {deliveryPos.lng.toFixed(5)}
            </p>
          )}

          {order.status === 'Entregado' && (
            <div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-3 text-center">
              <p class="text-green-700 font-semibold text-lg">Your order has been delivered!</p>
            </div>
          )}
        </div>

        <div style={{ height: '450px', borderRadius: '16px', overflow: 'hidden' }} class="shadow">
          <MapContainer
            center={initialCenter}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {destination && (
              <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
                <Popup>Delivery destination</Popup>
              </Marker>
            )}
            {deliveryPos && <DeliveryMarker position={deliveryPos} />}
            <MapFollower position={deliveryPos} />
          </MapContainer>
        </div>

        <div class="bg-white rounded-2xl shadow p-4 mt-4">
          <h3 class="font-medium text-gray-800 mb-2">Items</h3>
          {order.items.map((item) => (
            <div key={item.id} class="flex justify-between text-sm py-1">
              <span class="text-gray-600">{item.quantity}x {item.product_name}</span>
              <span class="text-gray-800">${item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
