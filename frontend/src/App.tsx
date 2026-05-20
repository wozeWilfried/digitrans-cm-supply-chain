import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import StocksPage from '@/pages/StocksPage';
import FournisseursPage from '@/pages/FournisseursPage';
import CommandesPage from '@/pages/CommandesPage';
import LivraisonsPage from '@/pages/LivraisonsPage';
import MouvementsPage from '@/pages/MouvementsPage';
import Layout from '@/components/layout/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('jwt_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="stocks" element={<StocksPage />} />
            <Route path="fournisseurs" element={<FournisseursPage />} />
            <Route path="commandes" element={<CommandesPage />} />
            <Route path="livraisons" element={<LivraisonsPage />} />
            <Route path="mouvements" element={<MouvementsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
