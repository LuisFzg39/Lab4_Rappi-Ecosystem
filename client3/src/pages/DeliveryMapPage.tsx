import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAxios } from '../providers/AxiosProvider';
import { useToast } from '../providers/ToastProvider';
import useSupabase from '../hooks/useSupabase';
import type { Order, LatLng } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import 'leaflet/dist/leaflet.css';

const STEP = 0.0001;

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


export function DeliveryMapPage() {
  const { id } = useParams<{ id: string }>();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const supabase = useSupabase();

  const [order, setOrder] = useState<Order | null>(null);
  const [position, setPosition] = useState<LatLng>({ lat: 3.4516, lng: -76.532 });
  const [loading, setLoading] = useState(true);
  const [delivered, setDelivered] = useState(false);
  const [channelReady, setChannelReady] = useState(false);

  const positionRef = useRef<LatLng>(position);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const globalChannelRef = useRef<RealtimeChannel | null>(null);
  const deliveredRef = useRef(false);
  const acceptedBroadcastSent = useRef(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    deliveredRef.current = delivered;
  }, [delivered]);

  useEffect(() => {
    axios.get<Order>(`/api/orders/${id}`)
      .then(({ data }) => {
        setOrder(data);
        if (data.delivery_lat && data.delivery_lng) {
          const p = { lat: data.delivery_lat, lng: data.delivery_lng };
          setPosition(p);
          positionRef.current = p;
        } else if (data.destination_lat && data.destination_lng) {
          const startPos = {
            lat: data.destination_lat + 0.002,
            lng: data.destination_lng + 0.002,
          };
          setPosition(startPos);
          positionRef.current = startPos;
        }
        if (data.status === 'Entregado') {
          setDelivered(true);
          deliveredRef.current = true;
        }
      })
      .catch(() => showToast('Error loading order', 'error'))
      .finally(() => setLoading(false));
  }, [axios, id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase.channel(`order:${id}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'request-position' }, (message) => {
        const pos = positionRef.current;
        console.log('[Delivery] Received request-position from consumer:', message.payload, 'responding with', pos);
        channel.send({
          type: 'broadcast',
          event: 'position-update',
          payload: { lat: pos.lat, lng: pos.lng },
        }).then((r) => console.log('[Delivery] Response position-update sent:', r));
      })
      .subscribe((status) => {
        console.log('[Delivery] Channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setChannelReady(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setChannelReady(false);
    };
  }, [id, supabase]);

  useEffect(() => {
    const channel = supabase.channel('orders:global');
    globalChannelRef.current = channel;
    channel.subscribe((status) => {
      console.log('[Delivery] orders:global subscription:', status);
    });

    return () => {
      supabase.removeChannel(channel);
      globalChannelRef.current = null;
    };
  }, [supabase]);

  useEffect(() => {
    if (!order || acceptedBroadcastSent.current) return;
    if (order.status !== 'En entrega') return;
    if (!globalChannelRef.current) return;

    acceptedBroadcastSent.current = true;
    globalChannelRef.current.send({
      type: 'broadcast',
      event: 'order-accepted',
      payload: order,
    }).then((r) => console.log('[Delivery] order-accepted broadcast (global):', r));
  }, [order]);

  const sendPositionUpdate = useCallback(async (pos: LatLng) => {
    try {
      const ch = channelRef.current;
      if (ch) {
        const sendResult = await ch.send({
          type: 'broadcast',
          event: 'position-update',
          payload: { lat: pos.lat, lng: pos.lng },
        });
        console.log('[Delivery] Broadcast sent, result:', sendResult, 'pos:', pos.lat.toFixed(5), pos.lng.toFixed(5));
      }

      const { data } = await axios.patch<Order>(`/api/orders/${id}/position`, {
        lat: pos.lat,
        lng: pos.lng,
      });

      if (data.status === 'Entregado') {
        setDelivered(true);
        deliveredRef.current = true;
        setOrder(data);
        showToast('Order delivered! You arrived at the destination.', 'success');

        if (globalChannelRef.current) {
          await globalChannelRef.current.send({
            type: 'broadcast',
            event: 'order-delivered',
            payload: data,
          });
          console.log('[Delivery] order-delivered broadcast sent (global)');
        }
      }
    } catch (err) {
      console.error('[Delivery] Error sending position:', err);
    }
  }, [axios, id, showToast]);

  useEffect(() => {
    if (!order || order.status !== 'En entrega') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (deliveredRef.current) return;

      let { lat, lng } = positionRef.current;

      switch (e.key) {
        case 'ArrowUp':    lat += STEP; break;
        case 'ArrowDown':  lat -= STEP; break;
        case 'ArrowLeft':  lng -= STEP; break;
        case 'ArrowRight': lng += STEP; break;
        default: return;
      }

      e.preventDefault();

      const newPos = { lat, lng };
      positionRef.current = newPos;
      setPosition(newPos);

      if (!throttleRef.current) {
        throttleRef.current = setTimeout(() => {
          sendPositionUpdate(positionRef.current);
          throttleRef.current = null;
        }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [order, sendPositionUpdate]);

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-gray-400">Loading delivery map...</p>
      </div>
    );
  }

  if (!order) return null;

  const destination: LatLng | null =
    order.destination_lat && order.destination_lng
      ? { lat: order.destination_lat, lng: order.destination_lng }
      : null;

  const mapCenter: [number, number] = [position.lat, position.lng];

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button onClick={() => navigate('/my-deliveries')} class="text-gray-400 hover:text-gray-600 text-sm">
            &larr; My Deliveries
          </button>
          <h1 class="text-xl font-semibold text-gray-800">Delivery Map</h1>
        </div>
        <div class="flex items-center gap-2">
          {!channelReady && (
            <span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Connecting...</span>
          )}
          <span class={`text-xs px-3 py-1 rounded-full font-medium ${delivered ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
            {delivered ? 'Entregado' : 'En entrega'}
          </span>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-6">
        <div class="bg-white rounded-2xl shadow p-4 mb-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="font-medium text-gray-800">{order.store_name}</h3>
              <p class="text-sm text-gray-500">Customer: {order.consumer_name}</p>
            </div>
            <span class="text-sm font-semibold text-gray-800">
              Total: ${order.items.reduce((s, i) => s + i.price * i.quantity, 0)}
            </span>
          </div>
        </div>

        {delivered ? (
          <div class="bg-green-50 border border-green-200 rounded-xl p-6 mb-4 text-center">
            <p class="text-green-700 font-semibold text-lg">Order delivered successfully!</p>
            <button
              onClick={() => navigate('/my-deliveries')}
              class="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Back to Deliveries
            </button>
          </div>
        ) : (
          <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 text-center">
            <p class="text-indigo-700 font-medium">
              Use arrow keys to move your position on the map
            </p>
            <p class="text-indigo-500 text-sm mt-1">
              Navigate to the red marker (destination) to complete the delivery
            </p>
          </div>
        )}

        <div style={{ height: '450px', borderRadius: '16px', overflow: 'hidden' }} class="shadow">
          <MapContainer
            center={mapCenter}
            zoom={17}
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
            <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
              <Popup>Your position</Popup>
            </Marker>
          </MapContainer>
        </div>

        <div class="text-xs text-gray-500 mt-2 text-center">
          Position: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </div>
      </main>
    </div>
  );
}
