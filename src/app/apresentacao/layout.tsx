import type { ReactNode } from "react";
import { AccountBar } from "../../components/auth/AccountBar.js";
import { requireTcePage } from "../../lib/auth/access.js";

export default async function PresentationProtectedLayout({ children }: Readonly<{ children: ReactNode }>) {
  const access = await requireTcePage("/apresentacao");
  return <><AccountBar email={access.user.email} />{children}</>;
}
