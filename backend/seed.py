"""
Seed-скрипт: заповнює БД тестовими даними для супермаркету ZLAGODA.
"""
from db import get_connection
from auth import hash_pass
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid
import random

conn = get_connection()
cur = conn.cursor()

print("🌱 Починаємо заповнення бази даних...")

# ── 1. EMPLOYEES ─────────────────────────────────────────────────────────────
print("  → Працівники...")

employees = [
    # (id, surname, name, patronymic, role, salary, dob, dos, phone, city, street, zip, email, password)
    ("CSH001", "Коваленко", "Оксана",    "Петрівна",   "Cashier", Decimal("18500.00"),
     date(1995, 3, 14), date(2021, 9, 1),  "+380671234567", "Київ",    "вул. Хрещатик, 12",    "01001", "kovalenko@zlagoda.com",  "cashier123"),
    ("CSH002", "Мельник",   "Тарас",     "Іванович",   "Cashier", Decimal("17800.00"),
     date(1998, 7, 22), date(2022, 3, 15), "+380502345678", "Київ",    "вул. Велика Васильківська, 45", "03150", "melnyk@zlagoda.com",    "cashier123"),
    ("CSH003", "Бондаренко","Ірина",     "Олексіївна", "Cashier", Decimal("18200.00"),
     date(1993, 11, 5), date(2020, 6, 1),  "+380933456789", "Бровари", "вул. Незалежності, 7",  "07400", "bondarenko@zlagoda.com", "cashier123"),
    ("CSH004", "Гриценко",  "Василь",    "Миколайович","Cashier", Decimal("17500.00"),
     date(2000, 1, 30), date(2023, 1, 10), "+380674567890", "Київ",    "вул. Лесі Українки, 21","01133", "hrytsenko@zlagoda.com",  "cashier123"),
    ("MGR002", "Дяченко",   "Наталія",   "Вікторівна", "Manager", Decimal("35000.00"),
     date(1988, 6, 18), date(2019, 4, 1),  "+380505678901", "Київ",    "вул. Саксаганського, 33","01033", "dyachenko@zlagoda.com",  "manager123"),
]

for emp in employees:
    cur.execute("SELECT 1 FROM Employee WHERE id_employee = %s", (emp[0],))
    if cur.fetchone():
        print(f"     → {emp[0]} вже існує, пропускаємо")
        continue
    cur.execute("""
        INSERT INTO Employee (id_employee, empl_surname, empl_name, empl_patronymic,
                              empl_role, salary, date_of_birth, date_of_start, phone_number,
                              city, street, zip_code, email, password_hash)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (*emp[:13], hash_pass(emp[13])))
print(f"     ✓ додано {len(employees)} працівників")


# ── 2. CATEGORIES ─────────────────────────────────────────────────────────────
print("  → Категорії...")

categories = [
    "Молочна продукція",
    "М'ясо та ковбасні вироби",
    "Хліб та випічка",
    "Овочі та фрукти",
    "Напої",
    "Кондитерські вироби",
    "Крупи та бобові",
    "Консерви",
    "Заморожені продукти",
    "Побутова хімія",
]

cur.execute("SELECT category_name FROM Category")
existing_cats = {r[0] for r in cur.fetchall()}
for name in categories:
    if name not in existing_cats:
        cur.execute("INSERT INTO Category (category_name) VALUES (%s)", (name,))

cur.execute("SELECT category_number, category_name FROM Category ORDER BY category_number")
cat_map = {name: num for num, name in cur.fetchall()}
print(f"     ✓ {len(cat_map)} категорій")


# ── 3. PRODUCTS (catalog) ─────────────────────────────────────────────────────
print("  → Товари (каталог)...")

products = [
    # (category_name, product_name, manufacturer, characteristics)
    ("Молочна продукція",        "Молоко 2.5%",           "Яготинське",    "Пастеризоване, 1 л"),
    ("Молочна продукція",        "Кефір 2.5%",            "Яготинське",    "Пастеризований, 1 л"),
    ("Молочна продукція",        "Масло вершкове 82%",    "Президент",     "Солодковершкове, 200 г"),
    ("Молочна продукція",        "Сир кисломолочний 9%",  "Ферма",         "Жирність 9%, 200 г"),
    ("Молочна продукція",        "Сметана 20%",           "Галичина",      "Натуральна, 400 г"),
    ("М'ясо та ковбасні вироби", "Ковбаса \"Докторська\"", "МʼясоПроф",    "Варена, 1 кг"),
    ("М'ясо та ковбасні вироби", "Сосиски молочні",       "Рафаело",       "Заморожені, 500 г"),
    ("М'ясо та ковбасні вироби", "Куряче філе",           "Наша Ряба",     "Охолоджене, 1 кг"),
    ("М'ясо та ковбасні вироби", "Свинина (шия)",         "Фермерське",    "Охолоджена, 1 кг"),
    ("Хліб та випічка",          "Хліб \"Бородинський\"", "Київхліб",      "Житньо-пшеничний, 700 г"),
    ("Хліб та випічка",          "Батон нарізний",        "Київхліб",      "Пшеничний, 450 г"),
    ("Хліб та випічка",          "Круасан з шоколадом",   "Bimbo",         "Листкове тісто, 75 г"),
    ("Овочі та фрукти",          "Яблука Голден",         "Місцевий фермер","Свіжі, 1 кг"),
    ("Овочі та фрукти",          "Банани",                "Dole",          "Свіжі, 1 кг"),
    ("Овочі та фрукти",          "Помідори черрі",        "Місцевий фермер","Свіжі, 250 г"),
    ("Напої",                    "Вода мінеральна Моршинська", "Моршинська","Газована, 1.5 л"),
    ("Напої",                    "Сік яблучний",          "Садочок",       "Прямого пресування, 1 л"),
    ("Напої",                    "Кола",                  "Coca-Cola",     "Газований напій, 2 л"),
    ("Напої",                    "Чай чорний",            "Lipton",        "25 пакетиків"),
    ("Кондитерські вироби",      "Шоколад \"Корона\"",    "Roshen",        "Молочний, 90 г"),
    ("Кондитерські вироби",      "Печиво \"Юбілейне\"",   "Kraft",         "Цукрове, 400 г"),
    ("Кондитерські вироби",      "Цукерки \"Ведмедик\"",  "Roshen",        "Шоколадні, 200 г"),
    ("Крупи та бобові",          "Гречка ядриця",         "Добробут",      "Смажена, 1 кг"),
    ("Крупи та бобові",          "Рис круглозернистий",   "Добробут",      "Шліфований, 1 кг"),
    ("Крупи та бобові",          "Вівсянка",              "Чумак",         "Швидкого приготування, 500 г"),
    ("Консерви",                 "Тушонка яловича",       "Мʼясний двір",  "ГОСТ, 325 г"),
    ("Консерви",                 "Горошок зелений",       "Чумак",         "Стерилізований, 400 г"),
    ("Консерви",                 "Кукурудза консервована","Бондюель",      "В розсолі, 340 г"),
    ("Заморожені продукти",      "Вареники з картоплею",  "Геліос",        "Заморожені, 900 г"),
    ("Заморожені продукти",      "Піца Маргарита",        "Dr.Oetker",     "Заморожена, 320 г"),
    ("Побутова хімія",           "Порошок Ariel",         "P&G",           "Автомат, 2 кг"),
    ("Побутова хімія",           "Гель для посуду Fairy", "P&G",           "Лимон, 500 мл"),
]

cur.execute("SELECT product_name FROM Product")
existing_prods = {r[0] for r in cur.fetchall()}
added = 0
for cat_name, prod_name, manufacturer, chars in products:
    if prod_name not in existing_prods:
        cur.execute(
            "INSERT INTO Product (category_number, product_name, manufacturer, characteristics) VALUES (%s,%s,%s,%s)",
            (cat_map[cat_name], prod_name, manufacturer, chars)
        )
        added += 1
print(f"     ✓ {added} товарів додано")


# ── 4. STORE_PRODUCTS (склад) ─────────────────────────────────────────────────
print("  → Товари в магазині (склад)...")

cur.execute("SELECT id_product, product_name FROM Product ORDER BY id_product")
prod_map = {name: pid for pid, name in cur.fetchall()}

# (product_name, UPC, price, qty, is_promo)
store_entries = [
    ("Молоко 2.5%",              "482005555123", Decimal("45.90"),  120, False),
    ("Кефір 2.5%",               "482005555234", Decimal("38.50"),   85, False),
    ("Масло вершкове 82%",       "482005555345", Decimal("89.90"),   60, False),
    ("Сир кисломолочний 9%",     "482005555456", Decimal("52.00"),   40, True),   # акція
    ("Сметана 20%",              "482005555567", Decimal("36.00"),   75, False),
    ("Ковбаса \"Докторська\"",   "482005555678", Decimal("185.00"),  30, False),
    ("Сосиски молочні",          "482005555789", Decimal("98.50"),   50, False),
    ("Куряче філе",              "482005555890", Decimal("155.00"),  25, True),   # акція
    ("Свинина (шия)",            "482005555901", Decimal("230.00"),  18, False),
    ("Хліб \"Бородинський\"",    "482005556012", Decimal("32.00"),  200, False),
    ("Батон нарізний",           "482005556123", Decimal("24.50"),  180, False),
    ("Круасан з шоколадом",      "482005556234", Decimal("18.00"),   90, True),   # акція
    ("Яблука Голден",            "482005556345", Decimal("42.00"),  100, False),
    ("Банани",                   "482005556456", Decimal("55.00"),   80, False),
    ("Помідори черрі",           "482005556567", Decimal("78.00"),   35, False),
    ("Вода мінеральна Моршинська","482005556678",Decimal("28.00"),  300, False),
    ("Сік яблучний",             "482005556789", Decimal("67.00"),  120, False),
    ("Кола",                     "482005556890", Decimal("89.00"),   95, False),
    ("Чай чорний",               "482005556901", Decimal("72.00"),   70, False),
    ("Шоколад \"Корона\"",       "482005557012", Decimal("47.50"),  110, True),   # акція
    ("Печиво \"Юбілейне\"",      "482005557123", Decimal("63.00"),   65, False),
    ("Цукерки \"Ведмедик\"",     "482005557234", Decimal("125.00"),  40, False),
    ("Гречка ядриця",            "482005557345", Decimal("58.00"),  150, False),
    ("Рис круглозернистий",      "482005557456", Decimal("48.00"),  130, False),
    ("Вівсянка",                 "482005557567", Decimal("35.00"),  100, False),
    ("Тушонка яловича",          "482005557678", Decimal("92.00"),   45, False),
    ("Горошок зелений",          "482005557789", Decimal("29.00"),  200, False),
    ("Кукурудза консервована",   "482005557890", Decimal("31.50"),  180, False),
    ("Вареники з картоплею",     "482005557901", Decimal("74.00"),   55, False),
    ("Піца Маргарита",           "482005558012", Decimal("145.00"),  30, True),   # акція
    ("Порошок Ariel",            "482005558123", Decimal("289.00"),  40, False),
    ("Гель для посуду Fairy",    "482005558234", Decimal("89.00"),   85, False),
]

# Акційні позиції (не використовуємо UPC_prom у цьому сиді — достатньо promotional_product=True)
promo_link = {}

cur.execute("SELECT UPC FROM Store_Product")
existing_upc = {r[0] for r in cur.fetchall()}
added = 0
for prod_name, upc, price, qty, is_promo in store_entries:
    if upc in existing_upc:
        continue
    pid = prod_map.get(prod_name)
    if not pid:
        continue
    actual_price = (price * Decimal("0.8")).quantize(Decimal("0.01")) if is_promo else price
    cur.execute(
        "INSERT INTO Store_Product (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product) VALUES (%s,%s,%s,%s,%s,%s)",
        (upc, None, pid, actual_price, qty, is_promo)
    )
    existing_upc.add(upc)
    added += 1
print(f"     ✓ {added} позицій на складі")


# ── 5. CUSTOMER CARDS ─────────────────────────────────────────────────────────
print("  → Картки клієнтів...")

cards = [
    ("CC0000000001", "Шевченко",  "Марина",  "Олегівна",  "+380671111111", "Київ",    "вул. Солом'янська, 3",  "03035", 5),
    ("CC0000000002", "Петренко",  "Андрій",  "Сергійович","+380502222222", "Київ",    "вул. Голосіївська, 12", "03039", 10),
    ("CC0000000003", "Іванченко", "Олена",   "Василівна", "+380933333333", "Бровари", "вул. Шевченка, 5",      "07400", 5),
    ("CC0000000004", "Кравченко", "Дмитро",  "Андрійович","+380674444444", "Київ",    "вул. Антоновича, 55",   "03150", 15),
    ("CC0000000005", "Лисенко",   "Світлана","Іванівна",  "+380505555555", "Вишгород","вул. Незалежності, 2",  "07300", 10),
    ("CC0000000006", "Романенко", "Олексій", None,        "+380676666666", "Київ",    None,                    None,   5),
    ("CC0000000007", "Гончаренко","Юлія",    "Борисівна", "+380507777777", "Київ",    "вул. Борщагівська, 10", "03056", 20),
    ("CC0000000008", "Ткаченко",  "Микола",  "Петрович",  "+380678888888", "Ірпінь",  "вул. Університетська, 8","08200", 5),
]

cur.execute("SELECT card_number FROM Customer_Card")
existing_cards = {r[0] for r in cur.fetchall()}
for card in cards:
    if card[0] not in existing_cards:
        cur.execute(
            "INSERT INTO Customer_Card (card_number, cust_surname, cust_name, cust_patronymic, phone_number, city, street, zip_code, percent) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            card
        )
print(f"     ✓ {len(cards)} карток клієнтів")


# ── 6. CHECKS + SALES ─────────────────────────────────────────────────────────
print("  → Чеки та продажі...")

cur.execute("SELECT id_employee FROM Employee WHERE empl_role = 'Cashier'")
cashier_ids = [r[0] for r in cur.fetchall()]

cur.execute("SELECT UPC, selling_price FROM Store_Product")
store_upcs = cur.fetchall()

cur.execute("SELECT card_number FROM Customer_Card")
card_numbers = [r[0] for r in cur.fetchall()]

cur.execute("SELECT COUNT(*) FROM \"Check\"")
existing_checks = cur.fetchone()[0]
if existing_checks > 0:
    print(f"     → вже є {existing_checks} чеків, пропускаємо")
else:
    check_count = 0
    now = datetime.now()

    # Генеруємо 60 чеків за останні 30 днів
    for day_offset in range(30):
        check_date = now - timedelta(days=day_offset)
        checks_per_day = random.randint(1, 4)

        for _ in range(checks_per_day):
            cashier = random.choice(cashier_ids)
            card = random.choice(card_numbers + [None, None, None])  # 25% з карткою
            check_number = uuid.uuid4().hex[:10]
            hour = random.randint(8, 20)
            minute = random.randint(0, 59)
            check_dt = check_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

            # Обираємо 1–5 товарів
            chosen = random.sample(store_upcs, min(random.randint(1, 5), len(store_upcs)))
            total = Decimal("0.00")
            sale_rows = []
            for upc, price in chosen:
                qty = random.randint(1, 4)
                line = Decimal(price) * qty
                total += line
                sale_rows.append((upc, check_number, qty, Decimal(price)))

            # Знижка по картці
            if card:
                cur.execute("SELECT percent FROM Customer_Card WHERE card_number = %s", (card,))
                pct = cur.fetchone()[0]
                total = (total * (1 - Decimal(pct) / 100)).quantize(Decimal("0.01"))

            vat = (total * Decimal("0.20")).quantize(Decimal("0.01"))

            cur.execute(
                'INSERT INTO "Check" (check_number, id_employee, card_number, print_date, sum_total, vat) VALUES (%s,%s,%s,%s,%s,%s)',
                (check_number, cashier, card, check_dt, total, vat)
            )
            for row in sale_rows:
                cur.execute(
                    "INSERT INTO Sale (UPC, check_number, product_number, selling_price) VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                    row
                )
            check_count += 1

    print(f"     ✓ {check_count} чеків зі змістом")

conn.commit()
conn.close()
print("\n✅ База даних успішно заповнена!")
print("\nТестові аккаунти:")
print("  Менеджер : dyachenko@zlagoda.com  / manager123")
print("  Касир 1  : kovalenko@zlagoda.com  / cashier123")
print("  Касир 2  : melnyk@zlagoda.com     / cashier123")
print("  Admin    : admin@zlagoda.com      (існуючий)")
