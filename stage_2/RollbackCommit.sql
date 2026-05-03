-- ==========================================
-- Requirement 8: ROLLBACK Demonstration
-- ==========================================

-- 1. Show the initial state of the database before any changes
SELECT productid, productname, price 
FROM products 
WHERE productid = 1;

-- Start the transaction
BEGIN;

-- 2. Perform an update
UPDATE products 
SET price = price + 50 
WHERE productid = 1;

-- 3. Show the state of the database AFTER the update (but before rollback)
-- (The price should reflect the +50 increase)
SELECT productid, productname, price 
FROM products 
WHERE productid = 1;

-- 4. Execute ROLLBACK to cancel the transaction
ROLLBACK;

-- 5. Show the state of the database AFTER the rollback
-- (The price should be back to its original value)
SELECT productid, productname, price 
FROM products 
WHERE productid = 1;


-- ==========================================
-- Requirement 9: COMMIT Demonstration
-- ==========================================

-- 1. Show the initial state of the database before any changes
SELECT employeeid, firstname, hiredate 
FROM employees 
WHERE employeeid = 1;

-- Start the transaction
BEGIN;

-- 2. Perform an update
UPDATE employees 
SET hiredate = hiredate + 1
WHERE employeeid = 1;

-- 3. Show the state of the database AFTER the update (but before commit)
-- (The hiredate should reflect the 1 day increase)
SELECT employeeid, firstname, hiredate 
FROM employees 
WHERE employeeid = 1;

-- 4. Execute COMMIT to save the transaction permanently
COMMIT;

-- 5. Show the state of the database AFTER the commit
-- (The hiredate should remain at the updated value)
SELECT employeeid, firstname, hiredate 
FROM employees 
WHERE employeeid = 1;