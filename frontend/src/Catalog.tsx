import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { CatalogService, CatalogProduct } from "./services";
import { useProductStore } from "./store/product";
import { SortableTh, SortState, nextSort } from "./components/SortableTh";
import { useUserStore } from "./store";

interface FormData {
  category_number: string;
  product_name: string;
  manufacturer: string;
  characteristics: string;
}

const emptyForm: FormData = {
  category_number: "",
  product_name: "",
  manufacturer: "",
  characteristics: "",
};

function Catalog(): React.JSX.Element {
  const {
    catalogProducts: products,
    categories,
    loadCatalog,
    loadCategories,
  } = useProductStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    sort: null,
    order: null,
  });
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const { user } = useUserStore();
  const isCashier = user?.empl_role === "Cashier";
  const isManager = user?.empl_role === "Manager";

  const loadParams: {
    sort?: string;
    order?: "ASC" | "DESC";
    category_number?: number;
  } = {};
  if (sortState.sort && sortState.order) {
    loadParams.sort = sortState.sort;
    loadParams.order = sortState.order;
  }
  if (categoryFilter !== null) {
    loadParams.category_number = categoryFilter;
  }
  const requestParams =
    Object.keys(loadParams).length > 0 ? loadParams : undefined;

  useEffect(() => {
    loadCatalog(requestParams);
    loadCategories();
  }, [sortState, categoryFilter]);

  const toggleSort = (field: string) => {
    setSortState((prev) => nextSort(prev, field));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await CatalogService.putProduct({
          id_product: editingProduct.id_product,
          category_number: Number(formData.category_number),
          product_name: formData.product_name,
          manufacturer: formData.manufacturer,
          characteristics: formData.characteristics,
        });
        toast.success("Товар оновлено");
      } else {
        await CatalogService.postProduct({
          category_number: Number(formData.category_number),
          product_name: formData.product_name,
          manufacturer: formData.manufacturer,
          characteristics: formData.characteristics,
        });
        toast.success("Товар додано до каталогу");
      }
      loadCatalog(requestParams);
      closeModal();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || "Помилка збереження");
        return;
      }
      toast.error("Помилка збереження");
    }
  };

  const handleDelete = async (product: CatalogProduct) => {
    if (!window.confirm(`Видалити "${product.product_name}" з каталогу?`))
      return;
    try {
      await CatalogService.deleteProduct({ id_product: product.id_product });
      toast.success("Товар видалено");
      loadCatalog(requestParams);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || "Помилка видалення");
        return;
      }
      toast.error("Помилка видалення");
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (product: CatalogProduct) => {
    setEditingProduct(product);
    setFormData({
      category_number: String(product.category_number),
      product_name: product.product_name,
      manufacturer: product.manufacturer,
      characteristics: product.characteristics,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const filtered = products.filter(
    (p) =>
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="card">
      <div className="card-header">
        <h2>Каталог товарів</h2>
        {isManager && (
          <button className="btn btn-primary" onClick={openAddModal}>
            Додати товар
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <label style={{ whiteSpace: "nowrap" }}>Категорія:</label>
        <select
          className="form-control"
          style={{ maxWidth: 280 }}
          value={categoryFilter ?? ""}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
        >
          <option value="">Усі категорії</option>
          {categories.map((c) => (
            <option key={c.category_number} value={c.category_number}>
              {c.category_name}
            </option>
          ))}
        </select>
        {categoryFilter !== null && (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setCategoryFilter(null)}
          >
            Скинути фільтр
          </button>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Пошук за назвою або виробником..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <SortableTh field="id" state={sortState} onToggle={toggleSort}>
                ID
              </SortableTh>
              <SortableTh field="name" state={sortState} onToggle={toggleSort}>
                Назва
              </SortableTh>
              <SortableTh
                field="category"
                state={sortState}
                onToggle={toggleSort}
              >
                Категорія
              </SortableTh>
              <SortableTh
                field="manufacturer"
                state={sortState}
                onToggle={toggleSort}
              >
                Виробник
              </SortableTh>
              <SortableTh
                field="characteristics"
                state={sortState}
                onToggle={toggleSort}
              >
                Характеристики
              </SortableTh>
              {isManager && <th>Дії</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id_product}>
                <td>{p.id_product}</td>
                <td>{p.product_name}</td>
                <td>{p.category_name}</td>
                <td>{p.manufacturer}</td>
                <td>{p.characteristics}</td>
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
                      onClick={() => handleDelete(p)}
                      style={{ marginLeft: "5px" }}
                    >
                      Видалити
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    color: "#999",
                    padding: "40px",
                  }}
                >
                  Товарів не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingProduct ? "Редагувати товар" : "Додати товар до каталогу"}
            </h3>
            <div style={{ marginBottom: 12 }} />
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Категорія</label>
                <select
                  className="form-control"
                  value={formData.category_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category_number: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Оберіть категорію</option>
                  {categories.map((c) => (
                    <option key={c.category_number} value={c.category_number}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Назва товару</label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={50}
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Виробник</label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={50}
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Характеристики</label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={100}
                  value={formData.characteristics}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      characteristics: e.target.value,
                    })
                  }
                  required
                />
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

export default Catalog;
