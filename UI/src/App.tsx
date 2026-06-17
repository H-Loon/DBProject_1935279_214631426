0.03; /**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShoppingBag,
  ShoppingCart,
  Package,
  Users,
  Star,
  Truck,
  Tag,
  Warehouse,
  User,
  Search,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Award,
  Calendar,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Mock Data Reflecting SQL Queries ---

// Q1 & Q6: Storefront Products with Suppliers and Pricing Analysis
const PRODUCTS_DATA = [
  {
    id: 1,
    name: "AeroSound Pro",
    category: "Electronics",
    supplier: "Global Tech Parts Inc.",
    rating: 4.8,
    price: 299.99,
    isAboveAverage: true,
    image: "https://picsum.photos/seed/headphones/400/300",
  },
  {
    id: 2,
    name: "Urban Explorer",
    category: "Fashion",
    supplier: "EcoFabric Textiles",
    rating: 4.5,
    price: 85.0,
    isAboveAverage: false,
    image: "https://picsum.photos/seed/backpack/400/300",
  },
  {
    id: 3,
    name: "SmartWatch S5",
    category: "Electronics",
    supplier: "Global Tech Parts Inc.",
    rating: 4.7,
    price: 199.0,
    isAboveAverage: false,
    image: "https://picsum.photos/seed/watch/400/300",
  },
  {
    id: 4,
    name: "Minimalist Lamp",
    category: "Home & Living",
    supplier: "Modern Home Goods",
    rating: 4.2,
    price: 45.5,
    isAboveAverage: false,
    image: "https://picsum.photos/seed/lamp/400/300",
  },
  {
    id: 5,
    name: "Organic Tee",
    category: "Fashion",
    supplier: "EcoFabric Textiles",
    rating: 4.9,
    price: 28.0,
    isAboveAverage: false,
    image: "https://picsum.photos/seed/shirt/400/300",
  },
  {
    id: 6,
    name: "Ceramic Set",
    category: "Home & Living",
    supplier: "Modern Home Goods",
    rating: 4.6,
    price: 64.0,
    isAboveAverage: true,
    image: "https://picsum.photos/seed/coffee/400/300",
  },
];

// Q2: Monthly Revenue Report Data
const REVENUE_REPORT = [
  { year: 2026, month: "April", orders: 124, revenue: 45200.5 },
  { year: 2026, month: "March", orders: 156, revenue: 58900.25 },
  { year: 2026, month: "February", orders: 98, revenue: 32400.0 },
];

// Q3: HR Employee Directory Data
const HR_DATA = [
  {
    firstName: "David",
    lastName: "Chen",
    role: "Manager",
    location: "Chicago Hub",
    hireYear: 2022,
  },
  {
    firstName: "Maria",
    lastName: "Garcia",
    role: "Specialist",
    location: "Los Angeles Center",
    hireYear: 2023,
  },
  {
    firstName: "James",
    lastName: "Wilson",
    role: "Associate",
    location: "Chicago Hub",
    hireYear: 2023,
  },
  {
    firstName: "Linda",
    lastName: "Park",
    role: "Coordinator",
    location: "New Jersey Terminal",
    hireYear: 2021,
  },
];

// Q4: Checkout History Data
const CHECKOUT_HISTORY = [
  {
    customer: "John Smith",
    date: "2026-04-28",
    method: "SwiftExpress",
    discount: "15%",
  },
  {
    customer: "Sarah Miller",
    date: "2026-04-25",
    method: "GlobalFreight",
    discount: "0%",
  },
  {
    customer: "Robert Brown",
    date: "2026-04-22",
    method: "StandardMail",
    discount: "20%",
  },
];

// Q5: Expired Coupon Audit Users
const EXPIRED_COUPON_USERS = [
  { firstName: "Alice", lastName: "Vance", email: "alice.v@example.com" },
  { firstName: "Kevin", lastName: "Duarte", email: "k.duarte@mail.com" },
];

// Q7: Unused Shippers
const UNUSED_SHIPPERS = [
  { name: "Oceanic Freight", phone: "555-9988" },
  { name: "Local Parcel Co.", phone: "555-2233" },
];

// Q8: Top Spender
const TOP_SPENDER = {
  firstName: "Eleanor",
  lastName: "Rigby",
  totalSpent: 12450.75,
};

const CATEGORIES = [
  "All Products",
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty & Health",
];

// --- UI Components ---

const Navbar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
}) => {
  const tabs = [
    { id: "store", label: "Storefront", icon: ShoppingBag },
    { id: "checkout", label: "Checkout History", icon: ShoppingCart },
    { id: "inventory", label: "Operations & Supply", icon: Package },
    { id: "hr", label: "HR Directory", icon: Users },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                NexusCommerce
              </span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Database View: Production v2.1
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Screen 1: Storefront (Q1 & Q6) ---
const StorefrontScreen = () => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 flex-shrink-0">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Categories
        </h3>
        <ul className="space-y-1">
          {CATEGORIES.map((cat, idx) => (
            <li key={cat}>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  idx === 0
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-8 p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
          <TrendingUp className="w-8 h-8 mb-4 opacity-50" />
          <h4 className="text-lg font-bold mb-1">Pricing Insight</h4>
          <p className="text-xs text-indigo-100 leading-relaxed">
            System identified{" "}
            {PRODUCTS_DATA.filter((p) => p.isAboveAverage).length} items priced
            above their category average.
          </p>
        </div>
      </aside>

      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Featured Products
          </h2>
          <div className="text-xs font-medium text-slate-500">
            Query 1: Storefront Featured Products & Ratings
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS_DATA.map((product) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden relative"
            >
              {product.isAboveAverage && (
                <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase rounded-md flex items-center gap-1 border border-amber-200">
                  <TrendingUp className="w-3 h-3" /> Above Avg Price
                </div>
              )}
              <div className="aspect-[4/3] bg-slate-100 relative">
                <img
                  src={product.image}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {product.category}
                  </p>
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Supplied by:{" "}
                  {product.supplier}
                </p>
                <div className="flex items-center gap-1 mb-4">
                  <div className="flex text-amber-400 fill-current">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i >= Math.floor(product.rating) ? "text-slate-200" : ""}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-900 ml-1">
                    {product.rating}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-lg font-black text-slate-900">
                    ${product.price.toFixed(2)}
                  </span>
                  <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800">
                    Buy
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

// --- Screen 2: Checkout History & Audit (Q4 & Q5) ---
const CheckoutScreen = () => {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Checkout History
          </h2>
          <p className="text-sm text-slate-500">
            Query 4: Detailed Customer Checkout History (Active Orders)
          </p>
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4">Shipping Method</th>
                <th className="px-6 py-4">Coupon Discount</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CHECKOUT_HISTORY.map((row, i) => (
                <tr key={i} className="text-sm">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {row.customer}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono italic">
                    {row.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-slate-400" /> {row.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold ${row.discount !== "0%" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {row.discount} OFF
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded">
                      Processing
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Security Audit (Q5) */}
      <section className="bg-rose-50 rounded-2xl border border-rose-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
            <AlertCircle className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-900">
              Security Audit: Expired Coupon Usage
            </h3>
            <p className="text-xs text-rose-700">
              Query 5: Detects orders placed with coupons past their expiry
              date.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-rose-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-rose-100/50 text-rose-800 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">First Name</th>
                <th className="px-6 py-3">Last Name</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {EXPIRED_COUPON_USERS.map((user, i) => (
                <tr key={i}>
                  <td className="px-6 py-3 font-medium">{user.firstName}</td>
                  <td className="px-6 py-3 font-medium">{user.lastName}</td>
                  <td className="px-6 py-3 text-slate-500">{user.email}</td>
                  <td className="px-6 py-3 text-right">
                    <button className="text-rose-600 font-bold hover:underline">
                      Revoke Reward
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// --- Screen 3: Operations & Analytics (Q2, Q7 & Q8) ---
const InventoryScreen = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Revenue Report (Q2) */}
        <section className="flex-1 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Monthly Revenue Report
            </h3>
            <div className="text-[9px] font-bold text-slate-400 uppercase">
              Query 2: Date Extraction
            </div>
          </div>
          <div className="space-y-4">
            {REVENUE_REPORT.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center leading-none">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                      {row.month.substring(0, 3)}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {row.year % 100}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {row.orders} Orders
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      Delivered Status
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-emerald-600">
                    ${row.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Logistics & VIP (Q7 & Q8) */}
        <section className="w-full md:w-80 space-y-6">
          {/* Top Spender (Q8) */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
            <Award className="absolute -top-4 -right-4 w-24 h-24 text-slate-800" />
            <div className="relative z-10">
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">
                VIP Spender: All Time
              </h4>
              <p className="text-2xl font-black mb-1">
                {TOP_SPENDER.firstName} {TOP_SPENDER.lastName}
              </p>
              <div className="flex items-center gap-2 text-indigo-300 mb-6">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold">
                  Query 8B: Most Efficient Spend Sort
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Total Lifetime Value</p>
                <p className="text-3xl font-black text-white">
                  ${TOP_SPENDER.totalSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Unused Shippers (Q7) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center justify-between">
              Shipper Activity Audit
              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] rounded">
                Query 7B
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-tight">
              Contracted but inactive this year:
            </p>
            <div className="space-y-3">
              {UNUSED_SHIPPERS.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {s.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- Screen 4: HR Directory (Q3) ---
const HRScreen = () => {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Personnel Directory
          </h2>
          <p className="text-sm text-slate-500">
            Query 3: Workforce Distribution & Seniority
          </p>
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">First Name</th>
                <th className="px-6 py-4">Last Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Warehouse</th>
                <th className="px-6 py-4 text-right">Hire Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {HR_DATA.map((emp, i) => (
                <tr
                  key={i}
                  className="text-sm group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {emp.firstName}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {emp.lastName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-3 h-3 text-indigo-400" />
                      <span className="text-slate-600 font-medium">
                        {emp.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-xs font-bold py-1 px-2 border border-slate-200 rounded-md">
                      {emp.hireYear}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState("store");

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "store" && <StorefrontScreen />}
            {activeTab === "checkout" && <CheckoutScreen />}
            {activeTab === "inventory" && <InventoryScreen />}
            {activeTab === "hr" && <HRScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
                <ShoppingBag className="text-white w-3 h-3" />
              </div>
              <span className="font-bold text-slate-900">
                NexusCommerce Database Environment
              </span>
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <span>SQL Optimized</span>
              <span>•</span>
              <span>Indexing Active</span>
              <span>•</span>
              <span>ACID Compliant</span>
            </div>
            <p className="text-xs text-slate-400 font-mono uppercase">
              System: AIS-Production-2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
