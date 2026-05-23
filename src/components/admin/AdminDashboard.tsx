import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { getAdminGrids, getAdminStats } from "@/app/actions/admin";
import { getAnalyticsSummary } from "@/app/actions/analytics";
import { logoutAction } from "@/app/actions/auth";
import AdminPanel from "@/components/AdminPanel";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const [stats, analytics, grids] = await Promise.all([getAdminStats(), getAnalyticsSummary(), getAdminGrids()]);

  return (
    <div className="bg-farm-cream-100">
      <header className="border-b border-farm-green-900/10 bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-farm-green-950 text-farm-cream-50">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-farm-gold-600">Farm Operations Command</p>
              <h1 className="text-2xl font-bold text-farm-green-950">Admin Hub</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-farm-green-900/10 bg-farm-cream-50 px-4 py-2">
              <p className="text-sm font-bold text-farm-green-950">{admin.name}</p>
              <p className="text-xs text-farm-green-700">
                {admin.email} - {admin.role}
              </p>
            </div>
            <form action={logoutAction}>
              <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-farm-green-950 px-4 text-sm font-bold text-farm-cream-50 hover:bg-farm-green-800">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <AdminPanel stats={stats} analytics={analytics} grids={grids} />
    </div>
  );
}
