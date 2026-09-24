import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ModifyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.roleId !== 1) redirect("/dashboard/contents");
  return children;
}
