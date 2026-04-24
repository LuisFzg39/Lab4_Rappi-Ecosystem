import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useAxios } from '../../providers/AxiosProvider';
import { useToast } from '../../providers/ToastProvider';
import { destinationIcon, deliveryIcon } from '../../utils/mapIcons';
import type { Order, LatLng } from '../../types';
import 'leaflet/dist/leaflet.css';

const STEP = 0.00003;

export function DeliveryMapPage() {
  const { id } = useParams<{ id: string }>();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [position, setPosition] = useState<LatLng>({ lat: 3.4516, lng: -76.532 });
  const [loading, setLoading] = useState(true);
  const [delivered, setDelivered] = useState(false);

  const positionRef = useRef<LatLng>(position);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deliveredRef = useRef(false);
  const initialPositionPublishedRef = useRef(false);

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

        let startPos: LatLng | null = null;
        let needsPublish = false;

        if (data.delivery_lat && data.delivery_lng) {
          startPos = { lat: data.delivery_lat, lng: data.delivery_lng };
        } else if (data.destination_lat && data.destination_lng) {
          startPos = {
            lat: data.destination_lat + 0.002,
            lng: data.destination_lng + 0.002,
          };
          needsPublish = true;
        }

        if (startPos) {
          setPosition(startPos);
          positionRef.current = startPos;
        }

        if (data.status === 'Entregado') {
          setDelivered(true);
          deliveredRef.current = true;
        }

        // Persist starting position right away so the consumer sees the driver's
        // pin even before the first arrow key press (server will broadcast it).
        if (
          needsPublish &&
          startPos &&
          data.status === 'En entrega' &&
          !initialPositionPublishedRef.current
        ) {
          initialPositionPublishedRef.current = true;
          axios.patch(`/api/orders/${id}/position`, {
            lat: startPos.lat,
            lng: startPos.lng,
          }).catch(() => { /* non-blocking */ });
        }
      })
      .catch(() => showToast('Error loading order', 'error'))
      .finally(() => setLoading(false));
  }, [axios, id]);

  const sendPositionUpdate = useCallback(async (pos: LatLng) => {
    try {
      const { data } = await axios.patch<Order>(`/api/orders/${id}/position`, {
        lat: pos.lat,
        lng: pos.lng,
      });

      if (data.status === 'Entregado') {
        setDelivered(true);
        deliveredRef.current = true;
        setOrder(data);
        showToast('Order delivered! You arrived at the destination.', 'success');
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
        }, 700);
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
        <span class={`text-xs px-3 py-1 rounded-full font-medium ${delivered ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
          {delivered ? 'Entregado' : 'En entrega'}
        </span>
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
