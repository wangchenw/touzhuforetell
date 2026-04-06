import { Outlet, NavLink } from 'react-router-dom';
import { Aperture, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  return (
    <div className="flex flex-col h-full w-full">
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Outlet />
      </main>

      <nav className="relative w-full bg-white/80 backdrop-blur-2xl border-t border-[#E5E5EA]/40 flex justify-around items-center h-[72px] px-4 z-50 shrink-0">
        {[
          { to: '/', icon: Aperture, label: 'Foretell' },
          { to: '/bookkeeping', icon: Wallet, label: '记账本' },
          { to: '/profile', icon: User, label: '我的' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-16 h-full gap-[5px] transition-all duration-500 relative",
                isActive ? "text-emerald-600" : "text-[#AEAEB2]"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative p-1.5">
                  {isActive && (
                    <div className="absolute inset-[-6px] bg-emerald-400/[0.07] rounded-2xl blur-[8px] pointer-events-none" />
                  )}
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="relative z-10 transition-all duration-500"
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] tracking-[0.03em] transition-all duration-500",
                    isActive ? "font-semibold" : "font-normal"
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
