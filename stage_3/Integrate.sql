-- ==========================================
-- INTEGRATION SCRIPT: SUPABASE -> LOGISTIC DB
-- ==========================================

-- 1. CLEAN SLATE: Remove any previous broken connections or messy schemas
DROP SERVER IF EXISTS their_system_server CASCADE;
DROP SCHEMA IF EXISTS remote_logistics CASCADE;

-- 2. SETUP: Enable the foreign data wrapper extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 3. CONNECTION: Link to their ngrok TCP tunnel
-- (Update the port number if their ngrok tunnel restarts and assigns a new one)
CREATE SERVER their_system_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
    host '2.tcp.eu.ngrok.io', 
    port '26183', 
    dbname 'LogisticDB'
);

-- 4. AUTHENTICATION: Map your Supabase 'postgres' user to their database credentials
CREATE USER MAPPING FOR postgres
SERVER their_system_server
OPTIONS (user 'postgres', password '26Zakai26!!');

-- 5. ORGANIZATION: Create a dedicated schema (folder) for their logistics tables
CREATE SCHEMA remote_logistics;

-- 6. IMPORT: Pull their tables from their 'public' schema into your new dedicated schema
IMPORT FOREIGN SCHEMA public
FROM SERVER their_system_server
INTO remote_logistics;

-- TEST: Verify the connection works
-- SELECT * FROM remote_logistics.categories LIMIT 5;