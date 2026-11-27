export default function ConfirmDialog({ product, onConfirm, onCancel }) {
  if (!product) return null;

  return (
    <div className="modal-backdrop">
      <div data-testid="confirm-dialog" className="modal-box">
        <p>Bạn có chắc muốn xoá sản phẩm "{product.name}"?</p>
        <div className="modal-actions">
          <button type="button" data-testid="confirm-no" onClick={onCancel}>
            Huỷ
          </button>
          <button type="button" data-testid="confirm-yes" onClick={onConfirm}>
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}