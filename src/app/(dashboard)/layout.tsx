import { DashboardLayout } from "@/components/dasboardComponents/DashboardLayoutComponent";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
