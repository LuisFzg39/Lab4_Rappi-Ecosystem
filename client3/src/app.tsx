import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './providers/UserProvider';
import { AxiosProvider } from './providers/AxiosProvider';
import { ToastProvider } from './providers/ToastProvider';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AvailableOrdersPage } from './pages/AvailableOrdersPage';
import { MyDeliveriesPage } from './pages/MyDeliveriesPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { DeliveryMapPage } from './pages/DeliveryMapPage';

function AppRoutes() {
  const { auth } = useUser();

  return (
    <Routes>
      <Route path="/login" element={!auth ? <LoginPage /> : <Navigate to="/available" />} />
      <Route path="/register" element={!auth ? <RegisterPage /> : <Navigate to="/available" />} />
      <Route path="/available" element={auth ? <AvailableOrdersPage /> : <Navigate to="/login" />} />
      <Route path="/my-deliveries" element={auth ? <MyDeliveriesPage /> : <Navigate to="/login" />} />
      <Route path="/orders/:id" element={auth ? <OrderDetailPage /> : <Navigate to="/login" />} />
      <Route path="/delivery/:id" element={auth ? <DeliveryMapPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={auth ? '/available' : '/login'} />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AxiosProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AxiosProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
