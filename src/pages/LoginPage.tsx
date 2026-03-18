import { useState, useEffect } from 'react';
import { Eye, EyeOff, X, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const KEY_EMAIL = 'qms_saved_email';
const KEY_PASSWORD = 'qms_saved_password';
const DOMAIN = '@cosmo-robotics.com';
const PW_RULE = /^(?=.*[A-Za-z])(?=.*[0-9]).{4,}$/;

const INIT_REQ = { name: '', email: '', password: '', department: '' };

export const LoginPage = () => {
  const { setIsLoggedIn, setCurrentUser, users, departments, accessRequests, setAccessRequests } = useApp();

  // 로그인 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [saveEmail, setSaveEmail] = useState(false);
  const [savePw, setSavePw] = useState(false);

  // 권한 요청 모달 상태
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState(INIT_REQ);
  const [reqShowPw, setReqShowPw] = useState(false);
  const [reqError, setReqError] = useState('');
  const [reqDone, setReqDone] = useState(false);

  // 저장된 값 복원
  useEffect(() => {
    const savedEmail = localStorage.getItem(KEY_EMAIL);
    const savedPw = localStorage.getItem(KEY_PASSWORD);
    if (savedEmail) { setEmail(savedEmail); setSaveEmail(true); }
    if (savedPw) {
      try { setPassword(atob(savedPw)); setSavePw(true); } catch { localStorage.removeItem(KEY_PASSWORD); }
    }
  }, []);

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

    if (saveEmail) localStorage.setItem(KEY_EMAIL, email.trim());
    else localStorage.removeItem(KEY_EMAIL);
    if (savePw && saveEmail) localStorage.setItem(KEY_PASSWORD, btoa(password));
    else localStorage.removeItem(KEY_PASSWORD);

    setCurrentUser(user);
    setIsLoggedIn(true);
    setError('');
  };

  const openReqModal = () => {
    setReqForm(INIT_REQ);
    setReqError('');
    setReqDone(false);
    setReqShowPw(false);
    setShowReqModal(true);
  };

  const handleRequest = () => {
    setReqError('');
    if (!reqForm.name.trim()) { setReqError('이름을 입력하세요.'); return; }
    if (!reqForm.department) { setReqError('부서를 선택하세요.'); return; }
    if (!reqForm.email.trim()) { setReqError('이메일을 입력하세요.'); return; }
    if (!reqForm.email.trim().endsWith(DOMAIN)) {
      setReqError(`이메일은 ${DOMAIN} 형식이어야 합니다.`); return;
    }
    if (users.some(u => u.email === reqForm.email.trim())) {
      setReqError('이미 등록된 이메일입니다.'); return;
    }
    if (accessRequests.some(r => r.email === reqForm.email.trim() && r.status === 'pending')) {
      setReqError('이미 권한 요청 중인 이메일입니다.'); return;
    }
    if (!PW_RULE.test(reqForm.password)) {
      setReqError('비밀번호는 영문 + 숫자 조합 4자 이상이어야 합니다.'); return;
    }

    const now = new Date().toISOString().slice(0, 10);
    setAccessRequests([
      ...accessRequests,
      {
        id: `req_${Date.now()}`,
        name: reqForm.name.trim(),
        email: reqForm.email.trim(),
        password: reqForm.password,
        department: reqForm.department,
        status: 'pending',
        requested_at: now,
      },
    ]);
    setReqDone(true);
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

          {/* 권한 요청 링크 */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={openReqModal}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              계정이 없으신가요? 권한 요청하기
            </button>
          </div>
        </div>
      </div>

      {/* 권한 요청 모달 */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">권한 요청</h2>
              <button onClick={() => setShowReqModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {reqDone ? (
                /* 요청 완료 화면 */
                <div className="text-center py-4 space-y-4">
                  <CheckCircle size={48} className="text-green-500 mx-auto" />
                  <div>
                    <p className="text-base font-semibold text-gray-900">권한 요청이 완료되었습니다</p>
                    <p className="text-sm text-gray-500 mt-1">관리자 승인 후 계정을 사용하실 수 있습니다.</p>
                    <p className="text-sm text-gray-500">승인 시 입력하신 이메일로 안내 메일이 발송됩니다.</p>
                  </div>
                  <button
                    onClick={() => setShowReqModal(false)}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    확인
                  </button>
                </div>
              ) : (
                /* 요청 폼 */
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    이메일은 <strong>{DOMAIN}</strong> 형식만 가능합니다. 관리자 승인 후 계정이 활성화됩니다.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={reqForm.name}
                        onChange={e => setReqForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="이름"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">부서 <span className="text-red-500">*</span></label>
                      <select
                        value={reqForm.department}
                        onChange={e => setReqForm(f => ({ ...f, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">부서 선택</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일 <span className="text-red-500">*</span></label>
                    <div className="flex">
                      <input
                        type="text"
                        value={reqForm.email}
                        onChange={e => setReqForm(f => ({ ...f, email: e.target.value }))}
                        placeholder={`이메일 입력 (예: hong${DOMAIN})`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type={reqShowPw ? 'text' : 'password'}
                        value={reqForm.password}
                        onChange={e => setReqForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="영문 + 숫자 조합 4자 이상"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
                      />
                      <button type="button" onClick={() => setReqShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {reqShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">영문 + 숫자 조합 4자 이상</p>
                  </div>

                  {reqError && <p className="text-red-500 text-sm">{reqError}</p>}

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowReqModal(false)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleRequest}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      권한 요청
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
