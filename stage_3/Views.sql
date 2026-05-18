-- ==========================================
-- VIEW 1: Local Perspective (Shoppy Only)
-- ==========================================
-- This view combines Customers and Orders to show total orders per customer.
CREATE OR REPLACE VIEW v_customer_order_summary AS
SELECT 
    c.CustomerID, 
    c.FirstName, 
    c.LastName, 
    c.Phone,
    COUNT(o.OrderID) AS TotalOrders
FROM CUSTOMERS c
JOIN ORDERS o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerID, c.FirstName, c.LastName, c.Phone;

-- Query 1.1: Find active customers with more than 3 orders
SELECT * FROM v_customer_order_summary WHERE TotalOrders > 3;

-- Query 1.2: Get the top 5 customers with the most orders
SELECT FirstName, LastName, TotalOrders 
FROM v_customer_order_summary 
ORDER BY TotalOrders DESC LIMIT 5;


-- ==========================================
-- VIEW 2: Foreign Perspective (Logistics Only)
-- ==========================================
-- This view looks purely at his logistics system to monitor delivery incidents.
CREATE OR REPLACE VIEW v_delivery_incidents AS
SELECT 
    d.DeliveryID, 
    d.ExternalOrderID AS ShoppyOrderID, 
    d.Status AS DeliveryStatus, 
    i.IncidentType, 
    i.IncidentDate
FROM remote_logistics.DELIVERIES d
JOIN remote_logistics.DELIVERY_INCIDENTS i ON d.DeliveryID = i.DeliveryID;

-- Query 2.1: View all incidents where the delivery failed ('Échouée')
SELECT * FROM v_delivery_incidents WHERE DeliveryStatus = 'Échouée';

-- Query 2.2: Count how many incidents there are of each type
SELECT IncidentType, COUNT(*) as TotalIncidents 
FROM v_delivery_incidents 
GROUP BY IncidentType;


-- ==========================================
-- VIEW 3: Combined Perspective (Shoppy + Logistics)
-- ==========================================
-- This view connects your Orders with his Deliveries to track order status.
CREATE OR REPLACE VIEW v_order_tracking AS
SELECT 
    o.OrderID, 
    o.OrderDate, 
    o.ShippingAddress, 
    d.DeliveryID, 
    d.Status AS DeliveryStatus, 
    d.ActualDeliveryDate
FROM ORDERS o
JOIN remote_logistics.DELIVERIES d ON o.OrderID = d.ExternalOrderID;

-- Query 3.1: See all orders that are currently in transit
SELECT OrderID, ShippingAddress FROM v_order_tracking WHERE DeliveryStatus = 'En transit';

-- Query 3.2: See all delivered orders and when they arrived
SELECT OrderID, ActualDeliveryDate FROM v_order_tracking WHERE DeliveryStatus = 'Livrée';