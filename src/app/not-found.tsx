import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-farm-cream-50 px-4 py-16 text-center">
      <span className="text-6xl mb-4">🌿</span>
      <h1 className="font-serif text-3xl font-bold text-farm-green-900 mb-2">
        Page Not Found
      </h1>
      <p className="text-farm-green-800/80 mb-6 max-w-md font-light">
        We couldn't find the page you are looking for. Please check the URL or return to our marketplace.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-farm-green-900 px-6 py-3 text-xs font-semibold tracking-wider text-farm-cream-100 hover:bg-farm-green-800 transition-colors shadow-sm"
      >
        Go back home
      </Link>
    </div>
  );
}
