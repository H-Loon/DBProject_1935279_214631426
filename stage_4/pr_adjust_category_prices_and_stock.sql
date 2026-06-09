CREATE OR REPLACE PROCEDURE public.pr_adjust_category_prices_and_stock(
    p_category_id INT, 
    p_price_factor NUMERIC, 
    p_min_stock_add INT
)
AS $$
DECLARE
    r_product RECORD;
BEGIN
    -- בדיקת תקינות קלט
    IF p_price_factor <= 0 THEN
        RAISE EXCEPTION 'מקדם המחיר חייב להיות ערך חיובי הגדול מאפס';
    END IF;

    -- לולאת FOR הרצה על סמן משתמע (Implicit Cursor) של טבלת products המקומית
    FOR r_product IN 
        SELECT productid, productname, price, stockquantity 
        FROM public.products 
        WHERE categoryid = p_category_id
    LOOP
        -- הסתעפות מורכבת על בסיס מצב המלאי של המוצר
        IF r_product.stockquantity < 15 THEN
            -- פקודת DML 1: עדכון מחיר והגדלת מלאי למוצרים מקומיים
            UPDATE public.products
            SET price = ROUND(price * p_price_factor, 2),
                stockquantity = stockquantity + p_min_stock_add
            WHERE productid = r_product.productid;
            
            RAISE NOTICE 'המוצר % עודכן: המחיר עלה והמלאי חודש.', r_product.productname;
        ELSE
            -- פקודת DML 2: עדכון מחיר בלבד ללא שינוי מלאי
            UPDATE public.products
            SET price = ROUND(price * p_price_factor, 2)
            WHERE productid = r_product.productid;
        END IF;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'פעולת העדכון המאסיבית נכשלה: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;