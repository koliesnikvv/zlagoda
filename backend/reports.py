from db import get_connection
from datetime import datetime


def report():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
                   SELECT id, name, price, stock
                   FROM products
                   ORDER BY name
                   """)
    products = cursor.fetchall()
    conn.close()

    report = {
        "title": "Inventory Report",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "products": [
            {"id": p[0], "name": p[1], "price": p[2], "stock": p[3]}
            for p in products
        ],
        "total_items": sum(p[3] for p in products),
        "total_value": sum(p[2] * p[3] for p in products)
    }

    return report