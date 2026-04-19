import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sale' })
export class Sale {
  @PrimaryColumn({ name: 'upc', type: 'varchar', length: 12 })
  upc!: string;

  @PrimaryColumn({ name: 'check_number', type: 'varchar', length: 10 })
  checkNumber!: string;

  @Column({ name: 'product_number', type: 'int' })
  productNumber!: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 13, scale: 4 })
  sellingPrice!: string;
}
