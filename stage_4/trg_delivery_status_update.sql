CREATE OR REPLACE FUNCTION public.trg_fn_log_delivery_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_next_id INT;
BEGIN
    -- בדיקה האם חל שינוי ממשי בסטטוס המשלוח החיצוני (UPDATE)
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT COALESCE(MAX(statushistoryid), 0) + 1 INTO v_next_id FROM remote_logistics.delivery_status_history;
        
        -- פקודת DML פנימית המכניסה שורה להיסטוריה של remote_logistics
        INSERT INTO remote_logistics.delivery_status_history (statushistoryid, deliveryid, status, changeddate)
        VALUES (v_next_id, NEW.deliveryid, NEW.status, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'שגיאה בריצת הטריגר trg_fn_log_delivery_status_change: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- יצירת הטריגר וקישורו לטבלה החיצונית remote_logistics.deliveries
DROP TRIGGER IF EXISTS trg_delivery_status_update ON remote_logistics.deliveries;
CREATE TRIGGER trg_delivery_status_update
AFTER UPDATE ON remote_logistics.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_log_delivery_status_change();