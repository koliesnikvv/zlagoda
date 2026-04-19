import React, { useState } from "react";
import { toast } from "react-toastify";
import * as T from "./services/customer-cards/types";
import {AnalyticsService} from "./services/customer-cards/analytics.service";


const LoyalCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<T.TLoyalCustomer[]>([]);
  const [manufacturer, setManufacturer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!manufacturer.trim()) {
      toast.warn("Введіть назву виробника");
      return;
    }

    setLoading(true);
    try {

      const res = await AnalyticsService.getLoyalCustomers(manufacturer);
      setCustomers(res.data);

      if (res.data.length === 0) {
        toast.info("Клієнтів, що купили всі товари бренду, не знайдено");
      }
    } catch (error) {
      toast.error("Помилка при виконанні складного запиту");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Аналітика: Лояльні клієнти</h2>
      </div>

      <div style={{ padding: "16px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Введіть виробника (напр. Apple)..."
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Завантаження..." : "Сформувати звіт"}
          </button>
        </form>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Прізвище</th>
                <th>Ім'я</th>
                <th>Номер картки</th>
                <th>Відсоток знижки</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.card_number}>
                  <td>{customer.cust_surname}</td>
                  <td>{customer.cust_name}</td>
                  <td>{customer.card_number}</td>
                  <td>{customer.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default LoyalCustomers;