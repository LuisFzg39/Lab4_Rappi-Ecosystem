import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './providers/UserProvider';
import { AxiosProvider } from './providers/AxiosProvider';
import { ToastProvider } from './providers/ToastProvider';
import { CartProvider } from './providers/CartProvider';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StoresPage } from './pages/StoresPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';

function AppRoutes() {
  const { auth } = useUser();

  return (
    <Routes>
      <Route path="/login" element={!auth ? <LoginPage /> : <Navigate to="/stores" />} />
      <Route path="/register" element={!auth ? <RegisterPage /> : <Navigate to="/stores" />} />
      <Route path="/stores" element={auth ? <StoresPage /> : <Navigate to="/login" />} />
      <Route path="/stores/:id" element={auth ? <StoreDetailPage /> : <Navigate to="/login" />} />
      <Route path="/cart" element={auth ? <CartPage /> : <Navigate to="/login" />} />
      <Route path="/orders" element={auth ? <OrdersPage /> : <Navigate to="/login" />} />
      <Route path="/orders/:id/tracking" element={auth ? <OrderTrackingPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={auth ? '/stores' : '/login'} />} />
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
