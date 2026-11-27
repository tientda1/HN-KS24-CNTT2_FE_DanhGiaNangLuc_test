import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosClient';
import { useToast } from '../context/ToastContext';

const INITIAL_FORM = {
  name: '',
  sku: '',
  category: '',
  price: '',
  stock: '0',
  status: 'active',
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const catRes = await api.get('/categories');
        if (active) setCategories(catRes.data);

        if (isEdit) {
          const prodRes = await api.get(`/products/${id}`);
          if (active) {
            const p = prodRes.data;
            setForm({
              name: p.name ?? '',
              sku: p.sku ?? '',
              category: p.category ?? '',
              price: String(p.price ?? ''),
              stock: String(p.stock ?? 0),
              status: p.status ?? 'active',
            });
          }
        }
      } catch (err) {
        if (active && err.response?.status === 404) {
          setNotFound(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    const trimmedName = form.name.trim();

    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 100) {
      newErrors.name = 'Tên sản phẩm phải từ 3 đến 100 ký tự';
    }

    if (!/^[A-Z]{3}-\d{4}$/.test(form.sku)) {
      newErrors.sku = 'SKU phải đúng định dạng ABC-1234 (3 chữ in hoa, gạch ngang, 4 chữ số)';
    }

    if (!form.category) {
      newErrors.category = 'Vui lòng chọn danh mục';
    }

    const priceNum = Number(form.price);
    if (form.price === '' || Number.isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Giá phải là số lớn hơn 0';
    }

    const stockNum = Number(form.stock);
    if (
      form.stock === '' ||
      Number.isNaN(stockNum) ||
      !Number.isInteger(stockNum) ||
      stockNum < 0
    ) {
      newErrors.stock = 'Tồn kho phải là số nguyên không âm';
    }

    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        status: form.status,
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        showToast('Đã cập nhật sản phẩm');
      } else {
        await api.post('/products', payload);
        showToast('Đã thêm sản phẩm');
      }
      navigate('/products');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409) {
        setErrors({ sku: data?.message || 'SKU đã tồn tại' });
      } else if (status === 400 && data?.field) {
        setErrors({ [data.field]: data.message });
      } else if (status === 404) {
        setNotFound(true);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div data-testid="loading">Đang tải...</div>;
  }

  if (notFound) {
    return (
      <div>
        <p>Không tìm thấy sản phẩm</p>
        <button type="button" onClick={() => navigate('/products')}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>

      <form data-testid="product-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name">Tên sản phẩm</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && (
            <p data-testid="field-error-name" className="error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            name="sku"
            type="text"
            placeholder="VD: KEY-0001"
            value={form.sku}
            onChange={handleChange}
          />
          {errors.sku && (
            <p data-testid="field-error-sku" className="error">
              {errors.sku}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="category">Danh mục</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p data-testid="field-error-category" className="error">
              {errors.category}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="price">Giá</label>
          <input
            id="price"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
          />
          {errors.price && (
            <p data-testid="field-error-price" className="error">
              {errors.price}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="stock">Tồn kho</label>
          <input
            id="stock"
            name="stock"
            type="number"
            value={form.stock}
            onChange={handleChange}
          />
          {errors.stock && (
            <p data-testid="field-error-stock" className="error">
              {errors.stock}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="status">Trạng thái</label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/products')}>
            Huỷ
          </button>
          <button type="submit" data-testid="submit-button" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
}