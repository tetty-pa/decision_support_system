import os
import random
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv


def generate_sales_history(avg_demand, volatility, days=30):
    """
    Generates a realistic sales history based on average demand and volatility.
    Volatility is a percentage (e.g., 0.1 for 10%) that determines the standard deviation.
    """
    std_dev = avg_demand * volatility
    # Generate normally distributed sales data, ensuring no negative values
    sales = np.random.normal(loc=avg_demand, scale=std_dev, size=days)
    return [max(0, round(sale)) for sale in sales]


def populate_db():
    """
    Connects to the database, clears the existing products collection,
    and inserts a new set of sample products.
    """
    # --- 1. Load Configuration ---
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME")

    if not mongo_uri:
        print("Error: MONGO_URI not found in .env file. Please check your configuration.")
        return

    # --- 2. Define Sample Product Templates ---
    # This list defines the characteristics of the products we want to create.
    product_templates = [
        {
            "name": "Хліб 'Нарізний'",
            "avg_demand": 40,
            "volatility": 0.15,  # Low volatility (stable demand)
            "lead_time": 1,
            "service_level": 0.95
        },
        {
            "name": "Морозиво 'Пломбір'",
            "avg_demand": 15,
            "volatility": 0.60,  # High volatility (seasonal/impulse buys)
            "lead_time": 2,
            "service_level": 0.90
        },
        {
            "name": "Кава 'Jacobs' 500г",
            "avg_demand": 25,
            "volatility": 0.25,  # Medium volatility
            "lead_time": 5,  # Long lead time from supplier
            "service_level": 0.97
        },
        {
            "name": "Вода 'Моршинська' 1.5л",
            "avg_demand": 60,
            "volatility": 0.20,
            "lead_time": 1,
            "service_level": 0.98,  # High service level for a critical item
        },
        {
            "name": "Батарейки Duracell AA",
            "avg_demand": 8,
            "volatility": 0.80,  # Very "lumpy" or unpredictable demand
            "lead_time": 7,
            "service_level": 0.95
        }
    ]

    product_documents = []
    for template in product_templates:
        # For each template, generate the full document for the database
        sales_history = generate_sales_history(template["avg_demand"], template["volatility"])

        # Set a realistic starting quantity on hand
        current_quantity = random.randint(template["avg_demand"], template["avg_demand"] * template["lead_time"] * 2)

        product_documents.append({
            "name": template["name"],
            "quantity": current_quantity,
            "sales_history": sales_history,
            "lead_time": template["lead_time"],
            "service_level": template["service_level"]
        })

    # --- 3. Connect to Database and Perform Operations ---
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        products_collection = db["products"]

        # Clear the collection before inserting new data
        print(f"Clearing existing data from '{products_collection.name}' collection...")
        result = products_collection.delete_many({})
        # print(f"Deleted {result.deleted_count} documents.")

        result = db["orders"].delete_many({})
        result = db["users"].delete_many({})


        # Insert the new documents
        # print(f"Inserting {len(product_documents)} new product documents...")
        result = products_collection.insert_many(product_documents)
        # print(f"Successfully inserted {len(result.inserted_ids)} documents.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'client' in locals():
            client.close()
            print("Database connection closed.")


# --- Run the script ---
if __name__ == "__main__":
    populate_db()