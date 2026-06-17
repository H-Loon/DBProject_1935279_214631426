import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, Package, Shield, Receipt, Store, CheckCircle2,
} from 'lucide-react';
import { api, type Product, type ShopCustomer, type CheckoutResult } from '../../api.ts';
import { Logo, Button, Spinner, Modal } from '../ui.tsx';
import ProductModal, { Stars, productImage } from './ProductModal.tsx';
import Checkout from './Checkout.tsx';
import MyOrders from './MyOrders.tsx';

interface CartLine { product: Product; qty: number; }

export default function Storefront({ onExit }: { onExit: () => void }) {
  const [customers, setCustomers] = useState<ShopCustomer[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<'shop' | 'orders'>('shop');
  const [checkout, setCheckout] = useState(false);
  const [confirmation, setConfirmation] = useState<CheckoutResult | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [ordersRefresh, setOrdersRefresh] = useState(0);

  // initial data
  useEffect(() => {
    api.shop.customers().then((r) => {
      setCustomers(r.customers);
      if (r.customers[0]) setCustomerId(r.customers[0].customerid);
    }).catch(() => {});
    api.shop.categories().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  // products (debounced on search / category)
  useEffect(() => {
    let alive = true;
    setProducts(null);
    const t = setTimeout(() => {
      api.shop.products(search, activeCat)
        .then((r) => { if (alive) setProducts(r.products); })
        .catch(() => { if (alive) setProducts([]); });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [search, activeCat]);

  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const subtotal = cartLines.reduce((s, l) => s + Number(l.product.price) * l.qty, 0);
  const customerName = customers.find((c) => c.customerid === customerId)?.name || '';

  function addToCart(p: Product) {
    setCart((c) => {
      const existing = c[p.productid];
      return { ...c, [p.productid]: { product: p, qty: (existing?.qty || 0) + 1 } };
    });
    setCartOpen(true);
  }
  function setQty(id: number, qty: number) {
    setCart((c) => {
      if (qty <= 0) { const { [id]: _, ...rest } = c; return rest; }
      return { ...c, [id]: { ...c[id], qty } };
    });
  }

  function onPlaced(r: CheckoutResult) {
    setCheckout(false);
    setCartOpen(false);
    setCart({});
    setConfirmation(r);
    setOrdersRefresh((n) => n + 1);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button className="flex items-center gap-2 shrink-0" onClick={() => setView('shop')}>
            <Logo size={32} />
            <span className="font-extrabold tracking-tight text-slate-900 hidden sm:block">NexusCommerce</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hidden md:block">Store</span>
          </button>

          <div className="flex-1 relative max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setView('shop'); }}
              placeholder="Search products…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}
            title="Shopping as"
            className="hidden lg:block max-w-44 rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {customers.map((c) => <option key={c.customerid} value={c.customerid}>{c.name}</option>)}
          </select>

          <button onClick={() => setView('orders')}
            className={`flex items-center gap-1.5 text-sm font-medium px-2 ${view === 'orders' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}>
            <Receipt className="w-4 h-4" /> <span className="hidden sm:block">Orders</span>
          </button>

          <button onClick={() => setCartOpen(true)} className="relative text-slate-700 hover:text-indigo-600">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button onClick={onExit} title="Staff / Admin"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 border-l border-slate-200 pl-3">
            <Shield className="w-4 h-4" /> <span className="hidden md:block">Admin</span>
          </button>
        </div>

        {/* category bar */}
        {view === 'shop' && (
          <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
            <Chip label="All" active={!activeCat} onClick={() => setActiveCat('')} />
            {categories.map((c) => <Chip key={c} label={c} active={activeCat === c} onClick={() => setActiveCat(c)} />)}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* customer notice on small screens */}
        <div className="lg:hidden mb-4 flex items-center gap-2">
          <span className="text-xs text-slate-500">Shopping as</span>
          <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}
            className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
            {customers.map((c) => <option key={c.customerid} value={c.customerid}>{c.name}</option>)}
          </select>
        </div>

        {view === 'orders' ? (
          customerId ? <MyOrders customerId={customerId} refreshKey={ordersRefresh} /> : null
        ) : products === null ? (
          <Spinner label="Loading products…" />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 text-slate-500">
              <Store className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg font-bold text-slate-900">
                {activeCat || 'Featured products'}
              </h1>
              <span className="text-sm">· {products.length} items</span>
            </div>
            {products.length === 0 ? (
              <div className="text-center text-slate-400 py-16">No products match your search.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.productid} p={p} onAdd={addToCart} onOpen={() => setDetail(p)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex" onMouseDown={() => setCartOpen(false)}>
          <div className="flex-1 bg-slate-900/30" />
          <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your cart</h3>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartLines.length === 0 ? (
                <p className="text-center text-slate-400 py-16">Your cart is empty.</p>
              ) : cartLines.map((l) => (
                <div key={l.product.productid} className="flex gap-3 items-center border border-slate-100 rounded-xl p-2">
                  <img src={productImage(l.product.productid)} referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{l.product.productname}</p>
                    <p className="text-xs text-slate-500">${Number(l.product.price).toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => setQty(l.product.productid, l.qty - 1)}
                        className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm w-6 text-center font-semibold">{l.qty}</span>
                      <button onClick={() => setQty(l.product.productid, l.qty + 1)}
                        className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => setQty(l.product.productid, 0)}
                        className="ml-auto text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">${(Number(l.product.price) * l.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 p-4 space-y-3">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <Button variant="success" className="w-full"
                disabled={cartLines.length === 0 || !customerId}
                onClick={() => { setCartOpen(false); setCheckout(true); }}>
                Checkout
              </Button>
              {!customerId && <p className="text-xs text-rose-500 text-center">Pick a customer first.</p>}
            </div>
          </div>
        </div>
      )}

      {detail && (
        <ProductModal product={detail} customerId={customerId} onClose={() => setDetail(null)}
          onAdd={(p) => { addToCart(p); setDetail(null); }} />
      )}
      {checkout && customerId && (
        <Checkout items={cartLines} customerId={customerId} customerName={customerName}
          onClose={() => setCheckout(false)} onPlaced={onPlaced} />
      )}
      {confirmation && (
        <Modal title="Order placed!" onClose={() => setConfirmation(null)}>
          <div className="text-center py-2">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-slate-900">Thank you for your order</p>
            <p className="text-sm text-slate-500 mt-1">
              Order <span className="font-mono font-semibold">#{confirmation.orderId}</span> · {confirmation.itemCount} item(s)
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">${confirmation.total.toFixed(2)}</p>
            {confirmation.discountPercent > 0 && (
              <p className="text-xs text-emerald-600 mt-1">{confirmation.discountPercent}% coupon discount applied</p>
            )}
            <div className="flex gap-2 mt-5">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmation(null)}>Keep shopping</Button>
              <Button className="flex-1" onClick={() => { setConfirmation(null); setView('orders'); }}>
                View my orders
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}>{label}</button>
  );
}

function ProductCard({ p, onAdd, onOpen }: { p: Product; onAdd: (p: Product) => void; onOpen: () => void }) {
  const avg = p.avg_rating ? Number(p.avg_rating) : 0;
  const out = p.stockquantity <= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-sm transition-shadow">
      <button onClick={onOpen} className="aspect-[4/3] bg-slate-100 overflow-hidden">
        <img src={productImage(p.productid)} referrerPolicy="no-referrer"
          className="w-full h-full object-cover hover:scale-105 transition-transform" />
      </button>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{p.category}</p>
        <button onClick={onOpen} className="text-left font-bold text-slate-900 text-sm leading-tight line-clamp-2 hover:text-indigo-600">
          {p.productname}
        </button>
        <div className="flex items-center gap-1 mt-1">
          <Stars value={avg} size={12} />
          <span className="text-[10px] text-slate-400">{avg ? `${avg} (${p.review_count})` : 'No reviews'}</span>
        </div>
        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 truncate">
          <Package className="w-3 h-3" /> {p.supplier}
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-lg font-extrabold text-slate-900">${Number(p.price).toFixed(2)}</span>
          <button onClick={() => onAdd(p)} disabled={out}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
              out ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
            <Plus className="w-3 h-3" /> {out ? 'Out' : 'Add'}
          </button>
        </div>
        <p className={`text-[10px] mt-1 ${out ? 'text-rose-500' : 'text-slate-400'}`}>
          {out ? 'Out of stock' : `${p.stockquantity} in stock`}
        </p>
      </div>
    </div>
  );
}
