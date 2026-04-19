import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'employee' })
export class Employee {
  @PrimaryColumn({ name: 'id_employee', type: 'varchar', length: 10 })
  idEmployee!: string;

  @Column({ name: 'empl_surname', type: 'varchar', length: 50 })
  emplSurname!: string;

  @Column({ name: 'empl_name', type: 'varchar', length: 50 })
  emplName!: string;

  @Column({ name: 'empl_patronymic', type: 'varchar', length: 50, nullable: true })
  emplPatronymic!: string | null;

  @Column({ name: 'empl_role', type: 'varchar', length: 10 })
  emplRole!: 'Manager' | 'Cashier';

  @Column({ name: 'salary', type: 'decimal', precision: 13, scale: 4 })
  salary!: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth!: Date;

  @Column({ name: 'date_of_start', type: 'date' })
  dateOfStart!: Date;

  @Column({ name: 'phone_number', type: 'varchar', length: 13 })
  phoneNumber!: string;

  @Column({ name: 'city', type: 'varchar', length: 50 })
  city!: string;

  @Column({ name: 'street', type: 'varchar', length: 50 })
  street!: string;

  @Column({ name: 'zip_code', type: 'varchar', length: 9 })
  zipCode!: string;

  @Column({ name: 'email', type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;
}
