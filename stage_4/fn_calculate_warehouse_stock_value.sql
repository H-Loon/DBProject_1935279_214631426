CREATE OR REPLACE FUNCTION public.fn_calculate_warehouse_stock_value(p_warehouse_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_value NUMERIC := 0.0;
    v_warehouse_exists INT;
    
    -- הגדרת Explicit Cursor (סמן מפורש)
    cur_products CURSOR FOR 
        SELECT price, stockquantity 
        FROM public.products 
        WHERE warehouseid = p_warehouse_id;
    
    -- משתנה מסוג רשומה (Record)
    r_prod RECORD;
BEGIN
    -- בדיקה מוקדמת אם המחסן קיים במערכת המקומית
    SELECT COUNT(*) INTO v_warehouse_exists FROM public.warehouses WHERE warehouseid = p_warehouse_id;
    IF v_warehouse_exists = 0 THEN
        RAISE EXCEPTION 'מחסן שמספרו % אינו קיים במערכת', p_warehouse_id;
    END IF;

    -- פתיחה ושימוש בסמן המפורש
    OPEN cur_products;
    LOOP
        FETCH cur_products INTO r_prod;
        EXIT WHEN NOT FOUND; -- תנאי יציאה מהלולאה
        
        -- הסתעפות (Branching)
        IF r_prod.stockquantity > 0 THEN
            v_total_value := v_total_value + (r_prod.price * r_prod.stockquantity);
        ELSE
            RAISE NOTICE 'התראה: נמצא מוצר ללא מלאי זמין במחסן זה.';
        END IF;
    END LOOP;
    CLOSE cur_products;

    RETURN v_total_value;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE NOTICE 'לא נמצאו נתונים עבור המחסן המבוקש.';
        RETURN 0.0;
    WHEN OTHERS THEN
        RAISE NOTICE 'שגיאה בלתי צפויה בפונקציה fn_calculate_warehouse_stock_value: %', SQLERRM;
        RETURN -1.0;
END;
$$ LANGUAGE plpgsql;