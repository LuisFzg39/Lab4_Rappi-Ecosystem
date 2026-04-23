import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './providers/UserProvider';
import { AxiosProvider } from './providers/AxiosProvider';
import { ToastProvider } from './providers/ToastProvider';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MyStorePage } from './pages/MyStorePage';
import { StoreOrdersPage } from './pages/StoreOrdersPage';

function AppRoutes() {
  const { auth } = useUser();

  return (
    <Routes>
      <Route path="/login" element={!auth ? <LoginPage /> : <Navigate to="/my-store" />} />
      <Route path="/register" element={!auth ? <RegisterPage /> : <Navigate to="/my-store" />} />
      <Route path="/my-store" element={auth ? <MyStorePage /> : <Navigate to="/login" />} />
      <Route path="/orders" element={auth ? <StoreOrdersPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={auth ? '/my-store' : '/login'} />} />
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
