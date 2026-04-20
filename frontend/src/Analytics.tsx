import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  AnalyticsService,
  TCategorySalesRow,
  TLoyalCustomerRow,
} from "./services";
import { useProductStore } from "./store/product";

function Analytics(): React.JSX.Element {
  const { categories, loadCategories } = useProductStore();

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthAgoStr = monthAgo.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState<string>(monthAgoStr);
  const [endDate, setEndDate] = useState<string>(today);
  const [loadingQ1, setLoadingQ1] = useState(false);
  const [rowsQ1, setRowsQ1] = useState<TCategorySalesRow[]>([]);
  const [executedQ1, setExecutedQ1] = useState(false);

  const [categoryNumber, setCategoryNumber] = useState<string>("");
  const [loadingQ2, setLoadingQ2] = useState(false);
  const [rowsQ2, setRowsQ2] = useState<TLoyalCustomerRow[]>([]);
  const [executedQ2, setExecutedQ2] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const runQuery1 = async () => {
    if (!startDate || !endDate) {
      toast.error("Вкажіть початкову і кінцеву дати");
      return;
    }
    if (startDate > endDate) {
      toast.error("Дата початку має бути не пізніше дати кінця");
      return;
    }
    setLoadingQ1(true);
    try {
      const res = await AnalyticsService.getCategorySales(startDate, endDate);
      setRowsQ1(res.data || []);
      setExecutedQ1(true);
    } catch (e) {
      console.error("[Analytics]: runQuery1 error:", e);
      toast.error("Не вдалося виконати запит");
    } finally {
      setLoadingQ1(false);
    }
  };

  const runQuery2 = async () => {
    if (!categoryNumber) {
      toast.error("Оберіть категорію");
      return;
    }
    setLoadingQ2(true);
    try {
      const res = await AnalyticsService.getCustomersBoughtAll(
        Number(categoryNumber),
      );
      setRowsQ2(res.data || []);
      setExecutedQ2(true);
    } catch (e) {
      console.error("[Analytics]: runQuery2 error:", e);
      toast.error("Не вдалося виконати запит");
    } finally {
      setLoadingQ2(false);
    }
  };

  const totalRevenueQ1 = rowsQ1.reduce((s, r) => s + Number(r.total_revenue), 0);
  const totalUnitsQ1 = rowsQ1.reduce((s, r) => s + Number(r.total_units), 0);

  const selectedCategoryName =
    categories.find((c) => String(c.category_number) === categoryNumber)
      ?.category_name ?? "";

  return (
    <div>


      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2>
            Виторг за категоріями за період
          </h2>
        </div>


        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="form-group" style={{ minWidth: 180 }}>
            <label>Початкова дата</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ minWidth: 180 }}>
            <label>Кінцева дата</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={runQuery1}
            disabled={loadingQ1}
            style={{ marginBottom: 10 }}
          >
            {loadingQ1 ? "Виконання…" : "Виконати запит"}
          </button>
        </div>

        {executedQ1 && (
          <div className="table-container" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>№ категорії</th>
                  <th>Назва категорії</th>
                  <th>К-сть чеків</th>
                  <th>Продано одиниць</th>
                  <th>Виторг (грн)</th>
                </tr>
              </thead>
              <tbody>
                {rowsQ1.map((r) => (
                  <tr key={r.category_number}>
                    <td>{r.category_number}</td>
                    <td>{r.category_name}</td>
                    <td>{r.checks_count}</td>
                    <td>{r.total_units}</td>
                    <td>{Number(r.total_revenue).toFixed(2)}</td>
                  </tr>
                ))}
                {rowsQ1.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 16 }}>
                      За вказаний період продажів немає
                    </td>
                  </tr>
                )}
                {rowsQ1.length > 0 && (
                  <tr style={{ fontWeight: 600, background: "#f6f6f6" }}>
                    <td colSpan={3}>Разом</td>
                    <td>{totalUnitsQ1}</td>
                    <td>{totalRevenueQ1.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2>Клієнти, які купили всі товари категорії
          </h2>
        </div>


        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="form-group" style={{ minWidth: 260 }}>
            <label>Категорія</label>
            <select
              className="form-control"
              value={categoryNumber}
              onChange={(e) => setCategoryNumber(e.target.value)}
            >
              <option value="">— оберіть категорію —</option>
              {categories.map((c) => (
                <option
                  key={c.category_number}
                  value={String(c.category_number)}
                >
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={runQuery2}
            disabled={loadingQ2}
            style={{ marginBottom: 10 }}
          >
            {loadingQ2 ? "Виконання…" : "Виконати запит"}
          </button>
        </div>

        {executedQ2 && (
          <>
            <div style={{ margin: "10px 0", color: "#555" }}>
              Категорія: <strong>{selectedCategoryName || "—"}</strong>.
              Знайдено клієнтів: <strong>{rowsQ2.length}</strong>.
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>№ картки</th>
                    <th>Прізвище</th>
                    <th>Імʼя</th>
                    <th>По батькові</th>
                    <th>Знижка, %</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsQ2.map((r) => (
                    <tr key={r.card_number}>
                      <td>
                        <code>{r.card_number}</code>
                      </td>
                      <td>{r.cust_surname}</td>
                      <td>{r.cust_name}</td>
                      <td>{r.cust_patronymic ?? "—"}</td>
                      <td>{r.percent}</td>
                    </tr>
                  ))}
                  {rowsQ2.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: 16 }}
                      >
                        Немає клієнтів, що купили всі товари цієї категорії
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;
