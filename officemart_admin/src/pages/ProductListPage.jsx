import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosClient';
import { useToast } from '../context/ToastContext';
import ProductTable from '../components/ProductTable';
import ConfirmDialog from '../components/ConfirmDialog';
import useProductSearch from '../hooks/useProductSearch';

const LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang bán' },
  { value: 'inactive', label: 'Ngừng bán' },
];

function parsePage(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function buildPageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  sorted.forEach((p) => {
    if (prev && p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  });
  return result;
}

export default function ProductListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = parsePage(searchParams.get('page'));

  const [searchInput, setSearchInput] = useState(q);
  const [categories, setCategories] = useState([]);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const { data: products, total, loadedPage, loading, error, refresh } = useProductSearch({
    q,
    category,
    status,
    page,
    limit: LIMIT,
  });

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  function updateParams(patch, options = {}) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === '' || value == null) next.delete(key);
          else next.set(key, String(value));
        });
        return next;
      },
      { replace: true, ...options },
    );
  }

  useEffect(() => {
    let active = true;
    api
      .get('/categories')
      .then((res) => {
        if (active) setCategories(res.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSearchInput((prev) => (prev.trim() === q.trim() ? prev : q));
  }, [q]);

  useEffect(() => {
    if (searchInput.trim() === q.trim()) return undefined;
    const timer = setTimeout(() => {
      updateParams({ q: searchInput.trim(), page: null });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    if (!loading && !error && loadedPage === page && page > totalPages) {
      updateParams({ page: totalPages === 1 ? null : totalPages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, loadedPage, page, totalPages]);

  async function handleConfirmDelete() {
    if (!deletingProduct) return;
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      setDeletingProduct(null);
      showToast('Đã xoá sản phẩm');
      refresh();
    } catch (err) {
      setDeletingProduct(null);
      showToast(err.response?.data?.message || 'Không thể xoá sản phẩm');
    }
  }

  function handleReset() {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  }

  const hasFilters = Boolean(q || category || status);
  const startItem = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, total);

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

      <div className="filter-bar" data-testid="filter-bar">
        <input
          type="search"
          data-testid="search-input"
          aria-label="Tìm theo tên hoặc SKU"
          placeholder="Tìm theo tên hoặc SKU..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <select
          data-testid="filter-category"
          aria-label="Lọc theo danh mục"
          value={category}
          onChange={(e) => updateParams({ category: e.target.value, page: null })}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          data-testid="filter-status"
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: null })}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button type="button" data-testid="reset-filters" onClick={handleReset}>
            Xoá bộ lọc
          </button>
        )}
      </div>

      {loading && <div data-testid="loading">Đang tải...</div>}

      {!loading && error && (
        <div data-testid="error-message" className="error-box">
          <p>{error}</p>
          <button type="button" data-testid="retry-button" onClick={refresh}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div data-testid="empty-state">
          {hasFilters ? 'Không tìm thấy sản phẩm phù hợp' : 'Không có sản phẩm nào'}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <ProductTable
            products={products}
            categoryMap={categoryMap}
            onEdit={(id) => navigate(`/products/${id}/edit`)}
            onDelete={(product) => setDeletingProduct(product)}
          />

          <div className="pagination" data-testid="pagination">
            <span data-testid="page-info">
              {startItem}–{endItem} / {total} sản phẩm
            </span>

            <button
              type="button"
              data-testid="prev-page"
              disabled={page <= 1}
              onClick={() => updateParams({ page: page - 1 === 1 ? null : page - 1 })}
            >
              Trước
            </button>

            {buildPageRange(page, totalPages).map((item, index) =>
              item === '...' ? (
                <span key={`gap-${index}`} className="pagination-gap">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  data-testid="page-button"
                  className={item === page ? 'page-button active' : 'page-button'}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => updateParams({ page: item === 1 ? null : item })}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              data-testid="next-page"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: page + 1 })}
            >
              Sau
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        product={deletingProduct}
        onCancel={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
