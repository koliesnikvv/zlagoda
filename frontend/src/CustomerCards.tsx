import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { useUserStore } from "./store/user";
import {
  CustomerCardsService,
  TCustomerCard,
  TCustomerCardFormData,
} from "./services";
import { SortableTh, SortState, nextSort } from "./components/SortableTh";
import { Link } from 'react-router-dom';

const emptyForm: TCustomerCardFormData = {
  card_number: "",
  cust_surname: "",
  cust_name: "",
  cust_patronymic: "",
  phone_number: "",
  city: "",
  street: "",
  zip_code: "",
  percent: 0,
};

function CustomerCards(): React.JSX.Element {
  const { user } = useUserStore();
  const isManager = user?.empl_role === "Manager";

  const [cards, setCards] = useState<TCustomerCard[]>([]);
  const [search, setSearch] = useState<string>("");
  const [sortState, setSortState] = useState<SortState>({
    sort: null,
    order: null,
  });

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<TCustomerCard | null>(null);
  const [formData, setFormData] = useState<TCustomerCardFormData>(emptyForm);

  useEffect(() => {
    loadCards();
  }, [sortState]);

  const loadCards = async () => {
    try {
      const params: { sort?: string; order?: "ASC" | "DESC"; surname?: string } =
        {};
      if (sortState.sort && sortState.order) {
        params.sort = sortState.sort;
        params.order = sortState.order;
      }
      if (search.trim()) {
        params.surname = search.trim();
      }
      const res = await CustomerCardsService.getCards(params);
      setCards(res.data);
    } catch (e) {
      toast.error("Помилка завантаження карток клієнтів");
      console.error("[CustomerCards]: loadCards error:", e);
    }
  };

  const toggleSort = (field: string) => {
    setSortState((prev) => nextSort(prev, field));
  };

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loadCards();
  };

  const openAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: TCustomerCard) => {
    setEditing(c);
    setFormData({
      card_number: c.card_number,
      cust_surname: c.cust_surname,
      cust_name: c.cust_name,
      cust_patronymic: c.cust_patronymic ?? "",
      phone_number: c.phone_number,
      city: c.city ?? "",
      street: c.street ?? "",
      zip_code: c.zip_code ?? "",
      percent: c.percent,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      card_number: formData.card_number.trim(),
      cust_surname: formData.cust_surname.trim(),
      cust_name: formData.cust_name.trim(),
      cust_patronymic: formData.cust_patronymic.trim() || null,
      phone_number: formData.phone_number.trim(),
      city: formData.city.trim() || null,
      street: formData.street.trim() || null,
      zip_code: formData.zip_code.trim() || null,
      percent: Number(formData.percent),
    };
    try {
      if (editing) {
        await CustomerCardsService.putCard(payload);
        toast.success("Картку оновлено");
      } else {
        await CustomerCardsService.postCard(payload);
        toast.success("Картку клієнта додано");
      }
      closeModal();
      loadCards();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const errData = error.response.data;
        toast.error(errData.detail || errData.message || "Помилка збереження");
        return;
      }
      toast.error("Помилка збереження");
      console.error("[CustomerCards]: handleSubmit error:", error);
    }
  };

  const handleDelete = async (c: TCustomerCard) => {
    if (
      !window.confirm(
        `Видалити картку №${c.card_number} (${c.cust_surname} ${c.cust_name})?`,
      )
    )
      return;
    try {
      await CustomerCardsService.deleteCard({ card_number: c.card_number });
      toast.success("Картку видалено");
      loadCards();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const errData = error.response.data;
        toast.error(errData.detail || errData.message || "Помилка видалення");
        return;
      }
      toast.error("Помилка видалення");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Постійні клієнти (картки)</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          Додати картку
        </button>
      </div>

      <form
        onSubmit={onSearchSubmit}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Пошук за прізвищем..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
          <li>
          <Link to="/loyal-customers" className="btn-nav">
            Аналітика фанатів бренду
          </Link>
        </li>
        <button type="submit" className="btn btn-primary">
          Пошук
        </button>
        {search && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch("");
              setTimeout(loadCards, 0);
            }}
          >
            Скинути
          </button>


        )}
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <SortableTh
                field="card_number"
                state={sortState}
                onToggle={toggleSort}
              >
                № картки
              </SortableTh>
              <SortableTh
                field="surname"
                state={sortState}
                onToggle={toggleSort}
              >
                ПІБ
              </SortableTh>
              <SortableTh
                field="phone"
                state={sortState}
                onToggle={toggleSort}
              >
                Телефон
              </SortableTh>
              <SortableTh field="city" state={sortState} onToggle={toggleSort}>
                Адреса
              </SortableTh>
              <SortableTh
                field="percent"
                state={sortState}
                onToggle={toggleSort}
              >
                Знижка (%)
              </SortableTh>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.card_number}>
                <td>
                  <code>{c.card_number}</code>
                </td>
                <td>
                  {c.cust_surname} {c.cust_name}
                  {c.cust_patronymic ? ` ${c.cust_patronymic}` : ""}
                </td>
                <td>{c.phone_number}</td>
                <td>
                  {[c.city, c.street, c.zip_code].filter(Boolean).join(", ") ||
                    "—"}
                </td>
                <td>{c.percent}%</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => openEdit(c)}
                  >
                    Редагувати
                  </button>
                  {isManager && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: 5 }}
                      onClick={() => handleDelete(c)}
                    >
                      Видалити
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {cards.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
                  Карток клієнтів не знайдено
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
              {editing ? "Редагувати картку клієнта" : "Додати картку клієнта"}
            </h3>
            <div style={{ marginBottom: 12 }} />
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Номер картки</label>
                <input
                  type="text"
                  maxLength={13}
                  className="form-control"
                  value={formData.card_number}
                  onChange={(e) =>
                    setFormData({ ...formData, card_number: e.target.value })
                  }
                  disabled={!!editing}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Прізвище</label>
                  <input
                    type="text"
                    maxLength={50}
                    className="form-control"
                    value={formData.cust_surname}
                    onChange={(e) =>
                      setFormData({ ...formData, cust_surname: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Ім'я</label>
                  <input
                    type="text"
                    maxLength={50}
                    className="form-control"
                    value={formData.cust_name}
                    onChange={(e) =>
                      setFormData({ ...formData, cust_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>По батькові</label>
                  <input
                    type="text"
                    maxLength={50}
                    className="form-control"
                    value={formData.cust_patronymic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cust_patronymic: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Телефон (починається з "+")</label>
                <input
                  type="text"
                  maxLength={13}
                  className="form-control"
                  placeholder="+380..."
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Місто</label>
                  <input
                    type="text"
                    maxLength={50}
                    className="form-control"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Вулиця</label>
                  <input
                    type="text"
                    maxLength={50}
                    className="form-control"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData({ ...formData, street: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ width: 120 }}>
                  <label>Індекс</label>
                  <input
                    type="text"
                    maxLength={9}
                    className="form-control"
                    value={formData.zip_code}
                    onChange={(e) =>
                      setFormData({ ...formData, zip_code: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Відсоток знижки (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="form-control"
                  value={formData.percent}
                  onChange={(e) =>
                    setFormData({ ...formData, percent: e.target.value })
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

export default CustomerCards;
