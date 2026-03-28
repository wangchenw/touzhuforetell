import { Outlet, NavLink } from 'react-router-dom';
import { Aperture, Trophy, MessageCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  return (
    <div className="flex flex-col h-full w-full">
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Outlet />
      </main>
      
      <nav className="relative w-full bg-white/90 backdrop-blur-xl border-t border-gray-100/50 flex justify-around items-center h-[68px] px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] shrink-0">
        {[
          { to: '/', icon: Aperture, label: 'Foretell' },
          { to: '/schedule', icon: Trophy, label: '赛程' },
          { to: '/news', icon: MessageCircle, label: '资讯' },
          { to: '/bookkeeping', icon: Wallet, label: '投注' }
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-300 relative",
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn("relative p-1 rounded-xl transition-all duration-300", isActive && "bg-blue-50")}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] transition-all duration-300", isActive ? "font-semibold" : "font-medium")}>
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
