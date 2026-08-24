import { AppShell } from "@/components/app-shell";

export default function LoggedInLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
