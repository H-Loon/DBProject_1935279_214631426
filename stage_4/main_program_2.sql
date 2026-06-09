DO $$
DECLARE
    v_returned_cursor refcursor;
    v_target_category INT := 3; -- מזהה קטגוריה מקומית לעדכון
    
    -- משתנים לקליטת הנתונים מתוך ה-Cursor במהלך הלולאה
    v_del_id      INT;
    v_del_status  VARCHAR(50);
    v_actual_date DATE;
    v_depot_name  VARCHAR(100);
    v_rate_amount NUMERIC;
BEGIN
    RAISE NOTICE '=== תחילת ריצת תוכנית ראשית 2 ===';

    -- 1. זימון הפרוצדורה השנייה לעדכון מחירים ומלאים מקומיים
    RAISE NOTICE 'מפעיל עדכון מחירים ומלאי לקטגוריה שמספרה %...', v_target_category;
    CALL public.pr_adjust_category_prices_and_stock(v_target_category, 1.05, 20);

    -- 2. זימון הפונקציה השנייה וקבלת ה-Ref Cursor שמביא נתונים מ-remote_logistics
    RAISE NOTICE 'שולף סמן (Cursor) של משלוחים בסטטוס Pending...';
    v_returned_cursor := public.fn_get_deliveries_by_status_cursor('Pending');

    -- לולאת FETCH מפורשת לקריאת רשומות מתוך ה-Cursor שהתקבל
    IF v_returned_cursor IS NOT NULL THEN
        LOOP
            FETCH v_returned_cursor INTO v_del_id, v_del_status, v_actual_date, v_depot_name, v_rate_amount;
            EXIT WHEN NOT FOUND; -- תנאי יציאה מהלולאה
            
            RAISE NOTICE 'פרטי משלוח מעוכב -> מזהה: %, סטטוס: %, מחסן אחראי: %, עלות משלוח: %', 
                v_del_id, v_del_status, v_depot_name, v_rate_amount;
        END LOOP;
        
        -- סגירה מסודרת של ה-Cursor בסיום השימוש
        CLOSE v_returned_cursor;
    ELSE
        RAISE NOTICE 'לא הוחזר סמן תקין מהפונקציה.';
    END IF;

    RAISE NOTICE '=== תוכנית ראשית 2 הסתיימה בהצלחה ===';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'שגיאה קריטית במהלך הרצת תוכנית ראשית 2: %', SQLERRM;
END $$;