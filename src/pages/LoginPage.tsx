import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';


const DEMO_PASSWORD = '1234'; // 목업 공통 비밀번호

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
    if (!email.trim()) { setError('이메일을 입력하세요.'); return; }
    if (!password) { setError('비밀번호를 입력하세요.'); return; }
    if (password !== DEMO_PASSWORD) { setError(`비밀번호가 올바르지 않습니다. (데모: ${DEMO_PASSWORD})`); return; }
    const user = users.find(u => u.email === email.trim() && u.is_active);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('등록되지 않은 이메일이거나 비활성 계정입니다.');
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
                  placeholder={`비밀번호를 입력하세요 (데모: ${DEMO_PASSWORD})`}
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
