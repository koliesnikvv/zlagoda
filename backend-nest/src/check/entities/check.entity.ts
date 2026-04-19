import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'check' })
export class Check {
  @PrimaryColumn({ name: 'check_number', type: 'varchar', length: 10 })
  checkNumber!: string;

  @Column({ name: 'id_employee', type: 'varchar', length: 10 })
  idEmployee!: string;

  @Column({ name: 'card_number', type: 'varchar', length: 13, nullable: true })
  cardNumber!: string | null;

  @Column({ name: 'print_date', type: 'timestamp' })
  printDate!: Date;

  @Column({ name: 'sum_total', type: 'decimal', precision: 13, scale: 4 })
  sumTotal!: string;

  @Column({ name: 'vat', type: 'decimal', precision: 13, scale: 4 })
  vat!: string;
}
