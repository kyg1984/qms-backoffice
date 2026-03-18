import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

const KEY_EMAIL = 'qms_saved_email';
const KEY_PASSWORD = 'qms_saved_password';

export const LoginPage = () => {
  const { setIsLoggedIn, setCurrentUser, users } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [saveEmail, setSaveEmail] = useState(false);
  const [savePw, setSavePw] = useState(false);

  // 저장된 값 복원
  useEffect(() => {
    const savedEmail = localStorage.getItem(KEY_EMAIL);
    const savedPw = localStorage.getItem(KEY_PASSWORD);
    if (savedEmail) { setEmail(savedEmail); setSaveEmail(true); }
    if (savedPw) {
      try { setPassword(atob(savedPw)); setSavePw(true); } catch { localStorage.removeItem(KEY_PASSWORD); }
    }
  }, []);

  // 비밀번호 저장은 아이디 저장이 체크된 경우에만 가능
  const handleSaveEmail = (checked: boolean) => {
    setSaveEmail(checked);
    if (!checked) { setSavePw(false); }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('이메일을 입력하세요.'); return; }
    if (!password) { setError('비밀번호를 입력하세요.'); return; }

    const user = users.find(u => u.email === email.trim() && u.is_active);
    if (!user) { setError('등록되지 않은 이메일이거나 비활성 계정입니다.'); return; }
    if (user.password !== password) { setError('비밀번호가 올바르지 않습니다.'); return; }

    // 아이디 저장
    if (saveEmail) localStorage.setItem(KEY_EMAIL, email.trim());
    else localStorage.removeItem(KEY_EMAIL);

    // 비밀번호 저장
    if (savePw && saveEmail) localStorage.setItem(KEY_PASSWORD, btoa(password));
    else localStorage.removeItem(KEY_PASSWORD);

    setCurrentUser(user);
    setIsLoggedIn(true);
    setError('');
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

            {/* 아이디 / 비밀번호 각각 저장 */}
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveEmail}
                  onChange={e => handleSaveEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-600">아이디 저장</span>
              </label>
              <label className={`flex items-center gap-2 select-none ${saveEmail ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
                <input
                  type="checkbox"
                  checked={savePw}
                  disabled={!saveEmail}
                  onChange={e => setSavePw(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-600">비밀번호 저장</span>
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
