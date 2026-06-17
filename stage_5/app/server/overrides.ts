/**
 * overrides.ts - Per-table hints layered on top of live introspection.
 *
 * The backend discovers tables/columns/keys automatically from the database
 * catalog. For most LOCAL tables that's enough. But:
 *   - foreign (remote_logistics) tables imported via postgres_fdw expose NO
 *     primary keys in the local catalog, so we supply them here;
 *   - some tables look nicer with a custom display label (e.g. a customer
 *     shown as "First Last" instead of just the first text column).
 *
 * Keys are "schema.table". Every field is optional.
 *   title    - friendly screen name
 *   group    - dashboard section
 *   pk       - primary-key column(s) (needed for remote tables)
 *   label    - SQL expression (alias "t") used wherever the row is shown by name
 *   readOnly - hide create/update/delete (browse only)
 *
 * <<< When the integrated backup is loaded, adjust the remote entries below
 *     if the real column names differ. >>>
 */
export interface TableOverride {
  title?: string;
  group?: string;
  pk?: string[];
  label?: string;
  readOnly?: boolean;
  /** Fixed choice lists for specific columns (rendered as dropdowns). */
  enums?: Record<string, string[]>;
}

export const OVERRIDES: Record<string, TableOverride> = {
  // ---- local (public) ----
  'public.customers': {
    title: 'Customers', group: 'Sales & Customers',
    label: "t.firstname || ' ' || t.lastname",
  },
  'public.employees': {
    title: 'Employees', group: 'Operations',
    label: "t.firstname || ' ' || t.lastname",
  },
  'public.products': { title: 'Products', group: 'Catalog & Inventory', label: 't.productname' },
  'public.categories': { title: 'Categories', group: 'Catalog & Inventory', label: 't.categoryname' },
  'public.suppliers': { title: 'Suppliers', group: 'Catalog & Inventory', label: 't.companyname' },
  'public.warehouses': { title: 'Warehouses', group: 'Catalog & Inventory', label: 't.location' },
  'public.shippers': { title: 'Shippers', group: 'Operations', label: 't.companyname' },
  'public.coupons': { title: 'Coupons', group: 'Operations', label: 't.couponcode' },
  'public.orders': {
    title: 'Orders', group: 'Sales & Customers',
    label: "to_char(t.orderdate,'YYYY-MM-DD') || ' / ' || t.shippingaddress",
    enums: { status: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
  },
  'public.order_items': { title: 'Order Items', group: 'Sales & Customers' },
  'public.product_reviews': {
    title: 'Product Reviews', group: 'Sales & Customers',
    label: "'Review #' || t.reviewid",
  },

  // ---- remote (integrated logistics, via postgres_fdw) ----
  // Browse-only by default: this data is meant to be changed INDIRECTLY through
  // the Stage-4 procedures (e.g. pr_process_delivery_incident), which the Tools
  // screen runs. Flip readOnly to false once you confirm the real PK columns.
  'remote_logistics.deliveries': {
    title: 'Deliveries', group: 'Integrated Logistics',
    pk: ['deliveryid'], label: "'Delivery #' || t.deliveryid", readOnly: true,
  },
  'remote_logistics.depots': {
    title: 'Depots', group: 'Integrated Logistics',
    pk: ['depotid'], label: 't.depotname', readOnly: true,
  },
  'remote_logistics.delivery_rates': {
    title: 'Delivery Rates', group: 'Integrated Logistics',
    pk: ['rateid'], label: "'Rate #' || t.rateid", readOnly: true,
  },
  'remote_logistics.delivery_incidents': {
    title: 'Delivery Incidents', group: 'Integrated Logistics',
    pk: ['incidentid'], label: "'Incident #' || t.incidentid", readOnly: true,
  },
  'remote_logistics.delivery_status_history': {
    title: 'Delivery Status History', group: 'Integrated Logistics',
    pk: ['statushistoryid'], label: "'History #' || t.statushistoryid", readOnly: true,
  },
};

export const GROUP_ORDER = [
  'Catalog & Inventory',
  'Sales & Customers',
  'Operations',
  'Integrated Logistics',
  'Other',
];
