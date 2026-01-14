import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import ScanProduct from "./pages/ScanProduct";
import ReportFeedback from "./pages/ReportFeedback";
import ProductList from "./pages/ProductList";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import ReportManagement from "./pages/admin/ReportManagement";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, role, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} /> : <Landing />} />
      <Route path="/auth" element={user ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} /> : <Auth />} />
      
      {/* User Routes - Redirect admins to admin panel */}
      <Route path="/dashboard" element={role === 'admin' ? <Navigate to="/admin" replace /> : <ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/scan" element={role === 'admin' ? <Navigate to="/admin" replace /> : <ProtectedRoute><ScanProduct /></ProtectedRoute>} />
      <Route path="/report" element={role === 'admin' ? <Navigate to="/admin" replace /> : <ProtectedRoute><ReportFeedback /></ProtectedRoute>} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute adminOnly><ProductManagement /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute adminOnly><ReportManagement /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
