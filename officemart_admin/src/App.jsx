import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProductListPage from "./pages/ProductListPage";
import "./App.css";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id/edit" element={<ProductFormPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
