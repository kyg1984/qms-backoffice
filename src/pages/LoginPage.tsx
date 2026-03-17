import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

const CompanyLogo = () => (
  <svg viewBox="0 0 96 72" width="96" height="72" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="48" cy="36" rx="48" ry="36" fill="#29ABE2" />
    <ellipse cx="48" cy="36" rx="48" ry="36" fill="url(#loginLogoGrad)" />
    <path d="M48 72 C21.49 72 0 55.882 0 36 C0 16.118 21.49 0 48 0 L96 0 C96 0 80 16 80 36 C80 56 96 72 96 72 Z" fill="#1A3A5C" opacity="0.85" />
    <path d="M60 18 C44 18 32 26.059 32 36 C32 45.941 44 54 60 54 C64 54 67.8 53.314 71.2 52.059 L66 45 C63.6 45.657 61.8 46 60 46 C48.954 46 40 41.523 40 36 C40 30.477 48.954 26 60 26 C61.8 26 63.6 26.343 66 27 L71.2 19.941 C67.8 18.686 64 18 60 18 Z" fill="white" />
    <defs>
      <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="96" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#29ABE2" />
        <stop offset="100%" stopColor="#1A7DB5" />
      </linearGradient>
    </defs>
  </svg>
);

const DEMO_ACCOUNTS = [
  { name: '김관리 (Admin)', email: 'admin@company.com', role: 'ADMIN' as UserRole },
  { name: '이작성 (Author)', email: 'author1@company.com', role: 'AUTHOR' as UserRole },
  { name: '최열람 (Viewer)', email: 'viewer1@company.com', role: 'VIEWER' as UserRole },
];

export const LoginPage = () => {
  const { setIsLoggedIn, setCurrentUser, users } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.is_active);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('이메일을 확인하거나 데모 계정을 클릭하세요.');
    }
  };

  const loginAs = (demoEmail: string) => {
    const user = users.find(u => u.email === demoEmail);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-white text-2xl font-bold tracking-widest uppercase mb-3">COSMO ROBOTICS</p>
          <h1 className="text-base font-medium text-slate-300">ISO13485 QMS</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-3 font-medium">데모 계정으로 빠른 로그인</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => loginAs(acc.email)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <span className="text-gray-700">{acc.name}</span>
                  <span className="text-gray-400 text-xs">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
