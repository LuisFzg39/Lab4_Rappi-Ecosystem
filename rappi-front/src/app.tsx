import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './providers/UserProvider';
import { AxiosProvider } from './providers/AxiosProvider';
import { ToastProvider } from './providers/ToastProvider';
import { CartProvider } from './providers/CartProvider';
import { getHomeRoute } from './utils/routes';
import type { UserRole } from './types';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { StoresPage } from './pages/consumer/StoresPage';
import { StoreDetailPage } from './pages/consumer/StoreDetailPage';
import { CartPage } from './pages/consumer/CartPage';
import { OrdersPage } from './pages/consumer/OrdersPage';
import { OrderTrackingPage } from './pages/consumer/OrderTrackingPage';

import { MyStorePage } from './pages/store/MyStorePage';
import { StoreOrdersPage } from './pages/store/StoreOrdersPage';

import { AvailableOrdersPage } from './pages/delivery/AvailableOrdersPage';
import { MyDeliveriesPage } from './pages/delivery/MyDeliveriesPage';
import { OrderDetailPage } from './pages/delivery/OrderDetailPage';
import { DeliveryMapPage } from './pages/delivery/DeliveryMapPage';

function ConsumerRoutes() {
  return (
    <Routes>
      <Route path="/stores" element={<StoresPage />} />
      <Route path="/stores/:id" element={<StoreDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/my-orders" element={<OrdersPage />} />
      <Route path="/my-orders/:id/tracking" element={<OrderTrackingPage />} />
      <Route path="*" element={<Navigate to="/stores" />} />
    </Routes>
  );
}

function StoreRoutes() {
  return (
    <Routes>
      <Route path="/my-store" element={<MyStorePage />} />
      <Route path="/store-orders" element={<StoreOrdersPage />} />
      <Route path="*" element={<Navigate to="/my-store" />} />
    </Routes>
  );
}

function DeliveryRoutes() {
  return (
    <Routes>
      <Route path="/available" element={<AvailableOrdersPage />} />
      <Route path="/my-deliveries" element={<MyDeliveriesPage />} />
      <Route path="/deliveries/:id" element={<OrderDetailPage />} />
      <Route path="/deliveries/:id/map" element={<DeliveryMapPage />} />
      <Route path="*" element={<Navigate to="/available" />} />
    </Routes>
  );
}

function RoleRoutes({ role }: { role: UserRole }) {
  switch (role) {
    case 'consumer':
      return <ConsumerRoutes />;
    case 'store':
      return <StoreRoutes />;
    case 'delivery':
      return <DeliveryRoutes />;
  }
}

function AppRoutes() {
  const { auth } = useUser();

  if (!auth) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const home = getHomeRoute(auth.user.role);

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={home} />} />
      <Route path="/register" element={<Navigate to={home} />} />
      <Route path="/*" element={<RoleRoutes role={auth.user.role} />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AxiosProvider>
          <ToastProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </ToastProvider>
        </AxiosProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
