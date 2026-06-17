import React, { useEffect, useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { api, type Product, type CheckoutResult } from '../../api.ts';
import { Modal, Button, ErrorBox } from '../ui.tsx';

interface CartLine { product: Product; qty: number; }

export default function Checkout({ items, customerId, customerName, onClose, onPlaced }: {
  items: CartLine[];
  customerId: number;
  customerName: string;
  onClose: () => void;
  onPlaced: (r: CheckoutResult) => void;
}) {
  const [shippers, setShippers] = useState<{ shipperid: number; companyname: string }[]>([]);
  const [shipperId, setShipperId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<{ ok: boolean; discount: number; msg?: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.shop.shippers().then((r) => {
      setShippers(r.shippers);
      if (r.shippers[0]) setShipperId(String(r.shippers[0].shipperid));
    }).catch(() => {});
  }, []);

  const subtotal = items.reduce((s, l) => s + Number(l.product.price) * l.qty, 0);
  const discount = coupon?.ok ? coupon.discount : 0;
  const total = subtotal * (1 - discount / 100);

  async function applyCoupon() {
    setCoupon(null);
    if (!couponCode.trim()) return;
    try {
      const r = await api.shop.coupon(couponCode.trim());
      if (r.valid) setCoupon({ ok: true, discount: r.discountPercent || 0 });
      else setCoupon({ ok: false, discount: 0, msg: r.reason || 'Invalid coupon.' });
    } catch (e: any) { setCoupon({ ok: false, discount: 0, msg: e.message }); }
  }

  async function place() {
    setPlacing(true); setError('');
    try {
      const r = await api.shop.checkout({
        customerId, shipperId: Number(shipperId), shippingAddress: address.trim(),
        couponCode: coupon?.ok ? couponCode.trim() : undefined,
        items: items.map((l) => ({ productId: l.product.productid, quantity: l.qty })),
      });
      onPlaced(r);
    } catch (e: any) { setError(e.message); } finally { setPlacing(false); }
  }

  return (
    <Modal title="Checkout" onClose={onClose} wide>
      <div className="grid md:grid-cols-2 gap-6">
        {/* order summary */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Your order</h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((l) => (
              <div key={l.product.productid} className="flex justify-between text-sm">
                <span className="text-slate-700">{l.qty} × {l.product.productname}</span>
                <span className="font-semibold">${(Number(l.product.price) * l.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Coupon ({discount}% off)</span>
                <span>−${(subtotal * discount / 100).toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-extrabold text-lg text-slate-900 pt-1">
              <span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* shipping + payment */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Customer</label>
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">{customerName}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Shipping company</label>
            <select value={shipperId} onChange={(e) => setShipperId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {shippers.map((s) => <option key={s.shipperid} value={s.shipperid}>{s.companyname}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Shipping address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Coupon code (optional)</label>
            <div className="flex gap-2">
              <input value={couponCode} onChange={(e) => { setCouponCode(e.target.value); setCoupon(null); }}
                placeholder="e.g. SAVE10"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <Button variant="ghost" onClick={applyCoupon}><Tag className="w-4 h-4" /> Apply</Button>
            </div>
            {coupon && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${coupon.ok ? 'text-emerald-600' : 'text-rose-500'}`}>
                {coupon.ok ? <><Check className="w-3 h-3" /> {coupon.discount}% discount applied</>
                  : <><X className="w-3 h-3" /> {coupon.msg}</>}
              </p>
            )}
          </div>

          {error && <ErrorBox message={error} />}

          <Button variant="success" className="w-full" onClick={place} disabled={placing}>
            {placing ? 'Placing order…' : `Place order · $${total.toFixed(2)}`}
          </Button>
          <p className="text-[11px] text-slate-400 text-center">
            Placing the order writes to the database and runs the stock trigger.
          </p>
        </div>
      </div>
    </Modal>
  );
}
