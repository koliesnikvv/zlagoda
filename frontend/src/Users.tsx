import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { isAxiosError } from "axios";
import { ChangeUserModal } from "./components/ChangeUserModal";
import { TUser, UserFormData, EditingUser } from "./types";
import { UsersService } from "./services";
import { SortableTh, SortState, nextSort } from "./components/SortableTh";
import { UserRow } from "./components/UserRow";

const userDefaultData: UserFormData = {
  empl_surname: "",
  empl_name: "",
  empl_patronymic: "",
  empl_salary: 0,
  password: "",
  empl_role: "Cashier",
  city: "",
  street: "",
  zip_code: "",
  date_of_birth: "",
  phone_number: "",
  email: "",
};

function Users(): React.JSX.Element {
  const [users, setUsers] = useState<TUser[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalEditOpen, setModalEditOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(userDefaultData);
  const [search, setSearch] = useState<string>("");
  const [sortState, setSortState] = useState<SortState>({
    sort: null,
    order: null,
  });
  const [roleFilter, setRoleFilter] = useState<"Manager" | "Cashier" | null>(
    null,
  );

  const filtered = users.filter(
    (u) =>
      `${u.empl_name} ${u.empl_surname} ${u.empl_patronymic}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    loadUsers();
  }, [sortState, roleFilter]);

  const loadUsers = async (): Promise<void> => {
    try {
      const params: { sort?: string; order?: "ASC" | "DESC"; role?: string } =
        {};
      if (sortState.sort && sortState.order) {
        params.sort = sortState.sort;
        params.order = sortState.order;
      }
      if (roleFilter) {
        params.role = roleFilter;
      }
      const res = await UsersService.getUsers(
        Object.keys(params).length > 0 ? params : undefined,
      );
      setUsers(res.data);
    } catch {
      toast.error("Помилка завантаження користувачів");
    }
  };

  const toggleRoleFilter = (role: "Manager" | "Cashier") => {
    setRoleFilter((prev) => (prev === role ? null : role));
  };

  const toggleSort = (field: string) => {
    setSortState((prev) => nextSort(prev, field));
  };

  const onEditUser = (user: TUser): void => {
    setEditingUser({
      id_employee: user.id_employee,
      empl_surname: user.empl_surname,
      empl_name: user.empl_name,
      empl_patronymic: user.empl_patronymic,
      empl_salary: user.salary,
      empl_role: user.empl_role,
      city: user.city,
      email: user.email,
      street: user.street,
      zip_code: user.zip_code,
      date_of_birth: user.date_of_birth,
      phone_number: user.phone_number,
    });
    setModalEditOpen(true);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    try {
      await UsersService.postUser({
        ...formData,
        date_of_start: new Date().toISOString().split("T")[0],
      });
      toast.success("Користувача додано");
      loadUsers();
      closeModal();
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        toast.error(error.response.data?.detail || "Помилка створення");
        return;
      }
      toast.error("Помилка з'єднання");
    }
  };

  const handleDelete = async (id_employee: number): Promise<void> => {
    if (window.confirm("Ви впевнені?")) {
      try {
        await UsersService.deleteUser({ id: id_employee });
        toast.success("Користувача видалено");
        loadUsers();
      } catch (error) {
        if (isAxiosError(error) && error.response) {
          toast.error(error.response.data?.detail || "Помилка видалення");
          return;
        }
        toast.error("Помилка з'єднання");
      }
    }
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setEditingUser(null);
    setFormData(userDefaultData);
  };

  const renderItem = (user: TUser): React.JSX.Element => (
    <UserRow
      key={user.id_employee}
      user={user}
      onEdit={onEditUser}
      onDelete={handleDelete}
    />
  );

  console.log("filtered =>", filtered);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Управління користувачами</h2>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Додати користувача
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          className={`btn ${roleFilter === "Manager" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => toggleRoleFilter("Manager")}
        >
          Менеджери
        </button>
        <button
          className={`btn ${roleFilter === "Cashier" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => toggleRoleFilter("Cashier")}
        >
          Касири
        </button>
        {roleFilter && (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setRoleFilter(null)}
          >
            Скинути фільтр
          </button>
        )}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Пошук за ім'ям або email..."
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
                Ім'я
              </SortableTh>
              <SortableTh field="email" state={sortState} onToggle={toggleSort}>
                Email
              </SortableTh>
              <SortableTh field="role" state={sortState} onToggle={toggleSort}>
                Роль
              </SortableTh>
              <SortableTh
                field="created_at"
                state={sortState}
                onToggle={toggleSort}
              >
                Дата реєстрації
              </SortableTh>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>{filtered.map(renderItem)}</tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Додати користувача</h3>
              <span className="close" onClick={closeModal}>
                &times;
              </span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Ім'я *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.empl_name}
                  onChange={(e) =>
                    setFormData({ ...formData, empl_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Прізвище *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.empl_surname}
                  onChange={(e) =>
                    setFormData({ ...formData, empl_surname: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>По батькові *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.empl_patronymic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      empl_patronymic: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль *</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Роль *</label>
                <select
                  className="form-control"
                  value={formData.empl_role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      empl_role: e.target.value as UserFormData["empl_role"],
                    })
                  }
                >
                  <option value="Cashier">Касир</option>
                  <option value="Manager">Менеджер</option>
                </select>
              </div>
              <div className="form-group">
                <label>Зарплата *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.empl_salary as number}
                  onChange={(e) =>
                    setFormData({ ...formData, empl_salary: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Дата народження *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Номер телефону *</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Місто *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Вулиця *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Поштовий індекс *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.zip_code}
                  onChange={(e) =>
                    setFormData({ ...formData, zip_code: e.target.value })
                  }
                  required
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  Додати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalEditOpen && editingUser && (
        <ChangeUserModal
          user={editingUser}
          onClose={() => setModalEditOpen(false)}
          loadUsers={loadUsers}
        />
      )}
    </div>
  );
}

export default Users;
