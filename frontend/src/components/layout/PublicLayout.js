import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRightIcon,
  Bars3Icon,
  BuildingOffice2Icon,
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  PowerIcon,
  TrophyIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button, useDialog, useToast } from '../ui';
import { APP_CONFIG } from '../../config/appConfig';

const PublicLayout = () => {
  const { user, isAuthenticated, loading, isLoggingOut, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { confirm } = useDialog();
  const { showToast } = useToast();

  const dashboardHref = user?.role === 'field_owner' ? '/owner/dashboard' : '/app/dashboard';
  const hasResolvedUser = Boolean(user?.id || user?.username || user?.email);
  const showAuthenticatedActions = !loading && isAuthenticated && hasResolvedUser;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    const confirmed = await confirm('Do you want to logout?', { title: 'Logout' });
    if (!confirmed) return;
    await logout();
    navigate('/', { replace: true });
  };

  const navItems = useMemo(
    () => [
      { to: '/', label: 'Home', icon: HomeIcon },
      { to: '/fields', label: 'Fields', icon: BuildingOffice2Icon },
      { to: '/league', label: 'League', icon: TrophyIcon },
      { to: '/teams', label: 'Teams', icon: UserGroupIcon }
    ],
    []
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.12),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
      <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            <Link
              to="/"
              className="group flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-lime-500 text-sm font-black tracking-wide text-white shadow-[0_10px_24px_rgba(22,163,74,0.3)]">
                FB
              </span>
              <span className="min-w-0 py-0.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-600">
                  {APP_CONFIG.brand.englishName}
                </span>
                <span className="khmer-brand-font block text-base font-semibold leading-[1.2] text-slate-900 sm:text-xl">
                  {APP_CONFIG.brand.displayName}
                </span>
              </span>
            </Link>

            <nav className="hidden items-center rounded-full border border-slate-200/80 bg-white/80 p-1.5 shadow-sm md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActivePath(item.to)
                      ? 'bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.28)]'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${
                      isActivePath(item.to) ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                    }`}
                  />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 md:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>

              {showAuthenticatedActions ? (
                <>
                  <Button
                    as={Link}
                    to={dashboardHref}
                    variant="outline"
                    size="sm"
                    className="hidden rounded-full border-slate-300 bg-white px-5 text-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:inline-flex"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    size="sm"
                    className="hidden rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-5 text-white shadow-[0_10px_24px_rgba(22,163,74,0.24)] hover:-translate-y-0.5 hover:from-emerald-700 hover:to-green-700 sm:inline-flex"
                  >
                    <PowerIcon className="h-4 w-4" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    as={Link}
                    to="/login"
                    state={authRouteState}
                    variant="outline"
                    size="sm"
                    className="hidden rounded-full border-slate-300 bg-white/90 px-4 sm:inline-flex"
                  >
                    Login
                  </Button>
                  <Button
                    as={Link}
                    to="/register"
                    state={authRouteState}
                    size="sm"
                    className="hidden rounded-full px-4 shadow-[0_12px_24px_rgba(22,163,74,0.22)] sm:inline-flex"
                  >
                    Register
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {mobileOpen && (
            <div className="pb-5 md:hidden">
              <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white/95 p-3 shadow-[0_18px_44px_rgba(15,23,42,0.09)]">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                        isActivePath(item.to)
                          ? 'bg-emerald-600 text-white shadow-[0_12px_24px_rgba(5,150,105,0.22)]'
                          : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActivePath(item.to) ? 'text-white' : 'text-slate-400'}`}
                      />
                      {item.label}
                    </NavLink>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  {showAuthenticatedActions ? (
                    <>
                      <Button
                        as={Link}
                        to={dashboardHref}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-slate-300 bg-white"
                      >
                        Dashboard
                      </Button>
                      <Button onClick={handleLogout} disabled={isLoggingOut} size="sm" className="flex-1 rounded-full">
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        as={Link}
                        to="/login"
                        state={authRouteState}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-slate-300 bg-white"
                      >
                        Login
                      </Button>
                      <Button
                        as={Link}
                        to="/register"
                        state={authRouteState}
                        size="sm"
                        className="flex-1 rounded-full"
                      >
                        Register
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isHomePage ? 'py-0' : 'py-8'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
