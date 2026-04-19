import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'store_product' })
export class StoreProduct {
  @PrimaryColumn({ name: 'upc', type: 'varchar', length: 12 })
  upc!: string;

  @Column({ name: 'upc_prom', type: 'varchar', length: 12, nullable: true })
  upcProm!: string | null;

  @Column({ name: 'id_product', type: 'int' })
  idProduct!: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 13, scale: 4 })
  sellingPrice!: string;

  @Column({ name: 'products_number', type: 'int' })
  productsNumber!: number;

  @Column({ name: 'promotional_product', type: 'boolean' })
  promotionalProduct!: boolean;
}
