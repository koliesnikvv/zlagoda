from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from reports import report
from db import get_connection
from auth import hash_pass, check_pass, create_token, decode, security
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
import time

app = FastAPI()


@app.on_event("startup")
def startup():
    create_tables()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VAT_RATE = Decimal('0.20')
PROMO_DISCOUNT = Decimal('0.80')


class EmployeeBase(BaseModel):
    id_employee: str = Field(..., max_length=10)
    empl_surname: str = Field(..., max_length=50)
    empl_name: str = Field(..., max_length=50)
    empl_patronymic: Optional[str] = Field(None, max_length=50)
    empl_role: str = Field(..., pattern="^(Manager|Cashier)$")
    salary: Decimal = Field(..., ge=0)
    date_of_birth: date
    date_of_start: date
    phone_number: str = Field(..., max_length=13)
    city: str = Field(..., max_length=50)
    street: str = Field(..., max_length=50)
    zip_code: str = Field(..., max_length=9)

    @validator('date_of_birth')
    def check_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Працівник має бути старше 18 років')  #
        return v


class UserRegister(EmployeeBase):
    password: str = Field(..., min_length=8)
    email: EmailStr


class UserLogin(BaseModel):
    email: str
    password: str


class Category(BaseModel):
    category_number: int
    category_name: str = Field(..., max_length=50)


class Product(BaseModel):
    id_product: int = Field(..., description="PK: ID товару")
    category_number: int = Field(..., description="FK: Номер категорії")
    product_name: str = Field(..., max_length=50)
    manufacturer: str = Field(..., max_length=50)
    characteristics: str = Field(..., max_length=100)


class StoreProduct(BaseModel):
    UPC: str = Field(..., max_length=12)
    UPC_prom: Optional[str] = Field(None, max_length=12)
    id_product: int
    selling_price: Decimal = Field(..., ge=0)
    products_number: int = Field(..., ge=0)
    promotional_product: bool

    @property
    def final_price(self) -> Decimal:
        if self.promotional_product:
            return (self.selling_price * PROMO_DISCOUNT).quantize(Decimal('0.01'))
        return self.selling_price


class CustomerCard(BaseModel):
    card_number: str = Field(..., max_length=13)
    cust_surname: str = Field(..., max_length=50)
    cust_name: str = Field(..., max_length=50)
    cust_patronymic: Optional[str] = Field(None, max_length=50)
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: int


class Check(BaseModel):
    check_number: str = Field(..., max_length=10)
    id_employee: str = Field(..., max_length=10)
    card_number: Optional[str] = Field(None, max_length=13)
    print_date: datetime
    sum_total: Decimal
    vat: Decimal


class Sale(BaseModel):
    UPC: str = Field(..., max_length=12)
    check_number: str = Field(..., max_length=10)
    product_number: int
    selling_price: Decimal


class SaleItemRequest(BaseModel):
    UPC: str
    product_number: int = Field(..., gt=0)


class CheckCreate(BaseModel):
    card_number: Optional[str] = Field(None, max_length=13)
    items: List[SaleItemRequest]


class CheckResponse(BaseModel):
    check_number: str
    id_employee: str
    card_number: Optional[str]
    print_date: datetime
    sum_total: Decimal
    vat: Decimal


def require_manager(user):
    if user["role"] != "Manager":
        raise HTTPException(status_code=403, detail="Доступ дозволено тільки менеджеру")


def require_cashier(user):
    if user["role"] != "Cashier":
        raise HTTPException(status_code=403, detail="Доступ дозволено тільки касиру")


def create_tables():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
                CREATE TABLE  IF NOT EXISTS Category
                (
                    category_number SERIAL PRIMARY KEY,
                    category_name   VARCHAR(50) NOT NULL
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS Product
                (
                    id_product      SERIAL PRIMARY KEY,
                    category_number INT          NOT NULL REFERENCES Category (category_number) ON UPDATE CASCADE ON DELETE NO ACTION,
                    product_name    VARCHAR(50)  NOT NULL,
                    manufacturer    VARCHAR(50)  NOT NULL,
                    characteristics VARCHAR(100) NOT NULL
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS Employee
                (
                    id_employee     VARCHAR(10) PRIMARY KEY,
                    empl_surname    VARCHAR(50)         NOT NULL,
                    empl_name       VARCHAR(50)         NOT NULL,
                    empl_patronymic VARCHAR(50),
                    empl_role       VARCHAR(10)         NOT NULL CHECK (empl_role IN ('Manager', 'Cashier')),
                    salary          DECIMAL(13, 4)      NOT NULL CHECK (salary >= 0),
                    date_of_birth   DATE                NOT NULL,
                    date_of_start   DATE                NOT NULL,
                    phone_number    VARCHAR(13)         NOT NULL,
                    city            VARCHAR(50)         NOT NULL,
                    street          VARCHAR(50)         NOT NULL,
                    zip_code        VARCHAR(9)          NOT NULL,
                    email           VARCHAR(100) UNIQUE NOT NULL,
                    password_hash   TEXT                NOT NULL
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS Store_Product
                (
                    UPC                 VARCHAR(12) PRIMARY KEY,
                    UPC_prom            VARCHAR(12)    REFERENCES Store_Product (UPC) ON UPDATE CASCADE ON DELETE SET NULL,
                    id_product          INT            NOT NULL REFERENCES Product (id_product) ON UPDATE CASCADE ON DELETE NO ACTION,
                    selling_price       DECIMAL(13, 4) NOT NULL CHECK (selling_price >= 0),
                    products_number     INT            NOT NULL CHECK (products_number >= 0),
                    promotional_product BOOLEAN        NOT NULL
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS Customer_Card
                (
                    card_number     VARCHAR(13) PRIMARY KEY,
                    cust_surname    VARCHAR(50) NOT NULL,
                    cust_name       VARCHAR(50) NOT NULL,
                    cust_patronymic VARCHAR(50),
                    phone_number    VARCHAR(13) NOT NULL,
                    city            VARCHAR(50),
                    street          VARCHAR(50),
                    zip_code        VARCHAR(9),
                    percent         INT         NOT NULL CHECK (percent >= 0)
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS "Check"
                (
                    check_number VARCHAR(10) PRIMARY KEY,
                    id_employee  VARCHAR(10)    NOT NULL REFERENCES Employee (id_employee) ON UPDATE CASCADE ON DELETE NO ACTION,
                    card_number  VARCHAR(13) REFERENCES Customer_Card (card_number) ON UPDATE CASCADE ON DELETE NO ACTION,
                    print_date   TIMESTAMP      NOT NULL,
                    sum_total    DECIMAL(13, 4) NOT NULL,
                    vat          DECIMAL(13, 4) NOT NULL
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS Sale
                (
                    UPC            VARCHAR(12)    NOT NULL REFERENCES Store_Product (UPC) ON UPDATE CASCADE ON DELETE NO ACTION,
                    check_number   VARCHAR(10)    NOT NULL REFERENCES "Check" (check_number) ON UPDATE CASCADE ON DELETE CASCADE,
                    product_number INT            NOT NULL,
                    selling_price  DECIMAL(13, 4) NOT NULL,
                    PRIMARY KEY (UPC, check_number)
                );
                """)

    conn.commit()
    conn.close()


@app.get("/reports/total-sales")
def get_total_sales_report(start_date: date, end_date: date,
                           credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
                SELECT SUM(sum_total) as total_revenue, SUM(vat) as total_vat
                FROM "Check"
                WHERE print_date BETWEEN %s AND %s
                """, (start_date, end_date))

    result = cur.fetchone()
    conn.close()

    return {
        "revenue": result[0] or 0,
        "vat": result[1] or 0
    }


def generate_check_number():
    return str(int(time.time()))[:10]


@app.post("/checks")
def create_check(data: CheckCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)

    conn = get_connection()
    cur = conn.cursor()

    try:
        check_id = generate_check_number()
        total_sum = Decimal('0.00')

        sale_items = []

        for item in data.items:
            cur.execute("SELECT selling_price, products_number FROM Store_Product WHERE UPC = %s", (item.UPC,))
            prod = cur.fetchone()
            if not prod or prod[1] < item.product_number:
                raise HTTPException(status_code=400, detail=f"Товару {item.UPC} недостатньо")

            price = prod[0]
            total_sum += price * item.product_number
            sale_items.append((item.UPC, check_id, item.product_number, price))

        vat = total_sum * Decimal('0.2')

        cur.execute(
            'INSERT INTO "Check" (check_number, id_employee, card_number, print_date, sum_total, vat) VALUES (%s, %s, %s, %s, %s, %s)',
            (check_id, user["user_id"], data.card_number, datetime.now(), total_sum, vat)
        )

        for sale in sale_items:
            cur.execute(
                "INSERT INTO Sale (UPC, check_number, product_number, selling_price) VALUES (%s, %s, %s, %s)",
                sale
            )
            cur.execute(
                "UPDATE Store_Product SET products_number = products_number - %s WHERE UPC = %s",
                (sale[2], sale[0])
            )

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    return {"message": "Чек створено", "check_number": check_id}


@app.post("/login")
def login(user: UserLogin):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute('''
                SELECT "id_employee", "password_hash", "empl_role", "empl_name"
                FROM Employee
                WHERE "email" = %s
                ''', (user.email,))

    result = cur.fetchone()
    conn.close()

    if not result:
        raise HTTPException(status_code=401, detail="Користувача з таким email не знайдено")

    id_employee, hashed_password, role, name = result

    if not check_pass(user.password, hashed_password):
        raise HTTPException(status_code=401, detail="Невірний пароль")

    token = create_token({
        "user_id": id_employee,
        "role": role,
        "email": user.email,
        "name": name
    })

    return {"token": token, "role": role, "name": name}


@app.post("/register")
def register(user: UserRegister, credentials: HTTPAuthorizationCredentials = Depends(security)):
    admin = decode(credentials.credentials)
    require_manager(admin)

    conn = get_connection()
    cur = conn.cursor()
    hashed = hash_pass(user.password)

    try:
        cur.execute(
            """INSERT INTO Employee (id_employee, email, empl_surname, empl_name, empl_patronymic,
                                     empl_role, salary, date_of_birth, date_of_start, phone_number, city, street,
                                     zip_code, password_hash)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (user.id_employee, user.email, user.empl_surname, user.empl_name, user.empl_patronymic,
             user.role, user.salary, user.date_of_birth, user.date_of_start,
             user.phone_number, user.city, user.street, user.zip_code, hashed)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Працівник з таким Email вже існує")
    finally:
        conn.close()

    return {"message": "Працівника успішно зареєстровано"}


@app.get("/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return decode(credentials.credentials)


@app.get("/users")
def get_users(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()


    cur.execute("""
                SELECT id_employee,
                       empl_surname,
                       empl_name,
                       empl_patronymic,
                       empl_role,
                       salary,
                       phone_number,
                       email
                FROM employee
                ORDER BY empl_surname ASC
                """)
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id_employee": r[0],
            "surname": r[1],
            "name": r[2],
            "patronymic": r[3],
            "role": r[4],
            "salary": float(r[5]),
            "phone": r[6],
            "email": r[7]
        }
        for r in rows
    ]


@app.put("/users/{id_employee}")
def update_user(id_employee: str, updated: UserRegister, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            UPDATE employee
            SET email=%s,
                empl_role=%s,
                empl_surname=%s,
                empl_name=%s,
                empl_patronymic=%s,
                salary=%s,
                phone_number=%s,
                city=%s,
                street=%s,
                zip_code=%s
            WHERE id_employee = %s
            """,
            (
                updated.email, updated.role, updated.empl_surname, updated.empl_name,
                updated.empl_patronymic, updated.salary, updated.phone_number,
                updated.city, updated.street, updated.zip_code, id_employee
            )
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Працівника не знайдено")

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

    return {"message": "Дані працівника оновлено"}


@app.delete("/users/{id_employee}")
def delete_user(id_employee: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("DELETE FROM Employee WHERE id_employee=%s", (id_employee,))

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Працівника не знайдено")

        conn.commit()
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Неможливо видалити працівника (є зв'язані чеки)")
    finally:
        conn.close()

    return {"message": "Працівника видалено"}

@app.post("/store-products")
def add_to_store(item: StoreProduct, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO "Store_Product"
               (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (item.UPC, item.UPC_prom, item.id_product, item.selling_price,
             item.products_number, item.promotional_product)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"message": "Товар додано на склад"}


@app.get("/products")
def get_store_products():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT sp.UPC, p.product_name, sp.selling_price, sp.products_number, sp.promotional_product
                FROM Store_Product sp
                         JOIN Product p ON sp.id_product = p.id_product
                """)
    rows = cur.fetchall()
    conn.close()
    return [
        {"upc": r[0], "name": r[1], "price": float(r[2]), "stock": r[3], "is_promo": r[4]}
        for r in rows
    ]


@app.get("/store-products/{upc}")
def get_store_product_detail(upc: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT sp.UPC, sp.selling_price, sp.products_number, p.product_name, p.characteristics
                FROM "Store_Product" sp
                         JOIN "Product" p ON sp.id_product = p.id_product
                WHERE sp.UPC = %s
                """, (upc,))
    res = cur.fetchone()
    conn.close()

    if not res:
        raise HTTPException(status_code=404, detail="Товар не знайдено")
    return {
        "upc": res[0], "price": float(res[1]), "quantity": res[2],
        "name": res[3], "characteristics": res[4]
    }


@app.put("/store-products/{upc}")
def update_store_product(upc: str, item: StoreProduct, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """UPDATE Store_Product
               SET selling_price       = %s,
                   products_number     = %s,
                   promotional_product = %s,
                   UPC_prom            = %s
               WHERE UPC = %s""",
            (item.selling_price, item.products_number, item.promotional_product, item.UPC_prom, upc)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"message": "Дані на складі оновлено (переоцінка проведена)"}


@app.delete("/store-products/{upc}")
def delete_from_store(upc: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute('DELETE FROM Store_Product WHERE UPC = %s', (upc,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Не вдалося видалити (можливо, товар є в чеках)")
    finally:
        conn.close()
    return {"message": "Товар вилучено зі складу магазину"}


@app.get("/products/simple")
def get_products_simple():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, name FROM Product")
    rows = cur.fetchall()

    conn.close()

    return [{"id": r[0], "name": r[1]} for r in rows]


@app.put("/products/{product_id}")
def update_product(product_id: int, product: Product, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            UPDATE Product
            SET category_number = %s,
                product_name    = %s,
                manufacturer    = %s,
                characteristics = %s
            WHERE id_product = %s
            """,
            (
                product.category_number,
                product.product_name,
                product.manufacturer,
                product.characteristics,
                product_id
            )
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Товар з таким ID не знайдено")

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Помилка оновлення: {str(e)}")
    finally:
        conn.close()

    return {"message": "Дані про товар оновлено"}


@app.delete("/products/{product_id}")
def delete_product(product_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute('DELETE FROM "Product" WHERE id_product = %s', (product_id,))

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Товар не знайдено")

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Неможливо видалити: товар використовується в магазині")
    finally:
        conn.close()

    return {"message": "Товар вилучено з каталогу"}


@app.post("/products")
def create_product(product: Product, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO "Product" (category_number, product_name, manufacturer, characteristics) VALUES (%s, %s, %s, %s)',
        (product.category_number, product.product_name, product.manufacturer, product.characteristics)
    )
    conn.commit()
    conn.close()
    return {"message": "Товар додано"}


@app.post("/sales")
def create_sale_check(data: CheckCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_cashier(user)

    conn = get_connection()
    cur = conn.cursor()
    check_number = generate_check_number()

    try:
        total_sum = Decimal('0.0')
        items_to_save = []

        for item in data.items:
            cur.execute('SELECT selling_price, products_number FROM "Store_Product" WHERE UPC = %s', (item.UPC,))
            res = cur.fetchone()

            if not res:
                raise HTTPException(status_code=404, detail=f"Товар з UPC {item.UPC} не знайдено")

            price, stock = res
            if stock < item.product_number:
                raise HTTPException(status_code=400, detail=f"Недостатньо одиниць товару {item.UPC} на складі")

            total_sum += price * item.product_number
            items_to_save.append((item.UPC, check_number, item.product_number, price))

        vat = total_sum * Decimal('0.2')

        cur.execute(
            """INSERT INTO "Check" (check_number, id_employee, card_number, print_date, sum_total, vat)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (check_number, user["user_id"], data.card_number, datetime.now(), total_sum, vat)
        )
        for sale in items_to_save:
            cur.execute(
                'INSERT INTO "Sale" (UPC, check_number, product_number, selling_price) VALUES (%s, %s, %s, %s)',
                sale
            )
            cur.execute(
                'UPDATE "Store_Product" SET products_number = products_number - %s WHERE UPC = %s',
                (sale[2], sale[0])
            )

        conn.commit()
    except Exception as e:
        conn.rollback()
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    return {"message": "Чек успішно створено", "check_number": check_number, "total": float(total_sum)}


@app.get("/sales")
def get_all_sales_history(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
                SELECT c.check_number, e.empl_surname, c.print_date, c.sum_total, c.vat
                FROM Check c
                         JOIN "Employee" e ON c.id_employee = e.id_employee
                ORDER BY c.print_date DESC
                """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "check_number": r[0],
            "cashier_surname": r[1],
            "date": str(r[2]),
            "total_sum": float(r[3]),
            "vat": float(r[4])
        }
        for r in rows
    ]


@app.get("/report")
def get_sales_report(start_date: str, end_date: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
                SELECT p.product_name,
                       SUM(s.product_number)                   as total_quantity,
                       SUM(s.product_number * s.selling_price) as total_revenue
                FROM Sale s
                         JOIN Store_Product sp ON s.UPC = sp.UPC
                         JOIN Product p ON sp.id_product = p.id_product
                         JOIN Check c ON s.check_number = c.check_number
                WHERE c.print_date BETWEEN %s AND %s
                GROUP BY p.product_name
                """, (start_date, end_date))

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "product_name": r[0],
            "total_sold_units": r[1],
            "total_revenue": float(r[2])
        }
        for r in rows
    ]


@app.get("/report/products")
def get_products_report():
    return report()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
