import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'product' })
export class Product {
  @PrimaryGeneratedColumn({ name: 'id_product' })
  idProduct!: number;

  @Column({ name: 'category_number', type: 'int' })
  categoryNumber!: number;

  @Column({ name: 'product_name', type: 'varchar', length: 50 })
  productName!: string;

  @Column({ name: 'manufacturer', type: 'varchar', length: 50 })
  manufacturer!: string;

  @Column({ name: 'characteristics', type: 'varchar', length: 100 })
  characteristics!: string;
}
