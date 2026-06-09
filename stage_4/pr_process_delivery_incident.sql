CREATE OR REPLACE PROCEDURE public.pr_process_delivery_incident(
    p_delivery_id INT, 
    p_incident_type VARCHAR, 
    p_description VARCHAR
)
AS $$
DECLARE
    v_next_incident_id INT;
    -- Row type mapping explicitly to the foreign logistics schema table structure
    v_delivery_row remote_logistics.deliveries%ROWTYPE;
BEGIN
    -- Fetch foreign delivery details safely into a rowtype variable
    SELECT * INTO v_delivery_row FROM remote_logistics.deliveries WHERE deliveryid = p_delivery_id;
    
    IF v_delivery_row.deliveryid IS NULL THEN
        RAISE EXCEPTION 'Delivery ID % does not exist in remote logistics.', p_delivery_id;
    END IF;

    -- Generate sequence ID for the incident log
    SELECT COALESCE(MAX(incidentid), 0) + 1 INTO v_next_incident_id FROM remote_logistics.delivery_incidents;

    -- DML 1: Insert into foreign incident table (remote_logistics schema)
    INSERT INTO remote_logistics.delivery_incidents (incidentid, deliveryid, externallivreurid, incidenttype, incidentdate, description)
    VALUES (v_next_incident_id, p_delivery_id, v_delivery_row.externalprimarylivreurid, p_incident_type, CURRENT_DATE, p_description);

    -- DML 2: Update foreign delivery status to 'Incident' (Allowed by foreign check constraint)
    -- This update will automatically fire your trigger 'trg_delivery_status_update' 
    -- which cleanly inserts the status history log without string or ID collisions!
    UPDATE remote_logistics.deliveries 
    SET status = 'Incident' 
    WHERE deliveryid = p_delivery_id;

    -- DML 3: Cross-Schema Integration Update (public schema)
    -- Updates local customer order status to 'Cancelled' due to the logistics incident (Allowed by local constraint)
    UPDATE public.orders
    SET status = 'Cancelled'
    WHERE orderid = v_delivery_row.externalorderid;

    RAISE NOTICE 'Incident processed successfully for Foreign Delivery %. Status updated to Incident, and local Order % set to Cancelled.', 
        p_delivery_id, v_delivery_row.externalorderid;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Procedure failed, rolling back changes: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;