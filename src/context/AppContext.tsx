import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User,
  Document,
  DocumentFile,
  DocumentHistory,
  DocumentRelation,
  AccessRequest,
} from '../types';
import {
  mockUsers,
  mockDocuments,
  mockDocumentFiles,
  mockDocumentHistories,
  mockDocumentRelations,
  getCurrentUser,
} from '../data/mockData';

const LS_ACCESS_REQUESTS = 'qms_access_requests';

function loadAccessRequests(): AccessRequest[] {
  try {
    const raw = localStorage.getItem(LS_ACCESS_REQUESTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

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
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(getCurrentUser());
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>(mockDocumentFiles);
  const [documentHistories, setDocumentHistories] = useState<DocumentHistory[]>(mockDocumentHistories);
  const [documentRelations, setDocumentRelations] = useState<DocumentRelation[]>(mockDocumentRelations);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [departments, setDepartments] = useState<string[]>(['품질팀', '개발팀', '생산팀', '구매팀', '영업팀', '경영지원팀']);
  const [accessRequests, setAccessRequestsState] = useState<AccessRequest[]>(loadAccessRequests);

  // accessRequests 변경 시 localStorage 동기화
  const setAccessRequests = (reqs: AccessRequest[]) => {
    setAccessRequestsState(reqs);
    try {
      localStorage.setItem(LS_ACCESS_REQUESTS, JSON.stringify(reqs));
    } catch { /* ignore */ }
  };

  // 다른 탭에서 변경 시 동기화
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_ACCESS_REQUESTS) {
        try {
          setAccessRequestsState(e.newValue ? JSON.parse(e.newValue) : []);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

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
