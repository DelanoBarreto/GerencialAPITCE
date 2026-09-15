import type { ReactNode } from "react";
import { AccountBar } from "../../components/auth/AccountBar.js";
import { requireSuperadminPage } from "../../lib/auth/access.js";

export default async function AdminProtectedLayout({ children }: Readonly<{ children: ReactNode }>) {
  const access = await requireSuperadminPage("/admin");
  return <><AccountBar email={access.user.email} />{children}</>;
}
