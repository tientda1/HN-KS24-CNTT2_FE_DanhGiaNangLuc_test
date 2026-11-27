import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import ProductTable from '../components/ProductTable';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingProduct, setDeletingProduct] = useState(null);

  async function fetchProducts() {
    setLoading(true);
    setError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products', { params: { page: 1, limit: 10 } }),
        api.get('/categories'),
      ]);

      setProducts(prodRes.data.data || []);

      const map = {};
      (catRes.data || []).forEach((c) => {
        map[c.id] = c.name;
      });
      setCategoryMap(map);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function handleConfirmDelete() {
    if (!deletingProduct) return;
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
      showToast('Đã xoá sản phẩm');
    } catch (err) {
      setDeletingProduct(null);
      setError(err.response?.data?.message || 'Không thể xoá sản phẩm');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Sản phẩm</h1>
        <button
          type="button"
          data-testid="add-button"
          onClick={() => navigate('/products/new')}
        >
          Thêm sản phẩm
        </button>
      </div>

      {loading && <div data-testid="loading">Đang tải...</div>}

      {!loading && error && (
        <div data-testid="error-message" className="error-box">
          <p>{error}</p>
          <button type="button" data-testid="retry-button" onClick={fetchProducts}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div data-testid="empty-state">Không có sản phẩm nào</div>
      )}

      {!loading && !error && products.length > 0 && (
        <ProductTable
          products={products}
          categoryMap={categoryMap}
          onEdit={(id) => navigate(`/products/${id}/edit`)}
          onDelete={(product) => setDeletingProduct(product)}
        />
      )}

      <ConfirmDialog
        product={deletingProduct}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}