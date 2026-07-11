import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/supabase/auth";
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) { const user = await requireUser(); return <AppShell email={user.email}>{children}</AppShell>; }
