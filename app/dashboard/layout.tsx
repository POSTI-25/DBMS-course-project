import type { Metadata } from "next";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import StarCanvas from "@/components/StarCanvas";

export const metadata: Metadata = {
  title: "Dashboard | Stellar Archive DBMS",
  description: "Database administration dashboard for astronomical datasets",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ position: "relative" }}>
      {/* Animated star-field canvas */}
      <StarCanvas />

      {/* Topbar sits above canvas */}
      <div style={{ position: "relative", zIndex: 50 }}>
        <Topbar />
      </div>

      <div className="flex flex-1" style={{ position: "relative", zIndex: 10 }}>
        <Sidebar />
        <main
          className="flex-1 overflow-auto p-6"
          style={{ minWidth: 0 }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
