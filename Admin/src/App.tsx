import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import OverviewPage from "./pages/Overview";
import ProductsPage from "./pages/Products";
import ProductCreate from "./pages/Products/ProductCreate";
import ProductEdit from "./pages/Products/ProductEdit";
import ProductView from "./pages/Products/ProductView";
import OrdersPage from "./pages/Orders";
import CustomersPage from "./pages/Customers";
import CategoriesPage from "./pages/category";
import CloudinaryPage from "./pages/cloudinary";
import Profile from "./pages/profile/index";
import Login from "./pages/Auth/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes - Accessible only when not authenticated */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              
              {/* Protected Routes - Require authentication and wrapped with DashboardLayout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <OverviewPage />
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              } />
              <Route path="/products/create" element={
                <ProtectedRoute>
                  <ProductCreate />
                </ProtectedRoute>
              } />
              <Route path="/products/edit/:id" element={
                <ProtectedRoute>
                  <ProductEdit />
                </ProtectedRoute>
              } />
              <Route path="/products/view/:id" element={
                <ProtectedRoute>
                  <ProductView />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute>
                  <CustomersPage />
                </ProtectedRoute>
              } />
              <Route path="/categories" element={
                <ProtectedRoute>
                  <CategoriesPage />
                </ProtectedRoute>
              } />
              <Route path="/cloudinary" element={
                <ProtectedRoute>
                  <CloudinaryPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route - Protected */}
              <Route path="*" element={
                <ProtectedRoute>
                  <NotFound />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
