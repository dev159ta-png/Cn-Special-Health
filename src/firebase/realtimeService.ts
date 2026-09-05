import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { 
  Student, 
  Medicine, 
  InfirmaryVisit, 
  MedicalAppointment, 
  IllnessEpisode, 
  StockMovementLog, 
  AuditLog, 
  SystemConfig,
  UploadedDocumentItem 
} from '../types';

// Collection paths
export const COLLECTIONS = {
  STUDENTS: 'students',
  MEDICINES: 'medicines',
  VISITS: 'visits',
  APPOINTMENTS: 'appointments',
  ILLNESS_EPISODES: 'illnessEpisodes',
  STOCK_LOGS: 'stockLogs',
  AUDIT_LOGS: 'auditLogs',
  UPLOADED_DOCUMENTS: 'uploadedDocuments',
  SYSTEM_CONFIG: 'systemConfig'
} as const;

// Realtime listeners
export function subscribeToStudents(
  onUpdate: (students: Student[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.STUDENTS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Student);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToMedicines(
  onUpdate: (medicines: Medicine[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.MEDICINES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Medicine[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Medicine);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToVisits(
  onUpdate: (visits: InfirmaryVisit[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.VISITS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: InfirmaryVisit[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as InfirmaryVisit);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToAppointments(
  onUpdate: (appointments: MedicalAppointment[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.APPOINTMENTS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: MedicalAppointment[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as MedicalAppointment);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToIllnessEpisodes(
  onUpdate: (episodes: IllnessEpisode[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.ILLNESS_EPISODES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: IllnessEpisode[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as IllnessEpisode);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToStockLogs(
  onUpdate: (logs: StockMovementLog[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.STOCK_LOGS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: StockMovementLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as StockMovementLog);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToAuditLogs(
  onUpdate: (logs: AuditLog[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.AUDIT_LOGS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as AuditLog);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToUploadedDocuments(
  onUpdate: (docs: UploadedDocumentItem[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.UPLOADED_DOCUMENTS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: UploadedDocumentItem[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as UploadedDocumentItem);
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

export function subscribeToSystemConfig(
  onUpdate: (config: SystemConfig) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = COLLECTIONS.SYSTEM_CONFIG;
  return onSnapshot(
    doc(db, path, 'default'),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SystemConfig);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${path}/default`);
      if (onError) onError(error);
    }
  );
}

// Write mutations with error handling
export async function saveStudentToFirestore(student: Student): Promise<void> {
  const path = `${COLLECTIONS.STUDENTS}/${student.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), student);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.STUDENTS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMedicineToFirestore(medicine: Medicine): Promise<void> {
  const path = `${COLLECTIONS.MEDICINES}/${medicine.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.MEDICINES, medicine.id), medicine);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMedicineFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.MEDICINES}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.MEDICINES, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveVisitToFirestore(visit: InfirmaryVisit): Promise<void> {
  const path = `${COLLECTIONS.VISITS}/${visit.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.VISITS, visit.id), visit);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVisitFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.VISITS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.VISITS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveAppointmentToFirestore(appointment: MedicalAppointment): Promise<void> {
  const path = `${COLLECTIONS.APPOINTMENTS}/${appointment.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointment.id), appointment);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.APPOINTMENTS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveIllnessEpisodeToFirestore(episode: IllnessEpisode): Promise<void> {
  const path = `${COLLECTIONS.ILLNESS_EPISODES}/${episode.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ILLNESS_EPISODES, episode.id), episode);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteIllnessEpisodeFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.ILLNESS_EPISODES}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ILLNESS_EPISODES, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveStockLogToFirestore(log: StockMovementLog): Promise<void> {
  const path = `${COLLECTIONS.STOCK_LOGS}/${log.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STOCK_LOGS, log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAuditLogToFirestore(log: AuditLog): Promise<void> {
  const path = `${COLLECTIONS.AUDIT_LOGS}/${log.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveDocumentToFirestore(documentItem: UploadedDocumentItem): Promise<void> {
  const path = `${COLLECTIONS.UPLOADED_DOCUMENTS}/${documentItem.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.UPLOADED_DOCUMENTS, documentItem.id), documentItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDocumentFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.UPLOADED_DOCUMENTS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.UPLOADED_DOCUMENTS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSystemConfigToFirestore(config: SystemConfig): Promise<void> {
  const path = `${COLLECTIONS.SYSTEM_CONFIG}/default`;
  try {
    await setDoc(doc(db, COLLECTIONS.SYSTEM_CONFIG, 'default'), {
      ...config,
      id: 'default'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Seed all initial data to Firestore
export async function seedAllDataToFirestore(params: {
  students: Student[];
  medicines: Medicine[];
  visits: InfirmaryVisit[];
  appointments: MedicalAppointment[];
  illnessEpisodes: IllnessEpisode[];
  stockLogs: StockMovementLog[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
}): Promise<{ count: number }> {
  let count = 0;
  for (const s of params.students) {
    await saveStudentToFirestore(s);
    count++;
  }
  for (const m of params.medicines) {
    await saveMedicineToFirestore(m);
    count++;
  }
  for (const v of params.visits) {
    await saveVisitToFirestore(v);
    count++;
  }
  for (const a of params.appointments) {
    await saveAppointmentToFirestore(a);
    count++;
  }
  for (const e of params.illnessEpisodes) {
    await saveIllnessEpisodeToFirestore(e);
    count++;
  }
  for (const sl of params.stockLogs) {
    await saveStockLogToFirestore(sl);
    count++;
  }
  for (const al of params.auditLogs) {
    await saveAuditLogToFirestore(al);
    count++;
  }
  await saveSystemConfigToFirestore(params.systemConfig);
  count++;

  return { count };
}

// Clear all mock data from Firestore and populate with real 173 students
export async function clearAndSeedRealStudentsToFirestore(params: {
  students: Student[];
  medicines?: Medicine[];
  systemConfig?: SystemConfig;
}): Promise<{ count: number }> {
  try {
    const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    for (const d of studentsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Could not clear old students:', err);
  }

  try {
    const visitsSnap = await getDocs(collection(db, COLLECTIONS.VISITS));
    for (const d of visitsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Could not clear old visits:', err);
  }

  try {
    const apptsSnap = await getDocs(collection(db, COLLECTIONS.APPOINTMENTS));
    for (const d of apptsSnap.docs) {
      await deleteDoc(d.ref);
    }
    const epSnap = await getDocs(collection(db, COLLECTIONS.ILLNESS_EPISODES));
    for (const d of epSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Could not clear old appointments/episodes:', err);
  }

  let count = 0;
  for (const s of params.students) {
    await saveStudentToFirestore(s);
    count++;
  }

  if (params.medicines) {
    for (const m of params.medicines) {
      await saveMedicineToFirestore(m);
    }
  }

  if (params.systemConfig) {
    await saveSystemConfigToFirestore(params.systemConfig);
  }

  return { count };
}
