import { useState } from 'react';
import { Plus, Edit2, UserX, UserCheck, Eye, EyeOff, Trash2, Building2, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import type { UserRole, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { toDateStr, isValidEmail } from '../utils/date';

const ROLE_LABEL: Record<UserRole, string> = { ADMIN: '관리자', AUTHOR: '작성자', VIEWER: '열람자' };
const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 border border-purple-200',
  AUTHOR: 'bg-blue-100 text-blue-700 border border-blue-200',
  VIEWER: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const INIT_FORM = { name: '', email: '', password: '', role: 'VIEWER' as UserRole, department: '' };

export const UserManagementPage = () => {
  const { users, setUsers, currentUser, departments, setDepartments, accessRequests, setAccessRequests } = useApp();
  const navigate = useNavigate();
  const [newDeptName, setNewDeptName] = useState('');
  const [showModal, setShowModal] = useState(false);
  // 승인 역할 선택 상태: requestId → role
  const [approveRoles, setApproveRoles] = useState<Record<string, UserRole>>({});
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(INIT_FORM);
  const [formError, setFormError] = useState('');
  const [showFormPw, setShowFormPw] = useState(false);
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterActive, setFilterActive] = useState<'' | 'active' | 'inactive'>('');

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">접근 권한이 없습니다.</p>
        <button onClick={() => navigate('/documents')} className="mt-4 text-blue-600 hover:underline text-sm">문서 목록으로 이동</button>
      </div>
    );
  }

  const filtered = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterActive === 'active' && !u.is_active) return false;
    if (filterActive === 'inactive' && u.is_active) return false;
    return true;
  });

  const openCreate = () => {
    setEditUser(null);
    setForm(INIT_FORM);
    setFormError('');
    setShowFormPw(false);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department ?? '' });
    setFormError('');
    setShowFormPw(false);
    setShowModal(true);
  };

  const saveUser = () => {
    setFormError('');
    if (!form.name || !form.email) { setFormError('이름과 이메일을 입력하세요.'); return; }
    if (!isValidEmail(form.email)) { setFormError('올바른 이메일 형식이 아닙니다. (예: user@company.com)'); return; }
    const PW_RULE = /^(?=.*[A-Za-z])(?=.*[0-9]).{4,}$/;
    if (!editUser) {
      if (!PW_RULE.test(form.password)) { setFormError('비밀번호는 영문 + 숫자 조합 4자 이상이어야 합니다.'); return; }
      if (users.some(u => u.email === form.email)) { setFormError('이미 사용 중인 이메일입니다.'); return; }
    } else if (form.password && !PW_RULE.test(form.password)) {
      setFormError('비밀번호는 영문 + 숫자 조합 4자 이상이어야 합니다.'); return;
    }

    if (editUser) {
      setUsers(users.map(u => u.id === editUser.id ? {
        ...u,
        name: form.name,
        role: form.role,
        department: form.department.trim() || undefined,
        ...(form.password ? { password: form.password } : {}),
        updated_at: toDateStr(),
      } : u));
    } else {
      setUsers([...users, {
        id: `u${Date.now()}`,
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department.trim() || undefined,
        is_active: true,
        created_at: toDateStr(),
        updated_at: toDateStr(),
      }]);
    }
    setShowModal(false);
  };

  const toggleActive = (u: User) => {
    if (u.id === currentUser.id) { alert('자신의 계정은 비활성화할 수 없습니다.'); return; }
    setUsers(users.map(x => x.id === u.id ? { ...x, is_active: !x.is_active, updated_at: toDateStr() } : x));
  };

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  const handleApprove = (reqId: string) => {
    const req = accessRequests.find(r => r.id === reqId);
    if (!req) return;
    const role = approveRoles[reqId] || 'VIEWER';
    const now = toDateStr();
    // 사용자 추가
    setUsers([...users, {
      id: `u${Date.now()}`,
      name: req.name,
      email: req.email,
      password: req.password,
      role,
      department: req.department,
      is_active: true,
      created_at: now,
      updated_at: now,
    }]);
    // 요청 상태 업데이트
    setAccessRequests(accessRequests.map(r =>
      r.id === reqId ? { ...r, status: 'approved', role, reviewed_at: now } : r
    ));
    alert(`✉️ ${req.email} 으로 승인 안내 메일이 발송되었습니다.\n역할: ${role === 'AUTHOR' ? '작성자' : '열람자'}`);
  };

  const handleReject = (reqId: string) => {
    const req = accessRequests.find(r => r.id === reqId);
    if (!req) return;
    if (!window.confirm(`'${req.name}(${req.email})' 의 권한 요청을 거절하시겠습니까?`)) return;
    const now = toDateStr();
    setAccessRequests(accessRequests.map(r =>
      r.id === reqId ? { ...r, status: 'rejected', reviewed_at: now } : r
    ));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {users.length}명 · 활성 {users.filter(u => u.is_active).length}명</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 계정 생성
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">역할</span>
          <button onClick={() => setFilterRole('')} className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${filterRole === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}>전체</button>
          {(['ADMIN', 'AUTHOR', 'VIEWER'] as UserRole[]).map(r => (
            <button key={r} onClick={() => setFilterRole(r === filterRole ? '' : r)} className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${filterRole === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}>{ROLE_LABEL[r]}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">상태</span>
          {([['', '전체'], ['active', '활성'], ['inactive', '비활성']] as [typeof filterActive, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setFilterActive(v)} className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${filterActive === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['이름', '이메일', '부서', '역할', '상태', '생성일', '최종 수정일', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">조건에 맞는 사용자가 없습니다.</td></tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">{u.name[0]}</div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                      {u.id === currentUser.id && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">나</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3.5 text-gray-600">{u.department || <span className="text-gray-300 text-xs">미지정</span>}</td>
                  <td className="px-4 py-3.5"><span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {u.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{u.created_at}</td>
                  <td className="px-4 py-3.5 text-gray-500">{u.updated_at}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="수정"><Edit2 size={14} /></button>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`p-1.5 rounded transition-colors ${u.is_active ? 'hover:bg-red-100 text-gray-400 hover:text-red-600' : 'hover:bg-green-100 text-gray-400 hover:text-green-600'}`}
                        title={u.is_active ? '비활성화' : '활성화'}
                      >
                        {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 권한 요청 관리 */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">권한 요청</h2>
            {pendingRequests.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {pendingRequests.length}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {accessRequests.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">접수된 권한 요청이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['이름', '부서', '이메일', '요청일', '역할 지정', '처리'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accessRequests.map(req => (
                  <tr key={req.id} className={`${req.status !== 'pending' ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3.5 font-medium text-gray-900">{req.name}</td>
                    <td className="px-4 py-3.5 text-gray-600">{req.department}</td>
                    <td className="px-4 py-3.5 text-gray-600">{req.email}</td>
                    <td className="px-4 py-3.5 text-gray-500">{req.requested_at}</td>
                    <td className="px-4 py-3.5">
                      {req.status === 'pending' ? (
                        <select
                          value={approveRoles[req.id] || 'VIEWER'}
                          onChange={e => setApproveRoles(prev => ({ ...prev, [req.id]: e.target.value as UserRole }))}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="AUTHOR">작성자</option>
                          <option value="VIEWER">열람자</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {req.status === 'approved' ? `승인 (${req.role === 'AUTHOR' ? '작성자' : '열람자'})` : '거절'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <CheckCircle2 size={12} /> 승인
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <XCircle size={12} /> 거절
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{req.reviewed_at}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 부서 관리 */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">부서 관리</h2>
            <span className="text-sm font-normal text-gray-400">({departments.length})</span>
          </div>
        </div>
        <div className="px-6 py-4">
          {/* 부서 추가 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const name = newDeptName.trim();
                  if (!name) return;
                  if (departments.includes(name)) { alert('이미 존재하는 부서입니다.'); return; }
                  setDepartments([...departments, name]);
                  setNewDeptName('');
                }
              }}
              placeholder="부서명 입력 후 Enter 또는 추가 버튼"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                const name = newDeptName.trim();
                if (!name) return;
                if (departments.includes(name)) { alert('이미 존재하는 부서입니다.'); return; }
                setDepartments([...departments, name]);
                setNewDeptName('');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={14} /> 추가
            </button>
          </div>
          {/* 부서 목록 */}
          {departments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">등록된 부서가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {departments.map(dept => (
                <div key={dept} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 group">
                  <span>{dept}</span>
                  <button
                    onClick={() => {
                      if (users.some(u => u.department === dept)) {
                        if (!window.confirm(`'${dept}' 부서를 사용 중인 계정이 있습니다. 삭제하시겠습니까?`)) return;
                      }
                      setDepartments(departments.filter(d => d !== dept));
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? '계정 수정' : '계정 생성'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="이름" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일 <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="이메일" disabled={!!editUser} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 {!editUser && <span className="text-red-500">*</span>}
              {editUser && <span className="text-gray-400 font-normal text-xs ml-1">(변경 시에만 입력)</span>}
            </label>
            <div className="relative">
              <input
                type={showFormPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={editUser ? '변경할 비밀번호 (미입력 시 유지)' : '영문+숫자 조합 4자 이상'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9"
              />
              <button type="button" onClick={() => setShowFormPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showFormPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할 <span className="text-red-500">*</span></label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ADMIN">관리자 (Admin)</option>
                <option value="AUTHOR">작성자 (Author)</option>
                <option value="VIEWER">열람자 (Viewer)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
              <select
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">부서 선택</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={saveUser} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">저장</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
