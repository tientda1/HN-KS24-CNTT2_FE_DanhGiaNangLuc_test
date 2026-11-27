import { products, categoryNames } from '../data/sample';
import ProductTable from '../components/ProductTable';

export default function ProductListPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Sản phẩm</h1>
        <button type="button" data-testid="add-button">
          Thêm sản phẩm
        </button>
      </div>
      <ProductTable products={products} categoryMap={categoryNames} />
    </div>
  );
}