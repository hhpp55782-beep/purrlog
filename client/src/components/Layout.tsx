import { House, PawPrint, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/', label: '广场', icon: House },
  { to: '/publish', label: '发布', icon: PawPrint },
  { to: '/mine', label: '我的', icon: UserRound },
];

const Layout = () => {
  return (
    <div className="w-screen h-screen bg-[#FFF8F2] text-[#4A3B31] flex justify-center">
      <div className="relative w-full max-w-[480px] h-full flex flex-col bg-[#FFF8F2]">
        <main className="flex-1 overflow-y-auto pb-[76px]">
          <Outlet />
        </main>
        <nav className="absolute bottom-0 left-0 right-0 h-[68px] bg-white/95 backdrop-blur border-t border-[#F0E4DA] flex items-center px-2 pb-[env(safe-area-inset-bottom)]">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 text-[11px] transition-colors ${
                  isActive ? 'text-[#E8913F]' : 'text-[#B39C8C]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
