import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useProductStore } from "./store/product";
import { useSalesStore } from "./store/sales";
import { useUserStore } from "./store/user";
import {
  CustomerCardsService,
  SalesService,
  TCustomerCard,
  UsersService,
} from "./services";
import { TUser } from "./types";
import { TCheckDetails, TSalesFilters } from "./services/sales/types";
import { SortableTh, SortState, nextSort } from "./components/SortableTh";

type ReportSections = {
  employees: boolean;
  customers: boolean;
  categories: boolean;
  catalog: boolean;
  store: boolean;
  checks: boolean;
};

const defaultSections: ReportSections = {
  employees: true,
  customers: true,
  categories: true,
  catalog: true,
  store: true,
  checks: true,
};

type GroupedCheck = {
  id: string | number;
  cashier: string;
  date: string;
  total: number;
  itemsCount: number;
  unitsCount: number;
};

type DateMode = "all" | "today" | "range";

type Filters = {
  idEmployee: string;
  dateMode: DateMode;
  startDate: string;
  endDate: string;
};

const defaultFilters: Filters = {
  idEmployee: "",
  dateMode: "all",
  startDate: "",
  endDate: "",
};

function buildApiFilters(f: Filters): TSalesFilters {
  const api: TSalesFilters = {};
  if (f.idEmployee) api.id_employee = f.idEmployee;
  if (f.dateMode === "today") {
    api.today_only = true;
  } else if (f.dateMode === "range") {
    if (f.startDate) api.start_date = f.startDate;
    if (f.endDate) api.end_date = f.endDate;
  }
  return api;
}

function describeFilters(f: Filters, cashiers: TUser[]): string {
  const parts: string[] = [];
  if (f.idEmployee) {
    const c = cashiers.find(
      (u) => String(u.id_employee) === String(f.idEmployee),
    );
    if (c) {
      parts.push(`касир: ${c.empl_surname} ${c.empl_name}`);
    }
  }
  if (f.dateMode === "today") {
    parts.push("за сьогодні");
  } else if (f.dateMode === "range") {
    if (f.startDate && f.endDate) {
      parts.push(`період: ${f.startDate} — ${f.endDate}`);
    } else if (f.startDate) {
      parts.push(`з ${f.startDate}`);
    } else if (f.endDate) {
      parts.push(`по ${f.endDate}`);
    }
  }
  return parts.length > 0 ? parts.join(", ") : "без фільтрів";
}

function Reports(): React.JSX.Element {
  const {
    storeProducts: products,
    catalogProducts,
    categories,
    loadStore,
    loadCatalog,
    loadCategories,
  } = useProductStore();
  const { sales, loadSales, deleteSale } = useSalesStore();
  const { user } = useUserStore();

  const isManager = user?.empl_role === "Manager";

  const [allEmployees, setAllEmployees] = useState<TUser[]>([]);
  const [customers, setCustomers] = useState<TCustomerCard[]>([]);
  const [sections, setSections] = useState<ReportSections>(defaultSections);

  const [modalOpen, setModalOpen] = useState(false);
  const [cashiers, setCashiers] = useState<TUser[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [sortState, setSortState] = useState<SortState>({
    sort: null,
    order: null,
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [checkDetails, setCheckDetails] = useState<TCheckDetails | null>(null);

  const buildFullFilters = (f: Filters): TSalesFilters => {
    return buildApiFilters(f);
  };

  useEffect(() => {
    loadStore();
    loadCatalog();
    loadCategories();
    loadSales(buildFullFilters(filters));
    if (isManager) {
      loadCashiers();
      loadAllEmployees();
      loadCustomers();
    }
  }, [isManager]);

  const loadAllEmployees = async () => {
    try {
      const res = await UsersService.getUsers();
      setAllEmployees(res.data || []);
    } catch (e) {
      console.error("[Reports]: loadAllEmployees error:", e);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await CustomerCardsService.getCards();
      setCustomers(res.data || []);
    } catch (e) {
      console.error("[Reports]: loadCustomers error:", e);
    }
  };

  const toggleSort = (field: string) => {
    setSortState((prev) => nextSort(prev, field));
  };

  const loadCashiers = async () => {
    try {
      const res = await UsersService.getUsers({ role: "Cashier" });
      const list = (res.data || [])
        .slice()
        .sort((a, b) =>
          (a.empl_surname || "").localeCompare(b.empl_surname || ""),
        );
      setCashiers(list);
    } catch (e) {
      console.error("[Reports]: loadCashiers error:", e);
    }
  };

  const onCloseModal = () => {
    setModalOpen(false);
  };

  const onOpenModal = () => {
    setDraft(filters);
    setModalOpen(true);
  };

  const onApplyFilters = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (draft.dateMode === "range" && draft.startDate && draft.endDate) {
      if (draft.startDate > draft.endDate) {
        toast.error("Дата початку має бути не пізніше дати кінця");
        return;
      }
    }
    setFilters(draft);
    await loadSales(buildFullFilters(draft));
    setModalOpen(false);
  };

  const onResetFilters = async () => {
    setFilters(defaultFilters);
    setDraft(defaultFilters);
    await loadSales(buildFullFilters(defaultFilters));
    setModalOpen(false);
  };

  const openDetails = async (checkNumber: string | number) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setCheckDetails(null);
    try {
      const res = await SalesService.getCheckDetails(String(checkNumber));
      setCheckDetails(res.data);
    } catch (e) {
      console.error("[Reports]: openDetails error:", e);
      toast.error("Не вдалося завантажити деталі чека");
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setCheckDetails(null);
  };

  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.stock, 0),
    [products],
  );
  const totalItems = useMemo(
    () => products.reduce((sum, p) => sum + p.stock, 0),
    [products],
  );
  const selectedCashier = useMemo(() => {
    if (!filters.idEmployee) return null;

    if (!isManager) {
      return user;
    }
    return (
      cashiers.find(
        (u) => String(u.id_employee) === String(filters.idEmployee),
      ) ?? null
    );
  }, [filters.idEmployee, cashiers, isManager, user]);

  const filteredSales = useMemo(() => {
    let list = sales;

    if (!isManager) {
      list.filter((s) => s.cashier === user?.empl_surname);
    }

    if (isManager && filters.idEmployee && selectedCashier) {
      list = list.filter((s) => s.cashier === selectedCashier.empl_surname);
    }

    if (filters.dateMode === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      list = list.filter((s) => {
        const d = new Date(s.date);
        return d >= start && d < end;
      });
    } else if (filters.dateMode === "range") {
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        list = list.filter((s) => new Date(s.date) >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        list = list.filter((s) => new Date(s.date) <= end);
      }
    }

    return list;
  }, [sales, filters, selectedCashier]);

  const groupedChecks = useMemo<GroupedCheck[]>(() => {
    const map = new Map<string, GroupedCheck>();
    for (const s of filteredSales) {
      const key = String(s.id);
      const existing = map.get(key);
      if (existing) {
        existing.total += s.total;
        existing.itemsCount += 1;
        existing.unitsCount += Number(s.quantity || 0);
      } else {
        map.set(key, {
          id: s.id,
          cashier: s.cashier,
          date: s.date,
          total: s.total,
          itemsCount: 1,
          unitsCount: Number(s.quantity || 0),
        });
      }
    }
    return Array.from(map.values());
  }, [filteredSales]);

  const sortedChecks = useMemo<GroupedCheck[]>(() => {
    if (!sortState.sort || !sortState.order) {
      return [...groupedChecks].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }
    const field = sortState.sort;
    const dir = sortState.order === "ASC" ? 1 : -1;
    const getVal = (c: GroupedCheck): string | number => {
      switch (field) {
        case "id":
          return String(c.id);
        case "cashier":
          return c.cashier || "";
        case "items":
          return c.itemsCount;
        case "quantity":
          return c.unitsCount;
        case "total":
          return c.total;
        case "date":
          return new Date(c.date).getTime();
        default:
          return 0;
      }
    };
    return [...groupedChecks].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [groupedChecks, sortState]);

  const totalSales = useMemo(
    () => groupedChecks.reduce((sum, c) => sum + c.total, 0),
    [groupedChecks],
  );
  const uniqueChecks = groupedChecks.length;
  const totalUnitsSold = useMemo(
    () => groupedChecks.reduce((sum, c) => sum + c.unitsCount, 0),
    [groupedChecks],
  );
  const cashierLabel = !isManager
    ? `${user?.empl_surname} ${user?.empl_name}`
    : selectedCashier
      ? `${selectedCashier.empl_surname} ${selectedCashier.empl_name}` +
        (selectedCashier.empl_patronymic
          ? ` ${selectedCashier.empl_patronymic}`
          : "")
      : "всі касири";
  const periodLabel =
    filters.dateMode === "today"
      ? "сьогодні"
      : filters.dateMode === "range"
        ? filters.startDate && filters.endDate
          ? `${filters.startDate} — ${filters.endDate}`
          : filters.startDate
            ? `з ${filters.startDate}`
            : filters.endDate
              ? `по ${filters.endDate}`
              : "за весь час"
        : "за весь час";

  const currentDate = new Date().toLocaleString("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const filterSummary = describeFilters(filters, cashiers);
  const hasActiveFilters =
    filters.idEmployee !== "" || filters.dateMode !== "all";

  const handleDeleteSale = async (id: string | number): Promise<void> => {
    if (window.confirm(`Видалити чек #${id}?`)) {
      await deleteSale(id as number);
    }
  };

  const handlePrint = (): void => {
    const effectiveSections: ReportSections = isManager
      ? sections
      : {
          ...sections,
          employees: false,
          customers: false,
        };
    const anySelected = Object.values(effectiveSections).some(Boolean);
    if (!anySelected) {
      toast.error("Оберіть хоча б один розділ для звіту");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const esc = (v: unknown): string =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const employeesSection = effectiveSections.employees
      ? `
          <h2>Працівники</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ПІБ</th>
                <th>Роль</th>
                <th>Зарплата</th>
                <th>Телефон</th>
                <th>Email</th>
                <th>Адреса</th>
                <th>Дата нар.</th>
                <th>З</th>
              </tr>
            </thead>
            <tbody>
              ${allEmployees
                .map(
                  (e) => `
                <tr>
                  <td>${esc(e.id_employee)}</td>
                  <td>${esc(e.empl_surname)} ${esc(e.empl_name)}${
                    e.empl_patronymic ? " " + esc(e.empl_patronymic) : ""
                  }</td>
                  <td>${esc(e.empl_role)}</td>
                  <td>${Number(e.salary ?? 0).toFixed(2)}</td>
                  <td>${esc(e.phone_number)}</td>
                  <td>${esc(e.email)}</td>
                  <td>${esc(
                    [e.city, e.street, e.zip_code].filter(Boolean).join(", "),
                  )}</td>
                  <td>${esc(e.date_of_birth)}</td>
                  <td>${esc(e.date_of_start)}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <div class="summary">
            <p>Усього працівників: ${allEmployees.length}</p>
          </div>`
      : "";

    const customersSection = effectiveSections.customers
      ? `
          <h2>Постійні клієнти (картки)</h2>
          <table>
            <thead>
              <tr>
                <th>№ картки</th>
                <th>ПІБ</th>
                <th>Телефон</th>
                <th>Адреса</th>
                <th>Знижка</th>
              </tr>
            </thead>
            <tbody>
              ${customers
                .map(
                  (c) => `
                <tr>
                  <td>${esc(c.card_number)}</td>
                  <td>${esc(c.cust_surname)} ${esc(c.cust_name)}${
                    c.cust_patronymic ? " " + esc(c.cust_patronymic) : ""
                  }</td>
                  <td>${esc(c.phone_number)}</td>
                  <td>${esc(
                    [c.city, c.street, c.zip_code].filter(Boolean).join(", "),
                  )}</td>
                  <td>${esc(c.percent)}%</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <div class="summary">
            <p>Усього карток: ${customers.length}</p>
          </div>`
      : "";

    const categoriesSection = effectiveSections.categories
      ? `
          <h2>Категорії товарів</h2>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Назва</th>
              </tr>
            </thead>
            <tbody>
              ${categories
                .map(
                  (c) => `
                <tr>
                  <td>${esc(c.category_number)}</td>
                  <td>${esc(c.category_name)}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <div class="summary">
            <p>Усього категорій: ${categories.length}</p>
          </div>`
      : "";

    const catalogSection = effectiveSections.catalog
      ? `
          <h2>Каталог товарів</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Назва</th>
                <th>Категорія</th>
                <th>Виробник</th>
                <th>Характеристики</th>
              </tr>
            </thead>
            <tbody>
              ${catalogProducts
                .map(
                  (p) => `
                <tr>
                  <td>${esc(p.id_product)}</td>
                  <td>${esc(p.product_name)}</td>
                  <td>${esc(p.category_name)}</td>
                  <td>${esc(p.manufacturer)}</td>
                  <td>${esc(p.characteristics)}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <div class="summary">
            <p>Усього найменувань у каталозі: ${catalogProducts.length}</p>
          </div>`
      : "";

    const storeSection = effectiveSections.store
      ? `
          <h2>Товари у магазині (склад)</h2>
          <table>
            <thead>
              <tr>
                <th>UPC</th>
                <th>Назва товару</th>
                <th>Ціна (грн)</th>
                <th>Кількість (шт)</th>
                <th>Статус</th>
                <th>Вартість (грн)</th>
              </tr>
            </thead>
            <tbody>
              ${products
                .map(
                  (p) => `
                <tr>
                  <td>${esc(p.upc)}</td>
                  <td>${esc(p.name)}</td>
                  <td>${p.price?.toFixed(2)}</td>
                  <td>${esc(p.stock)}</td>
                  <td>${p.is_promo ? "Акційний" : "Звичайний"}</td>
                  <td>${(p.price * p.stock)?.toFixed(2)}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <div class="summary">
            <p>Загальна кількість товарів на складі: ${totalItems} шт</p>
            <p>Загальна вартість на складі: ${totalValue.toFixed(2)} грн</p>
            <p>Кількість найменувань: ${products.length}</p>
          </div>`
      : "";

    const checksSection = effectiveSections.checks
      ? `
          <h2>Історія чеків${hasActiveFilters ? " (з урахуванням фільтрів)" : ""}</h2>
          <table>
            <thead>
              <tr>
                <th>№ чека</th>
                <th>Касир</th>
                <th>Позицій</th>
                <th>Одиниць</th>
                <th>Сума (грн)</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              ${sortedChecks
                .map(
                  (c) => `
                <tr>
                  <td>${esc(c.id)}</td>
                  <td>${esc(c.cashier)}</td>
                  <td>${c.itemsCount}</td>
                  <td>${c.unitsCount}</td>
                  <td>${c.total?.toFixed(2)}</td>
                  <td>${new Date(c.date).toLocaleString("uk-UA")}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <div class="summary">
            <p>Загальна сума продажів: ${totalSales?.toFixed(2)} грн</p>
            <p>Кількість чеків: ${sortedChecks.length}</p>
            <p>Кількість позицій: ${filteredSales.length}</p>
            <p>Одиниць продано: ${totalUnitsSold}</p>
          </div>`
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Звіт по супермаркету "ZLAGODA"</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; }
            @media print {
              body { margin: 0; padding: 0; }
              h2 { page-break-before: auto; page-break-after: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #333; }
            .header h1 { font-size: 24px; margin-bottom: 10px; }
            .header p { color: #666; font-size: 12px; }
            .filters { margin: 10px 0 20px; padding: 10px 15px; background: #eef; border-left: 4px solid #55a; font-size: 13px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10px; color: #666; }
            h2 { margin: 24px 0 8px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { margin: 10px 0 20px; padding: 10px 15px; background: #f9f9f9; border-radius: 5px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ЗВІТ ПО СУПЕРМАРКЕТУ "ZLAGODA"</h1>
            <p>Автоматизована інформаційна система "Супермаркет"</p>
            <p>Дата формування: ${currentDate}</p>
          </div>

          ${
            effectiveSections.checks
              ? `<div class="filters">
            <strong>Фільтри (для розділу "Чеки"):</strong> ${filterSummary}
          </div>`
              : ""
          }

          ${employeesSection}
          ${customersSection}
          ${categoriesSection}
          ${catalogSection}
          ${storeSection}
          ${checksSection}

          <div class="footer">
            <p>© ${new Date().getFullYear()} Автоматизована інформаційна система "Супермаркет"</p>
            <p>Звіт сформовано автоматично.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Формування звітів</h2>
          <span>
            <button
              className="btn btn-primary"
              style={{ marginRight: 16 }}
              onClick={handlePrint}
            >
              Попередній перегляд та друк
            </button>

            <button className="btn btn-primary" onClick={onOpenModal}>
              Фільтри
            </button>
          </span>
        </div>

        {hasActiveFilters && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "#eef5ff",
              borderLeft: "4px solid #3b82f6",
              borderRadius: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Застосовані фільтри:</strong> {filterSummary}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onResetFilters}
            >
              Скинути
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: 10 }}>Розділи звіту:</h3>
          <div
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            {(
              [
                ...(isManager
                  ? ([
                      ["employees", "Працівники"],
                      ["customers", "Постійні клієнти"],
                    ] as Array<[keyof ReportSections, string]>)
                  : []),
                ["categories", "Категорії"],
                ["catalog", "Каталог товарів"],
                ["store", "Товари у магазині"],
                ["checks", "Чеки"],
              ] as Array<[keyof ReportSections, string]>
            ).map(([key, label]) => (
              <label
                key={key}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <input
                  type="checkbox"
                  checked={sections[key]}
                  onChange={(e) =>
                    setSections((s) => ({ ...s, [key]: e.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSections(defaultSections)}
            >
              Усі
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setSections({
                  employees: false,
                  customers: false,
                  categories: false,
                  catalog: false,
                  store: false,
                  checks: false,
                })
              }
            >
              Зняти усі
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          <h3>Коротка статистика:</h3>
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "10px",
              flexWrap: "wrap",
              color: "#555",
            }}
          >
            <div>
              <strong>Касир:</strong> {cashierLabel}
            </div>
            <div>
              <strong>Період:</strong> {periodLabel}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong>Чеків:</strong> {uniqueChecks}
            </div>
            <div>
              <strong>Позицій (рядків):</strong> {filteredSales.length}
            </div>
            <div>
              <strong>Одиниць продано:</strong> {totalUnitsSold}
            </div>
            <div>
              <strong>Сума продажів:</strong> {totalSales?.toFixed(2)} грн
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-header">
          <h2>Чеки (продажі)</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <SortableTh field="id" state={sortState} onToggle={toggleSort}>
                  № чека
                </SortableTh>
                <SortableTh
                  field="cashier"
                  state={sortState}
                  onToggle={toggleSort}
                >
                  Касир
                </SortableTh>
                <SortableTh
                  field="items"
                  state={sortState}
                  onToggle={toggleSort}
                >
                  Позицій
                </SortableTh>
                <SortableTh
                  field="quantity"
                  state={sortState}
                  onToggle={toggleSort}
                >
                  Одиниць
                </SortableTh>
                <SortableTh
                  field="total"
                  state={sortState}
                  onToggle={toggleSort}
                >
                  Сума (грн)
                </SortableTh>
                <SortableTh
                  field="date"
                  state={sortState}
                  onToggle={toggleSort}
                >
                  Дата
                </SortableTh>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {sortedChecks.map((c) => (
                <tr key={String(c.id)}>
                  <td>
                    <code>{c.id}</code>
                  </td>
                  <td>{c.cashier}</td>
                  <td>{c.itemsCount}</td>
                  <td>{c.unitsCount}</td>
                  <td>{c.total?.toFixed(2)} грн</td>
                  <td>{new Date(c.date).toLocaleString("uk-UA")}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openDetails(c.id)}
                    >
                      Деталі
                    </button>
                    {isManager && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: 5 }}
                        onClick={() => handleDeleteSale(c.id)}
                      >
                        Видалити
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sortedChecks.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 20 }}>
                    Немає даних для відображення
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailsOpen && (
        <div className="modal" onClick={closeDetails}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 720 }}
          >
            <h3>Деталі чека</h3>
            <div style={{ marginBottom: 12 }} />
            {detailsLoading && <p>Завантаження…</p>}
            {!detailsLoading && checkDetails && (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 16,
                    padding: 12,
                    background: "#f9f9f9",
                    borderRadius: 6,
                  }}
                >
                  <div>
                    <strong>№ чека:</strong>{" "}
                    <code>{checkDetails.check_number}</code>
                  </div>
                  <div>
                    <strong>Дата:</strong>{" "}
                    {new Date(checkDetails.print_date).toLocaleString("uk-UA")}
                  </div>
                  <div>
                    <strong>Касир:</strong> {checkDetails.cashier_surname} (
                    {checkDetails.id_employee})
                  </div>
                  <div>
                    <strong>Картка клієнта:</strong>{" "}
                    {checkDetails.card_number ?? "—"}
                  </div>
                  <div>
                    <strong>Сума:</strong> {checkDetails.sum_total?.toFixed(2)}{" "}
                    грн
                  </div>
                  <div>
                    <strong>ПДВ:</strong> {checkDetails.vat?.toFixed(2)} грн
                  </div>
                </div>

                <h4 style={{ marginBottom: 8 }}>Позиції</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>UPC</th>
                        <th>Товар</th>
                        <th>Кількість</th>
                        <th>Ціна</th>
                        <th>Підсумок</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkDetails.items.map((it) => (
                        <tr key={it.upc}>
                          <td>
                            <code>{it.upc}</code>
                          </td>
                          <td>{it.product_name}</td>
                          <td>{it.product_number}</td>
                          <td>{it.selling_price?.toFixed(2)} грн</td>
                          <td>
                            {(it.selling_price * it.product_number)?.toFixed(2)}{" "}
                            грн
                          </td>
                        </tr>
                      ))}
                      {checkDetails.items.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ textAlign: "center", padding: 12 }}
                          >
                            Позицій немає
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDetails}
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal" onClick={onCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Фільтри</h3>
            <div style={{ marginBottom: 12 }} />
            <form onSubmit={onApplyFilters}>
              {isManager && (
                <div className="form-group">
                  <label>Касир</label>
                  <select
                    className="form-control"
                    value={draft.idEmployee}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, idEmployee: e.target.value }))
                    }
                  >
                    <option value="">Усі касири</option>
                    {cashiers.map((u) => (
                      <option
                        key={String(u.id_employee)}
                        value={String(u.id_employee)}
                      >
                        {u.empl_surname} {u.empl_name}
                        {u.empl_patronymic ? ` ${u.empl_patronymic}` : ""}
                      </option>
                    ))}
                  </select>
                  {cashiers.length === 0 && (
                    <small style={{ color: "#888" }}>
                      Немає зареєстрованих касирів.
                    </small>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Період</label>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <input
                      type="radio"
                      name="dateMode"
                      value="all"
                      checked={draft.dateMode === "all"}
                      onChange={() =>
                        setDraft((d) => ({ ...d, dateMode: "all" }))
                      }
                    />
                    За весь час
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <input
                      type="radio"
                      name="dateMode"
                      value="today"
                      checked={draft.dateMode === "today"}
                      onChange={() =>
                        setDraft((d) => ({ ...d, dateMode: "today" }))
                      }
                    />
                    Сьогодні
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <input
                      type="radio"
                      name="dateMode"
                      value="range"
                      checked={draft.dateMode === "range"}
                      onChange={() =>
                        setDraft((d) => ({ ...d, dateMode: "range" }))
                      }
                    />
                    Діапазон дат
                  </label>
                </div>
              </div>

              {draft.dateMode === "range" && (
                <div style={{ display: "flex", gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Від</label>
                    <input
                      type="date"
                      className="form-control"
                      value={draft.startDate}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          startDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>До</label>
                    <input
                      type="date"
                      className="form-control"
                      value={draft.endDate}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          endDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onResetFilters}
                >
                  Скинути
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCloseModal}
                >
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  Застосувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
