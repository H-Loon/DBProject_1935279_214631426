import React, { useEffect, useState } from 'react';
import { Truck, Package, MapPin } from 'lucide-react';
import { api, type ShopOrder } from '../../api.ts';
import { Spinner, Badge, ErrorBox } from '../ui.tsx';

const statusColor = (s: string): string => ({
  Pending: 'amber', Processing: 'indigo', Shipped: 'indigo',
  Delivered: 'emerald', Cancelled: 'rose',
}[s] || 'slate');

export default function MyOrders({ customerId, refreshKey }: { customerId: number; refreshKey: number }) {
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setOrders(null); setError('');
    api.shop.orders(customerId)
      .then((r) => { if (alive) setOrders(r.orders); })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [customerId, refreshKey]);

  if (error) return <ErrorBox message={error} />;
  if (orders === null) return <Spinner label="Loading your orders…" />;
  if (!orders.length) {
    return <div className="text-center text-slate-400 py-16">No orders yet. Add something to your cart and check out!</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-xl font-extrabold text-slate-900">My Orders</h2>
      {orders.map((o) => (
        <div key={o.orderid} className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Order #{o.orderid}</p>
                <p className="text-xs text-slate-500">{String(o.orderdate).slice(0, 10)} · {o.items} item(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge color={statusColor(o.status)}>{o.status}</Badge>
              <span className="text-lg font-extrabold text-slate-900">${Number(o.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid sm:grid-cols-3 gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {o.shipper}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {o.shippingaddress}</span>
            {o.discountPercent > 0 && <span className="text-emerald-600 font-semibold">{o.discountPercent}% coupon applied</span>}
          </div>

          {o.deliveryStatus && (
            <div className="mt-3 bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Live delivery tracking</span>
              <span className="text-sm font-semibold">
                {o.deliveryStatus}{o.deliveredOn ? ` · delivered ${String(o.deliveredOn).slice(0, 10)}` : ''}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
