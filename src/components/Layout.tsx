import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Shield, 
  ListChecks, 
  Settings, 
  History,
  LogOut,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'auditor', 'viewer'] },
  { name: 'Risk Factors', href: '/risk-factors', icon: AlertTriangle, roles: ['admin', 'auditor', 'viewer'] },
  { name: 'Assurance Coverage', href: '/assurance-coverage', icon: Shield, roles: ['admin', 'auditor', 'viewer'] },
  { name: 'Priority Results', href: '/priority-results', icon: ListChecks, roles: ['admin', 'auditor', 'viewer'] },
  { name: 'Risk Weights', href: '/risk-weights', icon: Settings, roles: ['admin'] },
  { name: 'Audit Trail', href: '/audit-trail', icon: History, roles: ['admin', 'auditor', 'viewer'] },
];

const NavLinks = ({ userRole }: { userRole: string | null }) => {
  const location = useLocation();
  
  const filteredNav = navigation.filter(item => 
    !item.roles || !userRole || item.roles.includes(userRole)
  );

  return (
    <nav className="space-y-1">
      {filteredNav.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const { user, userRole, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="py-4">
                  <NavLinks userRole={userRole} />
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold text-primary">AAMAPS</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Audit Prioritization System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.email}</p>
              {userRole && (
                <Badge variant="secondary" className="text-xs">
                  {userRole}
                </Badge>
              )}
            </div>
            <Button onClick={signOut} variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 shrink-0 border-r bg-card">
          <div className="sticky top-16 p-4 h-[calc(100vh-4rem)] overflow-y-auto">
            <NavLinks userRole={userRole} />
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};