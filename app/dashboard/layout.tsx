import type { Metadata } from "next";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard | Stellar Archive DBMS",
  description: "Database administration dashboard for astronomical datasets",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <div className="flex flex-col min-h-screen" style={{ position: "relative" }}>
      {/* Topbar sits above canvas */}
      <div style={{ position: "relative", zIndex: 50 }}>
        <Topbar session={session} />
      </div>

      <div className="dashboard-body flex flex-1" style={{ position: "relative", zIndex: 10 }}>
        <Sidebar roleId={session.roleId} />
        <main
          className="dashboard-main flex-1 overflow-auto p-6"
          style={{ minWidth: 0 }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
