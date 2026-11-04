import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AuthProvider } from './lib/auth';
import { Guard, Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login, Register } from './pages/AuthPages';
import { Account } from './pages/Account';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="account" element={<Guard roles={['customer']}><Account /></Guard>} />
              <Route path="company" element={<Guard roles={['owner']}><CompanyDashboard /></Guard>} />
              <Route path="admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
              <Route path="*" element={<p className="text-zinc-400">Page introuvable.</p>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
