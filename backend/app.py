import os
import re  # Додано для регулярних виразів (валідація username)
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
import pandas as pd
from scipy.stats import norm
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Налаштування
load_dotenv()
app = Flask(__name__)
CORS(app)

# Підключення до MongoDB
mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")
client = MongoClient(mongo_uri)
db = client[db_name]

products_collection = db["products"]
users_collection = db["users"]
suppliers_collection = db["suppliers"]
orders_collection = db["orders"]


# --- Допоміжні функції Валідації ---

def validate_username(username):
    """Перевіряє ім'я користувача (логін)."""
    if not username or len(username) < 3 or len(username) > 20:
        return "Ім'я користувача повинно містити від 3 до 20 символів."
    if not re.match("^[a-zA-Z0-9_]+$", username):
        return "Ім'я користувача може містити лише літери, цифри та знак підкреслення (_)."
    return None  # Немає помилок


def validate_password(password):
    """Перевіряє пароль."""
    if not password or len(password) < 6:
        return "Пароль повинен містити щонайменше 6 символів."
    # Можна додати складніші перевірки (наявність цифр, великих літер тощо)
    return None


def parse_and_validate_sales_history(history_str):
    """Парсить рядок історії продажів та валідує його."""
    if not isinstance(history_str, str):
        # Якщо це вже список (прийшов з PUT), перевіряємо його
        if isinstance(history_str, list):
            if not all(isinstance(n, (int, float)) and n >= 0 for n in history_str):
                return None, "Історія продажів повинна містити лише невід'ємні числа."
            return history_str, None  # Все гаразд
        return [], None  # Повертаємо порожній список, якщо історія не задана або не рядок/список

    # Якщо це рядок, парсимо
    try:
        sales = [int(s.strip()) for s in history_str.split(',') if s.strip().isdigit()]
        if not all(n >= 0 for n in sales):
            return None, "Історія продажів повинна містити лише невід'ємні числа."
        return sales, None
    except ValueError:
        return None, "Некоректний формат історії продажів. Введіть числа через кому."


# --- Допоміжні функції ---
# ... (calculate_analytics без змін) ...
def calculate_analytics(product):
    daily_demand_history = product.get("sales_history", [])
    if len(daily_demand_history) < 2:
        return {
            "avg_daily_demand": pd.Series(daily_demand_history).mean() if daily_demand_history else 0,
            "demand_std_dev": 0,
            "safety_stock": 0,
            "reorder_point": 0
        }
    demand_series = pd.Series(daily_demand_history)
    avg_daily_demand = demand_series.mean()
    demand_std_dev = demand_series.std()
    if pd.isna(demand_std_dev):
        demand_std_dev = 0

    service_level = product.get("service_level", 0.95)  # Відновлено отримання з продукту
    lead_time = product.get("lead_time", 1)

    if not 0 < service_level < 1:
        service_level = 0.95

    z_score = norm.ppf(service_level)
    safety_stock = z_score * demand_std_dev * (lead_time ** 0.5)
    reorder_point = (avg_daily_demand * lead_time) + safety_stock
    return {
        "avg_daily_demand": round(avg_daily_demand, 2),
        "demand_std_dev": round(demand_std_dev, 2),
        "safety_stock": round(safety_stock),
        "reorder_point": round(reorder_point),
        "service_level": service_level
    }


# --- API Автентифікації (з валідацією) ---
@app.route('/api/auth/register', methods=['POST'])
def register_user():
    user_data = request.json
    username = user_data.get('username')
    password = user_data.get('password')
    role = user_data.get('role', 'manager')

    # Валідація username та password
    username_error = validate_username(username)
    if username_error:
        return jsonify({"error": username_error}), 400
    password_error = validate_password(password)
    if password_error:
        return jsonify({"error": password_error}), 400

    if users_collection.find_one({'username': username}):
        return jsonify({"error": "Username already exists"}), 409

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    if role == 'supplier':
        name = user_data.get('name')
        contactInfo = user_data.get('contactInfo')
        # Валідація полів постачальника
        if not name or len(name) < 2:
            return jsonify({"error": "Назва компанії повинна містити щонайменше 2 символи."}), 400
        if not contactInfo or len(contactInfo) < 5:
            return jsonify({"error": "Контактна інформація повинна містити щонайменше 5 символів."}), 400

        user_result = users_collection.insert_one({
            'username': username,
            'password': hashed_password,
            'role': 'supplier'
        })
        new_user_id = user_result.inserted_id
        supplier_result = suppliers_collection.insert_one({
            'userId': new_user_id,
            'name': name,
            'contactInfo': contactInfo
        })
        return jsonify({"message": f"Supplier {username} registered", "userId": str(new_user_id)}), 201
    else:
        is_chief = users_collection.count_documents({'role': {'$in': ['chief', 'manager']}}) == 0
        user_role = 'chief' if is_chief else 'manager'
        user_result = users_collection.insert_one({
            'username': username,
            'password': hashed_password,
            'role': user_role
        })
        return jsonify(
            {"message": f"User {username} registered as {user_role}", "userId": str(user_result.inserted_id)}), 201


# ... (login_user без змін валідації, помилка обробляється і так) ...
@app.route('/api/auth/login', methods=['POST'])
def login_user():
    user_data = request.json
    username = user_data.get('username')
    password = user_data.get('password')
    user = users_collection.find_one({'username': username})
    if user and check_password_hash(user['password'], password):
        return jsonify({
            "message": "Login successful",
            "userId": str(user['_id']),
            "username": user['username'],
            "role": user['role']
        }), 200
    return jsonify({"error": "Invalid username or password"}), 401


# --- API Товарів (Products) (з валідацією) ---
@app.route('/api/products', methods=['GET'])
def get_products():
    pipeline = [
        {'$lookup': {'from': 'suppliers', 'localField': 'supplierId', 'foreignField': '_id', 'as': 'supplierInfo'}},
        {'$unwind': {'path': '$supplierInfo', 'preserveNullAndEmptyArrays': True}},
        {'$project': {'name': 1, 'quantity': 1, 'lead_time': 1, 'service_level': 1, 'sales_history': 1,
                      'supplierId': '$supplierInfo._id', 'supplierName': '$supplierInfo.name'}}
    ]
    products = list(products_collection.aggregate(pipeline))
    for product in products:
        product['_id'] = str(product['_id'])
        if 'supplierId' in product and product['supplierId']:
            product['supplierId'] = str(product['supplierId'])
        analytics = calculate_analytics(product)
        product.update(analytics)
    return jsonify(products)


@app.route('/api/products', methods=['POST'])
def add_product():
    product_data = request.json
    user_id = request.args.get('userId')

    # Базова валідація наявності полів
    name = product_data.get('name')
    quantity_str = product_data.get('quantity')  # Отримуємо як рядок спочатку
    lead_time_str = product_data.get('lead_time')
    sales_history_input = product_data.get('sales_history', '')  # Може бути рядок або список
    service_level_input = product_data.get('service_level', 0.95)

    if not name or quantity_str is None or lead_time_str is None:
        return jsonify({"error": "Назва, кількість та час доставки є обов'язковими."}), 400
    if not user_id:
        return jsonify({"error": "User ID is required to add a product"}), 400

    # Валідація назви
    if len(name) < 2 or len(name) > 100:
        return jsonify({"error": "Назва товару повинна містити від 2 до 100 символів."}), 400

    # Валідація числових полів
    try:
        quantity = int(quantity_str)
        if quantity < 0:
            raise ValueError("Кількість не може бути від'ємною.")
    except (ValueError, TypeError):
        return jsonify({"error": "Кількість повинна бути цілим невід'ємним числом."}), 400

    try:
        lead_time = int(lead_time_str)
        if lead_time <= 0:
            raise ValueError("Час доставки повинен бути позитивним числом.")
    except (ValueError, TypeError):
        return jsonify({"error": "Час доставки повинен бути цілим позитивним числом."}), 400

    try:
        service_level = float(service_level_input)
        if not 0 < service_level < 1:
            service_level = 0.95  # Повертаємо до стандартного, якщо некоректне
    except (ValueError, TypeError):
        service_level = 0.95  # Повертаємо до стандартного, якщо не число

    # Валідація історії продажів
    sales_history, sales_error = parse_and_validate_sales_history(sales_history_input)
    if sales_error:
        return jsonify({"error": sales_error}), 400

    supplier = suppliers_collection.find_one({'userId': ObjectId(user_id)})
    if not supplier:
        return jsonify({"error": "Supplier account not found for this user"}), 404

    # Створюємо документ для збереження з валідованими даними
    new_product_doc = {
        'name': name,
        'quantity': quantity,
        'lead_time': lead_time,
        'service_level': service_level,
        'sales_history': sales_history,
        'supplierId': supplier['_id']
    }

    result = products_collection.insert_one(new_product_doc)
    created_product = products_collection.find_one({"_id": result.inserted_id})

    if created_product:
        created_product['_id'] = str(created_product['_id'])
        if 'supplierId' in created_product:
            created_product['supplierId'] = str(created_product['supplierId'])
    else:
        return jsonify({"error": "Failed to retrieve the newly added product"}), 500

    return jsonify(created_product), 201


@app.route('/api/products/<string:product_id>', methods=['PUT'])
def update_product(product_id):
    update_data = request.json
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    supplier = suppliers_collection.find_one({'userId': ObjectId(user_id)})
    if not supplier:
        return jsonify({"error": "Supplier account not found"}), 404

    product = products_collection.find_one({'_id': ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if product.get('supplierId') != supplier['_id']:
        return jsonify({"error": "Access denied: You do not own this product"}), 403

    # Готуємо дані для оновлення, застосовуючи валідацію до кожного поля
    validated_update = {}

    if 'name' in update_data:
        name = update_data['name']
        if not name or len(name) < 2 or len(name) > 100:
            return jsonify({"error": "Назва товару повинна містити від 2 до 100 символів."}), 400
        validated_update['name'] = name

    if 'quantity' in update_data:
        try:
            quantity = int(update_data['quantity'])
            if quantity < 0:
                raise ValueError("Кількість не може бути від'ємною.")
            validated_update['quantity'] = quantity
        except (ValueError, TypeError):
            return jsonify({"error": "Кількість повинна бути цілим невід'ємним числом."}), 400

    if 'lead_time' in update_data:
        try:
            lead_time = int(update_data['lead_time'])
            if lead_time <= 0:
                raise ValueError("Час доставки повинен бути позитивним числом.")
            validated_update['lead_time'] = lead_time
        except (ValueError, TypeError):
            return jsonify({"error": "Час доставки повинен бути цілим позитивним числом."}), 400

    if 'service_level' in update_data:
        try:
            service_level = float(update_data['service_level'])
            if not 0 < service_level < 1:
                service_level = 0.95
            validated_update['service_level'] = service_level
        except (ValueError, TypeError):
            validated_update['service_level'] = 0.95  # Повертаємо до стандартного

    if 'sales_history' in update_data:
        sales_history, sales_error = parse_and_validate_sales_history(update_data['sales_history'])
        if sales_error:
            return jsonify({"error": sales_error}), 400
        validated_update['sales_history'] = sales_history

    if not validated_update:
        return jsonify({"error": "No valid fields provided for update."}), 400

    result = products_collection.update_one(
        {'_id': ObjectId(product_id)},
        {'$set': validated_update}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Product not found (after check)"}), 404

    return jsonify({"message": "Product updated successfully"})


# ... (delete_product без змін валідації) ...
@app.route('/api/products/<string:product_id>', methods=['DELETE'])
def delete_product(product_id):
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    supplier = suppliers_collection.find_one({'userId': ObjectId(user_id)})
    if not supplier:
        return jsonify({"error": "Supplier account not found"}), 404
    product = products_collection.find_one({'_id': ObjectId(product_id)})
    if not product:
        return jsonify({"error": "Product not found"}), 404
    if product.get('supplierId') != supplier['_id']:
        return jsonify({"error": "Access denied: You do not own this product"}), 403
    result = products_collection.delete_one({'_id': ObjectId(product_id)})
    if result.deleted_count == 0:
        return jsonify({"error": "Product not found (after check)"}), 404
    return jsonify({"message": "Product deleted successfully"})


# --- API Постачальників (Suppliers) ---
@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    suppliers = []
    for supplier in suppliers_collection.find():
        supplier['_id'] = str(supplier['_id'])
        supplier['userId'] = str(supplier['userId'])
        suppliers.append(supplier)
    return jsonify(suppliers)


# --- API Замовлень (Orders) (з валідацією) ---
@app.route('/api/orders', methods=['POST'])
def create_order():
    order_data = request.json
    product_id = order_data.get('productId')
    quantity_str = order_data.get('quantity')
    supplier_id = order_data.get('supplierId')
    product_name = order_data.get('productName')  # Отримуємо ім'я для збереження

    if not product_id or quantity_str is None or not supplier_id or not product_name:
        return jsonify({"error": "Product, quantity, supplier, and product name are required"}), 400

    # Валідація кількості
    try:
        quantity = int(quantity_str)
        if quantity <= 0:
            raise ValueError("Кількість для замовлення повинна бути позитивною.")
    except (ValueError, TypeError):
        return jsonify({"error": "Кількість для замовлення повинна бути цілим позитивним числом."}), 400

    # Перевірка існування productId та supplierId (опціонально, але бажано)
    if not products_collection.find_one({"_id": ObjectId(product_id)}):
        return jsonify({"error": "Product not found"}), 404
    if not suppliers_collection.find_one({"_id": ObjectId(supplier_id)}):
        return jsonify({"error": "Supplier not found"}), 404

    result = orders_collection.insert_one({
        'productId': ObjectId(product_id),
        'productName': product_name,  # Зберігаємо ім'я
        'quantity': quantity,
        'supplierId': ObjectId(supplier_id),
        'status': 'pending_chief_approval',
        'createdAt': datetime.utcnow()
    })
    return jsonify({"message": "Order created and awaits chief approval"}), 201


# ... (get_orders, update_order_status без змін валідації) ...
@app.route('/api/orders', methods=['GET'])
def get_orders():
    pipeline = [
        {'$lookup': {'from': 'suppliers', 'localField': 'supplierId', 'foreignField': '_id', 'as': 'supplierInfo'}},
        {'$unwind': {'path': '$supplierInfo', 'preserveNullAndEmptyArrays': True}},
        {'$project': {'productId': 1, 'productName': 1, 'quantity': 1, 'status': 1, 'createdAt': 1,
                      'supplierName': '$supplierInfo.name'}},
        {'$sort': {'createdAt': -1}}
    ]
    orders = list(orders_collection.aggregate(pipeline))
    for order in orders:
        order['_id'] = str(order['_id'])
        order['productId'] = str(order['productId'])
    return jsonify(orders)


@app.route('/api/orders/<string:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    status_data = request.json
    new_status = status_data.get('status')
    if new_status == 'approved':
        target_status = 'pending_supplier_approval'
    elif new_status == 'rejected':
        target_status = 'rejected_by_chief'
    else:
        return jsonify({"error": "Invalid status update"}), 400
    result = orders_collection.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'status': target_status}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"message": f"Order status updated to {target_status}"})


# --- API для Постачальників (Supplier-specific) ---
@app.route('/api/supplier/products', methods=['GET'])
def get_supplier_products():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    supplier = suppliers_collection.find_one({'userId': ObjectId(user_id)})
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404
    products = []
    for product in products_collection.find({'supplierId': supplier['_id']},
                                            {'name': 1, 'quantity': 1, 'lead_time': 1, 'sales_history': 1,
                                             'supplierId': 1, 'service_level': 1}):
        product['_id'] = str(product['_id'])
        if 'supplierId' in product:
            product['supplierId'] = str(product['supplierId'])
        products.append(product)
    return jsonify(products)


@app.route('/api/supplier/orders', methods=['GET'])
def get_supplier_orders():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    supplier = suppliers_collection.find_one({'userId': ObjectId(user_id)})
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404
    orders = []
    for order in orders_collection.find({
        'supplierId': supplier['_id'],
        'status': 'pending_supplier_approval'
    }):
        order['_id'] = str(order['_id'])
        order['productId'] = str(order['productId'])
        order['supplierId'] = str(order['supplierId'])
        orders.append(order)
    return jsonify(orders)


@app.route('/api/supplier/orders/<string:order_id>/confirm', methods=['PUT'])
def supplier_confirm_order(order_id):
    result = orders_collection.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'status': 'confirmed_by_supplier'}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"message": "Order confirmed"})


@app.route('/api/supplier/orders/<string:order_id>/reject', methods=['PUT'])
def supplier_reject_order(order_id):
    result = orders_collection.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'status': 'rejected_by_supplier'}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"message": "Order rejected"})


# Запуск додатку
if __name__ == '__main__':
    app.run(debug=True, port=5001)

