import { useState } from 'preact/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useAxios } from '../../providers/AxiosProvider';
import { useToast } from '../../providers/ToastProvider';
import { useCart } from '../../providers/CartProvider';
import { destinationIcon } from '../../utils/mapIcons';
import type { LatLng, Order } from '../../types';
import 'leaflet/dist/leaflet.css';

function MapClickHandler({ onSelect }: { onSelect: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const axios = useAxios();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState<LatLng | null>(null);

  const groupedByStore = items.reduce((acc, item) => {
    if (!acc[item.store_id]) {
      acc[item.store_id] = { store_name: item.store_name, items: [] };
    }
    acc[item.store_id].items.push(item);
    return acc;
  }, {} as Record<string, { store_name: string; items: typeof items }>);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!destination) {
      showToast('Please select a delivery destination on the map', 'error');
      return;
    }

    setLoading(true);
    try {
      for (const [storeId, group] of Object.entries(groupedByStore)) {
        await axios.post<Order>('/api/orders', {
          store_id: storeId,
          items: group.items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
          destination_lat: destination.lat,
          destination_lng: destination.lng,
        });
      }

      clearCart();
      showToast('Order placed successfully!', 'success');
      navigate('/my-orders');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error placing order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button onClick={() => navigate(-1)} class="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Back
          </button>
          <h1 class="text-xl font-semibold text-gray-800">Cart</h1>
        </div>
        <Link to="/my-orders" class="text-sm text-purple-600 hover:underline">My Orders</Link>
      </header>

      <main class="max-w-4xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div class="text-center py-12">
            <p class="text-gray-400 mb-4">Your cart is empty.</p>
            <Link to="/stores" class="text-purple-600 hover:underline">Browse Stores</Link>
          </div>
        ) : (
          <div class="flex flex-col gap-6">
            {Object.entries(groupedByStore).map(([storeId, group]) => (
              <div key={storeId} class="bg-white rounded-2xl shadow p-6">
                <h2 class="text-lg font-medium text-gray-800 mb-4">{group.store_name}</h2>
                <div class="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <div key={item.product.id} class="flex justify-between items-center border-b border-gray-100 pb-3">
                      <div>
                        <p class="font-medium text-gray-800">{item.product.name}</p>
                        <p class="text-sm text-purple-600">${item.product.price} each</p>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >-</button>
                          <span class="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >+</button>
                        </div>
                        <span class="font-semibold text-gray-800 w-20 text-right">
                          ${item.product.price * item.quantity}
                        </span>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          class="text-red-400 hover:text-red-600 text-sm"
                        >Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div class="bg-white rounded-2xl shadow p-6">
              <h2 class="text-lg font-medium text-gray-800 mb-3">Delivery Destination</h2>
              <p class="text-sm text-gray-500 mb-3">Click on the map to select where you want your order delivered.</p>
              <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden' }}>
                <MapContainer
                  center={[3.4516, -76.532]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onSelect={setDestination} />
                  {destination && (
                    <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
                  )}
                </MapContainer>
              </div>
              {destination && (
                <p class="text-xs text-gray-500 mt-2">
                  Selected: {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                </p>
              )}
            </div>

            <div class="bg-white rounded-2xl shadow p-6 flex justify-between items-center">
              <span class="text-lg font-semibold text-gray-800">Total: ${total}</span>
              <button
                onClick={handleCheckout}
                disabled={loading || !destination}
                class="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
