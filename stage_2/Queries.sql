-- ==========================================
-- STAGE B: SQL QUERIES (Queries.sql)
-- BASED ON NEXUSCOMMERCE SCHEMA & UI
-- ==========================================

-- ==========================================
-- REGULAR QUERIES (1-4)
-- ==========================================

-- Query 1: Storefront Featured Products & Ratings (Matches Storefront UI)
-- Purpose: Displays products, their category, supplier, and average customer rating.
-- Complexity: Joins 4 tables, uses aggregation (AVG), handles NULLs with LEFT JOIN.
SELECT 
    p.ProductName, 
    c.CategoryName, 
    s.CompanyName AS SupplierName, 
    ROUND(AVG(pr.Rating), 1) AS AverageRating,
    p.Price
FROM PRODUCTS p
JOIN CATEGORIES c ON p.CategoryID = c.CategoryID
JOIN SUPPLIERS s ON p.SupplierID = s.SupplierID
LEFT JOIN PRODUCT_REVIEWS pr ON p.ProductID = pr.ProductID
GROUP BY p.ProductID, p.ProductName, c.CategoryName, s.CompanyName, p.Price
ORDER BY AverageRating DESC;


-- Query 2: Monthly Revenue Report (Date Extraction Requirement)
-- Purpose: Calculates total revenue per month and year from delivered orders.
-- Complexity: Joins 2 tables, extracts Year and Month from DATE field, uses math (Qty * Price).
SELECT 
    EXTRACT(YEAR FROM o.OrderDate) AS OrderYear,
    EXTRACT(MONTH FROM o.OrderDate) AS OrderMonth,
    COUNT(DISTINCT o.OrderID) AS TotalOrders,
    SUM(oi.Quantity * oi.UnitPrice) AS TotalRevenue
FROM ORDERS o
JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID
WHERE o.Status = 'Delivered'
GROUP BY EXTRACT(YEAR FROM o.OrderDate), EXTRACT(MONTH FROM o.OrderDate)
ORDER BY OrderYear DESC, OrderMonth DESC;


-- Query 3: HR Employee Directory (Matches HR & Fulfillment UI)
-- Purpose: Shows employee details, their assigned warehouse location, and hiring year.
-- Complexity: Joins 2 tables, extracts data from DATE field, sorts for HR view.
SELECT 
    e.FirstName, 
    e.LastName, 
    e.Role, 
    w.Location AS AssignedWarehouseLocation, 
    EXTRACT(YEAR FROM e.HireDate) AS HireYear
FROM EMPLOYEES e
JOIN WAREHOUSES w ON e.WarehouseID = w.WarehouseID
ORDER BY e.HireDate ASC;


-- Query 4: Detailed Customer Checkout History (Matches Checkout UI)
-- Purpose: Shows a history of a customer's orders, the shipper used, and if a coupon was applied.
-- Complexity: Joins 4 tables, filters by specific conditions, handles optional foreign keys (CouponID).
SELECT 
    c.FirstName || ' ' || c.LastName AS CustomerName,
    o.OrderDate,
    sh.CompanyName AS ShippingMethod,
    cp.DiscountPercent AS CouponDiscount
FROM ORDERS o
JOIN CUSTOMERS c ON o.CustomerID = c.CustomerID
JOIN SHIPPERS sh ON o.ShipperID = sh.ShipperID
LEFT JOIN COUPONS cp ON o.CouponID = cp.CouponID
WHERE o.Status IN ('Processing', 'Shipped')
ORDER BY o.OrderDate DESC;


-- ==========================================
-- DOUBLE QUERIES FOR EFFICIENCY COMPARISON (5-8)
-- ==========================================

-- ------------------------------------------
-- Query 5: Customers who used expired coupons
-- Purpose: Security/Logic check to find customers who placed orders with expired coupons.
-- ------------------------------------------

-- Query 5A: Using IN with Subquery (Less Efficient)
-- Explanation: The engine evaluates the inner query and builds a list in memory, then scans the outer table against it.
SELECT FirstName, LastName, Email
FROM CUSTOMERS
WHERE CustomerID IN (
    SELECT o.CustomerID
    FROM ORDERS o
    JOIN COUPONS cp ON o.CouponID = cp.CouponID
    WHERE o.OrderDate > cp.ExpiryDate
);

-- Query 5B: Using EXISTS (More Efficient)
-- Explanation: Uses short-circuit evaluation. It stops scanning as soon as it finds the first true condition, saving memory and CPU.
SELECT c.FirstName, c.LastName, c.Email
FROM CUSTOMERS c
WHERE EXISTS (
    SELECT 1
    FROM ORDERS o
    JOIN COUPONS cp ON o.CouponID = cp.CouponID
    WHERE o.CustomerID = c.CustomerID AND o.OrderDate > cp.ExpiryDate
);


-- ------------------------------------------
-- Query 6: Products Priced Above Their Category Average
-- Purpose: Pricing analysis dashboard.
-- ------------------------------------------

-- Query 6A: Using Correlated Subquery in WHERE (Less Efficient)
-- Explanation: The subquery runs for EVERY single row in the PRODUCTS table. If you have 10k products, it runs 10k times.
SELECT p1.ProductName, c.CategoryName, p1.Price
FROM PRODUCTS p1
JOIN CATEGORIES c ON p1.CategoryID = c.CategoryID
WHERE p1.Price > (
    SELECT AVG(Price) 
    FROM PRODUCTS p2 
    WHERE p2.CategoryID = p1.CategoryID
)
ORDER BY c.CategoryName, p1.Price DESC;

-- Query 6B: Using JOIN with Derived Table / Inline View (More Efficient)
-- Explanation: The average is calculated just ONCE per category in a temporary memory table, and then joined. Extremely fast for large datasets.
SELECT p.ProductName, c.CategoryName, p.Price
FROM PRODUCTS p
JOIN CATEGORIES c ON p.CategoryID = c.CategoryID
JOIN (
    SELECT CategoryID, AVG(Price) as AvgPrice 
    FROM PRODUCTS 
    GROUP BY CategoryID
) AS CatAvg ON p.CategoryID = CatAvg.CategoryID
WHERE p.Price > CatAvg.AvgPrice
ORDER BY c.CategoryName, p.Price DESC;


-- ------------------------------------------
-- Query 7: Shippers unused in the current year
-- Purpose: Supply chain management to see which shipping contracts are inactive.
-- ------------------------------------------

-- Query 7A: Using LEFT JOIN and IS NULL (Less Efficient)
-- Explanation: The database performs a full join, matching all rows, and only then filters out the nulls. Heavy on memory.
SELECT s.CompanyName, s.ContactPhone
FROM SHIPPERS s
LEFT JOIN ORDERS o ON s.ShipperID = o.ShipperID 
                   AND EXTRACT(YEAR FROM o.OrderDate) = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE o.OrderID IS NULL;

-- Query 7B: Using NOT EXISTS (More Efficient)
-- Explanation: It acts as a fast boolean check. It checks the condition and immediately excludes the shipper if a record exists.
SELECT s.CompanyName, s.ContactPhone
FROM SHIPPERS s
WHERE NOT EXISTS (
    SELECT 1 
    FROM ORDERS o 
    WHERE o.ShipperID = s.ShipperID 
      AND EXTRACT(YEAR FROM o.OrderDate) = EXTRACT(YEAR FROM CURRENT_DATE)
);


-- ------------------------------------------
-- Query 8: Top Spending Customer of all time
-- Purpose: Identify VIP customers based on total actual spent money (Qty * UnitPrice).
-- ------------------------------------------

-- Query 8A: Using HAVING with Nested Aggregate Subquery (Less Efficient)
-- Explanation: Groups the entire database twice. Once to find the absolute max total, and again to match the customer to that max total.
SELECT c.FirstName, c.LastName, SUM(oi.Quantity * oi.UnitPrice) AS TotalSpent
FROM CUSTOMERS c
JOIN ORDERS o ON c.CustomerID = o.CustomerID
JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID
GROUP BY c.CustomerID, c.FirstName, c.LastName
HAVING SUM(oi.Quantity * oi.UnitPrice) = (
    SELECT MAX(CustomerTotal) 
    FROM (
        SELECT SUM(oi2.Quantity * oi2.UnitPrice) AS CustomerTotal
        FROM ORDERS o2 
        JOIN ORDER_ITEMS oi2 ON o2.OrderID = oi2.OrderID 
        GROUP BY o2.CustomerID
    ) AS SubQ
);

-- Query 8B: Using ORDER BY and LIMIT (More Efficient & Standard)
-- Explanation: Groups the data only once, sorts it, and plucks the top record. Much lighter on database processing.
-- Note: Change 'LIMIT 1' to 'FETCH FIRST 1 ROWS ONLY' or 'TOP 1' depending on your specific SQL dialect.
SELECT c.FirstName, c.LastName, SUM(oi.Quantity * oi.UnitPrice) AS TotalSpent
FROM CUSTOMERS c
JOIN ORDERS o ON c.CustomerID = o.CustomerID
JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID
GROUP BY c.CustomerID, c.FirstName, c.LastName
ORDER BY TotalSpent DESC
LIMIT 1;
-- ==========================================
-- STAGE B: SQL QUERIES (Queries.sql)
-- BASED ON NEXUSCOMMERCE SCHEMA & UI
-- ==========================================

-- ==========================================
-- REGULAR QUERIES (1-4)
-- ==========================================

-- Query 1: Storefront Featured Products & Ratings (Matches Storefront UI)
-- Purpose: Displays products, their category, supplier, and average customer rating.
-- Complexity: Joins 4 tables, uses aggregation (AVG), handles NULLs with LEFT JOIN.
SELECT 
    p.ProductName, 
    c.CategoryName, 
    s.CompanyName AS SupplierName, 
    ROUND(AVG(pr.Rating), 1) AS AverageRating,
    p.Price
FROM PRODUCTS p
JOIN CATEGORIES c ON p.CategoryID = c.CategoryID
JOIN SUPPLIERS s ON p.SupplierID = s.SupplierID
LEFT JOIN PRODUCT_REVIEWS pr ON p.ProductID = pr.ProductID
GROUP BY p.ProductID, p.ProductName, c.CategoryName, s.CompanyName, p.Price
ORDER BY AverageRating DESC;


-- Query 2: Monthly Revenue Report (Date Extraction Requirement)
-- Purpose: Calculates total revenue per month and year from delivered orders.
-- Complexity: Joins 2 tables, extracts Year and Month from DATE field, uses math (Qty * Price).
SELECT 
    EXTRACT(YEAR FROM o.OrderDate) AS OrderYear,
    EXTRACT(MONTH FROM o.OrderDate) AS OrderMonth,
    COUNT(DISTINCT o.OrderID) AS TotalOrders,
    SUM(oi.Quantity * oi.UnitPrice) AS TotalRevenue
FROM ORDERS o
JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID
WHERE o.Status = 'Delivered'
GROUP BY EXTRACT(YEAR FROM o.OrderDate), EXTRACT(MONTH FROM o.OrderDate)
ORDER BY OrderYear DESC, OrderMonth DESC;


-- Query 3: HR Employee Directory (Matches HR & Fulfillment UI)
-- Purpose: Shows employee details, their assigned warehouse location, and hiring year.
-- Complexity: Joins 2 tables, extracts data from DATE field, sorts for HR view.
SELECT 
    e.FirstName, 
    e.LastName, 
    e.Role, 
    w.Location AS AssignedWarehouseLocation, 
    EXTRACT(YEAR FROM e.HireDate) AS HireYear
FROM EMPLOYEES e
JOIN WAREHOUSES w ON e.WarehouseID = w.WarehouseID
ORDER BY e.HireDate ASC;


-- Query 4: Detailed Customer Checkout History (Matches Checkout UI)
-- Purpose: Shows a history of a customer's orders, the shipper used, and if a coupon was applied.
-- Complexity: Joins 4 tables, filters by specific conditions, handles optional foreign keys (CouponID).
SELECT 
    c.FirstName || ' ' || c.LastName AS CustomerName,
    o.OrderDate,
    sh.CompanyName AS ShippingMethod,
    cp.DiscountPercent AS CouponDiscount
FROM ORDERS o
JOIN CUSTOMERS c ON o.CustomerID = c.CustomerID
JOIN SHIPPERS sh ON o.ShipperID = sh.ShipperID
LEFT JOIN COUPONS cp ON o.CouponID = cp.CouponID
WHERE o.Status IN ('Processing', 'Shipped')
ORDER BY o.OrderDate DESC;


-- ==========================================
-- DOUBLE QUERIES FOR EFFICIENCY COMPARISON (5-8)
-- ==========================================

-- ------------------------------------------
-- Query 5: Customers who used expired coupons
-- Purpose: Security/Logic check to find customers who placed orders with expired coupons.
-- ------------------------------------------

-- Query 5A: Using IN with Subquery (Less Efficient)
-- Explanation: The engine evaluates the inner query and builds a list in memory, then scans the outer table against it.
-- SELECT FirstName, LastName, Email
-- FROM CUSTOMERS
-- WHERE CustomerID IN (
--     SELECT o.CustomerID
--     FROM ORDERS o
--     JOIN COUPONS cp ON o.CouponID = cp.CouponID
--     WHERE o.OrderDate > cp.ExpiryDate
-- );

-- Query 5B: Using EXISTS (More Efficient)
-- Explanation: Uses short-circuit evaluation. It stops scanning as soon as it finds the first true condition, saving memory and CPU.
SELECT c.FirstName, c.LastName, c.Email
FROM CUSTOMERS c
WHERE EXISTS (
    SELECT 1
    FROM ORDERS o
    JOIN COUPONS cp ON o.CouponID = cp.CouponID
    WHERE o.CustomerID = c.CustomerID AND o.OrderDate > cp.ExpiryDate
);


-- ------------------------------------------
-- Query 6: Products Priced Above Their Category Average
-- Purpose: Pricing analysis dashboard.
-- ------------------------------------------

-- Query 6A: Using Correlated Subquery in WHERE (Less Efficient)
-- Explanation: The subquery runs for EVERY single row in the PRODUCTS table. If you have 10k products, it runs 10k times.
-- SELECT p1.ProductName, c.CategoryName, p1.Price
-- FROM PRODUCTS p1
-- JOIN CATEGORIES c ON p1.CategoryID = c.CategoryID
-- WHERE p1.Price > (
--     SELECT AVG(Price) 
--     FROM PRODUCTS p2 
--     WHERE p2.CategoryID = p1.CategoryID
-- )
-- ORDER BY c.CategoryName, p1.Price DESC;

-- Query 6B: Using JOIN with Derived Table / Inline View (More Efficient)
-- Explanation: The average is calculated just ONCE per category in a temporary memory table, and then joined. Extremely fast for large datasets.
SELECT p.ProductName, c.CategoryName, p.Price
FROM PRODUCTS p
JOIN CATEGORIES c ON p.CategoryID = c.CategoryID
JOIN (
    SELECT CategoryID, AVG(Price) as AvgPrice 
    FROM PRODUCTS 
    GROUP BY CategoryID
) AS CatAvg ON p.CategoryID = CatAvg.CategoryID
WHERE p.Price > CatAvg.AvgPrice
ORDER BY c.CategoryName, p.Price DESC;


-- ------------------------------------------
-- Query 7: Shippers unused in the current year
-- Purpose: Supply chain management to see which shipping contracts are inactive.
-- ------------------------------------------

-- Query 7A: Using LEFT JOIN and IS NULL (Less Efficient)
-- Explanation: The database performs a full join, matching all rows, and only then filters out the nulls. Heavy on memory.
-- SELECT s.CompanyName, s.ContactPhone
-- FROM SHIPPERS s
-- LEFT JOIN ORDERS o ON s.ShipperID = o.ShipperID 
--                    AND EXTRACT(YEAR FROM o.OrderDate) = EXTRACT(YEAR FROM CURRENT_DATE)
-- WHERE o.OrderID IS NULL;

-- Query 7B: Using NOT EXISTS (More Efficient)
-- Explanation: It acts as a fast boolean check. It checks the condition and immediately excludes the shipper if a record exists.
SELECT s.CompanyName, s.ContactPhone
FROM SHIPPERS s
WHERE NOT EXISTS (
    SELECT 1 
    FROM ORDERS o 
    WHERE o.ShipperID = s.ShipperID 
      AND EXTRACT(YEAR FROM o.OrderDate) = EXTRACT(YEAR FROM CURRENT_DATE)
);


-- ------------------------------------------
-- Query 8: Top Spending Customer of all time
-- Purpose: Identify VIP customers based on total actual spent money (Qty * UnitPrice).
-- ------------------------------------------

-- Query 8A: Using HAVING with Nested Aggregate Subquery (Less Efficient)
-- Explanation: Groups the entire database twice. Once to find the absolute max total, and again to match the customer to that max total.
SELECT c.FirstName, c.LastName, SUM(oi.Quantity * oi.UnitPrice) AS TotalSpent
FROM CUSTOMERS c
JOIN ORDERS o ON c.CustomerID = o.CustomerID
JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID
GROUP BY c.CustomerID, c.FirstName, c.LastName
HAVING SUM(oi.Quantity * oi.UnitPrice) = (
    SELECT MAX(CustomerTotal) 
    FROM (
        SELECT SUM(oi2.Quantity * oi2.UnitPrice) AS CustomerTotal
        FROM ORDERS o2 
        JOIN ORDER_ITEMS oi2 ON o2.OrderID = oi2.OrderID 
        GROUP BY o2.CustomerID
    ) AS SubQ
);

-- Query 8B: Using ORDER BY and LIMIT (More Efficient & Standard)
-- Explanation: Groups the data only once, sorts it, and plucks the top record. Much lighter on database processing.
-- Note: Change 'LIMIT 1' to 'FETCH FIRST 1 ROWS ONLY' or 'TOP 1' depending on your specific SQL dialect.
SELECT c.FirstName, c.LastName, SUM(oi.Quantity * oi.UnitPrice) AS TotalSpent
FROM CUSTOMERS c
JOIN ORDERS o ON c.CustomerID = o.CustomerID
JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID
GROUP BY c.CustomerID, c.FirstName, c.LastName
ORDER BY TotalSpent DESC
LIMIT 1;

-- ==========================================
-- STAGE B: UPDATE & DELETE QUERIES
-- ==========================================

-- ==========================================
-- 3 UPDATE QUERIES
-- ==========================================

-- UPDATE 1: Price Decrease for a Specific Supplier and Category
-- Purpose: Lowers the price by 15% for all products in 'Category_1' supplied by 'Skinix'.
-- Complexity: Uses subqueries on two different tables (CATEGORIES, SUPPLIERS) to filter the update.
UPDATE PRODUCTS
SET Price = Price * 0.85
WHERE CategoryID IN (
    SELECT CategoryID 
    FROM CATEGORIES 
    WHERE CategoryName = 'Category_1'
)
AND SupplierID IN (
    SELECT SupplierID 
    FROM SUPPLIERS 
    WHERE CompanyName = 'Skinix'
);
-- UPDATE 2: Promote High-Performing Employees
-- Purpose: Adds the prefix 'Senior ' to the role of employees who have successfully delivered more than 50 orders.
-- Complexity: Uses GROUP BY and HAVING in a subquery, and a LIKE condition to prevent double-promotion.
UPDATE EMPLOYEES
SET Role = 'Senior ' || Role
WHERE EmployeeID IN (
    SELECT EmployeeID
    FROM ORDERS
    WHERE Status = 'Delivered'
    GROUP BY EmployeeID
    HAVING COUNT(OrderID) > 5
) 
AND Role NOT LIKE 'Senior %';


-- UPDATE 3: Zero Out Stock for 'Dead' Products
-- Purpose: Sets StockQuantity to 0 for products that haven't been part of any order in the last year.
-- Complexity: Cross-references ORDER_ITEMS and ORDERS using date extraction (EXTRACT YEAR) to find unused products.
UPDATE PRODUCTS
SET StockQuantity = 0
WHERE ProductID NOT IN (
    SELECT DISTINCT oi.ProductID
    FROM ORDER_ITEMS oi
    JOIN ORDERS o ON oi.OrderID = o.OrderID
    WHERE EXTRACT(YEAR FROM o.OrderDate) >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
);


-- ==========================================
-- 3 DELETE QUERIES
-- ==========================================

-- DELETE 1: Remove Expired and Unused Coupons
-- Purpose: Cleans up the database by deleting coupons that have passed their expiry date AND were never used in any order.
-- Complexity: Ensures referential integrity by explicitly checking the ORDERS table before deletion.
DELETE FROM COUPONS
WHERE ExpiryDate < CURRENT_DATE
  AND CouponID NOT IN (
      SELECT DISTINCT CouponID 
      FROM ORDERS 
      WHERE CouponID IS NOT NULL
  );

-- DELETE 2: Remove 1-Star Reviews from Cancelled Orders
-- Purpose: Deletes unfair 1-star reviews if the order for that specific product was cancelled by the customer.
-- Complexity: Joins PRODUCT_REVIEWS, ORDERS, and ORDER_ITEMS to verify the cancellation status of the reviewed product.
DELETE FROM PRODUCT_REVIEWS
WHERE Rating = 1 AND ReviewID IN (
    SELECT pr.ReviewID
    FROM PRODUCT_REVIEWS pr
    JOIN ORDERS o ON pr.CustomerID = o.CustomerID
    JOIN ORDER_ITEMS oi ON o.OrderID = oi.OrderID AND pr.ProductID = oi.ProductID
    WHERE o.Status = 'Cancelled'
);

-- DELETE 3: Purge Inactive/Ghost Customers
-- Purpose: Deletes user accounts registered over 3 years ago if they have zero orders and zero reviews.
-- Complexity: Uses date math on CURRENT_DATE and checks two dependent tables to safely delete records without breaking Foreign Key constraints.
DELETE FROM CUSTOMERS
WHERE EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM RegistrationDate) >= 3
  AND CustomerID NOT IN (SELECT CustomerID FROM ORDERS)
  AND CustomerID NOT IN (SELECT CustomerID FROM PRODUCT_REVIEWS);
