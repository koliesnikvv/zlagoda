import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'customer_card' })
export class CustomerCard {
  @PrimaryColumn({ name: 'card_number', type: 'varchar', length: 13 })
  cardNumber!: string;

  @Column({ name: 'cust_surname', type: 'varchar', length: 50 })
  custSurname!: string;

  @Column({ name: 'cust_name', type: 'varchar', length: 50 })
  custName!: string;

  @Column({ name: 'cust_patronymic', type: 'varchar', length: 50, nullable: true })
  custPatronymic!: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 13 })
  phoneNumber!: string;

  @Column({ name: 'city', type: 'varchar', length: 50, nullable: true })
  city!: string | null;

  @Column({ name: 'street', type: 'varchar', length: 50, nullable: true })
  street!: string | null;

  @Column({ name: 'zip_code', type: 'varchar', length: 9, nullable: true })
  zipCode!: string | null;

  @Column({ name: 'percent', type: 'int' })
  percent!: number;
}
