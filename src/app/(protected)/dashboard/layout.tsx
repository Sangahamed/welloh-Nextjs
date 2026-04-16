// The dashboard uses its own full-screen layout
// Override the (protected) group layout for this route
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
