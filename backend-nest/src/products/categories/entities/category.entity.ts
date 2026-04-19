import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'category' })
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_number' })
  categoryNumber!: number;

  @Column({ name: 'category_name', type: 'varchar', length: 50 })
  categoryName!: string;
}
