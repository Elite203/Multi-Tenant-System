import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TenantWrapper } from "@/components/layout/TenantWrapper";
import Index from "./pages/Index";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Leave from "./pages/Leave";
import Auth from "./pages/Auth";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Organization from "./pages/Organization";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Documents from "./pages/Documents";
import Payslips from "./pages/Payslips";
import Rota from "./pages/Rota";
import Timesheets from "./pages/Timesheets";
import Profile from "./pages/Profile";
import DataImport from "./pages/DataImport";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import AdminLogin from "./components/admin/AdminLogin";
import AdminPage from "./components/admin/AdminPage";
import Home from "./components/admin/SchemaExplorer";
const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/admin" element={<AdminLogin />} />
    <Route path="/admin/home" element={<AdminPage />} />
    <Route path="/admin/dashboard" element={<Home />} />
    <Route path="/employees" element={<Employees />} />
    <Route path="/employees/:id" element={<EmployeeDetail />} />
    <Route path="/companies" element={<Companies />} />
    <Route path="/companies/:id" element={<CompanyDetail />} />
    <Route path="/organization" element={<Organization />} />
    <Route path="/leave" element={<Leave />} />
    <Route path="/rota" element={<Rota />} />
    <Route path="/timesheets" element={<Timesheets />} />
    <Route path="/documents" element={<Documents />} />
    <Route path="/payroll" element={<Payslips />} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/data-import" element={<DataImport />} />
    <Route path="/reports" element={<Reports />} />
    <Route path="/settings" element={<Settings />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TenantWrapper>
              <AppRoutes />
            </TenantWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
