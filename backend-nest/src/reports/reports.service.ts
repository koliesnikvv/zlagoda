import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  private addDay(dateStr: string): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  async totalSales(startDate: string, endDate: string, idEmployee?: string) {
    let query = `SELECT COALESCE(SUM(sum_total), 0) AS revenue,
                        COALESCE(SUM(vat), 0) AS vat,
                        COUNT(*) AS checks_count
                 FROM "Check"
                 WHERE print_date >= $1 AND print_date < $2`;
    const params: any[] = [startDate, this.addDay(endDate)];
    if (idEmployee) {
      params.push(idEmployee);
      query += ` AND id_employee = $${params.length}`;
    }
    const rows: any[] = await this.dataSource.query(query, params);
    const r = rows[0];
    return {
      revenue: Number(r.revenue),
      vat: Number(r.vat),
      checks_count: Number(r.checks_count),
    };
  }

  async productSold(upc: string, startDate: string, endDate: string) {
    const rows: any[] = await this.dataSource.query(
      `SELECT COALESCE(SUM(s.product_number), 0) AS units
       FROM Sale s
       JOIN "Check" c ON s.check_number = c.check_number
       WHERE s.UPC = $1 AND c.print_date >= $2 AND c.print_date < $3`,
      [upc, startDate, this.addDay(endDate)],
    );
    return { upc, units_sold: Number(rows[0].units) };
  }

  async salesReport(startDate: string, endDate: string) {
    const rows: any[] = await this.dataSource.query(
      `SELECT p.product_name,
              SUM(s.product_number)                   AS total_quantity,
              SUM(s.product_number * s.selling_price) AS total_revenue
       FROM Sale s
       JOIN Store_Product sp ON s.UPC = sp.UPC
       JOIN Product p ON sp.id_product = p.id_product
       JOIN "Check" c ON s.check_number = c.check_number
       WHERE c.print_date >= $1 AND c.print_date < $2
       GROUP BY p.product_name
       ORDER BY total_revenue DESC`,
      [startDate, this.addDay(endDate)],
    );
    return rows.map((r) => ({
      product_name: r.product_name,
      total_sold_units: Number(r.total_quantity),
      total_revenue: Number(r.total_revenue),
    }));
  }

  async inventoryReport() {
    const rows: any[] = await this.dataSource.query(
      `SELECT sp.UPC, p.product_name, sp.selling_price,
              sp.products_number, sp.promotional_product
       FROM Store_Product sp
       JOIN Product p ON sp.id_product = p.id_product
       ORDER BY p.product_name ASC`,
    );
    const items = rows.map((r) => ({
      upc: r.upc,
      name: r.product_name,
      price: Number(r.selling_price),
      stock: Number(r.products_number),
      is_promo: Boolean(r.promotional_product),
    }));
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    return {
      title: 'Inventory Report',
      date: dateStr,
      products: items,
      total_items: items.reduce((s, i) => s + i.stock, 0),
      total_value: items.reduce((s, i) => s + i.price * i.stock, 0),
    };
  }
}
