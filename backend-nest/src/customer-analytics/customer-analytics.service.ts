import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CustomerAnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Знаходить клієнтів, які купили всі товари конкретного виробника.
   * @param manufacturer Назва виробника (наприклад, 'Apple')
   */
  async getLoyalCustomers(manufacturer: string) {
    // 1. Формування тексту SQL-запиту з параметром для безпеки
    const queryText = `
      SELECT cc.cust_surname, cc.cust_name, cc.card_number
      FROM Customer_Card cc
      WHERE NOT EXISTS (
          SELECT p.id_product
          FROM Product p
          WHERE p.manufacturer = $1
          AND NOT EXISTS (
              SELECT s.UPC
              FROM Sale s
              JOIN "Check" ch ON s.check_number = ch.check_number
              JOIN Store_Product sp ON s.UPC = sp.UPC
              WHERE ch.card_number = cc.card_number 
                AND sp.id_product = p.id_product
          )
      );
    `;

    try {
      // 2. Відправка запиту до бази даних через DataSource
      // Параметр [manufacturer] автоматично підставляється замість $1
      const customers = await this.dataSource.query(queryText, [manufacturer]);

      // 3. Обробка відповіді та повернення результату
      return customers;
    } catch (error) {
      // Логування помилок у разі проблем із БД
      console.error('Database Query Error:', error);
      throw new Error('Не вдалося отримати дані про клієнтів');
    }
  }
}