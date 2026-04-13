from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from reports import report
from db import get_connection
from auth import hash_pass, check_pass, create_token, decode, security

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

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "cashier"


class UserLogin(BaseModel):
    email: str
    password: str


class Product(BaseModel):
    name: str
    price: float
    stock: int


class SaleRequest(BaseModel):
    product_id: int
    quantity: int


def require_admin(user):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin")


def require_admin_or_manager(user):
    if user["role"] not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="No access")


@app.post("/register")
def register(user: UserRegister):
    conn = get_connection()
    cur = conn.cursor()

    hashed = hash_pass(user.password)

    try:
        cur.execute(
            "INSERT INTO users (email, password, role, full_name) VALUES (%s, %s, %s, %s)",
            (user.email, hashed, user.role, user.full_name)
        )
        conn.commit()
    except:
        conn.close()
        raise HTTPException(status_code=400, detail="User already exists")

    conn.close()
    return {"message": "User created"}


@app.post("/login")
def login(user: UserLogin):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, email, password, role, full_name FROM users WHERE email = %s",
        (user.email,)
    )

    result = cur.fetchone()
    conn.close()

    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id, email, hashed_password, role, full_name = result

    if not check_pass(user.password, hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "user_id": user_id,
        "role": role,
        "email": email,
        "full_name": full_name
    })

    return {"token": token, "role": role, "full_name": full_name}


@app.get("/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return decode(credentials.credentials)

@app.get("/users")
def get_users(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_admin(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, email, role, full_name, created_at FROM users")
    rows = cur.fetchall()

    conn.close()

    return [
        {
            "id": r[0],
            "email": r[1],
            "role": r[2],
            "full_name": r[3],
            "created_at": str(r[4])
        }
        for r in rows
    ]


@app.put("/users/{user_id}")
def update_user(user_id: int, updated: UserRegister, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_admin(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "UPDATE users SET email=%s, role=%s, full_name=%s WHERE id=%s",
        (updated.email, updated.role, updated.full_name, user_id)
    )

    conn.commit()
    conn.close()

    return {"message": "User updated"}


@app.delete("/users/{user_id}")
def delete_user(user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_admin(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
    conn.commit()

    conn.close()
    return {"message": "User deleted"}


@app.get("/products")
def get_products():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, name, price, stock FROM products")
    rows = cur.fetchall()

    conn.close()

    return [
        {"id": r[0], "name": r[1], "price": r[2], "stock": r[3]}
        for r in rows
    ]

@app.get("/products/simple")
def get_products_simple():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, name FROM products")
    rows = cur.fetchall()

    conn.close()

    return [{"id": r[0], "name": r[1]} for r in rows]


@app.post("/products")
def create_product(product: Product, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_admin_or_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO products (name, price, stock) VALUES (%s, %s, %s)",
        (product.name, product.price, product.stock)
    )

    conn.commit()
    conn.close()

    return {"message": "Product created"}


@app.put("/products/{product_id}")
def update_product(product_id: int, product: Product, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_admin_or_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "UPDATE products SET name=%s, price=%s, stock=%s WHERE id=%s",
        (product.name, product.price, product.stock, product_id)
    )

    conn.commit()
    conn.close()

    return {"message": "Updated"}


@app.delete("/products/{product_id}")
def delete_product(product_id: int, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_admin_or_manager(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("DELETE FROM products WHERE id=%s", (product_id,))
    conn.commit()

    conn.close()
    return {"message": "Deleted"}


@app.post("/sales")
def create_sale(sale: SaleRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT price, stock FROM products WHERE id=%s", (sale.product_id,))
    product = cur.fetchone()

    if not product:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    price, stock = product

    if stock < sale.quantity:
        conn.close()
        raise HTTPException(status_code=400, detail="Not enough stock")

    total = price * sale.quantity

    cur.execute(
        "INSERT INTO sales (user_id, product_id, quantity, total_price) VALUES (%s, %s, %s, %s)",
        (user["user_id"], sale.product_id, sale.quantity, total)
    )

    cur.execute(
        "UPDATE products SET stock = stock - %s WHERE id = %s",
        (sale.quantity, sale.product_id)
    )

    conn.commit()
    conn.close()

    return {"message": "Sale completed", "total": total}


@app.get("/sales")
def get_sales():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT s.id, u.full_name, p.name, s.quantity, s.total_price, s.sale_date
        FROM sales s
        JOIN users u ON s.user_id = u.id
        JOIN products p ON s.product_id = p.id
        ORDER BY s.sale_date DESC
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "cashier": r[1],
            "product": r[2],
            "quantity": r[3],
            "total": r[4],
            "date": str(r[5])
        }
        for r in rows
    ]

@app.get("/report")
def report(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = decode(credentials.credentials)
    require_admin(user)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT p.name, SUM(s.quantity), SUM(s.total_price)
        FROM sales s
        JOIN products p ON s.product_id = p.id
        GROUP BY p.name
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "product": r[0],
            "total_sold": r[1],
            "total_money": r[2]
        }
        for r in rows
    ]

def create_tables():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price FLOAT NOT NULL,
        stock INT NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        product_id INT REFERENCES products(id),
        quantity INT NOT NULL,
        total_price FLOAT NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cur.execute("SELECT COUNT(*) FROM products")
    count = cur.fetchone()[0]

    if count == 0:
        cur.execute("""
                    INSERT INTO products (name, price, stock)
                    VALUES ('Молоко', 50, 100),
                           ('Хліб', 25, 200),
                           ('Сир', 120, 50),
                           ('Кава', 200, 30)
                    """)

    conn.commit()
    conn.close()

@app.get("/report/products")
def get_products_report():
    return report()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)