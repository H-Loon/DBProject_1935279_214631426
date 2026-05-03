-- ==========================================
-- STAGE B: INDEXES
-- ==========================================

-- Index 1: Index on Order Status
-- Motivation: Frequently used in WHERE clauses to filter delivered or cancelled orders.
CREATE INDEX idx_orders_status ON ORDERS(Status);

-- Index 2: Index on Order Date
-- Motivation: Optimizes range queries for monthly/yearly reports and date extractions.
CREATE INDEX idx_orders_orderdate ON ORDERS(OrderDate);

-- Index 3: Index on Product Category (Foreign Key)
-- Motivation: Speeds up UI filtering by category and significantly improves JOIN performance with the CATEGORIES table.
CREATE INDEX idx_products_categoryid ON PRODUCTS(CategoryID);