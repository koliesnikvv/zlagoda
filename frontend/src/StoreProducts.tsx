import React, { useState, useEffect } from "react";
import { StoreProduct, StoreProductFormData } from "./types";
import { useUserStore } from "./store/user";
import { useProductStore } from "./store/product";
import { toast } from "react-toastify";
import { ProductsService } from "./services";
import { isAxiosError } from "axios";
import { SortableTh, SortState, nextSort } from "./components/SortableTh";

const emptyForm: StoreProductFormData = {
  upc: "",
  id_product: "",
  price: "",
  quantity: "",
  is_promo: false,
};

function products(): React.JSX.Element {
  const { user } = useUserStore();
  const { storeProducts, loadStore, deleteProduct } = useProductStore();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(
    null,
  );
  const [formData, setFormData] = useState<StoreProductFormData>(emptyForm);

  const isManager = user?.empl_role === "Manager";
  const [search, setSearch] = useState<string>("");
  const [sortState, setSortState] = useState<SortState>({ sort: null, order: null });
  const [promoFilter, setPromoFilter] = useState<boolean | null>(null);

  const filtered = storeProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.upc.toLowerCase().includes(search.toLowerCase()),
  );

  const buildParams = () => {
    const params: { sort?: string; order?: 'ASC' | 'DESC'; promo?: boolean } = {};
    if (sortState.sort && sortState.order) {
      params.sort = sortState.sort;
      params.order = sortState.order;
    }
    if (promoFilter !== null) {
      params.promo = promoFilter;
    }
    return Object.keys(params).length > 0 ? params : undefined;
  };

  useEffect(() => {
    loadStore(buildParams());
  }, [sortState, promoFilter]);

  const togglePromoFilter = (value: boolean) => {
    setPromoFilter((prev) => (prev === value ? null : value));
  };

  const toggleSort = (field: string) => {
    setSortState((prev) => nextSort(prev, field));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    const isEditing = !!editingProduct;

    try {
      if (isEditing) {
        await ProductsService.patchProducts({
          UPC: formData.upc,
          id_product: Number(formData.id_product),
          selling_price: Number(formData.price),
          products_number: Number(formData.quantity),
          promotional_product: formData.is_promo,
        });
      } else {
        await ProductsService.postProducts({
          // UPC: formData.upc,
          id_product: Number(formData.id_product),
          selling_price: Number(formData.price),
          products_number: Number(formData.quantity),
          promotional_product: formData.is_promo,
        });
      }
      await toast.success(
        editingProduct ? "Дані оновлено (переоцінка)" : "Товар додано на склад",
      );
      loadStore(buildParams());
      closeModal();
    } catch (error) {
      console.log("[Products]: handleSubmit error:", error);
      if (isAxiosError(error) && error.response) {
        const errData = error.response.data;
        toast.error(errData.detail || "Помилка збереження");
        return;
      }
      toast.error("Помилка збереження");
    }
  };

  const handleDelete = async (upc: string): Promise<void> => {
    if (window.confirm(`Видалити товар з UPC ${upc} зі складу?`)) {
      await deleteProduct(upc);
    }
  };

  const openEditModal = (product: StoreProduct): void => {
    setEditingProduct(product);
    setFormData({
      upc: product.upc,
      id_product: String(product.id_product ?? ""),
      price: String(product.price),
      quantity: String(product.stock),
      is_promo: product.is_promo,
    });
    setModalOpen(true);
  };

  const openAddModal = (): void => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Товари на складі (ZLAGODA)</h2>
        {isManager && (
          <button className="btn btn-primary" onClick={openAddModal}>
            Додати на склад
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          className={`btn ${promoFilter === true ? "btn-primary" : "btn-secondary"}`}
          onClick={() => togglePromoFilter(true)}
        >
          Акційні
        </button>
        <button
          className={`btn ${promoFilter === false ? "btn-primary" : "btn-secondary"}`}
          onClick={() => togglePromoFilter(false)}
        >
          Неакційні
        </button>
        {promoFilter !== null && (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setPromoFilter(null)}
          >
            Скинути фільтр
          </button>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Пошук за назвою товару або UPC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <SortableTh field="upc" state={sortState} onToggle={toggleSort}>UPC</SortableTh>
              <SortableTh field="name" state={sortState} onToggle={toggleSort}>Назва</SortableTh>
              <SortableTh field="price" state={sortState} onToggle={toggleSort}>Ціна (з ПДВ)</SortableTh>
              <SortableTh field="stock" state={sortState} onToggle={toggleSort}>Кількість</SortableTh>
              <SortableTh field="status" state={sortState} onToggle={toggleSort}>Статус</SortableTh>
              {isManager && <th>Дії</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.upc}
                style={p.is_promo ? { backgroundColor: "#fff4f4" } : {}}
              >
                <td>
                  <code>{p.upc}</code>
                </td>
                <td>{p.name}</td>
                <td>{p.price} ₴</td>
                <td>{p.stock} шт</td>
                <td>
                  {p.is_promo ? (
                    <span className="badge badge-danger">Акційний</span>
                  ) : (
                    <span className="badge badge-success">Звичайний</span>
                  )}
                </td>
                {isManager && (
                  <td>
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => openEditModal(p)}
                    >
                      Редагувати
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.upc)}
                      style={{ marginLeft: "5px" }}
                    >
                      Видалити
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingProduct
                ? "Переоцінка / Редагування"
                : "Додати товар на склад"}
            </h3>
            <div
              style={{
                marginBottom: 12,
              }}
            />
            <form onSubmit={handleSubmit}>
              {/* {!editingProduct && (
                <div className="form-group">
                  <label>UPC</label>
                  <input
                    type="text"
                    maxLength={12}
                    disabled={!!editingProduct}
                    className="form-control"
                    value={formData.upc}
                    onChange={(e) =>
                      setFormData({ ...formData, upc: e.target.value })
                    }
                    required
                  />
                </div>
              )} */}
              {!editingProduct && (
                <div className="form-group">
                  <label>ID Товару з каталогу</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.id_product}
                    onChange={(e) =>
                      setFormData({ ...formData, id_product: e.target.value })
                    }
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Ціна продажу (грн)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
                <small>Включаючи ПДВ 20%</small>
              </div>
              <div className="form-group">
                <label>Кількість одиниць</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_promo}
                    onChange={(e) =>
                      setFormData({ ...formData, is_promo: e.target.checked })
                    }
                  />{" "}
                  Акційний товар
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default products;
