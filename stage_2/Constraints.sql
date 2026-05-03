-- ==========================================
-- STAGE B: CONSTRAINTS (ALTER TABLE)
-- ==========================================

-- Constraint 1: Prevent Negative or Zero Prices
-- Purpose: Ensures that a product's price is strictly greater than 0, preventing accidental data entry errors that could lead to financial losses.
ALTER TABLE PRODUCTS 
ADD CONSTRAINT chk_positive_price CHECK (Price > 0);

-- Constraint 2: Prevent Duplicate Coupon Codes
-- Purpose: Ensures that every coupon code in the system is unique. This prevents conflicts and bugs during the checkout process if marketing accidentally creates two coupons with the same text (e.g., 'SUMMER20').
ALTER TABLE COUPONS 
ADD CONSTRAINT uq_coupon_code UNIQUE (CouponCode);

-- Constraint 3: Basic Email Format Validation
-- Purpose: Ensures that any email address entered into the system contains the '@' symbol. This is a basic check to prevent completely invalid or fictional email structures from being saved to the database.
ALTER TABLE CUSTOMERS 
ADD CONSTRAINT chk_valid_email CHECK (Email LIKE '%@%');