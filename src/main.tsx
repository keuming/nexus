import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AuthProvider } from './lib/auth';
import { Guard, Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login, Register } from './pages/AuthPages';
import { Subscribe } from './pages/Subscribe';
import { Account } from './pages/Account';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Storefront } from './pages/Storefront';
import { OfferPage } from './pages/OfferPage';
import { Checkout } from './pages/Checkout';
import { Confirmation } from './pages/Confirmation';
import { Conditions } from './pages/Conditions';
import { Legal, Privacy } from './pages/LegalPages';
import { registerServiceWorker } from './lib/pwa';
import { Favorites } from './pages/Favorites';
import { LangProvider } from './lib/i18n';
import { Splash } from './components/Splash';
import { isBackoffice } from './lib/host';
import { BackofficeApp } from './pages/Backoffice';

registerServiceWorker();

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider><LangProvider>
        <BrowserRouter>
          {isBackoffice ? <BackofficeApp /> : <><Splash /><Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="souscription" element={<Subscribe />} />
              <Route path="boutique/:id" element={<Storefront />} />
              <Route path="offre/:id" element={<OfferPage />} />
              <Route path="reserver/:offerId" element={<Checkout />} />
              <Route path="reservation/:id" element={<Guard roles={['customer', 'owner', 'admin']}><Confirmation /></Guard>} />
              <Route path="conditions" element={<Conditions />} />
              <Route path="confidentialite" element={<Privacy />} />
              <Route path="mentions-legales" element={<Legal />} />
              <Route path="account" element={<Guard roles={['customer']}><Account /></Guard>} />
              <Route path="favoris" element={<Guard roles={['customer', 'owner', 'admin']}><Favorites /></Guard>} />
              <Route path="company" element={<Guard roles={['owner']}><CompanyDashboard /></Guard>} />
              <Route path="admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
              <Route path="*" element={<p className="text-zinc-400">Page introuvable.</p>} />
            </Route>
          </Routes></>}
        </BrowserRouter>
      </LangProvider></AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
