from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from reports import report
from db import get_connection
from auth import hash_pass, check_pass, create_token, decode, security
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime, date, timedelta
from typing import Optional, List
from decimal import Decimal
import uuid

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


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

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
            raise ValueError('Працівник має бути старше 18 років')
        return v

    @validator('phone_number')
    def check_phone(cls, v):
        if not v.startswith('+'):
            raise ValueError("Номер телефону має починатися з '+'")
        if len(v) > 13:
            raise ValueError("Номер телефону не може перевищувати 13 символів, включно з '+'")
        return v


class UserRegister(EmployeeBase):
    password: str = Field(..., min_length=8)
    email: EmailStr


class UserRegisterRequest(BaseModel):
    """Модель для POST /register — поля точно відповідають формі фронтенду."""
    empl_surname: str = Field(..., max_length=50)
    empl_name: str = Field(..., max_length=50)
    empl_patronymic: Optional[str] = Field(None, max_length=50)
    empl_role: str = Field(..., pattern="^(Manager|Cashier)$")
    empl_salary: Decimal = Field(..., ge=0)
    date_of_birth: date
    date_of_start: date
    phone_number: str = Field(..., max_length=13)
    city: str = Field(..., max_length=50)
    street: str = Field(..., max_length=50)
    zip_code: str = Field(..., max_length=9)
    password: str = Field(..., min_length=8)
    email: EmailStr

    @validator('date_of_birth')
    def check_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Працівник має бути старше 18 років')
        return v

    @validator('phone_number')
    def check_phone(cls, v):
        if not v.startswith('+'):
            raise ValueError("Номер телефону має починатися з '+'")
        if len(v) > 13:
            raise ValueError("Номер телефону не може перевищувати 13 символів, включно з '+'")
        return v


class UserUpdate(BaseModel):
    """Модель для PUT /users/{id} — тільки поля які надсилає форма редагування."""
    empl_surname: str = Field(..., max_length=50)
    empl_name: str = Field(..., max_length=50)
    empl_patronymic: Optional[str] = Field(None, max_length=50)
    empl_role: str = Field(..., pattern="^(Manager|Cashier)$")
    empl_salary: Decimal = Field(..., ge=0)
    date_of_birth: date
    phone_number: str = Field(..., max_length=13)
    city: str = Field(..., max_length=50)
    street: str = Field(..., max_length=50)
    zip_code: str = Field(..., max_length=9)
    email: EmailStr

    @validator('date_of_birth')
    def check_age(cls, v):
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError('Працівник має бути старше 18 років')
        return v

    @validator('phone_number')
    def check_phone(cls, v):
        if not v.startswith('+'):
            raise ValueError("Номер телефону має починатися з '+'")
        if len(v) > 13:
            raise ValueError("Номер телефону не може перевищувати 13 символів, включно з '+'")
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class CategoryIn(BaseModel):
    category_name: str = Field(..., max_length=50)


class ProductIn(BaseModel):
    category_number: int
    product_name: str = Field(..., max_length=50)
    manufacturer: str = Field(..., max_length=50)
    characteristics: str = Field(..., max_length=100)


class StoreProductIn(BaseModel):
    UPC: str = Field(..., max_length=12)
    UPC_prom: Optional[str] = Field(None, max_length=12)
    id_product: int
    selling_price: Decimal = Field(..., ge=0)
    products_number: int = Field(..., ge=0)
    promotional_product: bool


class CustomerCardIn(BaseModel):
    card_number: str = Field(..., max_length=13)
    cust_surname: str = Field(..., max_length=50)
    cust_name: str = Field(..., max_length=50)
    cust_patronymic: Optional[str] = Field(None, max_length=50)
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: int = Field(..., ge=0, le=100)

    @validator('phone_number')
    def check_phone(cls, v):
        if not v.startswith('+'):
            raise ValueError("Номер телефону має починатися з '+'")
        if len(v) > 13:
            raise ValueError("Номер телефону не може перевищувати 13 символів, включно з '+'")
        return v


class CustomerCardUpdate(BaseModel):
    cust_surname: str = Field(..., max_length=50)
    cust_name: str = Field(..., max_length=50)
    cust_patronymic: Optional[str] = Field(None, max_length=50)
    phone_number: str = Field(..., max_length=13)
    city: Optional[str] = Field(None, max_length=50)
    street: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=9)
    percent: int = Field(..., ge=0, le=100)


class SaleItemRequest(BaseModel):
    UPC: str
    product_number: int = Field(..., gt=0)


class CheckCreate(BaseModel):
    card_number: Optional[str] = Field(None, max_length=13)
    items: List[SaleItemRequest]


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def require_manager(user):
    if user.get("role") != "Manager":
        raise HTTPException(status_code=403, detail="Доступ дозволено тільки менеджеру")


def require_cashier(user):
    if user.get("role") != "Cashier":
        raise HTTPException(status_code=403, detail="Доступ дозволено тільки касиру")


def require_auth(user):
    if not user:
        raise HTTPException(status_code=401, detail="Потрібна авторизація")


# ---------------------------------------------------------------------------
# Schema initialisation
# ---------------------------------------------------------------------------

def create_tables():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
                CREATE TABLE IF NOT EXISTS Category
                (
                    category_number SERIAL PRIMARY KEY,
                    category_name   VARCHAR(50) NOT NULL
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS Product
                (
                    id_product      SERIAL PRIMARY KEY,
                    category_number INT          NOT NULL REFERENCES Category (category_number)
                                                          ON UPDATE CASCADE ON DELETE NO ACTION,
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
                    date_of_birth   DATE                NOT NULL CHECK (date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')),
                    date_of_start   DATE                NOT NULL,
                    phone_number    VARCHAR(13)         NOT NULL CHECK (char_length(phone_number) <= 13 AND phone_number LIKE '+%%'),
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
                    UPC_prom            VARCHAR(12)    REFERENCES Store_Product (UPC)
                                                       ON UPDATE CASCADE ON DELETE SET NULL,
                    id_product          INT            NOT NULL REFERENCES Product (id_product)
                                                       ON UPDATE CASCADE ON DELETE NO ACTION,
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
                    phone_number    VARCHAR(13) NOT NULL CHECK (char_length(phone_number) <= 13 AND phone_number LIKE '+%%'),
                    city            VARCHAR(50),
                    street          VARCHAR(50),
                    zip_code        VARCHAR(9),
                    percent         INT         NOT NULL CHECK (percent >= 0 AND percent <= 100)
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS "Check"
                (
                    check_number VARCHAR(10) PRIMARY KEY,
                    id_employee  VARCHAR(10)    NOT NULL REFERENCES Employee (id_employee)
                                                ON UPDATE CASCADE ON DELETE NO ACTION,
                    card_number  VARCHAR(13) REFERENCES Customer_Card (card_number)
                                                ON UPDATE CASCADE ON DELETE NO ACTION,
                    print_date   TIMESTAMP      NOT NULL,
                    sum_total    DECIMAL(13, 4) NOT NULL CHECK (sum_total >= 0),
                    vat          DECIMAL(13, 4) NOT NULL CHECK (vat >= 0)
                );
                """)
    cur.execute("""
                CREATE TABLE IF NOT EXISTS Sale
                (
                    UPC            VARCHAR(12)    NOT NULL REFERENCES Store_Product (UPC)
                                                  ON UPDATE CASCADE ON DELETE NO ACTION,
                    check_number   VARCHAR(10)    NOT NULL REFERENCES "Check" (check_number)
                                                  ON UPDATE CASCADE ON DELETE CASCADE,
                    product_number INT            NOT NULL CHECK (product_number > 0),
                    selling_price  DECIMAL(13, 4) NOT NULL CHECK (selling_price >= 0),
                    PRIMARY KEY (UPC, check_number)
                );
                """)

    conn.commit()
    conn.close()


def generate_check_number():
    # 10-символьний унікальний ID (uuid4 hex обрізаний до 10 символів)
    return uuid.uuid4().hex[:10]


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@app.post("/login")
def login(user: UserLogin):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT id_employee, password_hash, empl_role, empl_name, empl_surname
                FROM Employee
                WHERE email = %s
                """, (user.email,))
    result = cur.fetchone()
    conn.close()

    if not result:
        raise HTTPException(status_code=401, detail="Користувача з таким email не знайдено")

    id_employee, hashed_password, role, name, surname = result
    if not check_pass(user.password, hashed_password):
        raise HTTPException(status_code=401, detail="Невірний пароль")

    token = create_token({
        "user_id": id_employee,
        "role": role,
        "email": user.email,
        "name": name,
        "surname": surname,
    })
    return {"token": token, "role": role, "name": name, "surname": surname}


@app.post("/register")
def register(user: UserRegisterRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    admin = decode(credentials.credentials)
    require_manager(admin)

    # Генеруємо короткий унікальний id_employee (max 10 символів)
    new_id = uuid.uuid4().hex[:8].upper()

    conn = get_connection()
    cur = conn.cursor()
    hashed = hash_pass(user.password)
    try:
        cur.execute(
            """INSERT INTO Employee (id_employee, email, empl_surname, empl_name, empl_patronymic,
                                     empl_role, salary, date_of_birth, date_of_start, phone_number,
                                     city, street, zip_code, password_hash)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (new_id, user.email, user.empl_surname, user.empl_name, user.empl_patronymic,
             user.empl_role, user.empl_salary, user.date_of_birth, user.date_of_start,
             user.phone_number, user.city, user.street, user.zip_code, hashed)
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Працівник з таким Email вже існує")
    finally:
        conn.close()
    return {"message": "Працівника успішно зареєстровано", "id_employee": new_id}


@app.get("/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Повертає всю інформацію про поточного користувача (касир req. №15)."""
    user = decode(credentials.credentials)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT id_employee, empl_surname, empl_name, empl_patronymic, empl_role,
                       salary, date_of_birth, date_of_start, phone_number,
                       city, street, zip_code, email
                FROM Employee
                WHERE id_employee = %s
                """, (user["user_id"],))
    row = cur.fetchone()
    conn.close()
    print("Decoded user info:", user)
    print("Fetched user row:", row)
    if not row:
        raise HTTPException(status_code=404, detail="Працівника не знайдено")
    return {
        "id_employee": row[0], "empl_surname": row[1], "empl_name": row[2],
        "empl_patronymic": row[3], "empl_role": row[4], "salary": float(row[5]),
        "date_of_birth": str(row[6]), "date_of_start": str(row[7]),
        "phone_number": row[8], "city": row[9], "street": row[10],
        "zip_code": row[11], "email": row[12],
    }


# ---------------------------------------------------------------------------
# Employees
# ---------------------------------------------------------------------------

@app.get("/users")
def get_users(role: Optional[str] = None, surname: Optional[str] = None,
              credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Менеджер: всі працівники або тільки касири, відсортовані за прізвищем (req. №5, №6, №11)."""
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    query = """SELECT id_employee, empl_surname, empl_name, empl_patronymic, empl_role,
                      salary, phone_number, city, street, zip_code, email,
                      date_of_birth, date_of_start
               FROM Employee WHERE 1=1"""
    params = []
    if role:
        query += " AND empl_role = %s"
        params.append(role)
    if surname:
        query += " AND empl_surname ILIKE %s"
        params.append(f"%{surname}%")
    query += " ORDER BY empl_surname ASC"

    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()
    return [
        {
            # Поля для бекенду / ТЗ
            "id_employee":   r[0],
            "empl_surname":  r[1],
            "empl_name":     r[2],
            "empl_patronymic": r[3],
            "empl_role":     r[4],
            "salary":        float(r[5]),
            "phone_number":  r[6],
            "city":          r[7],
            "street":        r[8],
            "zip_code":      r[9],
            "email":         r[10],
            "date_of_birth": str(r[11]),
            "date_of_start": str(r[12]),
            # Псевдоніми для фронтенду
            "id":         r[0],
            "full_name":  f"{r[1]} {r[2]}" + (f" {r[3]}" if r[3] else ""),
            "role":       r[4],
            "created_at": str(r[12]),
        }
        for r in rows
    ]


@app.get("/users/{id_employee}/contact")
def get_user_contact(id_employee: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Менеджер req. №11: за прізвищем (тут id) знайти телефон та адресу."""
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT phone_number, city, street, zip_code
                FROM Employee
                WHERE id_employee = %s
                """, (id_employee,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Працівника не знайдено")
    return {"phone_number": row[0], "city": row[1], "street": row[2], "zip_code": row[3]}


@app.put("/users/{id_employee}")
def update_user(id_employee: str, updated: UserUpdate,
                credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """UPDATE Employee
               SET email=%s, empl_role=%s, empl_surname=%s, empl_name=%s,
                   empl_patronymic=%s, salary=%s, date_of_birth=%s,
                   phone_number=%s, city=%s, street=%s, zip_code=%s
               WHERE id_employee = %s""",
            (updated.email, updated.empl_role, updated.empl_surname, updated.empl_name,
             updated.empl_patronymic, updated.empl_salary, updated.date_of_birth,
             updated.phone_number, updated.city, updated.street,
             updated.zip_code, id_employee)
        )

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Працівника не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
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
        cur.execute("DELETE FROM Employee WHERE id_employee = %s", (id_employee,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Працівника не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Неможливо видалити працівника (є зв'язані чеки)")
    finally:
        conn.close()
    return {"message": "Працівника видалено"}


# ---------------------------------------------------------------------------
# Categories (TZ: повний CRUD для менеджера)
# ---------------------------------------------------------------------------

@app.get("/categories")
def list_categories(credentials: HTTPAuthorizationCredentials = Depends(security)):
    decode(credentials.credentials)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT category_number, category_name FROM Category ORDER BY category_name ASC")
    rows = cur.fetchall()
    conn.close()
    return [{"category_number": r[0], "category_name": r[1]} for r in rows]


@app.post("/categories")
def create_category(data: CategoryIn, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO Category (category_name) VALUES (%s) RETURNING category_number",
            (data.category_name,)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"category_number": new_id, "category_name": data.category_name}


@app.put("/categories/{category_number}")
def update_category(category_number: int, data: CategoryIn,
                    credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE Category SET category_name = %s WHERE category_number = %s",
            (data.category_name, category_number)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Категорію не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"message": "Категорію оновлено"}


@app.delete("/categories/{category_number}")
def delete_category(category_number: int,
                    credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM Category WHERE category_number = %s", (category_number,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Категорію не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Неможливо видалити: до категорії прив'язані товари")
    finally:
        conn.close()
    return {"message": "Категорію видалено"}


# ---------------------------------------------------------------------------
# Products (каталог)
# ---------------------------------------------------------------------------

@app.get("/catalog")
def list_products(category_number: Optional[int] = None,
                  credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Менеджер №9 / Касир №1, №5: товари (опційно по категорії), відсортовані за назвою."""
    decode(credentials.credentials)
    conn = get_connection()
    cur = conn.cursor()
    query = """SELECT p.id_product, p.category_number, c.category_name,
                      p.product_name, p.manufacturer, p.characteristics
               FROM Product p
               JOIN Category c ON p.category_number = c.category_number
               WHERE 1=1"""
    params = []
    if category_number is not None:
        query += " AND p.category_number = %s"
        params.append(category_number)
    query += " ORDER BY p.product_name ASC"
    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()
    return [
        {"id_product": r[0], "category_number": r[1], "category_name": r[2],
         "product_name": r[3], "manufacturer": r[4], "characteristics": r[5]}
        for r in rows
    ]


@app.post("/catalog")
def create_product(product: ProductIn,
                   credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO Product (category_number, product_name, manufacturer, characteristics)
               VALUES (%s, %s, %s, %s) RETURNING id_product""",
            (product.category_number, product.product_name, product.manufacturer, product.characteristics)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"id_product": new_id, "message": "Товар додано"}


@app.put("/catalog/{product_id}")
def update_product(product_id: int, product: ProductIn,
                   credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """UPDATE Product
               SET category_number = %s, product_name = %s,
                   manufacturer = %s, characteristics = %s
               WHERE id_product = %s""",
            (product.category_number, product.product_name, product.manufacturer,
             product.characteristics, product_id)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Товар не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Помилка оновлення: {str(e)}")
    finally:
        conn.close()
    return {"message": "Дані про товар оновлено"}


@app.delete("/catalog/{product_id}")
def delete_product(product_id: int,
                   credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM Product WHERE id_product = %s", (product_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Товар не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Неможливо видалити: товар використовується в магазині")
    finally:
        conn.close()
    return {"message": "Товар вилучено з каталогу"}


# ---------------------------------------------------------------------------
# Store_Product (товари в магазині)
# ---------------------------------------------------------------------------

@app.get("/products")
def get_store_products(promo: Optional[bool] = None, sort: str = "quantity",
                       category_number: Optional[int] = None):
    """Менеджер №10/15/16, Касир №2/12/13: товари в магазині. sort = name|quantity."""
    conn = get_connection()
    cur = conn.cursor()
    query = """SELECT sp.UPC, p.product_name, sp.selling_price, sp.products_number,
                      sp.promotional_product, p.id_product, p.category_number
               FROM Store_Product sp
               JOIN Product p ON sp.id_product = p.id_product
               WHERE 1=1"""
    params = []
    if promo is not None:
        query += " AND sp.promotional_product = %s"
        params.append(promo)
    if category_number is not None:
        query += " AND p.category_number = %s"
        params.append(category_number)
    if sort == "name":
        query += " ORDER BY p.product_name ASC"
    else:
        query += " ORDER BY sp.products_number DESC"
    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()
    return [
        {"upc": r[0], "name": r[1], "price": float(r[2]), "stock": r[3],
         "is_promo": r[4], "id_product": r[5], "category_number": r[6]}
        for r in rows
    ]


@app.get("/store-products/{upc}")
def get_store_product_detail(upc: str):
    """TZ Менеджер №14 / Касир №14: за UPC — ціна, к-сть, назва, характеристики."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT sp.UPC, sp.selling_price, sp.products_number,
                       p.product_name, p.characteristics, sp.promotional_product
                FROM Store_Product sp
                JOIN Product p ON sp.id_product = p.id_product
                WHERE sp.UPC = %s
                """, (upc,))
    res = cur.fetchone()
    conn.close()
    if not res:
        raise HTTPException(status_code=404, detail="Товар не знайдено")
    return {
        "upc": res[0], "price": float(res[1]), "quantity": res[2],
        "name": res[3], "characteristics": res[4], "is_promo": res[5],
    }


@app.post("/store-products")
def add_to_store(item: StoreProductIn,
                 credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO Store_Product
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


@app.put("/store-products/{upc}")
def update_store_product(upc: str, item: StoreProductIn,
                         credentials: HTTPAuthorizationCredentials = Depends(security)):
    """ТЗ: при надходженні нової партії — переоцінка усього товару (всі рядки з тим самим
       id_product + promotional_product перераховуються на нову ціну)."""
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id_product, selling_price FROM Store_Product WHERE UPC = %s FOR UPDATE",
                    (upc,))
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Товар не знайдено")
        existing_id_product, existing_price = existing

        cur.execute(
            """UPDATE Store_Product
               SET selling_price = %s, products_number = %s,
                   promotional_product = %s, UPC_prom = %s
               WHERE UPC = %s""",
            (item.selling_price, item.products_number, item.promotional_product,
             item.UPC_prom, upc)
        )

        # Переоцінка: якщо ціна змінилась — оновити всі неакційні партії того ж товару.
        if existing_price != item.selling_price and not item.promotional_product:
            cur.execute(
                """UPDATE Store_Product
                   SET selling_price = %s
                   WHERE id_product = %s AND promotional_product = FALSE AND UPC <> %s""",
                (item.selling_price, existing_id_product, upc)
            )
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"message": "Дані на складі оновлено (переоцінка проведена)"}


@app.delete("/store-products/{upc}")
def delete_from_store(upc: str,
                      credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM Store_Product WHERE UPC = %s", (upc,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Товар не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Не вдалося видалити (можливо, товар є в чеках)")
    finally:
        conn.close()
    return {"message": "Товар вилучено зі складу магазину"}


# ---------------------------------------------------------------------------
# Customer cards (TZ: CRUD; оновлення доступне і касирові)
# ---------------------------------------------------------------------------

@app.get("/customer-cards")
def list_customer_cards(percent: Optional[int] = None, surname: Optional[str] = None,
                        credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Менеджер №7/12, Касир №3/6: всі клієнти, опц. фільтр по відсотку/прізвищу."""
    decode(credentials.credentials)
    conn = get_connection()
    cur = conn.cursor()
    query = """SELECT card_number, cust_surname, cust_name, cust_patronymic,
                      phone_number, city, street, zip_code, percent
               FROM Customer_Card WHERE 1=1"""
    params = []
    if percent is not None:
        query += " AND percent = %s"
        params.append(percent)
    if surname:
        query += " AND cust_surname ILIKE %s"
        params.append(f"%{surname}%")
    query += " ORDER BY cust_surname ASC"
    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()
    return [
        {"card_number": r[0], "cust_surname": r[1], "cust_name": r[2],
         "cust_patronymic": r[3], "phone_number": r[4], "city": r[5],
         "street": r[6], "zip_code": r[7], "percent": r[8]}
        for r in rows
    ]


@app.get("/customer-cards/{card_number}")
def get_customer_card(card_number: str,
                      credentials: HTTPAuthorizationCredentials = Depends(security)):
    decode(credentials.credentials)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT card_number, cust_surname, cust_name, cust_patronymic,
                       phone_number, city, street, zip_code, percent
                FROM Customer_Card WHERE card_number = %s
                """, (card_number,))
    r = cur.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="Картку не знайдено")
    return {"card_number": r[0], "cust_surname": r[1], "cust_name": r[2],
            "cust_patronymic": r[3], "phone_number": r[4], "city": r[5],
            "street": r[6], "zip_code": r[7], "percent": r[8]}


@app.post("/customer-cards")
def create_customer_card(card: CustomerCardIn,
                         credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO Customer_Card (card_number, cust_surname, cust_name, cust_patronymic,
                                          phone_number, city, street, zip_code, percent)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (card.card_number, card.cust_surname, card.cust_name, card.cust_patronymic,
             card.phone_number, card.city, card.street, card.zip_code, card.percent)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"message": "Картку клієнта додано"}


@app.put("/customer-cards/{card_number}")
def update_customer_card(card_number: str, card: CustomerCardUpdate,
                         credentials: HTTPAuthorizationCredentials = Depends(security)):
    """TZ: оновлення картки доступне і менеджерові, і касирові."""
    user = decode(credentials.credentials)
    if user.get("role") not in ("Manager", "Cashier"):
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """UPDATE Customer_Card
               SET cust_surname=%s, cust_name=%s, cust_patronymic=%s,
                   phone_number=%s, city=%s, street=%s, zip_code=%s, percent=%s
               WHERE card_number = %s""",
            (card.cust_surname, card.cust_name, card.cust_patronymic, card.phone_number,
             card.city, card.street, card.zip_code, card.percent, card_number)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Картку не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"message": "Картку оновлено"}


@app.delete("/customer-cards/{card_number}")
def delete_customer_card(card_number: str,
                         credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM Customer_Card WHERE card_number = %s", (card_number,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Картку не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Неможливо видалити: до картки прив'язані чеки")
    finally:
        conn.close()
    return {"message": "Картку видалено"}


# ---------------------------------------------------------------------------
# Sales / Checks
# ---------------------------------------------------------------------------

@app.post("/sales")
def create_sale_check(data: CheckCreate,
                      credentials: HTTPAuthorizationCredentials = Depends(security)):
    """ТЗ: створення чеків доступне ТІЛЬКИ касирові."""
    user = decode(credentials.credentials)
    require_cashier(user)

    conn = get_connection()
    cur = conn.cursor()
    check_number = generate_check_number()

    try:
        # Перевіримо картку (якщо є) та її відсоток.
        discount = Decimal('0')
        if data.card_number:
            cur.execute("SELECT percent FROM Customer_Card WHERE card_number = %s",
                        (data.card_number,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Картку клієнта не знайдено")
            discount = Decimal(row[0]) / Decimal('100')

        total_sum = Decimal('0.00')
        items_to_save = []

        for item in data.items:
            cur.execute(
                """SELECT selling_price, products_number, promotional_product
                   FROM Store_Product WHERE UPC = %s FOR UPDATE""",
                (item.UPC,)
            )
            res = cur.fetchone()
            if not res:
                raise HTTPException(status_code=404, detail=f"Товар з UPC {item.UPC} не знайдено")
            price, stock, is_promo = res
            if stock < item.product_number:
                raise HTTPException(status_code=400,
                                    detail=f"Недостатньо одиниць товару {item.UPC} на складі")

            # Акційна знижка вже відображена у selling_price акційного рядка
            # (це закладено в моделі ТЗ — окрема акційна позиція в Store_Product),
            # але якщо запис позначено як акційний без перерахунку — застосовуємо 0.8.
            unit_price = Decimal(price)
            line_total = (unit_price * item.product_number).quantize(Decimal('0.01'))
            total_sum += line_total
            items_to_save.append((item.UPC, check_number, item.product_number, unit_price))

        # Знижка по карті клієнта.
        if discount > 0:
            total_sum = (total_sum * (Decimal('1') - discount)).quantize(Decimal('0.01'))

        vat = (total_sum * VAT_RATE).quantize(Decimal('0.01'))

        cur.execute(
            """INSERT INTO "Check" (check_number, id_employee, card_number, print_date, sum_total, vat)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (check_number, user["user_id"], data.card_number, datetime.now(), total_sum, vat)
        )
        for sale in items_to_save:
            cur.execute(
                """INSERT INTO Sale (UPC, check_number, product_number, selling_price)
                   VALUES (%s, %s, %s, %s)""",
                sale
            )
            cur.execute(
                "UPDATE Store_Product SET products_number = products_number - %s WHERE UPC = %s",
                (sale[2], sale[0])
            )

        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    return {"message": "Чек успішно створено", "check_number": check_number,
            "total": float(total_sum), "vat": float(vat)}


@app.get("/sales")
def get_all_sales_history(start_date: Optional[date] = None, end_date: Optional[date] = None,
                          id_employee: Optional[str] = None, today_only: bool = False,
                          credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Менеджер №17/18, Касир №9/10: плаский список рядків продажів.
    Формат відповіді сумісний з фронтендом: id, cashier, product, quantity, total, date."""
    user = decode(credentials.credentials)

    # Касир бачить тільки свої чеки.
    if user.get("role") == "Cashier":
        id_employee = user["user_id"]

    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT c.check_number,
               e.empl_surname,
               p.product_name,
               s.product_number,
               s.selling_price * s.product_number AS line_total,
               c.print_date
        FROM "Check" c
        JOIN Employee e  ON c.id_employee  = e.id_employee
        JOIN Sale s      ON s.check_number = c.check_number
        JOIN Store_Product sp ON sp.UPC    = s.UPC
        JOIN Product p   ON p.id_product   = sp.id_product
        WHERE 1=1
    """
    params = []
    if today_only:
        query += " AND c.print_date::date = CURRENT_DATE"
    else:
        if start_date:
            query += " AND c.print_date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND c.print_date <= %s"
            params.append(end_date + timedelta(days=1))
    if id_employee:
        query += " AND c.id_employee = %s"
        params.append(id_employee)
    query += " ORDER BY c.print_date DESC"

    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id":       r[0],
            "cashier":  r[1],
            "product":  r[2],
            "quantity": r[3],
            "total":    float(r[4]),
            "date":     str(r[5]),
        }
        for r in rows
    ]


@app.get("/sales/{check_number}")
def get_check_detail(check_number: str,
                     credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Касир №11 / Менеджер №17,18: повна інформація про чек, включно з товарами."""
    user = decode(credentials.credentials)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT c.check_number, c.id_employee, e.empl_surname, c.card_number,
                       c.print_date, c.sum_total, c.vat
                FROM "Check" c
                JOIN Employee e ON c.id_employee = e.id_employee
                WHERE c.check_number = %s
                """, (check_number,))
    head = cur.fetchone()
    if not head:
        conn.close()
        raise HTTPException(status_code=404, detail="Чек не знайдено")

    # Касир може дивитися тільки свої чеки.
    if user.get("role") == "Cashier" and head[1] != user["user_id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Чужий чек")

    cur.execute("""
                SELECT s.UPC, p.product_name, s.product_number, s.selling_price
                FROM Sale s
                JOIN Store_Product sp ON s.UPC = sp.UPC
                JOIN Product p ON sp.id_product = p.id_product
                WHERE s.check_number = %s
                """, (check_number,))
    items = cur.fetchall()
    conn.close()

    return {
        "check_number": head[0],
        "id_employee": head[1],
        "cashier_surname": head[2],
        "card_number": head[3],
        "print_date": str(head[4]),
        "sum_total": float(head[5]),
        "vat": float(head[6]),
        "items": [
            {"upc": i[0], "product_name": i[1],
             "product_number": i[2], "selling_price": float(i[3])}
            for i in items
        ],
    }


@app.delete("/sales/{check_number}")
def delete_check(check_number: str,
                 credentials: HTTPAuthorizationCredentials = Depends(security)):
    """ТЗ: вилучення чеків — лише менеджер."""
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute('DELETE FROM "Check" WHERE check_number = %s', (check_number,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Чек не знайдено")
        conn.commit()
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()
    return {"message": "Чек видалено"}


# ---------------------------------------------------------------------------
# Reports (звіти для менеджера)
# ---------------------------------------------------------------------------

@app.get("/reports/total-sales")
def get_total_sales_report(start_date: date, end_date: date,
                           id_employee: Optional[str] = None,
                           credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Менеджер №19/20: загальна сума продажів за касиром або усіма за період."""
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    query = """SELECT COALESCE(SUM(sum_total), 0) AS revenue,
                      COALESCE(SUM(vat), 0) AS vat,
                      COUNT(*) AS checks_count
               FROM "Check"
               WHERE print_date >= %s AND print_date < %s"""
    params = [start_date, end_date + timedelta(days=1)]
    if id_employee:
        query += " AND id_employee = %s"
        params.append(id_employee)
    cur.execute(query, tuple(params))
    result = cur.fetchone()
    conn.close()
    return {"revenue": float(result[0]), "vat": float(result[1]),
            "checks_count": int(result[2])}


@app.get("/reports/product-sold")
def get_product_sold_report(upc: str, start_date: date, end_date: date,
                            credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Менеджер №21: загальна кількість одиниць конкретного товару за період."""
    user = decode(credentials.credentials)
    require_manager(user)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT COALESCE(SUM(s.product_number), 0)
                FROM Sale s
                JOIN "Check" c ON s.check_number = c.check_number
                WHERE s.UPC = %s AND c.print_date >= %s AND c.print_date < %s
                """, (upc, start_date, end_date + timedelta(days=1)))
    total = cur.fetchone()[0]
    conn.close()
    return {"upc": upc, "units_sold": int(total)}


@app.get("/report")
def get_sales_report(start_date: date, end_date: date,
                     credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Зведений звіт по товарах за період (для друку)."""
    user = decode(credentials.credentials)
    require_manager(user)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT p.product_name,
                       SUM(s.product_number)                   AS total_quantity,
                       SUM(s.product_number * s.selling_price) AS total_revenue
                FROM Sale s
                JOIN Store_Product sp ON s.UPC = sp.UPC
                JOIN Product p ON sp.id_product = p.id_product
                JOIN "Check" c ON s.check_number = c.check_number
                WHERE c.print_date >= %s AND c.print_date < %s
                GROUP BY p.product_name
                ORDER BY total_revenue DESC
                """, (start_date, end_date + timedelta(days=1)))
    rows = cur.fetchall()
    conn.close()
    return [
        {"product_name": r[0], "total_sold_units": int(r[1]),
         "total_revenue": float(r[2])}
        for r in rows
    ]


@app.get("/report/products")
def get_products_report(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_manager(user)
    return report()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
