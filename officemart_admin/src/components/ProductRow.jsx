import { formatPrice } from '../utils/format';
import { categoryNames } from '../data/sample';

export default function ProductRow({ product, categoryMap = categoryNames, onEdit, onDelete }) {
  const isActive = product.status === 'active';

  return (
    <tr data-testid="product-row">
      <td data-label="Tên">{product.name}</td>
      <td data-label="SKU">{product.sku}</td>
      <td data-label="Danh mục">{categoryMap?.[product.category] || product.category}</td>
      <td data-label="Giá">{formatPrice(product.price)}</td>
      <td data-label="Tồn kho">
        {product.stock === 0 ? (
          <span className="out-of-stock">Hết hàng</span>
        ) : (
          product.stock
        )}
      </td>
      <td data-label="Trạng thái">
        <span
          data-testid="product-status"
          className={isActive ? 'badge badge-active' : 'badge badge-inactive'}
        >
          {isActive ? 'Đang bán' : 'Ngừng bán'}
        </span>
      </td>
      <td data-label="Thao tác" className="actions-cell">
        <button type="button" data-testid="edit-button" onClick={() => onEdit?.(product.id)}>
          Sửa
        </button>
        <button type="button" data-testid="delete-button" onClick={() => onDelete?.(product)}>
          Xoá
        </button>
      </td>
    </tr>
  );
}