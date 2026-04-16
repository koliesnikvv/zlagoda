from db import get_connection
from datetime import datetime


def report():
    """Інвентаризаційний звіт по складу: всі товари у магазині з цінами та залишками."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
                SELECT sp.UPC, p.product_name, sp.selling_price,
                       sp.products_number, sp.promotional_product
                FROM Store_Product sp
                JOIN Product p ON sp.id_product = p.id_product
                ORDER BY p.product_name ASC
                """)
    products = cur.fetchall()
    conn.close()

    items = [
        {
            "upc": p[0],
            "name": p[1],
            "price": float(p[2]),
            "stock": int(p[3]),
            "is_promo": bool(p[4]),
        }
        for p in products
    ]

    return {
        "title": "Inventory Report",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "products": items,
        "total_items": sum(i["stock"] for i in items),
        "total_value": sum(i["price"] * i["stock"] for i in items),
    }
