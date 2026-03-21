-- CUSTOMERS
-- EMPLOYEES
-- ORDERS
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (1, '2025-04-10', 'Address 1', 'Shipped', 172, 78, NULL, 259);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (2, '2025-05-30', 'Address 2', 'Shipped', 27, 43, NULL, 151);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (3, '2025-12-23', 'Address 3', 'Delivered', 298, 189, NULL, 257);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (4, '2026-01-29', 'Address 4', 'Pending', 290, 185, NULL, 323);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (5, '2025-09-11', 'Address 5', 'Delivered', 164, 17, NULL, 491);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (6, '2025-03-22', 'Address 6', 'Cancelled', 183, 115, NULL, 257);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (7, '2025-08-14', 'Address 7', 'Cancelled', 225, 219, NULL, 187);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (8, '2025-06-13', 'Address 8', 'Processing', 354, 47, NULL, 167);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (9, '2025-05-11', 'Address 9', 'Shipped', 161, 478, NULL, 251);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (10, '2025-11-24', 'Address 10', 'Delivered', 401, 309, NULL, 2);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (11, '2025-05-31', 'Address 11', 'Processing', 150, 107, NULL, 137);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (12, '2025-03-20', 'Address 12', 'Pending', 298, 168, NULL, 449);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (13, '2025-12-26', 'Address 13', 'Shipped', 242, 492, NULL, 406);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (14, '2025-04-10', 'Address 14', 'Cancelled', 118, 122, NULL, 376);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (15, '2025-10-10', 'Address 15', 'Shipped', 263, 250, NULL, 150);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (16, '2025-07-17', 'Address 16', 'Shipped', 423, 305, NULL, 272);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (17, '2026-02-05', 'Address 17', 'Shipped', 72, 423, NULL, 394);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (18, '2026-02-24', 'Address 18', 'Shipped', 296, 312, NULL, 473);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (19, '2025-10-22', 'Address 19', 'Cancelled', 336, 363, NULL, 22);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (20, '2025-11-27', 'Address 20', 'Shipped', 146, 374, NULL, 109);
INSERT INTO ORDERS (OrderID, OrderDate, ShippingAddress, Status, ShipperID, CustomerID, CouponID, EmployeeID) VALUES (21, '2025-07-17', 'Address 21', 'Shipped', 385, 260, NULL, 227);

-- ORDER_ITEMS
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (5, 303.06, 129, 1) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (3, 436.88, 323, 2) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (5, 499.78, 21, 2) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (4, 12.7, 76, 2) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (1, 172.09, 496, 3) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (4, 59.51, 48, 3) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (4, 448.4, 300, 4) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (3, 309.68, 252, 5) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (5, 316.53, 208, 5) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (2, 143.51, 69, 6) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (3, 411.1, 92, 7) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (3, 89.36, 13, 7) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (5, 445.61, 119, 8) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (3, 296.94, 497, 8) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (3, 199.56, 430, 9) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (2, 324.58, 197, 9) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (2, 63.71, 229, 10) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (5, 28.2, 368, 10) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (2, 339.66, 263, 11) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (1, 434.62, 199, 11) ON CONFLICT DO NOTHING;
INSERT INTO ORDER_ITEMS (Quantity, UnitPrice, ProductID, OrderID) VALUES (3, 318.4, 480, 11) ON CONFLICT DO NOTHING;

-- PRODUCTS
-- SUPPLIERS
-- CATEGORIES

-- SHIPPERS
-- COUPONS
-- WHAREHOUSE
-- PRODUCT_REVIEWS