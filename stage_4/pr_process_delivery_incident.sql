CREATE OR REPLACE PROCEDURE public.pr_process_delivery_incident(
    p_delivery_id INT, 
    p_incident_type VARCHAR, 
    p_description VARCHAR
)
AS $$
DECLARE
    v_next_incident_id INT;
    v_next_history_id INT;
    -- הגדרת רשומה המבוססת על מבנה הטבלה החיצונית remote_logistics.deliveries
    v_delivery_row remote_logistics.deliveries%ROWTYPE;
BEGIN
    -- שליפת נתוני המשלוח מתוך סכמת remote_logistics לתוך הרשומה
    SELECT * INTO v_delivery_row FROM remote_logistics.deliveries WHERE deliveryid = p_delivery_id;
    
    IF v_delivery_row.deliveryid IS NULL THEN
        RAISE EXCEPTION 'משלוח שמספרו % אינו קיים במערכת הלוגיסטיקה', p_delivery_id;
    END IF;

    -- הפקת מזהים רצים מתוך טבלאות ה-remote_logistics
    SELECT COALESCE(MAX(incidentid), 0) + 1 INTO v_next_incident_id FROM remote_logistics.delivery_incidents;
    SELECT COALESCE(MAX(statushistoryid), 0) + 1 INTO v_next_history_id FROM remote_logistics.delivery_status_history;

    -- פקודת DML 1: הכנסת רשומת אירוע חריג לטבלה החיצונית
    INSERT INTO remote_logistics.delivery_incidents (incidentid, deliveryid, externallivreurid, incidenttype, incidentdate, description)
    VALUES (v_next_incident_id, p_delivery_id, v_delivery_row.externalprimarylivreurid, p_incident_type, CURRENT_DATE, p_description);

    -- הסתעפות לבחירת סטטוס העדכון בטבלת המשלוחים החיצונית
    IF p_incident_type = 'Accident' OR p_incident_type = 'תאונה' THEN
        -- פקודת DML 2א: עדכון סטטוס משלוח במקרה חירום
        UPDATE remote_logistics.deliveries 
        SET status = 'Delayed-Urgent' 
        WHERE deliveryid = p_delivery_id;
    ELSE
        -- פקודת DML 2ב: עדכון סטטוס משלוח רגיל
        UPDATE remote_logistics.deliveries 
        SET status = 'Incident Recorded' 
        WHERE deliveryid = p_delivery_id;
    END IF;

    -- פקודת DML 3: תיעוד בהיסטוריית הסטטוסים החיצונית
    INSERT INTO remote_logistics.delivery_status_history (statushistoryid, deliveryid, status, changeddate)
    VALUES (v_next_history_id, p_delivery_id, 'Incident: ' || p_incident_type, CURRENT_TIMESTAMP);

    RAISE NOTICE 'האירוע החריג עבור משלוח % עובד בהצלחה בקובצי מערכת הלוגיסטיקה.', p_delivery_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'שגיאה בפרוצדורה pr_process_delivery_incident, מבוצע ביטול: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;