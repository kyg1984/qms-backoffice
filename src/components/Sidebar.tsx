import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Users, LogOut, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';

const NAV_ITEMS = [
  { to: '/documents', icon: FileText, label: '문서 목록' },
  { to: '/users', icon: Users, label: '사용자 관리', adminOnly: true },
];

const INIT_PW_FORM = { current: '', next: '', confirm: '' };

export const Sidebar = () => {
  const { currentUser, setIsLoggedIn, users, setUsers } = useApp();
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState(INIT_PW_FORM);
  const [showFields, setShowFields] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const openPwModal = () => {
    setPwForm(INIT_PW_FORM);
    setShowFields({ current: false, next: false, confirm: false });
    setPwError('');
    setPwSuccess(false);
    setShowPwModal(true);
  };

  const handleChangePw = () => {
    setPwError('');
    const PW_RULE = /^(?=.*[A-Za-z])(?=.*[0-9]).{4,}$/;
    if (!pwForm.current) { setPwError('현재 비밀번호를 입력하세요.'); return; }
    if (pwForm.current !== currentUser.password) { setPwError('현재 비밀번호가 올바르지 않습니다.'); return; }
    if (!PW_RULE.test(pwForm.next)) { setPwError('새 비밀번호는 영문 + 숫자 조합 4자 이상이어야 합니다.'); return; }
    if (pwForm.next === pwForm.current) { setPwError('새 비밀번호가 현재 비밀번호와 동일합니다.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('새 비밀번호가 일치하지 않습니다.'); return; }

    const updated = users.map(u =>
      u.id === currentUser.id ? { ...u, password: pwForm.next, updated_at: new Date().toISOString().slice(0, 10) } : u
    );
    setUsers(updated);
    setPwSuccess(true);
  };

  const toggleField = (field: keyof typeof showFields) =>
    setShowFields(f => ({ ...f, [field]: !f[field] }));

  const ROLE_LABEL: Record<string, string> = { ADMIN: '관리자', AUTHOR: '작성자', VIEWER: '열람자' };

  return (
    <>
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
              {ROLE_LABEL[currentUser.role] ?? currentUser.role}
            </span>
          </div>
          <button
            onClick={openPwModal}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors mb-1"
          >
            <KeyRound size={16} />
            비밀번호 변경
          </button>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 비밀번호 변경 모달 */}
      <Modal isOpen={showPwModal} onClose={() => setShowPwModal(false)} title="비밀번호 변경" size="sm">
        {pwSuccess ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <KeyRound size={22} className="text-green-600" />
            </div>
            <p className="text-gray-800 font-medium mb-1">비밀번호가 변경되었습니다.</p>
            <p className="text-gray-400 text-sm mb-5">다음 로그인부터 새 비밀번호를 사용하세요.</p>
            <button
              onClick={() => setShowPwModal(false)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 현재 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showFields.current ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  placeholder="현재 비밀번호"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
                />
                <button type="button" onClick={() => toggleField('current')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showFields.current ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showFields.next ? 'text' : 'password'}
                  value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                  placeholder="새 비밀번호 (영문+숫자, 4자 이상)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
                />
                <button type="button" onClick={() => toggleField('next')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showFields.next ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* 강도 표시 */}
              {pwForm.next && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map(i => {
                    const len = pwForm.next.length;
                    const hasLetter = /[A-Za-z]/.test(pwForm.next);
                    const hasNum = /[0-9]/.test(pwForm.next);
                    const hasSpec = /[^A-Za-z0-9]/.test(pwForm.next);
                    const valid = hasLetter && hasNum && len >= 4;
                    const score = valid ? ((len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasSpec ? 1 : 0) + 1) : 0;
                    const color = score >= i ? (score <= 1 ? 'bg-red-400' : score <= 2 ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-200';
                    return <div key={i} className={`h-1 flex-1 rounded-full ${color}`} />;
                  })}
                  <span className="text-xs text-gray-400 ml-1">
                    {(() => {
                      const len = pwForm.next.length;
                      const hasLetter = /[A-Za-z]/.test(pwForm.next);
                      const hasNum = /[0-9]/.test(pwForm.next);
                      const hasSpec = /[^A-Za-z0-9]/.test(pwForm.next);
                      const valid = hasLetter && hasNum && len >= 4;
                      const score = valid ? ((len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasSpec ? 1 : 0) + 1) : 0;
                      return score === 0 ? '규칙 미충족' : score <= 1 ? '약함' : score <= 2 ? '보통' : score <= 3 ? '강함' : '매우 강함';
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showFields.confirm ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="새 비밀번호 재입력"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9 ${
                    pwForm.confirm && pwForm.next !== pwForm.confirm ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button type="button" onClick={() => toggleField('confirm')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showFields.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pwForm.confirm && pwForm.next !== pwForm.confirm && (
                <p className="text-red-500 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {pwError && <p className="text-red-500 text-sm">{pwError}</p>}

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setShowPwModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleChangePw} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">변경</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
