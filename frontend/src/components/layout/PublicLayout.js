import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { Button, useDialog, useToast } from '../ui';

const PublicLayout = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { confirm } = useDialog();
  const { showToast } = useToast();

  const dashboardHref = user?.role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
  const hasResolvedUser = Boolean(user?.id || user?.username || user?.email);
  const showAuthenticatedActions = !loading && isAuthenticated && hasResolvedUser;

  const handleLogout = async () => {
    const confirmed = await confirm('Do you want to logout?', { title: 'Logout' });
    if (!confirmed) return;
    logout();
    navigate('/');
  };

  const navItems = useMemo(
    () => [
      { to: '/', label: t('nav_home', 'Home') },
      { to: '/fields', label: t('nav_fields', 'Fields') },
      { to: '/league', label: t('nav_league', 'League') },
      { to: '/teams', label: t('nav_teams', 'Teams') }
    ],
    [t]
  );

  const isActivePath = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const authRouteState = { backgroundLocation: location };

  React.useEffect(() => {
    const successMessage = location.state?.successMessage;
    const errorMessage = location.state?.errorMessage;

    if (!successMessage && !errorMessage) return;

    showToast(successMessage || errorMessage, {
      type: successMessage ? 'success' : 'error'
    });

    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: {}
    });
  }, [location, navigate, showToast]);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white">
                FB
              </span>
              <span className="khmer-brand-font text-base font-semibold text-gray-900 sm:text-xl">
                {t('app_name', 'Football Field Booking')}
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-gray-700">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`rounded-md px-3 py-2 transition hover:bg-gray-100 hover:text-gray-900 ${
                    isActivePath(item.to) ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              <LanguageSwitcher className="hidden sm:inline-flex" />
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 md:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>

              {showAuthenticatedActions ? (
                <>
                  <Button as={Link} to={dashboardHref} variant="outline" size="sm" className="hidden sm:inline-flex">
                    {t('action_go_dashboard', 'Go to Dashboard')}
                  </Button>
                  <Button onClick={handleLogout} size="sm" className="hidden sm:inline-flex">
                    {t('action_logout', 'Logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button as={Link} to="/login" state={authRouteState} variant="outline" size="sm" className="hidden sm:inline-flex">
                    {t('nav_login', 'Login')}
                  </Button>
                  <Button as={Link} to="/register" state={authRouteState} size="sm" className="hidden sm:inline-flex">
                    {t('nav_register', 'Register')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4">
              <div className="pt-2 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActivePath(item.to) ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="pt-3">
                <LanguageSwitcher className="flex w-full items-center justify-between" />
              </div>

              <div className="pt-3 flex gap-2">
                {showAuthenticatedActions ? (
                  <>
                    <Button as={Link} to={dashboardHref} variant="outline" size="sm" className="flex-1">
                      {t('nav_dashboard', 'Dashboard')}
                    </Button>
                    <Button onClick={handleLogout} size="sm" className="flex-1">
                      {t('action_logout', 'Logout')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button as={Link} to="/login" state={authRouteState} variant="outline" size="sm" className="flex-1">
                      {t('nav_login', 'Login')}
                    </Button>
                    <Button as={Link} to="/register" state={authRouteState} size="sm" className="flex-1">
                      {t('nav_register', 'Register')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isHomePage ? 'py-0' : 'py-8'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;