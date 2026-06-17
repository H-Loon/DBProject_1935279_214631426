import React, { useEffect, useState } from 'react';
import { Star, Package, Plus } from 'lucide-react';
import { api, type Product } from '../../api.ts';
import { Modal, Button, Spinner, ErrorBox } from '../ui.tsx';

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-amber-400">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} style={{ width: size, height: size }}
          className={i < Math.round(value) ? 'fill-current' : 'text-slate-200'} />
      ))}
    </span>
  );
}

export const productImage = (id: number) => `https://picsum.photos/seed/prod${id}/600/400`;

export default function ProductModal({ product, customerId, onClose, onAdd }: {
  product: Product;
  customerId: number | '';
  onClose: () => void;
  onAdd: (p: Product) => void;
}) {
  const [reviews, setReviews] = useState<any[] | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function load() {
    try { setReviews((await api.shop.reviews(product.productid)).reviews); }
    catch { setReviews([]); }
  }
  useEffect(() => { load(); }, [product.productid]);

  async function submit() {
    if (!customerId) { setError('Pick a customer (top bar) before reviewing.'); return; }
    setBusy(true); setError('');
    try {
      await api.shop.addReview(product.productid, Number(customerId), rating, comment);
      setComment(''); setDone(true); await load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const avg = product.avg_rating ? Number(product.avg_rating) : 0;

  return (
    <Modal title={product.productname} onClose={onClose} wide>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <img src={productImage(product.productid)} referrerPolicy="no-referrer"
            className="w-full aspect-[3/2] object-cover rounded-xl border border-slate-200" />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">${Number(product.price).toFixed(2)}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Package className="w-3 h-3" /> {product.supplier}
              </p>
            </div>
            <Button variant="dark" onClick={() => onAdd(product)} disabled={product.stockquantity <= 0}>
              <Plus className="w-4 h-4" /> {product.stockquantity > 0 ? 'Add to cart' : 'Out of stock'}
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Stars value={avg} /> <span className="font-bold">{avg || '—'}</span>
            <span className="text-slate-400">({product.review_count} reviews)</span>
            <span className="ml-auto text-xs text-slate-400">{product.category} · {product.stockquantity} in stock</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Customer reviews</h4>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {reviews === null ? <Spinner /> : reviews.length === 0 ? (
              <p className="text-sm text-slate-400">No reviews yet — be the first.</p>
            ) : reviews.map((r, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-800">{r.customer}</span>
                  <Stars value={r.rating} size={12} />
                </div>
                {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                <p className="text-[10px] text-slate-400 mt-1">{String(r.reviewdate).slice(0, 10)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Write a review</h4>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} title={`${n} star`}>
                  <Star className={`w-5 h-5 ${n <= rating ? 'fill-current text-amber-400' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
              placeholder="Share your thoughts…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {error && <div className="mt-2"><ErrorBox message={error} /></div>}
            {done && <p className="text-xs text-emerald-600 mt-1">Thanks! Your review was posted.</p>}
            <Button className="mt-2" onClick={submit} disabled={busy}>
              {busy ? 'Posting…' : 'Submit review'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
