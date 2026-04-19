import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaInitService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS Category (
        category_number SERIAL PRIMARY KEY,
        category_name   VARCHAR(50) NOT NULL
      );
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS Product (
        id_product      SERIAL PRIMARY KEY,
        category_number INT          NOT NULL REFERENCES Category (category_number)
                                              ON UPDATE CASCADE ON DELETE NO ACTION,
        product_name    VARCHAR(50)  NOT NULL,
        manufacturer    VARCHAR(50)  NOT NULL,
        characteristics VARCHAR(100) NOT NULL
      );
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS Employee (
        id_employee     VARCHAR(10) PRIMARY KEY,
        empl_surname    VARCHAR(50)         NOT NULL,
        empl_name       VARCHAR(50)         NOT NULL,
        empl_patronymic VARCHAR(50),
        empl_role       VARCHAR(10)         NOT NULL CHECK (empl_role IN ('Manager', 'Cashier')),
        salary          DECIMAL(13, 4)      NOT NULL CHECK (salary >= 0),
        date_of_birth   DATE                NOT NULL CHECK (date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')),
        date_of_start   DATE                NOT NULL,
        phone_number    VARCHAR(13)         NOT NULL CHECK (char_length(phone_number) <= 13 AND phone_number LIKE '+%'),
        city            VARCHAR(50)         NOT NULL,
        street          VARCHAR(50)         NOT NULL,
        zip_code        VARCHAR(9)          NOT NULL,
        email           VARCHAR(100) UNIQUE NOT NULL,
        password_hash   TEXT                NOT NULL
      );
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS Store_Product (
        UPC                 VARCHAR(12) PRIMARY KEY,
        UPC_prom            VARCHAR(12)    REFERENCES Store_Product (UPC)
                                           ON UPDATE CASCADE ON DELETE SET NULL,
        id_product          INT            NOT NULL REFERENCES Product (id_product)
                                           ON UPDATE CASCADE ON DELETE NO ACTION,
        selling_price       DECIMAL(13, 4) NOT NULL CHECK (selling_price >= 0),
        products_number     INT            NOT NULL CHECK (products_number >= 0),
        promotional_product BOOLEAN        NOT NULL
      );
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS Customer_Card (
        card_number     VARCHAR(13) PRIMARY KEY,
        cust_surname    VARCHAR(50) NOT NULL,
        cust_name       VARCHAR(50) NOT NULL,
        cust_patronymic VARCHAR(50),
        phone_number    VARCHAR(13) NOT NULL CHECK (char_length(phone_number) <= 13 AND phone_number LIKE '+%'),
        city            VARCHAR(50),
        street          VARCHAR(50),
        zip_code        VARCHAR(9),
        percent         INT         NOT NULL CHECK (percent >= 0 AND percent <= 100)
      );
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "Check" (
        check_number VARCHAR(10) PRIMARY KEY,
        id_employee  VARCHAR(10)    NOT NULL REFERENCES Employee (id_employee)
                                    ON UPDATE CASCADE ON DELETE NO ACTION,
        card_number  VARCHAR(13) REFERENCES Customer_Card (card_number)
                                    ON UPDATE CASCADE ON DELETE NO ACTION,
        print_date   TIMESTAMP      NOT NULL,
        sum_total    DECIMAL(13, 4) NOT NULL CHECK (sum_total >= 0),
        vat          DECIMAL(13, 4) NOT NULL CHECK (vat >= 0)
      );
    `);

    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS Sale (
        UPC            VARCHAR(12)    NOT NULL REFERENCES Store_Product (UPC)
                                      ON UPDATE CASCADE ON DELETE NO ACTION,
        check_number   VARCHAR(10)    NOT NULL REFERENCES "Check" (check_number)
                                      ON UPDATE CASCADE ON DELETE CASCADE,
        product_number INT            NOT NULL CHECK (product_number > 0),
        selling_price  DECIMAL(13, 4) NOT NULL CHECK (selling_price >= 0),
        PRIMARY KEY (UPC, check_number)
      );
    `);
  }
}
