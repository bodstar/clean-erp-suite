import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute, PublicRoute } from "@/components/auth/RouteGuards";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { MPromoLayout } from "@/components/mpromo/MPromoLayout";
import { SDLayout } from "@/components/sd/SDLayout";

import LoginPage from "@/pages/Login";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import ResetPasswordPage from "@/pages/ResetPassword";
import DashboardPage from "@/pages/Dashboard";
import MasterDataPage from "@/pages/MasterData";
import InventoryPage from "@/pages/Inventory";
import ProductionPage from "@/pages/Production";
import SalesPage from "@/pages/Sales";
import SDOverview from "@/pages/sd/SDOverview";
import SDOrders from "@/pages/sd/SDOrders";
import SDOrderDetail from "@/pages/sd/SDOrderDetail";
import SDOrderCreate from "@/pages/sd/SDOrderCreate";
import SDProducts from "@/pages/sd/SDProducts";
import SDCustomers from "@/pages/sd/SDCustomers";
import SDDrivers from "@/pages/sd/SDDrivers";
import SDRoutes from "@/pages/sd/SDRoutes";
import SDRouteCreate from "@/pages/sd/SDRouteCreate";
import SDMap from "@/pages/sd/SDMap";
import FinancePage from "@/pages/Finance";
import FranchisePage from "@/pages/Franchise";
import ReportsPage from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

import MPromoOverview from "@/pages/mpromo/MPromoOverview";
import MPromoPartners from "@/pages/mpromo/MPromoPartners";
import MPromoPartnerCreate from "@/pages/mpromo/MPromoPartnerCreate";
import MPromoCampaigns from "@/pages/mpromo/MPromoCampaigns";
import MPromoCampaignCreate from "@/pages/mpromo/MPromoCampaignCreate";
import MPromoCampaignDetail from "@/pages/mpromo/MPromoCampaignDetail";
import MPromoCodes from "@/pages/mpromo/MPromoCodes";
import MPromoRedemptions from "@/pages/mpromo/MPromoRedemptions";
import MPromoPayouts from "@/pages/mpromo/MPromoPayouts";
import MPromoOrders from "@/pages/mpromo/MPromoOrders";
import MPromoMarketData from "@/pages/mpromo/MPromoMarketData";
import MPromoFormBuilder from "@/pages/mpromo/MPromoFormBuilder";
import MPromoFormDetail from "@/pages/mpromo/MPromoFormDetail";

// Lazy-load leaflet-dependent pages to prevent react-leaflet context crash
const MPromoPartnerDetail = lazy(() => import("@/pages/mpromo/MPromoPartnerDetail"));
const MPromoMap = lazy(() => import("@/pages/mpromo/MPromoMap"));
const MPromoGeoQueue = lazy(() => import("@/pages/mpromo/MPromoGeoQueue"));
const SDRouteDetail = lazy(() => import("@/pages/sd/SDRouteDetail"));
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
              <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute><AuthenticatedLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/master-data" element={<MasterDataPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/production" element={<ProductionPage />} />
                <Route path="/sales" element={<SalesPage />} />

                {/* S&D module */}
                <Route path="/sd" element={<SDLayout />}>
                  <Route index element={<Navigate to="/sd/overview" replace />} />
                  <Route path="overview" element={<SDOverview />} />
                  <Route path="orders" element={<SDOrders />} />
                  <Route path="orders/new" element={<SDOrderCreate />} />
                  <Route path="orders/:id" element={<SDOrderDetail />} />
                  <Route path="products" element={<SDProducts />} />
                  <Route path="customers" element={<SDCustomers />} />
                  <Route path="drivers" element={<SDDrivers />} />
                  <Route path="routes" element={<SDRoutes />} />
                  <Route path="routes/:id" element={<Suspense fallback={<div className="p-8 text-muted-foreground">Loading route...</div>}><SDRouteDetail /></Suspense>} />
                  <Route path="map" element={<SDMap />} />
                </Route>
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/franchise" element={<FranchisePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* M-Promo module */}
                <Route path="/mpromo" element={<MPromoLayout />}>
                  <Route index element={<Navigate to="/mpromo/overview" replace />} />
                  <Route path="overview" element={<MPromoOverview />} />
                  <Route path="partners" element={<MPromoPartners />} />
                  <Route path="partners/new" element={<MPromoPartnerCreate />} />
                  <Route path="partners/:id" element={<Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}><MPromoPartnerDetail /></Suspense>} />
                  <Route path="campaigns" element={<MPromoCampaigns />} />
                  <Route path="campaigns/new" element={<MPromoCampaignCreate />} />
                  <Route path="campaigns/:id" element={<MPromoCampaignDetail />} />
                  <Route path="codes" element={<MPromoCodes />} />
                  <Route path="redemptions" element={<MPromoRedemptions />} />
                  <Route path="payouts" element={<MPromoPayouts />} />
                  <Route path="orders" element={<MPromoOrders />} />
                  <Route path="market-data" element={<MPromoMarketData />} />
                  <Route path="market-data/new" element={<MPromoFormBuilder />} />
                  <Route path="market-data/:id" element={<MPromoFormDetail />} />
                  <Route path="market-data/:id/edit" element={<MPromoFormBuilder />} />
                  <Route path="map" element={<Suspense fallback={<div className="p-8 text-muted-foreground">Loading map...</div>}><MPromoMap /></Suspense>} />
                  <Route path="geo-queue" element={<Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}><MPromoGeoQueue /></Suspense>} />
                </Route>
              </Route>

              {/* Redirects & fallback */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
