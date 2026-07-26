import { getSession } from "@/lib/auth";
import { HeaderClient } from "@/components/HeaderClient";

export async function Header() {
  const session = await getSession();
  return (
    <HeaderClient
      session={session ? { name: session.name, role: session.role } : null}
    />
  );
}
