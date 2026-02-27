import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieName, verifySession } from "@/lib/admin-auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  const session = verifySession(token);
  if (!session) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
