import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute, PublicRoute } from "@/components/auth/RouteGuards";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";

import LoginPage from "@/pages/Login";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import ResetPasswordPage from "@/pages/ResetPassword";
import DashboardPage from "@/pages/Dashboard";
import MasterDataPage from "@/pages/MasterData";
import InventoryPage from "@/pages/Inventory";
import ProductionPage from "@/pages/Production";
import SalesPage from "@/pages/Sales";
import FinancePage from "@/pages/Finance";
import FranchisePage from "@/pages/Franchise";
import ReportsPage from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

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
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/franchise" element={<FranchisePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
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
