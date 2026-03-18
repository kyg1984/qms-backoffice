import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  User, Document, DocumentFile, DocumentHistory, DocumentRelation, AccessRequest,
} from '../types';
import { userService } from '../services/userService';
import { documentService } from '../services/documentService';
import { fileService } from '../services/fileService';
import { historyService } from '../services/historyService';
import { relationService } from '../services/relationService';
import { departmentService } from '../services/departmentService';
import { accessRequestService } from '../services/accessRequestService';

const DEFAULT_USER: User = {
  id: '', name: '', email: '', password: '', role: 'VIEWER',
  department: undefined, is_active: false, created_at: '', updated_at: '',
};

const SESSION_KEY = 'qms_session_user';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  documentFiles: DocumentFile[];
  setDocumentFiles: (files: DocumentFile[]) => void;
  documentHistories: DocumentHistory[];
  setDocumentHistories: (histories: DocumentHistory[]) => void;
  documentRelations: DocumentRelation[];
  setDocumentRelations: (relations: DocumentRelation[]) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  departments: string[];
  setDepartments: (depts: string[]) => void;
  accessRequests: AccessRequest[];
  setAccessRequests: (reqs: AccessRequest[]) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch { return DEFAULT_USER; }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [documentHistories, setDocumentHistories] = useState<DocumentHistory[]>([]);
  const [documentRelations, setDocumentRelations] = useState<DocumentRelation[]>([]);
  const [isLoggedIn, setIsLoggedInState] = useState(() => !!localStorage.getItem(SESSION_KEY));

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    if (user.id) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  };

  const setIsLoggedIn = (v: boolean) => {
    setIsLoggedInState(v);
    if (!v) localStorage.removeItem(SESSION_KEY);
  };
  const [departments, setDepartments] = useState<string[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [u, docs, files, histories, relations, depts, requests] = await Promise.all([
        userService.getAll(),
        documentService.getAll(),
        fileService.getAll(),
        historyService.getAll(),
        relationService.getAll(),
        departmentService.getAll(),
        accessRequestService.getAll(),
      ]);
      setUsers(u);
      setDocuments(docs);
      setDocumentFiles(files);
      setDocumentHistories(histories);
      setDocumentRelations(relations);
      setDepartments(depts);
      setAccessRequests(requests);
    } catch (err) {
      console.error('Supabase 데이터 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 앱 시작 시 Supabase에서 전체 데이터 로드
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      users, setUsers,
      documents, setDocuments,
      documentFiles, setDocumentFiles,
      documentHistories, setDocumentHistories,
      documentRelations, setDocumentRelations,
      isLoggedIn, setIsLoggedIn,
      departments, setDepartments,
      accessRequests, setAccessRequests,
      isLoading,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
