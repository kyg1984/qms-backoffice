import React, { createContext, useContext, useState } from 'react';
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
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);

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
