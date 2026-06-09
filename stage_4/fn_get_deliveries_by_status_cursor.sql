CREATE OR REPLACE FUNCTION public.fn_get_deliveries_by_status_cursor(p_status VARCHAR)
RETURNS refcursor AS $$
DECLARE
    v_ref_cursor refcursor := 'delivery_status_cursor';
    v_count INT;
BEGIN
    -- שימוש ב-Implicit Cursor לבדיקת קיום רשומות בסכמה החיצונית remote_logistics
    SELECT COUNT(*) INTO v_count FROM remote_logistics.deliveries WHERE status = p_status;
    
    IF v_count = 0 THEN
        RAISE NOTICE 'לא נמצאו משלוחים פעילים בסטטוס: %', p_status;
    END IF;

    -- פתיחת ה-Ref Cursor והחזרתו מתוך סכמת remote_logistics
    OPEN v_ref_cursor FOR 
        SELECT d.deliveryid, d.status, d.actualdeliverydate, dp.depotname, dr.rateamount
        FROM remote_logistics.deliveries d
        JOIN remote_logistics.depots dp ON d.depotid = dp.depotid
        JOIN remote_logistics.delivery_rates dr ON d.rateid = dr.rateid
        WHERE d.status = p_status;
        
    RETURN v_ref_cursor;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'שגיאה בפתיחת ה-Cursor עבור הסטטוס %: %', p_status, SQLERRM;
END;
$$ LANGUAGE plpgsql;