DO $$
DECLARE
    v_warehouse_val NUMERIC;
    v_target_warehouse INT := 1;   -- מזהה מחסן מקומי לבדיקה
    v_target_delivery  INT := 101; -- מזהה משלוח חיצוני לבדיקה
BEGIN
    RAISE NOTICE '=== תחילת ריצת תוכנית ראשית 1 ===';

    -- 1. זימון הפונקציה הראשונה וקבלת הערך המוחזר
    v_warehouse_val := public.fn_calculate_warehouse_stock_value(v_target_warehouse);
    RAISE NOTICE 'שווי המלאי המחושב עבור מחסן מספר % הוא: % ש"ח', v_target_warehouse, v_warehouse_val;

    -- 2. זימון הפרוצדורה הראשונה (שתעבוד מול מערכת remote_logistics)
    RAISE NOTICE 'מפעיל פרוצדורה לרישום אירוע חריג למשלוח %...', v_target_delivery;
    CALL public.pr_process_delivery_incident(
        v_target_delivery, 
        'Delay', 
        'עומס תנועה כבד בציר הראשי מונע הגעה בזמן של השליח'
    );

    RAISE NOTICE '=== תוכנית ראשית 1 הסתיימה בהצלחה ===';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'שגיאה קריטית במהלך הרצת תוכנית ראשית 1: %', SQLERRM;
END $$;