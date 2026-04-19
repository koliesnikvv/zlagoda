export type TUserRole = "Manager" | "Cashier";

export interface TUser {
  id_employee: number;
  empl_name: string;
  empl_surname: string;
  empl_patronymic: string;
  empl_role: TUserRole;
  salary: number;
  email: string;
  city: string;
  street: string;
  zip_code: string;
  date_of_birth: string;
  phone_number: string;
  date_of_start: string;
}

export interface StoreProduct {
  upc: string;
  id?: number;
  id_product?: number;
  name: string;
  price: number;
  stock: number;
  is_promo: boolean;
}

export interface CartItem extends StoreProduct {
  quantity: number;
}

export interface Sale {
  id: number;
  cashier: string;
  product: string;
  quantity: number;
  total: number;
  date: string;
}

export interface StoreProductFormData {
  upc: string;
  id_product: string;
  price: string;
  quantity: string;
  is_promo: boolean;
}

export interface UserFormData {
  empl_surname: string;
  empl_name: string;
  empl_patronymic: string;
  empl_salary: number | string;
  password: string;
  empl_role: TUserRole;
  city: string;
  street: string;
  zip_code: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
}

export interface EditingUser {
  id_employee: number;
  empl_surname: string;
  empl_name: string;
  empl_patronymic: string;
  empl_salary: number | string;
  empl_role: TUserRole;
  city: string;
  email: string;
  street: string;
  zip_code: string;
  date_of_birth: string;
  phone_number: string;
}
