
import React, { useContext } from 'react'; 
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS, APP_NAME } from '../../constants';
import { NavItem, UserRole } from '../../types'; 
import { AppContext } from '../../App'; 
import { Cog6ToothIcon, XMarkIcon } from '../icons/HeroIcons'; // Added XMarkIcon

interface SidebarProps {
  isMobileOpen: boolean;
  closeMobileSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, closeMobileSidebar }) => {
  const context = useContext(AppContext);
  const currentUser = context?.currentUser;

  const visibleNavItems = NAVIGATION_ITEMS.filter(item => {
    if (item.adminOnly) {
      return currentUser?.role === UserRole.ADMIN;
    }
    return true;
  });

  return (
    <div className={`w-72 h-screen bg-slate-800 text-slate-100 flex flex-col shadow-lg fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
          <Cog6ToothIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-2 text-brand-primary" />
          {APP_NAME}
        </h2>
        <button onClick={closeMobileSidebar} className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white" aria-label="Close sidebar">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 sm:space-y-2">
        {visibleNavItems.map((item: NavItem) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.path === '/'}
            onClick={isMobileOpen ? closeMobileSidebar : undefined} // Close sidebar on nav click on mobile
            className={({ isActive }) =>
              `flex min-h-[52px] items-center px-4 py-3 rounded-lg transition-colors duration-150 ease-in-out
               ${isActive 
                 ? 'bg-brand-primary text-white shadow-md' 
                 : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`
            }
          >
            <item.icon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">&copy; {new Date().getFullYear()} {APP_NAME}</p>
         {currentUser && (
          <p className="text-xs text-slate-500 text-center mt-1">
            Rôle: <span className="font-semibold">{currentUser.role}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
