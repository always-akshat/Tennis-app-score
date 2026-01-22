import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser, useSignOut } from '@/features/auth';
import { Button } from '@/components/ui';

export function Layout() {
  const user = useUser();
  const signOut = useSignOut();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/tournaments', label: 'Tournaments' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="font-semibold text-gray-900">Sports Score</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut.mutate()}
                    isLoading={signOut.isPending}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
