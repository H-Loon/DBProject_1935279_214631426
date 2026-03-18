import random
from datetime import datetime, timedelta

with open('orders_insert.sql', 'w', encoding='utf-8') as f:
    
    statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
    
    for order_id in range(1, 20001):
        # Pick a random date within the last year
        random_days = random.randint(0, 365)
        order_date = (datetime.now() - timedelta(days=random_days)).strftime('%Y-%m-%d')
        
        status = random.choice(statuses)
        shipper_id = random.randint(1, 500) # Assuming there are 500 shipping companies
        customer_id = random.randint(1, 500) # Assuming there are 500 customers
        employee_id = random.randint(1, 500) # Assuming there are 500 employees
        
        # Write the order row to the file
        f.write(f"INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) ")
        f.write(f"VALUES ({order_id}, '{order_date}', 'Address {order_id}', '{status}', {shipper_id}, {customer_id}, NULL, {employee_id});\n")
        
        # For each order, generate between 1 and 3 items (ORDER_ITEMS)
        num_items = random.randint(1, 3)
        for _ in range(num_items):
            product_id = random.randint(1, 500) # Assuming there are 500 products
            quantity = random.randint(1, 5)
            unit_price = round(random.uniform(10.0, 500.0), 2)
            
            # Write the item row to the file (use ON CONFLICT to avoid duplicates on the composite primary key)
            f.write(f"INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) ")
            f.write(f"VALUES ({quantity}, {unit_price}, {product_id}, {order_id}) ON CONFLICT DO NOTHING;\n")

print("Successfully generated 20,000 orders and their items!")