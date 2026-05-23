"use client";

import { useMemo, useState, useTransition, type ComponentType, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Factory,
  FileClock,
  Filter,
  Landmark,
  PackagePlus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import {
  advancePreBookingStage,
  createBatch,
  createProduct,
  deleteBatch,
  deleteProduct,
  respondToBulkRequest,
  updateBatch,
  updateBulkRequestStatus,
  updateOrderStatus,
  updateProduct,
  updateUserAccount,
} from "@/app/actions/admin";

type AdminStats = {
  totalProducts: number;
  totalBatches: number;
  totalOrders: number;
  totalPrebookings: number;
  totalBulkRequests: number;
  totalUsers: number;
  totalRevenue: number;
};

type AnalyticsSummary = {
  uniqueSessions: number;
  pageViews: number;
  cartAdds: number;
  checkouts: number;
  purchases: number;
  prebookings: number;
  storyEngagements: number;
  aov: number;
  conversionRate: number;
  prebookPercentage: number;
  dropOffPercentage: number;
  repeatPurchaseRate: number;
  productViews: Array<{
    id: string;
    name: string;
    farmerName: string;
    views: number;
    storyEngagement: number;
  }>;
} | null;

type Grids = {
  products: any[];
  farmers: any[];
  batches: any[];
  orders: any[];
  prebookings: any[];
  bulkRequests: any[];
  notifications: any[];
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
};

type TabId = "dashboard" | "products" | "orders" | "planning" | "bulk" | "users" | "logs";

const tabs: Array<{ id: TabId; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "products", label: "Products", icon: Boxes },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "planning", label: "Crop Planning", icon: CalendarClock },
  { id: "bulk", label: "Bulk Trading", icon: Landmark },
  { id: "users", label: "Users", icon: Users },
  { id: "logs", label: "System Logs", icon: FileClock },
];

const orderStatuses = ["PENDING", "CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const batchStatuses = ["AVAILABLE", "PREBOOK", "SOLD_OUT", "HOLD"];
const bulkStatuses = ["PENDING", "APPROVED", "REJECTED", "RESPONDED", "COMPLETED"] as const;

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
}

function shortDate(value?: string | Date) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dateTime(value?: string | Date) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusClass(status: string) {
  if (["DELIVERED", "COMPLETED", "APPROVED", "AVAILABLE", "SUCCESS", "ADMIN"].includes(status)) {
    return "bg-green-50 text-green-800 border-green-200";
  }
  if (["SHIPPED", "PROCESSING", "READY", "RESPONDED", "PREBOOK"].includes(status)) {
    return "bg-blue-50 text-blue-800 border-blue-200";
  }
  if (["REJECTED", "CANCELLED", "SOLD_OUT", "FAILED", "DISABLED"].includes(status)) {
    return "bg-red-50 text-red-800 border-red-200";
  }
  return "bg-farm-gold-600/10 text-farm-green-950 border-farm-gold-600/20";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[10px] font-bold uppercase tracking-wider text-farm-green-700">{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(status)}`}>
      {status}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-farm-green-900/15 bg-white/60 p-6 text-sm text-farm-green-700">{label}</div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-farm-green-600" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-farm-green-900/10 bg-white pl-10 pr-3 text-sm text-farm-green-950 outline-none focus:border-farm-gold-600"
      />
    </label>
  );
}

export default function AdminPanel({ stats, analytics, grids }: { stats: AdminStats; analytics: AnalyticsSummary; grids: Grids }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [productStatus, setProductStatus] = useState("ALL");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("ALL");
  const [bulkStatus, setBulkStatus] = useState("ALL");
  const [logType, setLogType] = useState("ALL");
  const [logDate, setLogDate] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productDraft, setProductDraft] = useState({
    name: "",
    description: "",
    category: "Grains",
    farmerId: grids.farmers[0]?.id || grids.products[0]?.farmerId || "",
    mediaUrls: "/images/product_spelt_1.jpg",
    videoUrl: "",
    initialHarvestDate: "",
    initialQuantity: 100,
    initialPrice: 10,
    initialStatus: "AVAILABLE",
  });
  const [batchDraft, setBatchDraft] = useState({
    productId: grids.products[0]?.id || "",
    harvestDate: "",
    totalQuantity: 100,
    price: 10,
    status: "AVAILABLE",
    isFuture: false,
  });

  const farmers = grids.farmers.length ? grids.farmers : grids.products.map((product) => product.farmer).filter(Boolean);

  const runAction = (action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        setMessage(successMessage);
        router.refresh();
      } else {
        setMessage(result.error || "The admin action could not be completed.");
      }
    });
  };

  const filteredProducts = useMemo(() => {
    return grids.products.filter((product) => {
      const query = productQuery.toLowerCase();
      const latestBatch = product.batches?.[0];
      const haystack = `${product.name} ${product.category} ${product.farmer?.name || ""} ${product.farmer?.location || ""}`.toLowerCase();
      const matchesQuery = haystack.includes(query);
      const matchesStatus = productStatus === "ALL" || product.batches?.some((batch: any) => batch.status === productStatus) || latestBatch?.status === productStatus;
      return matchesQuery && matchesStatus;
    });
  }, [grids.products, productQuery, productStatus]);

  const filteredOrders = useMemo(() => {
    return grids.orders.filter((order) => {
      const query = orderQuery.toLowerCase();
      const haystack = `${order.id} ${order.customerName} ${order.customerEmail} ${order.shippingAddress}`.toLowerCase();
      return haystack.includes(query) && (orderStatus === "ALL" || order.status === orderStatus);
    });
  }, [grids.orders, orderQuery, orderStatus]);

  const filteredBulkRequests = useMemo(() => {
    return grids.bulkRequests.filter((request) => bulkStatus === "ALL" || request.status === bulkStatus);
  }, [grids.bulkRequests, bulkStatus]);

  const filteredLogs = useMemo(() => {
    return grids.notifications.filter((log) => {
      const matchesType = logType === "ALL" || log.event === logType || log.type === logType;
      const matchesDate = !logDate || new Date(log.createdAt).toISOString().slice(0, 10) === logDate;
      return matchesType && matchesDate;
    });
  }, [grids.notifications, logDate, logType]);

  const recentActivity = [
    ...grids.orders.slice(0, 4).map((order) => ({
      id: `order-${order.id}`,
      label: `Order ${order.id.slice(0, 8).toUpperCase()} moved through ${order.status}`,
      detail: `${order.customerName} - ${money(order.totalAmount, order.currency || "USD")}`,
      createdAt: order.createdAt,
      icon: ShoppingBag,
    })),
    ...grids.bulkRequests.slice(0, 4).map((request) => ({
      id: `bulk-${request.id}`,
      label: `Bulk request from ${request.businessName || request.name}`,
      detail: `${request.quantity} kg - ${request.productInterest}`,
      createdAt: request.createdAt,
      icon: Factory,
    })),
    ...grids.notifications.slice(0, 4).map((log) => ({
      id: `log-${log.id}`,
      label: log.event,
      detail: log.email,
      createdAt: log.createdAt,
      icon: Activity,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const logTypes = Array.from(new Set(grids.notifications.flatMap((log) => [log.event, log.type]).filter(Boolean)));

  const beginEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setProductDraft({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "Grains",
      farmerId: product.farmerId || product.farmer?.id || "",
      mediaUrls: product.mediaUrls || "",
      videoUrl: product.videoUrl || "",
      initialHarvestDate: "",
      initialQuantity: 100,
      initialPrice: 10,
      initialStatus: product.batches?.[0]?.status || "AVAILABLE",
    });
  };

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingProductId) {
      runAction(
        () =>
          updateProduct(editingProductId, {
            name: productDraft.name,
            description: productDraft.description,
            category: productDraft.category,
            farmerId: productDraft.farmerId,
            mediaUrls: productDraft.mediaUrls,
            videoUrl: productDraft.videoUrl || undefined,
          }),
        "Product updated.",
      );
      setEditingProductId(null);
    } else {
      runAction(
        () =>
          createProduct({
            name: productDraft.name,
            description: productDraft.description,
            category: productDraft.category,
            farmerId: productDraft.farmerId,
            mediaUrls: productDraft.mediaUrls,
            videoUrl: productDraft.videoUrl || undefined,
            initialHarvestDate: productDraft.initialHarvestDate || undefined,
            initialQuantity: Number(productDraft.initialQuantity),
            initialPrice: Number(productDraft.initialPrice),
            initialStatus: productDraft.initialStatus,
          }),
        "Product added.",
      );
    }
  };

  const submitBatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runAction(
      () =>
        createBatch({
          productId: batchDraft.productId,
          harvestDate: batchDraft.harvestDate,
          totalQuantity: Number(batchDraft.totalQuantity),
          price: Number(batchDraft.price),
          status: batchDraft.isFuture ? "PREBOOK" : batchDraft.status,
          isFuture: batchDraft.isFuture,
        }),
      "Harvest batch created.",
    );
  };

  return (
    <div className="min-h-screen bg-farm-cream-100">
      <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="h-fit rounded-lg border border-farm-green-900/10 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <div className="mb-5 border-b border-farm-green-900/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-farm-green-950 text-farm-cream-50">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-farm-green-950">Admin Hub</p>
                <p className="text-xs text-farm-green-700">Operations control</p>
              </div>
            </div>
          </div>

          <nav className="grid gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${
                  activeTab === tab.id ? "bg-farm-green-950 text-farm-cream-50" : "text-farm-green-800 hover:bg-farm-cream-100"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 space-y-6">
          {message && (
            <div className="flex items-center justify-between rounded-lg border border-farm-green-900/10 bg-white px-4 py-3 text-sm font-semibold text-farm-green-950 shadow-sm">
              <span>{message}</span>
              <button onClick={() => setMessage(null)} className="rounded-md p-1 text-farm-green-700 hover:bg-farm-cream-100">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Revenue", value: money(stats.totalRevenue), icon: Landmark },
                  { label: "Orders", value: stats.totalOrders, icon: ShoppingBag },
                  { label: "Users", value: stats.totalUsers, icon: Users },
                  { label: "Harvest Batches", value: stats.totalBatches, icon: Sprout },
                ].map((card) => (
                  <div key={card.label} className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <FieldLabel>{card.label}</FieldLabel>
                      <card.icon className="h-5 w-5 text-farm-gold-600" />
                    </div>
                    <p className="text-3xl font-bold text-farm-green-950">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-farm-green-950">Performance Overview</h2>
                    <StatusBadge status="LIVE" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Sessions", value: analytics?.uniqueSessions || 0, pct: 100 },
                      { label: "Page views", value: analytics?.pageViews || 0, pct: 86 },
                      { label: "Cart adds", value: analytics?.cartAdds || 0, pct: analytics?.pageViews ? (analytics.cartAdds / analytics.pageViews) * 100 : 0 },
                      { label: "Purchases", value: (analytics?.purchases || 0) + (analytics?.prebookings || 0), pct: analytics?.conversionRate || 0 },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg bg-farm-cream-50 p-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-farm-green-800">{item.label}</span>
                          <span className="font-mono font-bold text-farm-green-950">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-farm-cream-200">
                          <div className="h-2 rounded-full bg-farm-green-900" style={{ width: `${Math.min(item.pct, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-farm-green-900/10 p-4">
                      <FieldLabel>Conversion</FieldLabel>
                      <p className="mt-2 text-xl font-bold text-farm-green-950">{(analytics?.conversionRate || 0).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg border border-farm-green-900/10 p-4">
                      <FieldLabel>Drop off</FieldLabel>
                      <p className="mt-2 text-xl font-bold text-farm-green-950">{(analytics?.dropOffPercentage || 0).toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg border border-farm-green-900/10 p-4">
                      <FieldLabel>Average order</FieldLabel>
                      <p className="mt-2 text-xl font-bold text-farm-green-950">{money(analytics?.aov || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
                  <h2 className="mb-5 text-lg font-bold text-farm-green-950">Recent Activity</h2>
                  <div className="space-y-3">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="flex gap-3 rounded-lg bg-farm-cream-50 p-3">
                        <item.icon className="mt-1 h-4 w-4 shrink-0 text-farm-gold-600" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-farm-green-950">{item.label}</p>
                          <p className="truncate text-xs text-farm-green-700">{item.detail}</p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-farm-green-600">{dateTime(item.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {!recentActivity.length && <EmptyState label="No recent admin activity is available yet." />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-farm-green-950">Product / Harvest Management</h2>
                    <p className="text-sm text-farm-green-700">Add, edit, delete, search, and review availability by batch.</p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                    <SearchBox value={productQuery} onChange={setProductQuery} placeholder="Search products, farms, origins" />
                    <select value={productStatus} onChange={(event) => setProductStatus(event.target.value)} className="h-11 rounded-lg border border-farm-green-900/10 bg-white px-3 text-sm">
                      <option value="ALL">All availability</option>
                      {batchStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={submitProduct} className="mb-6 grid gap-3 rounded-lg bg-farm-cream-50 p-4 md:grid-cols-2 xl:grid-cols-4">
                  <input required value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} placeholder="Product name" className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                  <input required value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })} placeholder="Category" className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                  <select required value={productDraft.farmerId} onChange={(event) => setProductDraft({ ...productDraft, farmerId: event.target.value })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm">
                    <option value="">Select origin farmer</option>
                    {farmers.map((farmer: any) => (
                      <option key={farmer.id} value={farmer.id}>
                        {farmer.name} - {farmer.location}
                      </option>
                    ))}
                  </select>
                  <input required value={productDraft.mediaUrls} onChange={(event) => setProductDraft({ ...productDraft, mediaUrls: event.target.value })} placeholder="Image URLs" className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                  <input value={productDraft.videoUrl} onChange={(event) => setProductDraft({ ...productDraft, videoUrl: event.target.value })} placeholder="Video URL" className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                  {!editingProductId && (
                    <>
                      <input type="date" value={productDraft.initialHarvestDate} onChange={(event) => setProductDraft({ ...productDraft, initialHarvestDate: event.target.value })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                      <input type="number" min="0" step="1" value={productDraft.initialQuantity} onChange={(event) => setProductDraft({ ...productDraft, initialQuantity: Number(event.target.value) })} placeholder="Batch kg" className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                      <input type="number" min="0" step="0.01" value={productDraft.initialPrice} onChange={(event) => setProductDraft({ ...productDraft, initialPrice: Number(event.target.value) })} placeholder="Price per kg" className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                      <select value={productDraft.initialStatus} onChange={(event) => setProductDraft({ ...productDraft, initialStatus: event.target.value })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm">
                        {batchStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <textarea required value={productDraft.description} onChange={(event) => setProductDraft({ ...productDraft, description: event.target.value })} placeholder="Product story and handling notes" className="min-h-20 rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm xl:col-span-4" />
                  <button disabled={isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-farm-green-950 px-4 text-sm font-bold text-farm-cream-50 disabled:opacity-50">
                    <PackagePlus className="h-4 w-4" />
                    {editingProductId ? "Save Product" : "Add Product"}
                  </button>
                  {editingProductId && (
                    <button type="button" onClick={() => setEditingProductId(null)} className="h-11 rounded-lg border border-farm-green-900/10 bg-white px-4 text-sm font-bold text-farm-green-800">
                      Cancel Edit
                    </button>
                  )}
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead className="border-b border-farm-green-900/10 text-xs uppercase tracking-wide text-farm-green-700">
                      <tr>
                        <th className="py-3">Name</th>
                        <th>Origin</th>
                        <th>Batch</th>
                        <th>Pricing</th>
                        <th>Availability</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-farm-green-900/10">
                      {filteredProducts.map((product) => {
                        const batches = product.batches || [];
                        const quantity = batches.reduce((sum: number, batch: any) => sum + Number(batch.remainingQuantity || 0), 0);
                        const lowestPrice = batches.length ? Math.min(...batches.map((batch: any) => Number(batch.price || 0))) : 0;
                        return (
                          <tr key={product.id}>
                            <td className="py-4">
                              <p className="font-bold text-farm-green-950">{product.name}</p>
                              <p className="text-xs text-farm-green-700">{product.category}</p>
                            </td>
                            <td>{product.farmer?.name || "Unassigned"}</td>
                            <td className="font-mono text-xs">{batches[0]?.id?.slice(0, 8).toUpperCase() || "NO BATCH"}</td>
                            <td>{lowestPrice ? `${money(lowestPrice)} / kg` : "No price"}</td>
                            <td>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge status={batches[0]?.status || "UNAVAILABLE"} />
                                <span className="text-xs font-semibold text-farm-green-700">{quantity.toFixed(1)} kg</span>
                              </div>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => beginEditProduct(product)} className="rounded-lg border border-farm-green-900/10 px-3 py-2 text-xs font-bold text-farm-green-800">
                                  Edit
                                </button>
                                <button type="button" onClick={() => runAction(() => deleteProduct(product.id), "Product deleted.")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!filteredProducts.length && <EmptyState label="No products match the current filters." />}
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-farm-green-950">Order Management</h2>
                  <p className="text-sm text-farm-green-700">Retail orders and pre-booked harvests with customer details.</p>
                </div>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                  <SearchBox value={orderQuery} onChange={setOrderQuery} placeholder="Search orders or customers" />
                  <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)} className="h-11 rounded-lg border border-farm-green-900/10 bg-white px-3 text-sm">
                    <option value="ALL">All statuses</option>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-farm-green-900/10 text-xs uppercase tracking-wide text-farm-green-700">
                    <tr>
                      <th className="py-3">Order</th>
                      <th>Customer</th>
                      <th>Details</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-farm-green-900/10">
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-4 font-mono text-xs font-bold">
                          <Link href={`/order/retail-${order.id}`} className="text-farm-green-950 hover:text-farm-gold-600">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </Link>
                          <p className="mt-1 font-sans text-[10px] text-farm-green-700">{dateTime(order.createdAt)}</p>
                        </td>
                        <td>
                          <p className="font-bold text-farm-green-950">{order.customerName}</p>
                          <p className="text-xs text-farm-green-700">{order.customerEmail}</p>
                          <p className="text-xs text-farm-green-700">{order.customerPhone}</p>
                        </td>
                        <td>
                          <p className="max-w-xs truncate text-xs text-farm-green-800">{order.shippingAddress}</p>
                          <p className="mt-1 text-xs font-semibold text-farm-green-950">{order.orderItems?.length || 0} line items</p>
                        </td>
                        <td className="font-bold">{money(order.totalAmount, order.currency || "USD")}</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="text-right">
                          <select disabled={isPending} value={order.status} onChange={(event) => runAction(() => updateOrderStatus(order.id, event.target.value), "Order status updated.")} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-xs font-semibold">
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredOrders.length && <EmptyState label="No orders match the current filters." />}
              </div>

              <div className="mt-6 rounded-lg bg-farm-cream-50 p-4">
                <h3 className="mb-3 text-sm font-bold text-farm-green-950">B2C Pre-book Timeline</h3>
                <div className="grid gap-3 lg:grid-cols-2">
                  {grids.prebookings.map((booking) => (
                    <div key={booking.id} className="rounded-lg border border-farm-green-900/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-farm-green-950">{booking.customerName}</p>
                          <p className="text-xs text-farm-green-700">{booking.batch?.product?.name || "Harvest batch"} - {booking.quantity} kg</p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                        <span className="text-farm-green-700">Deposit {money(booking.advancePaid, booking.currency || "USD")}</span>
                        <button disabled={isPending || booking.status === "DELIVERED"} onClick={() => runAction(() => advancePreBookingStage(booking.id, booking.status), "Pre-booking advanced.")} className="rounded-lg bg-farm-green-950 px-3 py-2 font-bold text-farm-cream-50 disabled:opacity-50">
                          Advance Stage
                        </button>
                      </div>
                    </div>
                  ))}
                  {!grids.prebookings.length && <EmptyState label="No pre-booked harvest orders are available." />}
                </div>
              </div>
            </div>
          )}

          {activeTab === "planning" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-farm-green-950">Crop & Batch Planning</h2>
                <form onSubmit={submitBatch} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <select required value={batchDraft.productId} onChange={(event) => setBatchDraft({ ...batchDraft, productId: event.target.value })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm xl:col-span-2">
                    <option value="">Select product</option>
                    {grids.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <input required type="date" value={batchDraft.harvestDate} onChange={(event) => setBatchDraft({ ...batchDraft, harvestDate: event.target.value })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                  <input required type="number" min="0" step="1" value={batchDraft.totalQuantity} onChange={(event) => setBatchDraft({ ...batchDraft, totalQuantity: Number(event.target.value) })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                  <input required type="number" min="0" step="0.01" value={batchDraft.price} onChange={(event) => setBatchDraft({ ...batchDraft, price: Number(event.target.value) })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm" />
                  <select value={batchDraft.status} onChange={(event) => setBatchDraft({ ...batchDraft, status: event.target.value })} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-sm">
                    {batchStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-lg bg-farm-cream-50 px-3 py-2 text-sm font-semibold text-farm-green-800">
                    <input type="checkbox" checked={batchDraft.isFuture} onChange={(event) => setBatchDraft({ ...batchDraft, isFuture: event.target.checked })} />
                    Future yield
                  </label>
                  <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-farm-green-950 px-4 py-2 text-sm font-bold text-farm-cream-50 disabled:opacity-50">
                    <Sprout className="h-4 w-4" />
                    Add Batch
                  </button>
                </form>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {grids.batches.map((batch) => (
                  <div key={batch.id} className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-farm-green-950">{batch.product?.name || "Harvest batch"}</p>
                        <p className="font-mono text-xs text-farm-green-700">Batch #{batch.id.slice(0, 8).toUpperCase()} - {shortDate(batch.harvestDate)}</p>
                      </div>
                      <StatusBadge status={batch.status} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input aria-label="Price" type="number" step="0.01" defaultValue={batch.price} onBlur={(event) => runAction(() => updateBatch(batch.id, { price: Number(event.target.value) }), "Batch price updated.")} className="rounded-lg border border-farm-green-900/10 bg-farm-cream-50 px-3 py-2 text-sm" />
                      <input aria-label="Remaining quantity" type="number" step="1" defaultValue={batch.remainingQuantity} onBlur={(event) => runAction(() => updateBatch(batch.id, { remainingQuantity: Number(event.target.value) }), "Batch quantity updated.")} className="rounded-lg border border-farm-green-900/10 bg-farm-cream-50 px-3 py-2 text-sm" />
                      <select aria-label="Batch status" defaultValue={batch.status} onChange={(event) => runAction(() => updateBatch(batch.id, { status: event.target.value }), "Batch status updated.")} className="rounded-lg border border-farm-green-900/10 bg-farm-cream-50 px-3 py-2 text-sm">
                        {batchStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-farm-green-700">
                      <span>{Number(batch.remainingQuantity).toFixed(1)} of {Number(batch.totalQuantity).toFixed(1)} kg available</span>
                      <button onClick={() => runAction(() => deleteBatch(batch.id), "Batch deleted.")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 font-bold text-red-700">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!grids.batches.length && <EmptyState label="No crop batches have been planned yet." />}
              </div>
            </div>
          )}

          {activeTab === "bulk" && (
            <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-farm-green-950">Bulk Trading Controls</h2>
                  <p className="text-sm text-farm-green-700">Review institutional enquiries, approve requests, reject poor-fit leads, and complete contracts.</p>
                </div>
                <label className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-farm-green-600" />
                  <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} className="h-11 rounded-lg border border-farm-green-900/10 bg-white px-3 text-sm">
                    <option value="ALL">All bulk requests</option>
                    {bulkStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredBulkRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-farm-green-900/10 bg-farm-cream-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-farm-green-950">{request.businessName || request.name}</p>
                        <p className="text-xs text-farm-green-700">{request.email} - {request.phone}</p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <FieldLabel>Interest</FieldLabel>
                        <p className="text-sm font-bold text-farm-green-950">{request.productInterest}</p>
                      </div>
                      <div>
                        <FieldLabel>Volume</FieldLabel>
                        <p className="text-sm font-bold text-farm-green-950">{request.quantity} kg</p>
                      </div>
                      <div>
                        <FieldLabel>Contact</FieldLabel>
                        <p className="text-sm font-bold text-farm-green-950">{request.contactPreference}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-farm-green-800">{request.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button disabled={isPending} onClick={() => runAction(() => updateBulkRequestStatus(request.id, "APPROVED"), "Bulk request approved.")} className="inline-flex items-center gap-1 rounded-lg bg-farm-green-950 px-3 py-2 text-xs font-bold text-farm-cream-50 disabled:opacity-50">
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button disabled={isPending} onClick={() => runAction(() => updateBulkRequestStatus(request.id, "REJECTED"), "Bulk request rejected.")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                      <button disabled={isPending} onClick={() => runAction(() => respondToBulkRequest(request.id, "RESPONDED"), "Bulk request marked responded.")} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-xs font-bold text-farm-green-800 disabled:opacity-50">
                        Responded
                      </button>
                      <button disabled={isPending} onClick={() => runAction(() => respondToBulkRequest(request.id, "COMPLETED"), "Bulk contract completed.")} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-xs font-bold text-farm-green-800 disabled:opacity-50">
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
                {!filteredBulkRequests.length && <EmptyState label="No bulk trade enquiries match this filter." />}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-farm-green-950">User Management</h2>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-farm-green-900/10 text-xs uppercase tracking-wide text-farm-green-700">
                    <tr>
                      <th className="py-3">User</th>
                      <th>Email</th>
                      <th>Role / Account</th>
                      <th>Joined</th>
                      <th className="text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-farm-green-900/10">
                    {grids.users.map((user) => (
                      <tr key={user.id}>
                        <td className="py-4 font-bold text-farm-green-950">{user.name}</td>
                        <td className="text-farm-green-700">{user.email}</td>
                        <td>
                          <StatusBadge status={user.role} />
                        </td>
                        <td>{shortDate(user.createdAt)}</td>
                        <td className="text-right">
                          <select disabled={isPending} value={user.role} onChange={(event) => runAction(() => updateUserAccount(user.id, { role: event.target.value as "CUSTOMER" | "ADMIN" | "DISABLED" }), "User account updated.")} className="rounded-lg border border-farm-green-900/10 bg-white px-3 py-2 text-xs font-semibold">
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="DISABLED">DISABLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="rounded-lg border border-farm-green-900/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-farm-green-950">System Logs</h2>
                  <p className="text-sm text-farm-green-700">Admin activities, notifications, and operational events.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="date" value={logDate} onChange={(event) => setLogDate(event.target.value)} className="h-11 rounded-lg border border-farm-green-900/10 bg-white px-3 text-sm" />
                  <select value={logType} onChange={(event) => setLogType(event.target.value)} className="h-11 rounded-lg border border-farm-green-900/10 bg-white px-3 text-sm">
                    <option value="ALL">All event types</option>
                    {logTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="grid gap-3 rounded-lg border border-farm-green-900/10 bg-farm-cream-50 p-4 md:grid-cols-[180px_1fr_130px]">
                    <div>
                      <FieldLabel>Timestamp</FieldLabel>
                      <p className="mt-1 text-sm font-bold text-farm-green-950">{dateTime(log.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-bold text-farm-green-950">{log.event}</p>
                      <p className="mt-1 text-sm text-farm-green-800">{log.message}</p>
                      <p className="mt-1 text-xs text-farm-green-700">{log.email}</p>
                    </div>
                    <div className="md:text-right">
                      <StatusBadge status={log.type} />
                      <p className="mt-2 text-xs font-semibold text-farm-green-700">{log.status}</p>
                    </div>
                  </div>
                ))}
                {!filteredLogs.length && <EmptyState label="No system logs match the selected filters." />}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
