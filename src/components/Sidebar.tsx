import { NavLink } from 'react-router-dom';
import { FileText, Users, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { to: '/documents', icon: FileText, label: '문서 목록' },
  { to: '/users', icon: Users, label: '사용자 관리', adminOnly: true },
];

export const Sidebar = () => {
  const { currentUser, setIsLoggedIn } = useApp();

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-white font-semibold text-sm leading-tight">QMS 문서관리</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, adminOnly }) => {
          if (adminOnly && currentUser.role !== 'ADMIN') return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <div className="px-3 py-2 mb-2">
          <p className="text-white text-sm font-medium">{currentUser.name}</p>
          <p className="text-slate-400 text-xs">{currentUser.email}</p>
          <span className="inline-block mt-1 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
            {currentUser.role === 'ADMIN' ? '관리자' : currentUser.role === 'AUTHOR' ? '작성자' : '열람자'}
          </span>
        </div>
        <button
          onClick={() => setIsLoggedIn(false)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </aside>
  );
};
