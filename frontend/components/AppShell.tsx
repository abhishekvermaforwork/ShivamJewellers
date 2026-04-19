'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { fetchMe } from '@/services/auth.service';
import { clearSession } from '@/lib/session';
import type { BusinessProfile } from '@/types/user';

const NAV_MAIN = [
  { href: '/dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
  { href: '/sales', label: 'Sales', icon: 'fa-chart-line' },
];

const NAV_MANAGE = [
  { href: '/invoices', label: 'Invoices', icon: 'fa-file-invoice' },
  { href: '/clients', label: 'Clients', icon: 'fa-users' },
  { href: '/payments', label: 'Payments', icon: 'fa-money-bill' },
];

const NAV_STOCK = [
  { href: '/inventory', label: 'Inventory', icon: 'fa-gem' },
  { href: '/suppliers', label: 'Suppliers', icon: 'fa-truck' },
];

const NAV_FINANCE = [
  { href: '/petty-expenses', label: 'Petty Expenses', icon: 'fa-coins' },
  { href: '/advance-payments', label: 'Advances', icon: 'fa-hand-holding-dollar' },
];

function navActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavBlock({
  title,
  items,
  pathname,
  close,
}: {
  title: string;
  items: { href: string; label: string; icon: string }[];
  pathname: string;
  close: () => void;
}) {
  return (
    <>
      <span className="nav-section">{title}</span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${navActive(pathname, item.href) ? 'active' : ''}`}
          onClick={close}
        >
          <i className={`fas ${item.icon} w-4 text-center text-gray-600`} />
          <span className="nav-label text-gray-700">{item.label}</span>
        </Link>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (!cancelled && me.businessProfile) {
          setProfile(me.businessProfile as BusinessProfile);
        }
      } catch {
        /* unauthenticated handled by middleware */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function logout() {
    clearSession();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <div
        id="sidebar-overlay"
        role="presentation"
        className={`fixed inset-0 z-[39] bg-black/40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={closeSidebar}
      />

      <div
        id="mobile-topbar"
        className="sticky top-0 z-[38] flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden"
      >
        <button type="button" className="border-0 bg-transparent p-1 text-gray-700" onClick={toggleSidebar}>
          <i className="fas fa-bars text-xl" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          {profile?.logoUrl ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.logoUrl} alt="" className="h-full w-full object-contain" />
            </span>
          ) : null}
          <span className="text-base font-bold text-gray-800">Om Shivam Jewellers</span>
        </Link>
        <Link
          href="/invoices"
          className="rounded-lg bg-brand px-3 py-1.5 text-xs text-white no-underline"
        >
          <i className="fas fa-plus" />
        </Link>
      </div>

      <aside
        id="sidebar"
        className={`fixed left-0 top-0 z-40 flex h-screen h-dvh w-[240px] flex-col overflow-hidden border-r border-gray-200 bg-white transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="shrink-0 border-b border-gray-100 px-4 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-2 no-underline" onClick={closeSidebar}>
            {profile?.logoUrl ? (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.logoUrl} alt="" className="h-full w-full object-contain" />
              </span>
            ) : null}
            <span className="text-base font-bold text-gray-800">Om Shivam Jewellers</span>
          </Link>
          {profile?.businessName ? (
            <p className="mt-0.5 truncate text-[0.7rem] text-gray-400">{profile.businessName}</p>
          ) : null}
        </div>

        <nav id="sidebar-nav" className="min-h-0 flex-1 overflow-y-auto p-2">
          <NavBlock title="Main" items={NAV_MAIN} pathname={pathname} close={closeSidebar} />
          <NavBlock title="Manage" items={NAV_MANAGE} pathname={pathname} close={closeSidebar} />
          <NavBlock title="Stock" items={NAV_STOCK} pathname={pathname} close={closeSidebar} />
          <NavBlock title="Finance" items={NAV_FINANCE} pathname={pathname} close={closeSidebar} />
        </nav>

        <div id="sidebar-footer" className="shrink-0 border-t border-gray-100 p-2">
          <Link
            href="/settings"
            className={`nav-link ${pathname.startsWith('/settings') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <i className="fas fa-cog w-4 text-center text-gray-600" />
            <span className="nav-label">Settings</span>
          </Link>
          <button
            type="button"
            className="nav-link w-full cursor-pointer border-0 bg-transparent text-left"
            onClick={() => {
              closeSidebar();
              logout();
            }}
          >
            <i className="fas fa-sign-out-alt w-4 text-center text-gray-500" />
            <span className="nav-label text-gray-500">Logout</span>
          </button>
        </div>
      </aside>

      <div id="main-content" className="min-h-screen p-4 md:ml-[240px] md:p-8">
        {children}
      </div>
    </>
  );
}
