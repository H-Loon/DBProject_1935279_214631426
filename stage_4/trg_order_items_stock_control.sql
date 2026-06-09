CREATE OR REPLACE FUNCTION public.trg_fn_manage_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INT;
    v_product_name VARCHAR(100);
BEGIN
    -- שליפת המלאי הקיים ושם המוצר מתוך טבלת המוצרים המקומית
    SELECT stockquantity, productname INTO v_current_stock, v_product_name
    FROM public.products
    WHERE productid = NEW.productid;

    -- בדיקת תנאי המלאי (הסתעפות)
    IF v_current_stock < NEW.quantity THEN
        -- זריקת שגיאה יזומה המבטלת את הטרנזקציה (Exception חוסם)
        RAISE EXCEPTION 'שגיאת מלאי: לא ניתן להזמין את המוצר "%". מלאי זמין: %, כמות מבוקשת: %', 
            v_product_name, v_current_stock, NEW.quantity;
    ELSE
        -- פקודת DML: עדכון והפחתת המלאי המקומי בהתאם לכמות שהוזמנה
        UPDATE public.products
        SET stockquantity = stockquantity - NEW.quantity
        WHERE productid = NEW.productid;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- יצירת הטריגר וקישורו לטבלה המקומית public.order_items
DROP TRIGGER IF EXISTS trg_order_items_stock_control ON public.order_items;
CREATE TRIGGER trg_order_items_stock_control
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_manage_product_stock();