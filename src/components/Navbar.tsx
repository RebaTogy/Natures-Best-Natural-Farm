import Link from "next/link";
import { getCart } from "@/app/actions/cart";
import { getCurrentUser } from "@/lib/auth";
import { Home, Landmark, MapPin, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { NavLink } from "./NavLink";

export default async function Navbar() {
  const cartItems = await getCart();
  const user = await getCurrentUser();
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-farm-green-800/10 bg-farm-cream-100/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center space-x-2">
              <span className="text-2xl">🌿</span>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-farm-green-900 group-hover:text-farm-gold-600 transition-colors">
                  NATURE'S BEST
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-farm-green-700 font-sans">
                  Natural Farm
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium tracking-wide">
            <NavLink
              href="/"
              exact={true}
              className="text-farm-green-800 hover:text-farm-gold-600 transition-colors py-2 flex items-center space-x-1"
              activeClassName="text-farm-gold-600 font-bold border-b-2 border-farm-gold-600"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </NavLink>
            <NavLink
              href="/marketplace"
              className="text-farm-green-800 hover:text-farm-gold-600 transition-colors py-2 flex items-center space-x-1"
              activeClassName="text-farm-gold-600 font-bold border-b-2 border-farm-gold-600"
            >
              <Store className="h-4 w-4" />
              <span>The Marketplace</span>
            </NavLink>
            <NavLink
              href="/bulk"
              className="text-farm-green-800 hover:text-farm-gold-600 transition-colors py-2 flex items-center space-x-1"
              activeClassName="text-farm-gold-600 font-bold border-b-2 border-farm-gold-600"
            >
              <Landmark className="h-4 w-4" />
              <span>Bulk Trading</span>
            </NavLink>
            {user?.role === "ADMIN" && (
              <NavLink
                href="/admin"
                className="text-farm-green-800 hover:text-farm-gold-600 transition-colors py-2 flex items-center space-x-1"
                activeClassName="text-farm-gold-600 font-bold border-b-2 border-farm-gold-600"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Hub</span>
              </NavLink>
            )}
            <NavLink
              href="/#map"
              className="text-farm-green-800 hover:text-farm-gold-600 transition-colors py-2 flex items-center space-x-1"
              activeClassName="text-farm-gold-600 font-bold border-b-2 border-farm-gold-600"
            >
              <MapPin className="h-4 w-4" />
              <span>Map</span>
            </NavLink>
          </nav>

          {/* Action Utilities (Cart) */}
          <div className="flex items-center space-x-4">
            <Link
              href="/checkout"
              className="relative group p-2.5 rounded-full bg-farm-cream-200 hover:bg-farm-green-900 text-farm-green-950 hover:text-farm-cream-100 transition-all duration-300"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-farm-gold-600 text-[10px] font-bold text-farm-cream-50 ring-2 ring-farm-cream-100 animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              className="hidden sm:inline-flex rounded-full border border-farm-green-900/10 px-4 py-2 text-xs font-semibold text-farm-green-950 hover:border-farm-gold-600"
            >
              {user ? "Account" : "Login"}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
