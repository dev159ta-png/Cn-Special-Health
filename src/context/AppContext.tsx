import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  Student, 
  Medicine, 
  InfirmaryVisit, 
  User, 
  AuditLog, 
  StockMovementLog, 
  SystemConfig,
  ClassroomOption,
  Role,
  DispensedMedicineItem,
  MedicalAppointment,
  IllnessEpisode,
  IllnessStatus,
  UploadedDocumentItem
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_STUDENTS, 
  INITIAL_MEDICINES, 
  INITIAL_VISITS, 
  INITIAL_STOCK_LOGS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_SYSTEM_CONFIG,
  INITIAL_APPOINTMENTS,
  INITIAL_ILLNESS_EPISODES
} from '../data/initialData';
import { 
  auth, 
  testConnection, 
  signInWithGooglePopup, 
  logOutFirebase, 
  compressImage, 
  readPdfAsDataUrl 
} from '../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToStudents,
  subscribeToMedicines,
  subscribeToVisits,
  subscribeToAppointments,
  subscribeToIllnessEpisodes,
  subscribeToStockLogs,
  subscribeToAuditLogs,
  subscribeToUploadedDocuments,
  subscribeToSystemConfig,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  saveMedicineToFirestore,
  deleteMedicineFromFirestore,
  saveVisitToFirestore,
  deleteVisitFromFirestore,
  saveAppointmentToFirestore,
  deleteAppointmentFromFirestore,
  saveIllnessEpisodeToFirestore,
  deleteIllnessEpisodeFromFirestore,
  saveStockLogToFirestore,
  saveAuditLogToFirestore,
  saveDocumentToFirestore,
  deleteDocumentFromFirestore,
  saveSystemConfigToFirestore,
  seedAllDataToFirestore,
  clearAndSeedRealStudentsToFirestore
} from '../firebase/realtimeService';

export interface DrugSafetyResult {
  canDispense: boolean;
  isSafe: boolean;
  errors: string[];
  warnings: string[];
  hasAllergyAlert: boolean;
  allergyDetails?: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  daysUntilExpiry: number;
  isOutOfStock: boolean;
  isInsufficientStock: boolean;
  availableStock: number;
  messages: string[];
}

export interface DispenseLogItem {
  id: string;
  dispenseDate: string;
  dispenseTime: string;
  visitNumber: string;
  medicineCode: string;
  medicineName: string;
  lotNumber: string;
  quantity: number;
  unit: string;
  stockBefore: number;
  stockAfter: number;
  studentName: string;
  dispenserName: string;
}

interface AppContextType {
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;
  resetUserPassword: (id: string) => void;

  students: Student[];
  filteredStudentsForUser: Student[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Student;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;

  medicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Medicine;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  restockMedicine: (id: string, quantity: number, lotNumber: string, expiryDate: string, note?: string) => void;
  checkDrugSafety: (studentId: string, medicineId: string, quantity: number) => DrugSafetyResult;

  visits: InfirmaryVisit[];
  addVisit: (visit: Omit<InfirmaryVisit, 'id' | 'visitNumber' | 'createdAt'> & { id?: string; visitNumber?: string; createdAt?: string }) => InfirmaryVisit;
  updateVisit: (id: string, visit: Partial<InfirmaryVisit>) => void;
  deleteVisit: (id: string) => void;

  // สถานะการเจ็บป่วย (Illness Episodes & Status Tracking)
  illnessEpisodes: IllnessEpisode[];
  addIllnessEpisode: (episode: Omit<IllnessEpisode, 'id' | 'createdAt'>) => IllnessEpisode;
  updateIllnessEpisode: (id: string, updates: Partial<IllnessEpisode>) => void;
  markIllnessRecovered: (id: string, recoveredDate?: string, note?: string) => void;
  reopenIllnessEpisode: (id: string) => void;
  deleteIllnessEpisode: (id: string) => void;
  activeIllnessEpisodesCount: number;
  recoveredTodayCount: number;
  monthlyPatientsCount: number;

  appointments: MedicalAppointment[];
  addAppointment: (appointment: Omit<MedicalAppointment, 'id' | 'createdAt'>) => MedicalAppointment;
  updateAppointment: (id: string, updates: Partial<MedicalAppointment>) => void;
  deleteAppointment: (id: string) => void;
  upcomingAppointmentsCount: number;

  stockLogs: StockMovementLog[];
  dispenseLogs: DispenseLogItem[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  addClassroom: (classroom: ClassroomOption) => void;
  updateClassroom: (index: number, classroom: ClassroomOption) => void;
  deleteClassroom: (index: number) => void;

  // Alerts
  expiringMedicinesCount: number;
  lowStockMedicinesCount: number;
  expiredMedicinesCount: number;

  // Backup & Restore
  exportDatabaseBackup: () => void;
  importDatabaseBackup: (jsonContent: string) => boolean;
  restoreAllData: (data: {
    students: Student[];
    medicines: Medicine[];
    visits: InfirmaryVisit[];
    appointments?: MedicalAppointment[];
    dispenseLogs?: any[];
    systemConfig?: SystemConfig;
  }) => void;
  resetToDefaultData: () => void;

  // Firebase Realtime Cloud & Documents
  firebaseUser: FirebaseUser | null;
  isFirebaseConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutFirebase: () => Promise<void>;
  syncAllToFirebase: () => Promise<number>;
  clearAndSyncRealStudentsToFirebase: () => Promise<number>;
  uploadedDocuments: UploadedDocumentItem[];
  uploadDocument: (file: File, category: string, title: string, studentId?: string, notes?: string) => Promise<UploadedDocumentItem>;
  deleteUploadedDocument: (id: string) => Promise<void>;
}

const STORAGE_KEYS = {
  USERS: 'school_infirmary_users_v2',
  CURRENT_USER: 'school_infirmary_curr_user_v2',
  STUDENTS: 'school_infirmary_students_chainat_v2',
  MEDICINES: 'school_infirmary_medicines_v2',
  VISITS: 'school_infirmary_visits_v2',
  APPOINTMENTS: 'school_infirmary_appointments_v2',
  STOCK_LOGS: 'school_infirmary_stock_logs_v2',
  AUDIT_LOGS: 'school_infirmary_audit_logs_v2',
  SYSTEM_CONFIG: 'school_infirmary_config_v2',
  ILLNESS_EPISODES: 'school_infirmary_illness_episodes_v2',
  UPLOADED_DOCUMENTS: 'school_infirmary_documents_v2'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or fallback to initial
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedId) {
      const found = users.find(u => u.id === savedId);
      if (found) return found;
    }
    return users[1] || users[0]; // default to Nurse (วันเพ็ญ สุขใจ)
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      // Clean up legacy v1 storage with mock test data if present
      localStorage.removeItem('school_infirmary_students_v1');
      localStorage.removeItem('school_infirmary_visits_v1');
      localStorage.removeItem('school_infirmary_appointments_v1');
      localStorage.removeItem('school_infirmary_illness_episodes_v1');

      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      let rawList: Student[] = saved ? JSON.parse(saved) : INITIAL_STUDENTS;
      // If cached data contains old mock students or has fewer than 50 students, reset to the 173 Chainat students
      if (!rawList || rawList.length < 50 || rawList.some(s => s.id === 'stu-001' || s.studentCode === '690101')) {
        rawList = INITIAL_STUDENTS;
      }
      return (rawList || []).map(s => ({
        ...s,
        disabilities: s.disabilities || [],
        chronicDiseases: s.chronicDiseases || [],
        drugAllergies: s.drugAllergies || [],
        foodAllergies: s.foodAllergies || [],
        dailyMedications: s.dailyMedications || [],
        medicalDevices: s.medicalDevices || [],
        vaccines: s.vaccines || [],
        nutritionHistory: s.nutritionHistory || []
      }));
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEDICINES);
      return saved ? JSON.parse(saved) : INITIAL_MEDICINES;
    } catch {
      return INITIAL_MEDICINES;
    }
  });

  const [visits, setVisits] = useState<InfirmaryVisit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITS);
      const rawVisits: InfirmaryVisit[] = saved ? JSON.parse(saved) : INITIAL_VISITS;
      // If legacy test visits with mock stu-001 exist, clear them
      if (Array.isArray(rawVisits) && rawVisits.some(v => v.studentId === 'stu-001')) {
        return [];
      }
      return (rawVisits || []).map(v => ({
        ...v,
        symptoms: v.symptoms || [],
        treatments: v.treatments || (v as any).treatment || [],
        dispensedMedicines: v.dispensedMedicines || []
      }));
    } catch {
      return INITIAL_VISITS;
    }
  });

  const [appointments, setAppointments] = useState<MedicalAppointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  const [illnessEpisodes, setIllnessEpisodes] = useState<IllnessEpisode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ILLNESS_EPISODES);
      return saved ? JSON.parse(saved) : INITIAL_ILLNESS_EPISODES;
    } catch {
      return INITIAL_ILLNESS_EPISODES;
    }
  });

  const [stockLogs, setStockLogs] = useState<StockMovementLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_LOGS;
    } catch {
      return INITIAL_STOCK_LOGS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
      if (!saved) return INITIAL_SYSTEM_CONFIG;
      const parsed = JSON.parse(saved);
      const migratedSchoolName = (!parsed.schoolName || parsed.schoolName.includes('สถานศึกษาศึกษาพิเศษชัยนาท') || parsed.schoolName.includes('ศูนย์การศึกษาพิเศษ'))
        ? INITIAL_SYSTEM_CONFIG.schoolName
        : parsed.schoolName;
      return {
        ...INITIAL_SYSTEM_CONFIG,
        ...parsed,
        schoolName: migratedSchoolName,
        schoolAffiliation: parsed.schoolAffiliation || INITIAL_SYSTEM_CONFIG.schoolAffiliation,
        schoolAddress: parsed.schoolAddress || INITIAL_SYSTEM_CONFIG.schoolAddress,
        disabilityCategories: parsed.disabilityCategories?.length ? parsed.disabilityCategories : INITIAL_SYSTEM_CONFIG.disabilityCategories,
        commonSymptoms: parsed.commonSymptoms?.length ? parsed.commonSymptoms : INITIAL_SYSTEM_CONFIG.commonSymptoms,
        commonTreatments: parsed.commonTreatments?.length ? parsed.commonTreatments : INITIAL_SYSTEM_CONFIG.commonTreatments,
        treatmentMethods: parsed.treatmentMethods?.length ? parsed.treatmentMethods : (parsed.commonTreatments?.length ? parsed.commonTreatments : INITIAL_SYSTEM_CONFIG.treatmentMethods),
        medicineCategories: parsed.medicineCategories?.length ? parsed.medicineCategories : INITIAL_SYSTEM_CONFIG.medicineCategories,
        classrooms: parsed.classrooms?.length ? parsed.classrooms : INITIAL_SYSTEM_CONFIG.classrooms,
        hospitalPhone: parsed.hospitalPhone || parsed.nearbyHospitalPhone || INITIAL_SYSTEM_CONFIG.hospitalPhone,
        activeAcademicYear: parsed.activeAcademicYear || INITIAL_SYSTEM_CONFIG.activeAcademicYear,
        activeSemester: parsed.activeSemester || INITIAL_SYSTEM_CONFIG.activeSemester
      };
    } catch {
      return INITIAL_SYSTEM_CONFIG;
    }
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPLOADED_DOCUMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ILLNESS_EPISODES, JSON.stringify(illnessEpisodes));
  }, [illnessEpisodes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(stockLogs));
  }, [stockLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UPLOADED_DOCUMENTS, JSON.stringify(uploadedDocuments));
  }, [uploadedDocuments]);

  // Initial Firebase connection verification
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    }).catch(err => {
      console.warn('Firebase initial test notice:', err);
    });
  }, []);

  // Track Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsFirebaseConnected(true);
      }
    });
    return () => unsub();
  }, []);

  // Firebase Realtime onSnapshot Listeners
  useEffect(() => {
    if (!firebaseUser) return;

    setIsSyncing(true);
    const unsubs: (() => void)[] = [];

    try {
      // Realtime Students
      unsubs.push(subscribeToStudents((cloudStudents) => {
        if (cloudStudents && cloudStudents.length > 0) {
          // If cloud has legacy mock data (< 50 students or contains mock stu-001), do not overwrite real 173 students
          const hasOldMock = cloudStudents.some(s => s.id === 'stu-001' || s.studentCode === '690101');
          if (hasOldMock && cloudStudents.length < 50) {
            console.log('Ignored old mock cloud students, preserving 173 real students');
            return;
          }
          setStudents(cloudStudents);
          setLastSyncedAt(new Date());
          setIsFirebaseConnected(true);
        }
      }, (err) => setSyncError(err?.message || 'ข้อผิดพลาดการดึงข้อมูลนักเรียน')));

      // Realtime Medicines
      unsubs.push(subscribeToMedicines((cloudMedicines) => {
        if (cloudMedicines && cloudMedicines.length > 0) {
          setMedicines(cloudMedicines);
          setLastSyncedAt(new Date());
        }
      }, (err) => setSyncError(err?.message || 'ข้อผิดพลาดการดึงข้อมูลยา')));

      // Realtime Visits
      unsubs.push(subscribeToVisits((cloudVisits) => {
        if (cloudVisits) {
          const hasOldMock = cloudVisits.some(v => v.studentId === 'stu-001');
          if (hasOldMock) {
            console.log('Ignored old mock visits from Firestore');
            return;
          }
          setVisits(cloudVisits);
          setLastSyncedAt(new Date());
        }
      }, (err) => setSyncError(err?.message || 'ข้อผิดพลาดการดึงข้อมูลการเข้าห้องพยาบาล')));

      // Realtime Appointments
      unsubs.push(subscribeToAppointments((cloudAppts) => {
        if (cloudAppts && cloudAppts.length > 0) {
          setAppointments(cloudAppts);
          setLastSyncedAt(new Date());
        }
      }));

      // Realtime Illness Episodes
      unsubs.push(subscribeToIllnessEpisodes((cloudEpisodes) => {
        if (cloudEpisodes && cloudEpisodes.length > 0) {
          setIllnessEpisodes(cloudEpisodes);
          setLastSyncedAt(new Date());
        }
      }));

      // Realtime Stock Logs
      unsubs.push(subscribeToStockLogs((cloudStock) => {
        if (cloudStock && cloudStock.length > 0) {
          setStockLogs(cloudStock);
        }
      }));

      // Realtime Audit Logs
      unsubs.push(subscribeToAuditLogs((cloudAudit) => {
        if (cloudAudit && cloudAudit.length > 0) {
          setAuditLogs(cloudAudit);
        }
      }));

      // Realtime Uploaded Documents (Images & PDFs)
      unsubs.push(subscribeToUploadedDocuments((cloudDocs) => {
        if (cloudDocs) {
          setUploadedDocuments(cloudDocs);
          setLastSyncedAt(new Date());
        }
      }));

      // Realtime System Config
      unsubs.push(subscribeToSystemConfig((cloudConfig) => {
        if (cloudConfig && cloudConfig.schoolName) {
          setSystemConfig(prev => ({ ...prev, ...cloudConfig }));
          setLastSyncedAt(new Date());
        }
      }));
    } catch (e: any) {
      console.error('Error attaching Firestore realtime listeners:', e);
      setSyncError(e?.message);
    } finally {
      setIsSyncing(false);
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, [firebaseUser]);

  // Helper for logging audits
  const logAudit = useCallback((
    action: AuditLog['action'], 
    entityType: AuditLog['entityType'], 
    details: string
  ) => {
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      entityType,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // User Management
  const switchUser = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      logAudit('เข้าสู่ระบบ', 'ผู้ใช้งาน', `สลับผู้ใช้งานเป็น: ${target.name} (${target.roleTitle})`);
    }
  }, [users, logAudit]);

  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`
    };
    setUsers(prev => [...prev, newUser]);
    logAudit('เพิ่ม', 'ผู้ใช้งาน', `เพิ่มผู้ใช้งานใหม่: ${newUser.name} (${newUser.role})`);
  }, [logAudit]);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    logAudit('แก้ไข', 'ผู้ใช้งาน', `แก้ไขข้อมูลผู้ใช้งาน ID: ${id}`);
  }, [logAudit]);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    logAudit('ลบ', 'ผู้ใช้งาน', `ลบผู้ใช้งาน ID: ${id}`);
  }, [logAudit]);

  const toggleUserStatus = useCallback((id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = !u.isActive;
        logAudit('แก้ไข', 'ผู้ใช้งาน', `เปลี่ยนสถานะผู้ใช้ ${u.name} เป็น ${nextStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`);
        return { ...u, isActive: nextStatus };
      }
      return u;
    }));
  }, [logAudit]);

  const resetUserPassword = useCallback((id: string) => {
    const u = users.find(x => x.id === id);
    if (u) {
      logAudit('แก้ไข', 'ผู้ใช้งาน', `รีเซ็ตรหัสผ่านเริ่มต้นสำหรับผู้ใช้ ${u.name}`);
    }
  }, [users, logAudit]);

  // Role-based student filtering
  const filteredStudentsForUser = students.filter(s => {
    if (currentUser.role === 'admin' || currentUser.role === 'nurse') {
      return true;
    }
    // Teacher: only students in their assigned classroom
    if (currentUser.role === 'teacher') {
      if (currentUser.assignedClassroom) {
        return s.classroom === currentUser.assignedClassroom;
      }
      if (currentUser.assignedGrade) {
        return s.grade === currentUser.assignedGrade;
      }
      return false;
    }
    return true;
  });

  // Student CRUD
  const addStudent = useCallback((data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student => {
    const now = new Date().toISOString().slice(0, 10);
    const newStudent: Student = {
      ...data,
      id: `stu-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    setStudents(prev => [newStudent, ...prev]);
    if (firebaseUser) {
      saveStudentToFirestore(newStudent).catch(console.error);
    }
    logAudit('เพิ่ม', 'นักเรียน', `เพิ่มข้อมูลนักเรียน: ${newStudent.prefix} ${newStudent.firstName} ${newStudent.lastName} (${newStudent.studentCode})`);
    return newStudent;
  }, [logAudit, firebaseUser]);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    const now = new Date().toISOString().slice(0, 10);
    const target = students.find(s => s.id === id);
    const updatedStudent = target ? { ...target, ...updates, updatedAt: now } : null;
    setStudents(prev => prev.map(s => s.id === id ? (updatedStudent || s) : s));
    if (firebaseUser && updatedStudent) {
      saveStudentToFirestore(updatedStudent).catch(console.error);
    }
    logAudit('แก้ไข', 'นักเรียน', `แก้ไขข้อมูลสุขภาพ/ข้อมูลทั่วไป: ${target ? target.firstName : id}`);
  }, [students, logAudit, firebaseUser]);

  const deleteStudent = useCallback((id: string) => {
    const target = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    if (firebaseUser) {
      deleteStudentFromFirestore(id).catch(console.error);
    }
    logAudit('ลบ', 'นักเรียน', `ลบข้อมูลนักเรียน: ${target ? target.firstName + ' ' + target.lastName : id}`);
  }, [students, logAudit, firebaseUser]);

  const getStudentById = useCallback((id: string) => {
    return students.find(s => s.id === id);
  }, [students]);

  // Medicine CRUD & Inventory
  const addMedicine = useCallback((data: Omit<Medicine, 'id'>): Medicine => {
    const newMed: Medicine = {
      ...data,
      id: `med-${Date.now()}`
    };
    setMedicines(prev => [...prev, newMed]);
    if (firebaseUser) {
      saveMedicineToFirestore(newMed).catch(console.error);
    }
    
    // Log stock movement
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const newStockLog: StockMovementLog = {
      id: `log-${Date.now()}`,
      date: timeStr,
      medicineId: newMed.id,
      medicineName: newMed.tradeName,
      movementType: 'รับเข้าคลัง',
      quantity: newMed.currentStock,
      previousStock: 0,
      newStock: newMed.currentStock,
      lotNumber: newMed.lotNumber,
      referenceNote: 'เพิ่มรายการยาเข้าคลังใหม่',
      performedBy: currentUser.name
    };
    setStockLogs(prev => [newStockLog, ...prev]);
    if (firebaseUser) {
      saveStockLogToFirestore(newStockLog).catch(console.error);
    }

    logAudit('เพิ่ม', 'คลังยา', `เพิ่มยาใหม่เข้าคลัง: ${newMed.tradeName} จำนวน ${newMed.currentStock} ${newMed.unit}`);
    return newMed;
  }, [currentUser.name, logAudit, firebaseUser]);

  const updateMedicine = useCallback((id: string, updates: Partial<Medicine>) => {
    const target = medicines.find(m => m.id === id);
    const updatedMed = target ? { ...target, ...updates } : null;
    setMedicines(prev => prev.map(m => m.id === id ? (updatedMed || m) : m));
    if (firebaseUser && updatedMed) {
      saveMedicineToFirestore(updatedMed).catch(console.error);
    }
    logAudit('แก้ไข', 'คลังยา', `แก้ไขข้อมูลยา: ${target ? target.tradeName : id}`);
  }, [medicines, logAudit, firebaseUser]);

  const deleteMedicine = useCallback((id: string) => {
    const target = medicines.find(m => m.id === id);
    setMedicines(prev => prev.filter(m => m.id !== id));
    if (firebaseUser) {
      deleteMedicineFromFirestore(id).catch(console.error);
    }
    logAudit('ลบ', 'คลังยา', `ลบรายการยา: ${target ? target.tradeName : id}`);
  }, [medicines, logAudit, firebaseUser]);

  const restockMedicine = useCallback((
    id: string, 
    quantity: number, 
    lotNumber: string, 
    expiryDate: string, 
    note?: string
  ) => {
    let targetMed: Medicine | undefined;
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        targetMed = m;
        return {
          ...m,
          currentStock: m.currentStock + quantity,
          lotNumber: lotNumber || m.lotNumber,
          expiryDate: expiryDate || m.expiryDate
        };
      }
      return m;
    }));

    if (targetMed) {
      const now = new Date();
      const timeStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
      setStockLogs(prev => [{
        id: `log-${Date.now()}`,
        date: timeStr,
        medicineId: targetMed!.id,
        medicineName: targetMed!.tradeName,
        movementType: 'รับเข้าคลัง',
        quantity,
        previousStock: targetMed!.currentStock,
        newStock: targetMed!.currentStock + quantity,
        lotNumber: lotNumber || targetMed!.lotNumber,
        referenceNote: note || 'รับยาเข้าคลังเพิ่มเติม',
        performedBy: currentUser.name
      }, ...prev]);

      logAudit('เพิ่ม', 'คลังยา', `รับยา ${targetMed.tradeName} เข้าคลังจำนวน +${quantity} ${targetMed.unit} (Lot: ${lotNumber})`);
    }
  }, [currentUser.name, logAudit, medicines]);

  // Drug safety check before dispensing
  const checkDrugSafety = useCallback((studentId: string, medicineId: string, quantity: number): DrugSafetyResult => {
    const student = students.find(s => s.id === studentId);
    const med = medicines.find(m => m.id === medicineId);

    const result: DrugSafetyResult = {
      canDispense: true,
      isSafe: true,
      errors: [],
      warnings: [],
      hasAllergyAlert: false,
      isExpired: false,
      isNearExpiry: false,
      daysUntilExpiry: 999,
      isOutOfStock: false,
      isInsufficientStock: false,
      availableStock: med ? med.currentStock : 0,
      messages: []
    };

    if (!med) {
      result.canDispense = false;
      result.isSafe = false;
      result.errors.push('ไม่พบข้อมูลยาในคลัง');
      result.messages.push('ไม่พบข้อมูลยาในคลัง');
      return result;
    }

    // 1. Expiration check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(med.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    result.daysUntilExpiry = diffDays;

    if (diffDays <= 0) {
      result.isExpired = true;
      result.canDispense = false;
      result.isSafe = false;
      result.errors.push(`ยาหมดอายุแล้วตั้งแต่วันที่ ${med.expiryDate} (ห้ามจ่ายเด็ดขาด)`);
      result.messages.push(`⛔ ยาหมดอายุแล้วตั้งแต่วันที่ ${med.expiryDate} (ห้ามจ่ายเด็ดขาด)`);
    } else if (diffDays <= 30) {
      result.isNearExpiry = true;
      result.warnings.push(`ยาใกล้หมดอายุภายใน ${diffDays} วัน (${med.expiryDate})`);
      result.messages.push(`⚠️ ยาใกล้หมดอายุภายใน ${diffDays} วัน (${med.expiryDate})`);
    } else if (diffDays <= 90) {
      result.isNearExpiry = true;
      result.warnings.push(`ยาจะหมดอายุในอีก ${diffDays} วัน`);
      result.messages.push(`ℹ️ ยาจะหมดอายุในอีก ${diffDays} วัน`);
    }

    // 2. Stock check
    if (med.currentStock <= 0) {
      result.isOutOfStock = true;
      result.canDispense = false;
      result.isSafe = false;
      result.errors.push('ยาหมดสต็อกในคลัง (คงเหลือ 0)');
      result.messages.push('⛔ ยาหมดสต็อกในคลัง (คงเหลือ 0)');
    } else if (quantity > med.currentStock) {
      result.isInsufficientStock = true;
      result.canDispense = false;
      result.isSafe = false;
      result.errors.push(`ยามีไม่เพียงพอ (ต้องการ ${quantity} แต่มีคงเหลือ ${med.currentStock})`);
      result.messages.push(`⛔ ยามีไม่เพียงพอ (ต้องการ ${quantity} แต่มีคงเหลือ ${med.currentStock})`);
    }

    // 3. Drug Allergy check against student
    if (student && student.drugAllergies.length > 0) {
      const medNameLower = med.tradeName.toLowerCase();
      const genericLower = med.genericName.toLowerCase();

      for (const allergy of student.drugAllergies) {
        const allergyNameLower = allergy.drugName.toLowerCase();
        // Check substring match
        const isMatch = medNameLower.includes(allergyNameLower) || 
                        genericLower.includes(allergyNameLower) ||
                        allergyNameLower.includes(medNameLower) ||
                        allergyNameLower.includes(genericLower) ||
                        // Check common classes
                        (allergyNameLower.includes('penicillin') && (medNameLower.includes('amoxi') || genericLower.includes('amoxi'))) ||
                        (allergyNameLower.includes('amox') && (medNameLower.includes('amox') || genericLower.includes('amox'))) ||
                        (allergyNameLower.includes('nsaid') && (medNameLower.includes('ibuprofen') || medNameLower.includes('aspirin'))) ||
                        (allergyNameLower.includes('paracetamol') && (medNameLower.includes('para') || genericLower.includes('para')));

        if (isMatch) {
          result.hasAllergyAlert = true;
          result.canDispense = false;
          result.isSafe = false;
          result.allergyDetails = `นักเรียนมีประวัติแพ้ยา "${allergy.drugName}" (ระดับความรุนแรง: ${allergy.severity}) อาการ: ${allergy.reaction}`;
          result.errors.push(result.allergyDetails);
          result.messages.push(`🚨 คำเตือนรุนแรง: ${result.allergyDetails}`);
          break;
        }
      }
    }

    return result;
  }, [students, medicines]);

  // Infirmary Visit recording with stock deduction & logs
  const addVisit = useCallback((visitData: Omit<InfirmaryVisit, 'id' | 'visitNumber' | 'createdAt'> & { id?: string; visitNumber?: string; createdAt?: string }): InfirmaryVisit => {
    const now = new Date();
    const dateStr = visitData.visitDate || now.toISOString().slice(0, 10);
    const timeStr = visitData.visitTime || now.toTimeString().slice(0, 5);
    const visitSeq = (visits.length + 1).toString().padStart(3, '0');
    const visitNumber = visitData.visitNumber || `VIS-${dateStr.replace(/-/g, '')}-${visitSeq}`;
    const newVisitId = visitData.id || `vis-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    let linkedEpisodeId = visitData.illnessEpisodeId;

    // Automated illness status and episode tracking
    if (visitData.symptomStatus === 'กำลังป่วย') {
      const activeEpisode = illnessEpisodes.find(
        ep => ep.studentId === visitData.studentId && ep.status === 'กำลังป่วย'
      );

      if (linkedEpisodeId) {
        setIllnessEpisodes(prev => prev.map(ep => {
          if (ep.id === linkedEpisodeId) {
            const uniqueVisitIds = Array.from(new Set([...ep.visitIds, newVisitId]));
            const mergedSymptoms = Array.from(new Set([...ep.symptoms, ...(visitData.symptoms || [])]));
            return {
              ...ep,
              visitIds: uniqueVisitIds,
              symptoms: mergedSymptoms,
              updatedAt: new Date().toISOString()
            };
          }
          return ep;
        }));
      } else if (activeEpisode) {
        linkedEpisodeId = activeEpisode.id;
        setIllnessEpisodes(prev => prev.map(ep => {
          if (ep.id === activeEpisode.id) {
            const uniqueVisitIds = Array.from(new Set([...ep.visitIds, newVisitId]));
            const mergedSymptoms = Array.from(new Set([...ep.symptoms, ...(visitData.symptoms || [])]));
            return {
              ...ep,
              visitIds: uniqueVisitIds,
              symptoms: mergedSymptoms,
              updatedAt: new Date().toISOString()
            };
          }
          return ep;
        }));
      } else {
        const seq = (illnessEpisodes.length + 1).toString().padStart(3, '0');
        const newEpId = `ill-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newEp: IllnessEpisode = {
          id: newEpId,
          illnessCode: `ILL-${dateStr.replace(/-/g, '')}-${seq}`,
          studentId: visitData.studentId,
          studentName: visitData.studentName,
          nickname: visitData.nickname,
          studentCode: visitData.studentCode,
          grade: visitData.grade,
          classroom: visitData.classroom,
          symptoms: visitData.symptoms || [],
          symptomDetails: visitData.symptomDetails,
          startDate: dateStr,
          status: 'กำลังป่วย',
          initialVisitId: newVisitId,
          visitIds: [newVisitId],
          notes: visitData.treatmentDetails,
          recordedBy: visitData.attendantName || currentUser.name,
          createdAt: `${dateStr} ${timeStr}`
        };
        linkedEpisodeId = newEpId;
        setIllnessEpisodes(prev => [newEp, ...prev]);
      }
    } else if (visitData.symptomStatus === 'หายแล้ว') {
      const targetEpisode = linkedEpisodeId 
        ? illnessEpisodes.find(ep => ep.id === linkedEpisodeId)
        : illnessEpisodes.find(ep => ep.studentId === visitData.studentId && ep.status === 'กำลังป่วย');

      if (targetEpisode) {
        linkedEpisodeId = targetEpisode.id;
        setIllnessEpisodes(prev => prev.map(ep => {
          if (ep.id === targetEpisode.id) {
            const uniqueVisitIds = Array.from(new Set([...ep.visitIds, newVisitId]));
            return {
              ...ep,
              status: 'หายแล้ว',
              recoveredDate: dateStr,
              recoveryNote: visitData.outcomeDetails || visitData.treatmentDetails || 'หายเป็นปกติแล้วจากการรับบริการ',
              recoveredBy: visitData.attendantName || currentUser.name,
              visitIds: uniqueVisitIds,
              updatedAt: new Date().toISOString()
            };
          }
          return ep;
        }));
      }
    }

    const newVisit: InfirmaryVisit = {
      ...visitData,
      id: newVisitId,
      visitNumber,
      visitDate: dateStr,
      visitTime: timeStr,
      illnessEpisodeId: linkedEpisodeId,
      createdAt: visitData.createdAt || `${dateStr} ${timeStr}`
    };

    // Auto-deduct medicine stock
    if (visitData.dispensedMedicines && visitData.dispensedMedicines.length > 0) {
      setMedicines(prevMeds => {
        const updated = [...prevMeds];
        const newLogs: StockMovementLog[] = [];

        visitData.dispensedMedicines.forEach(item => {
          const medIndex = updated.findIndex(m => m.id === item.medicineId);
          if (medIndex !== -1) {
            const currentM = updated[medIndex];
            const newStockVal = Math.max(0, currentM.currentStock - item.quantity);
            
            updated[medIndex] = {
              ...currentM,
              currentStock: newStockVal
            };

            newLogs.push({
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              date: `${dateStr} ${timeStr}`,
              medicineId: currentM.id,
              medicineName: currentM.tradeName,
              movementType: 'จ่ายให้ผู้ป่วย',
              quantity: item.quantity,
              previousStock: currentM.currentStock,
              newStock: newStockVal,
              lotNumber: item.lotNumber || currentM.lotNumber,
              referenceId: newVisit.id,
              referenceNote: `จ่ายให้ ${visitData.studentName} (${visitNumber})`,
              performedBy: visitData.attendantName
            });
          }
        });

        if (newLogs.length > 0) {
          setStockLogs(prev => [...newLogs, ...prev]);
        }
        return updated;
      });
    }

    setVisits(prev => [newVisit, ...prev]);
    if (firebaseUser) {
      saveVisitToFirestore(newVisit).catch(console.error);
    }
    logAudit(
      'เพิ่ม', 
      'การรักษา', 
      `บันทึกบริการห้องพยาบาล: ${newVisit.visitNumber} - ${newVisit.studentName} (${newVisit.serviceType}) ผล: ${newVisit.outcome}`
    );

    if (visitData.referral) {
      logAudit(
        'ส่งต่อ',
        'การรักษา',
        `ส่งต่อนักเรียน ${newVisit.studentName} ไปยัง ${visitData.referral.hospitalName} โดย ${visitData.referral.transportMethod}`
      );
    }

    return newVisit;
  }, [visits.length, illnessEpisodes, currentUser.name, logAudit, firebaseUser]);

  const updateVisit = useCallback((id: string, updates: Partial<InfirmaryVisit>) => {
    const target = visits.find(v => v.id === id);
    const updatedVisit = target ? { ...target, ...updates } : null;
    setVisits(prev => prev.map(v => v.id === id ? (updatedVisit || v) : v));
    if (firebaseUser && updatedVisit) {
      saveVisitToFirestore(updatedVisit).catch(console.error);
    }
    logAudit('แก้ไข', 'การรักษา', `แก้ไขบันทึกการรักษา ID: ${id}`);
  }, [visits, logAudit, firebaseUser]);

  const deleteVisit = useCallback((id: string) => {
    const target = visits.find(v => v.id === id);
    setVisits(prev => prev.filter(v => v.id !== id));
    if (firebaseUser) {
      deleteVisitFromFirestore(id).catch(console.error);
    }
    logAudit('ลบ', 'การรักษา', `ลบบันทึกการรักษาหมายเลข: ${target ? target.visitNumber : id}`);
  }, [visits, logAudit, firebaseUser]);

  // Illness Episodes Management
  const addIllnessEpisode = useCallback((data: Omit<IllnessEpisode, 'id' | 'createdAt'>): IllnessEpisode => {
    const now = new Date();
    const dateStr = data.startDate || now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const seq = (illnessEpisodes.length + 1).toString().padStart(3, '0');
    const illnessCode = data.illnessCode || `ILL-${dateStr.replace(/-/g, '')}-${seq}`;

    const newEp: IllnessEpisode = {
      ...data,
      id: `ill-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      illnessCode,
      createdAt: `${dateStr} ${timeStr}`
    };

    setIllnessEpisodes(prev => [newEp, ...prev]);
    if (firebaseUser) {
      saveIllnessEpisodeToFirestore(newEp).catch(console.error);
    }
    logAudit('เพิ่ม', 'การรักษา', `เปิดการติดตามสถานะเจ็บป่วย: ${newEp.studentName} (${newEp.illnessCode}) อาการ: ${newEp.symptoms.join(', ')}`);
    return newEp;
  }, [illnessEpisodes.length, logAudit, firebaseUser]);

  const updateIllnessEpisode = useCallback((id: string, updates: Partial<IllnessEpisode>) => {
    const target = illnessEpisodes.find(e => e.id === id);
    const updatedEp = target ? { ...target, ...updates, updatedAt: new Date().toISOString() } : null;
    setIllnessEpisodes(prev => prev.map(ep => ep.id === id ? (updatedEp || ep) : ep));
    if (firebaseUser && updatedEp) {
      saveIllnessEpisodeToFirestore(updatedEp).catch(console.error);
    }
    logAudit('แก้ไข', 'การรักษา', `แก้ไขสถานะเจ็บป่วย ID: ${id}`);
  }, [illnessEpisodes, logAudit, firebaseUser]);

  const markIllnessRecovered = useCallback((id: string, recoveredDate?: string, note?: string) => {
    const now = new Date();
    const recDate = recoveredDate || now.toISOString().slice(0, 10);
    const target = illnessEpisodes.find(ep => ep.id === id);
    let updatedEp: IllnessEpisode | null = null;

    setIllnessEpisodes(prev => prev.map(ep => {
      if (ep.id === id) {
        updatedEp = {
          ...ep,
          status: 'หายแล้ว',
          recoveredDate: recDate,
          recoveryNote: note !== undefined ? note : (ep.recoveryNote || 'หายเป็นปกติแล้ว'),
          recoveredBy: currentUser.name,
          updatedAt: new Date().toISOString()
        };
        return updatedEp;
      }
      return ep;
    }));

    if (firebaseUser && updatedEp) {
      saveIllnessEpisodeToFirestore(updatedEp).catch(console.error);
    }

    logAudit('แก้ไข', 'การรักษา', `เปลี่ยนสถานะเป็นหายแล้ว: ${target ? target.studentName : id} (${target ? target.illnessCode : ''}) วันที่หาย: ${recDate}`);
  }, [currentUser.name, illnessEpisodes, logAudit, firebaseUser]);

  const reopenIllnessEpisode = useCallback((id: string) => {
    const target = illnessEpisodes.find(ep => ep.id === id);
    let updatedEp: IllnessEpisode | null = null;
    setIllnessEpisodes(prev => prev.map(ep => {
      if (ep.id === id) {
        updatedEp = {
          ...ep,
          status: 'กำลังป่วย',
          recoveredDate: undefined,
          updatedAt: new Date().toISOString()
        };
        return updatedEp;
      }
      return ep;
    }));
    if (firebaseUser && updatedEp) {
      saveIllnessEpisodeToFirestore(updatedEp).catch(console.error);
    }
    logAudit('แก้ไข', 'การรักษา', `เปิดสถานะเจ็บป่วยใหม่ (กำลังป่วย): ${target ? target.studentName : id}`);
  }, [illnessEpisodes, logAudit, firebaseUser]);

  const deleteIllnessEpisode = useCallback((id: string) => {
    const target = illnessEpisodes.find(ep => ep.id === id);
    setIllnessEpisodes(prev => prev.filter(ep => ep.id !== id));
    if (firebaseUser) {
      deleteIllnessEpisodeFromFirestore(id).catch(console.error);
    }
    logAudit('ลบ', 'การรักษา', `ลบรายการสถานะเจ็บป่วย: ${target ? target.illnessCode : id}`);
  }, [illnessEpisodes, logAudit, firebaseUser]);

  // Appointments Management
  const addAppointment = useCallback((data: Omit<MedicalAppointment, 'id' | 'createdAt'>): MedicalAppointment => {
    const now = new Date();
    const createdAt = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const newApt: MedicalAppointment = {
      ...data,
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt
    };
    setAppointments(prev => [newApt, ...prev]);
    if (firebaseUser) {
      saveAppointmentToFirestore(newApt).catch(console.error);
    }
    logAudit('เพิ่ม', 'การรักษา', `เพิ่มนัดพบแพทย์: ${newApt.studentName} - ${newApt.hospitalName} (${newApt.appointmentDate} ${newApt.appointmentTime} น.)`);
    return newApt;
  }, [logAudit, firebaseUser]);

  const updateAppointment = useCallback((id: string, updates: Partial<MedicalAppointment>) => {
    const target = appointments.find(a => a.id === id);
    const updatedApt = target ? { ...target, ...updates, updatedAt: new Date().toISOString() } : null;
    setAppointments(prev => prev.map(a => a.id === id ? (updatedApt || a) : a));
    if (firebaseUser && updatedApt) {
      saveAppointmentToFirestore(updatedApt).catch(console.error);
    }
    logAudit('แก้ไข', 'การรักษา', `แก้ไขการนัดพบแพทย์ ID: ${id}`);
  }, [appointments, logAudit, firebaseUser]);

  const deleteAppointment = useCallback((id: string) => {
    const target = appointments.find(a => a.id === id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    if (firebaseUser) {
      deleteAppointmentFromFirestore(id).catch(console.error);
    }
    logAudit('ลบ', 'การรักษา', `ลบการนัดพบแพทย์ของ: ${target ? target.studentName : id}`);
  }, [appointments, logAudit, firebaseUser]);

  // System Config
  const updateSystemConfig = useCallback((updates: Partial<SystemConfig>) => {
    setSystemConfig(prev => {
      const next = { ...prev, ...updates };
      if (firebaseUser) {
        saveSystemConfigToFirestore(next).catch(console.error);
      }
      return next;
    });
    logAudit('แก้ไข', 'ตั้งค่าระบบ', 'ปรับปรุงการตั้งค่าระบบห้องพยาบาล');
  }, [logAudit, firebaseUser]);

  const addClassroom = useCallback((classroom: ClassroomOption) => {
    setSystemConfig(prev => ({
      ...prev,
      classrooms: [...prev.classrooms, classroom]
    }));
    logAudit('เพิ่ม', 'ตั้งค่าระบบ', `เพิ่มตัวเลือกชั้นเรียน/ห้องเรียน: ${classroom.grade} (${classroom.name})`);
  }, [logAudit]);

  const updateClassroom = useCallback((index: number, updatedClassroom: ClassroomOption) => {
    setSystemConfig(prev => {
      const next = [...prev.classrooms];
      if (index >= 0 && index < next.length) {
        next[index] = updatedClassroom;
      }
      return { ...prev, classrooms: next };
    });
    logAudit('แก้ไข', 'ตั้งค่าระบบ', `แก้ไขตัวเลือกชั้นเรียน/ห้องเรียน: ${updatedClassroom.grade} (${updatedClassroom.name})`);
  }, [logAudit]);

  const deleteClassroom = useCallback((index: number) => {
    setSystemConfig(prev => {
      const target = prev.classrooms[index];
      const next = prev.classrooms.filter((_, i) => i !== index);
      if (target) {
        logAudit('ลบ', 'ตั้งค่าระบบ', `ลบตัวเลือกชั้นเรียน/ห้องเรียน: ${target.grade} (${target.name})`);
      }
      return { ...prev, classrooms: next };
    });
  }, [logAudit]);

  // Inventory alert counts
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiredMedicinesCount = medicines.filter(m => {
    return new Date(m.expiryDate).getTime() < now.getTime();
  }).length;

  const expiringMedicinesCount = medicines.filter(m => {
    const exp = new Date(m.expiryDate).getTime();
    const diffDays = (exp - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 90;
  }).length;

  const lowStockMedicinesCount = medicines.filter(m => {
    return m.currentStock <= m.minimumStock;
  }).length;

  const upcomingAppointmentsCount = appointments.filter(a => {
    return a.status === 'upcoming';
  }).length;

  const activeIllnessEpisodesCount = illnessEpisodes.filter(ep => ep.status === 'กำลังป่วย').length;
  const todayDateOnly = new Date().toISOString().slice(0, 10);
  const recoveredTodayCount = illnessEpisodes.filter(ep => ep.status === 'หายแล้ว' && ep.recoveredDate === todayDateOnly).length;
  const currentYearMonth = todayDateOnly.slice(0, 7);
  const monthlyPatientsCount = illnessEpisodes.filter(ep => 
    (ep.startDate && ep.startDate.startsWith(currentYearMonth)) || 
    (ep.createdAt && ep.createdAt.startsWith(currentYearMonth))
  ).length;

  // Backup and Restore
  const exportDatabaseBackup = useCallback(() => {
    const backupData = {
      appName: 'ระบบห้องพยาบาลโรงเรียนสำหรับนักเรียนพิการ',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.name,
      data: {
        users,
        students,
        medicines,
        visits,
        illnessEpisodes,
        appointments,
        stockLogs,
        auditLogs,
        systemConfig
      }
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `infirmary_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logAudit('สำรองข้อมูล', 'ตั้งค่าระบบ', 'ส่งออกไฟล์สำรองฐานข้อมูลระบบ (JSON) เรียบร้อย');
  }, [currentUser.name, users, students, medicines, visits, illnessEpisodes, appointments, stockLogs, auditLogs, systemConfig, logAudit]);

  const importDatabaseBackup = useCallback((jsonContent: string): boolean => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.data && parsed.data.students && parsed.data.medicines) {
        if (parsed.data.users) setUsers(parsed.data.users);
        if (parsed.data.students) setStudents(parsed.data.students);
        if (parsed.data.medicines) setMedicines(parsed.data.medicines);
        if (parsed.data.visits) setVisits(parsed.data.visits);
        if (parsed.data.illnessEpisodes) setIllnessEpisodes(parsed.data.illnessEpisodes);
        if (parsed.data.appointments) setAppointments(parsed.data.appointments);
        if (parsed.data.stockLogs) setStockLogs(parsed.data.stockLogs);
        if (parsed.data.auditLogs) setAuditLogs(parsed.data.auditLogs);
        if (parsed.data.systemConfig) setSystemConfig(parsed.data.systemConfig);

        logAudit('นำเข้าข้อมูล', 'ตั้งค่าระบบ', `นำเข้าข้อมูลสำรองจากไฟล์สำเร็จ โดย ${currentUser.name}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [currentUser.name, logAudit]);

  const resetToDefaultData = useCallback(() => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[1]);
    setStudents(INITIAL_STUDENTS);
    setMedicines(INITIAL_MEDICINES);
    setVisits(INITIAL_VISITS);
    setIllnessEpisodes(INITIAL_ILLNESS_EPISODES);
    setAppointments(INITIAL_APPOINTMENTS);
    setStockLogs(INITIAL_STOCK_LOGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSystemConfig(INITIAL_SYSTEM_CONFIG);

    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.MEDICINES);
    localStorage.removeItem(STORAGE_KEYS.VISITS);
    localStorage.removeItem(STORAGE_KEYS.ILLNESS_EPISODES);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SYSTEM_CONFIG);

    logAudit('นำเข้าข้อมูล', 'ตั้งค่าระบบ', 'รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นจากโรงเรียน');
  }, [logAudit]);

  const restoreAllData = useCallback((data: {
    students: Student[];
    medicines: Medicine[];
    visits: InfirmaryVisit[];
    illnessEpisodes?: IllnessEpisode[];
    appointments?: MedicalAppointment[];
    dispenseLogs?: any[];
    systemConfig?: SystemConfig;
  }) => {
    if (data.students) setStudents(data.students);
    if (data.medicines) setMedicines(data.medicines);
    if (data.visits) setVisits(data.visits);
    if (data.illnessEpisodes) setIllnessEpisodes(data.illnessEpisodes);
    if (data.appointments) setAppointments(data.appointments);
    if (data.systemConfig) setSystemConfig(data.systemConfig);
    logAudit('นำเข้าข้อมูล', 'ตั้งค่าระบบ', 'กู้คืนข้อมูลระบบจากไฟล์สำรองสำเร็จ');
  }, [logAudit]);

  // Firebase Auth and Cloud Sync Methods
  const loginWithGoogle = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const user = await signInWithGooglePopup();
      setFirebaseUser(user);
      setIsFirebaseConnected(true);
      logAudit('เข้าสู่ระบบ', 'ผู้ใช้งาน', `เข้าสู่ระบบ Firebase Cloud ด้วย Google: ${user.email}`);
    } catch (error: any) {
      setSyncError(error?.message || 'เข้าสู่ระบบ Firebase ไม่สำเร็จ');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [logAudit]);

  const logoutFirebase = useCallback(async () => {
    try {
      await logOutFirebase();
      setFirebaseUser(null);
      logAudit('ออกจากระบบ', 'ผู้ใช้งาน', 'ออกจากระบบ Firebase Cloud สำเร็จ');
    } catch (error: any) {
      console.error('Firebase Logout Error:', error);
    }
  }, [logAudit]);

  const syncAllToFirebase = useCallback(async (): Promise<number> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await seedAllDataToFirestore({
        students,
        medicines,
        visits,
        appointments,
        illnessEpisodes,
        stockLogs,
        auditLogs,
        systemConfig
      });
      setLastSyncedAt(new Date());
      setIsFirebaseConnected(true);
      logAudit('สำรองข้อมูล', 'ตั้งค่าระบบ', `ซิงค์ข้อมูลขึ้น Firebase Cloud สำเร็จ (${res.count} รายการ)`);
      return res.count;
    } catch (error: any) {
      setSyncError(error?.message || 'ซิงค์ข้อมูลขึ้น Firebase ไม่สำเร็จ');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [students, medicines, visits, appointments, illnessEpisodes, stockLogs, auditLogs, systemConfig, logAudit]);

  const clearAndSyncRealStudentsToFirebase = useCallback(async (): Promise<number> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await clearAndSeedRealStudentsToFirestore({
        students,
        medicines,
        systemConfig
      });
      setLastSyncedAt(new Date());
      setIsFirebaseConnected(true);
      logAudit('สำรองข้อมูล', 'ตั้งค่าระบบ', `ล้างข้อมูลทดลองและนำเข้าข้อมูลนักเรียนจริง 173 คนขึ้น Firebase Cloud สำเร็จ (${res.count} รายการ)`);
      return res.count;
    } catch (error: any) {
      setSyncError(error?.message || 'ล้างและซิงค์ข้อมูลขึ้น Firebase ไม่สำเร็จ');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [students, medicines, systemConfig, logAudit]);

  const uploadDocument = useCallback(async (
    file: File,
    category: string,
    title: string,
    studentId?: string,
    notes?: string
  ): Promise<UploadedDocumentItem> => {
    setIsSyncing(true);
    try {
      let fileData = '';
      let formattedSize = `${(file.size / 1024).toFixed(0)} KB`;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (isPdf) {
        const res = await readPdfAsDataUrl(file);
        fileData = res.dataUrl;
        formattedSize = res.sizeFormatted;
      } else if (isImage) {
        fileData = await compressImage(file, 900, 900, 0.75);
        formattedSize = `${(fileData.length * 0.75 / 1024).toFixed(0)} KB`;
      } else {
        const res = await readPdfAsDataUrl(file);
        fileData = res.dataUrl;
        formattedSize = res.sizeFormatted;
      }

      const matchedStudent = studentId ? students.find(s => s.id === studentId) : undefined;
      const studentName = matchedStudent ? `${matchedStudent.prefix}${matchedStudent.firstName} ${matchedStudent.lastName}` : undefined;

      const newDoc: UploadedDocumentItem = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId,
        studentName,
        fileName: file.name,
        fileType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        fileSize: formattedSize,
        category,
        title: title.trim() || file.name,
        fileData,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        notes
      };

      setUploadedDocuments(prev => [newDoc, ...prev]);

      if (firebaseUser) {
        await saveDocumentToFirestore(newDoc);
        setLastSyncedAt(new Date());
      }

      logAudit('เพิ่ม', 'เอกสาร', `อัปโหลดเอกสาร Cloud: ${newDoc.title} (${newDoc.fileName})`);
      return newDoc;
    } catch (err: any) {
      console.error('Upload document error:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [students, currentUser.name, firebaseUser, logAudit]);

  const deleteUploadedDocument = useCallback(async (id: string) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
    if (firebaseUser) {
      await deleteDocumentFromFirestore(id);
    }
    logAudit('ลบ', 'เอกสาร', `ลบเอกสาร Cloud ID: ${id}`);
  }, [firebaseUser, logAudit]);

  const dispenseLogs: DispenseLogItem[] = stockLogs.map(l => ({
    id: l.id,
    dispenseDate: l.date.slice(0, 10),
    dispenseTime: l.date.slice(11),
    visitNumber: l.referenceId ? (visits.find(v => v.id === l.referenceId)?.visitNumber || 'VN-GEN') : 'VN-DIRECT',
    medicineCode: medicines.find(m => m.id === l.medicineId)?.code || 'MED',
    medicineName: l.medicineName,
    lotNumber: l.lotNumber,
    quantity: l.quantity,
    unit: medicines.find(m => m.id === l.medicineId)?.unit || 'หน่วย',
    stockBefore: l.previousStock,
    stockAfter: l.newStock,
    studentName: l.referenceNote || 'นักเรียน',
    dispenserName: l.performedBy
  }));

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      switchUser,
      addUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      resetUserPassword,

      students,
      filteredStudentsForUser,
      addStudent,
      updateStudent,
      deleteStudent,
      getStudentById,

      medicines,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      restockMedicine,
      checkDrugSafety,

      visits,
      addVisit,
      updateVisit,
      deleteVisit,

      // Illness Episodes
      illnessEpisodes,
      addIllnessEpisode,
      updateIllnessEpisode,
      markIllnessRecovered,
      reopenIllnessEpisode,
      deleteIllnessEpisode,
      activeIllnessEpisodesCount,
      recoveredTodayCount,
      monthlyPatientsCount,

      appointments,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      upcomingAppointmentsCount,

      stockLogs,
      dispenseLogs,
      auditLogs,
      systemConfig,
      updateSystemConfig,
      addClassroom,
      updateClassroom,
      deleteClassroom,

      expiringMedicinesCount,
      lowStockMedicinesCount,
      expiredMedicinesCount,

      exportDatabaseBackup,
      importDatabaseBackup,
      restoreAllData,
      resetToDefaultData,

      // Firebase Cloud Realtime & Documents
      firebaseUser,
      isFirebaseConnected,
      isSyncing,
      lastSyncedAt,
      syncError,
      loginWithGoogle,
      logoutFirebase,
      syncAllToFirebase,
      clearAndSyncRealStudentsToFirebase,
      uploadedDocuments,
      uploadDocument,
      deleteUploadedDocument
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
