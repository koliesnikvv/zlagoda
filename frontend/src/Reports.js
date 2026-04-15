import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

function Reports({ token }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {loadData();}, []);

  const loadData = async () => {
    try {
      const [productsRes, salesRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/products'),
        fetch('http://127.0.0.1:8000/sales')
      ]);

      const productsData = await productsRes.json();
      const salesData = await salesRes.json();

      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      toast.error('Помилка завантаження даних');
    }
  };

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const currentDate = new Date().toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Звіт про товари та продажі</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 0;
              padding: 20px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .page { margin: 0; padding: 20px; }
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #333;
            }
            .header h1 { font-size: 24px; margin-bottom: 10px; }
            .header p { color: #666; font-size: 12px; }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              font-size: 10px;
              color: #666;
              position: fixed;
              bottom: 20px;
              left: 20px;
              right: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .summary {
              margin: 20px 0;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .summary h3 { margin-bottom: 10px; }
            .page-number {
              text-align: center;
              font-size: 10px;
              color: #999;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ЗВІТ ПРО ТОВАРИ ТА ПРОДАЖІ</h1>
            <p>Автоматизована інформаційна система "Супермаркет"</p>
            <p>Дата формування: ${currentDate}</p>
          </div>
          
          <h2>Список товарів</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Назва товару</th>
                <th>Ціна (грн)</th>
                <th>Кількість (шт)</th>
                <th>Вартість (грн)</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>${p.id}</td>
                  <td>${p.name}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>${p.stock}</td>
                  <td>${(p.price * p.stock).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Підсумки по товарах:</h3>
            <p>Загальна кількість товарів на складі: ${totalItems} шт</p>
            <p>Загальна вартість на складі: ${totalValue.toFixed(2)} грн</p>
            <p>Кількість найменувань: ${products.length}</p>
          </div>
          
          <h2>Історія продажів</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Касир</th>
                <th>Товар</th>
                <th>Кількість</th>
                <th>Сума (грн)</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map(s => `
                <tr>
                  <td>${s.id}</td>
                  <td>${s.cashier}</td>
                  <td>${s.product}</td>
                  <td>${s.quantity}</td>
                  <td>${s.total.toFixed(2)}</td>
                  <td>${new Date(s.date).toLocaleString('uk-UA')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Підсумки по продажах:</h3>
            <p>Загальна сума продажів: ${totalSales.toFixed(2)} грн</p>
            <p>Кількість операцій: ${sales.length}</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Автоматизована інформаційна система "Супермаркет"</p>
            <p>Звіт сформовано автоматично. Усі права захищено.</p>
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
          <button className="btn btn-primary" onClick={handlePrint}>
            Попередній перегляд та друк
          </button>
        </div>

        <div style={{ marginTop: '20px' }}></div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <h3>Коротка статистика:</h3>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div>
              <strong>Товарів:</strong> {products.length}
            </div>
            <div>
              <strong>Вартість складу:</strong> {totalValue.toFixed(2)} грн
            </div>
            <div>
              <strong>Продажів:</strong> {sales.length}
            </div>
            <div>
              <strong>Сума продажів:</strong> {totalSales.toFixed(2)} грн
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;