import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  TrendingUp, 
  BrainCircuit, 
  MessageSquare, 
  Trophy, 
  GraduationCap, 
  User, 
  History, 
  Star,
  LogOut
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = usePathname();
  const { signOut } = useClerk();

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Markets", href: "/markets", icon: TrendingUp },
    { label: "Watchlist", href: "/watchlist", icon: Star },
    { label: "Analysis", href: "/analysis", icon: BrainCircuit },
    { label: "AI Mentor", href: "/mentor", icon: MessageSquare },
    { label: "Transactions", href: "/transactions", icon: History },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Learn", href: "/learn", icon: GraduationCap },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background dark overflow-hidden">
        <Sidebar className="border-r border-border bg-sidebar h-full">
          <SidebarHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <TrendingUp className="w-6 h-6" />
              <span>Welloh</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground">Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.href}
                        className={location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem className="mt-4">
                    <SidebarMenuButton 
                      onClick={() => signOut()}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-y-auto p-8 relative z-0 bg-background text-foreground">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
