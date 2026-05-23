import Link from "next/link";
import { redirect } from "next/navigation";
import BlurBackground from "@/components/ui/BlurBackground";
import ReorderButton from "@/components/ReorderButton";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [orders, preBookings, addresses, wishlist] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { orderItems: { include: { batch: { include: { product: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.preBooking.findMany({
      where: { userId: user.id },
      include: { batch: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.wishlist.findMany({ where: { userId: user.id }, include: { product: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <BlurBackground className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between border-b border-farm-green-800/10 pb-6">
        <div>
          <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600">Customer Dashboard</span>
          <h1 className="font-serif text-4xl font-bold text-farm-green-950">Your Account</h1>
          <p className="mt-1 text-sm text-farm-green-700">{user.name} · {user.email}</p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-full border border-farm-green-900/10 px-5 py-2 text-xs font-semibold text-farm-green-900 hover:border-farm-gold-600">
            Logout
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="rounded-3xl bg-farm-cream-50 p-6 border border-farm-green-900/5">
          <h2 className="font-serif text-xl font-bold text-farm-green-950 mb-4">Order History</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-farm-cream-100 p-4 flex items-center justify-between gap-4">
                <div>
                  <Link href={`/order/retail-${order.id}`} className="font-mono text-xs font-bold hover:text-farm-gold-600">#{order.id.substring(0, 8).toUpperCase()}</Link>
                  <p className="text-xs text-farm-green-700">{order.status} · {order.currency} {order.totalAmount.toFixed(2)}</p>
                </div>
                <ReorderButton orderId={order.id} />
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-farm-green-700">No retail orders yet.</p>}
          </div>
        </section>

        <section className="rounded-3xl bg-farm-cream-50 p-6 border border-farm-green-900/5">
          <h2 className="font-serif text-xl font-bold text-farm-green-950 mb-4">Pre-Book Tracking</h2>
          <div className="space-y-3">
            {preBookings.map((pb) => (
              <Link key={pb.id} href={`/order/prebook-${pb.id}`} className="block rounded-2xl bg-farm-cream-100 p-4 hover:text-farm-gold-600">
                <span className="font-mono text-xs font-bold">#{pb.id.substring(0, 8).toUpperCase()}</span>
                <p className="text-xs text-farm-green-700">{pb.batch.product.name} · {pb.status}</p>
              </Link>
            ))}
            {preBookings.length === 0 && <p className="text-sm text-farm-green-700">No pre-bookings yet.</p>}
          </div>
        </section>

        <section className="rounded-3xl bg-farm-cream-50 p-6 border border-farm-green-900/5">
          <h2 className="font-serif text-xl font-bold text-farm-green-950 mb-4">Saved Addresses</h2>
          {addresses.map((address) => (
            <div key={address.id} className="rounded-2xl bg-farm-cream-100 p-4 text-xs text-farm-green-800 mb-3">
              <strong>{address.label}</strong>: {address.line1}, {address.city}, {address.region} {address.postalCode}
            </div>
          ))}
          {addresses.length === 0 && <p className="text-sm text-farm-green-700">Addresses can be saved from future checkout flows.</p>}
        </section>

        <section className="rounded-3xl bg-farm-cream-50 p-6 border border-farm-green-900/5">
          <h2 className="font-serif text-xl font-bold text-farm-green-950 mb-4">Wishlist</h2>
          {wishlist.map((item) => (
            <Link key={item.id} href={`/product/${item.product.id}`} className="block rounded-2xl bg-farm-cream-100 p-4 text-sm font-semibold text-farm-green-950 hover:text-farm-gold-600 mb-3">
              {item.product.name}
            </Link>
          ))}
          {wishlist.length === 0 && <p className="text-sm text-farm-green-700">No wishlist items yet.</p>}
        </section>
      </div>
    </BlurBackground>
  );
}
