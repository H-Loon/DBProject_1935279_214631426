DO $$
DECLARE
    v_warehouse_val NUMERIC;
    v_target_warehouse INT := 1;   -- Local Warehouse ID
    v_target_delivery  INT := 101; -- Foreign Delivery ID
BEGIN
    RAISE NOTICE '=== STARTING MAIN PROGRAM 1 ===';

    -- 1. Call stock calculator function (Local)
    v_warehouse_val := public.fn_calculate_warehouse_stock_value(v_target_warehouse);
    RAISE NOTICE 'Total calculated valuation for Local Warehouse %: % USD', v_target_warehouse, v_warehouse_val;

    -- 2. Call incident logger procedure (Foreign + Local cross-update)
    RAISE NOTICE 'Registering incident report for foreign delivery %...', v_target_delivery;
    CALL public.pr_process_delivery_incident(
        v_target_delivery, 
        'Breakdown', 
        'Transport truck engine overheating on courier route.'
    );

    RAISE NOTICE '=== MAIN PROGRAM 1 COMPLETED SUCCESSFULLY ===';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Critical termination in Main Program 1: %', SQLERRM;
END $$;