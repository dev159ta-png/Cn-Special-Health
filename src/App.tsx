import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { QRCodeModal } from './components/common/QRCodeModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentListView } from './components/students/StudentListView';
import { StudentHealthView } from './components/students/StudentHealthView';
import { StudentHealthDirectoryView } from './components/students/StudentHealthDirectoryView';
import { AllergiesCardView } from './components/students/AllergiesCardView';
import { DailyMedicationsCardView } from './components/students/DailyMedicationsCardView';
import { MedicalDevicesCardView } from './components/students/MedicalDevicesCardView';
import { ChronicDiseasesCardView } from './components/students/ChronicDiseasesCardView';
import { StudentNutritionCardView } from './components/students/StudentNutritionCardView';
import { StudentFormModal } from './components/students/StudentFormModal';
import { NewVisitForm } from './components/infirmary/NewVisitForm';
import { VisitHistoryView } from './components/infirmary/VisitHistoryView';
import { ReferralsView } from './components/infirmary/ReferralsView';
import { IllnessStatusView } from './components/infirmary/IllnessStatusView';
import { PharmacyView } from './components/pharmacy/PharmacyView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { EmergencyView } from './components/emergency/EmergencyView';
import { DoctorAppointmentCalendarView } from './components/appointments/DoctorAppointmentCalendarView';
import { CloudDocumentsView } from './components/documents/CloudDocumentsView';
import { Student, InfirmaryVisit } from './types';

interface NavigationState {
  tab: string;
  subTab?: string;
  param?: string;
}

const MainAppContent: React.FC = () => {
  const { students } = useApp();

  // Unified Navigation State
  const [nav, setNav] = useState<NavigationState>({
    tab: 'dashboard',
    subTab: undefined,
    param: undefined
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeHealthSubTab, setActiveHealthSubTab] = useState<string>('summary');
  const [isEmergencyReferral, setIsEmergencyReferral] = useState<boolean>(false);

  // Modals
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Central Navigation Handler
  const handleNavigate = (tab: string, subTab?: string, param?: string) => {
    // Handle aliases
    if (tab === 'new-visit') {
      tab = 'infirmary';
      subTab = 'new-visit';
    } else if (tab === 'visit-history') {
      tab = 'infirmary';
      subTab = 'visit-history';
    } else if (tab === 'hospital-referrals') {
      tab = 'infirmary';
      subTab = 'referrals';
    } else if (tab === 'student-detail') {
      tab = 'students';
      subTab = 'health';
    } else if (tab === 'allergies') {
      tab = 'students';
      subTab = 'allergies';
    } else if (tab === 'daily-meds' || tab === 'medications') {
      tab = 'students';
      subTab = 'daily-meds';
    } else if (tab === 'tubes' || tab === 'devices') {
      tab = 'students';
      subTab = 'tubes';
    } else if (tab === 'chronic-diseases' || tab === 'diseases') {
      tab = 'students';
      subTab = 'chronic-diseases';
    } else if (tab === 'low-stock') {
      tab = 'pharmacy';
      subTab = 'low-stock';
    } else if (tab === 'expiring-meds') {
      tab = 'pharmacy';
      subTab = 'expiring';
    }

    if (param) {
      setSelectedStudentId(param);
    }

    if (tab === 'infirmary' && subTab === 'new-visit' && !param) {
      // If opening general new visit without specific student param, keep previous or clear
    }

    setIsEmergencyReferral(false);
    setNav({ tab, subTab, param });
    setIsMobileSidebarOpen(false);
  };

  // Student Health Detail Navigation
  const handleSelectStudent = (studentId: string, healthSubTab: string = 'summary') => {
    setSelectedStudentId(studentId);
    setActiveHealthSubTab(healthSubTab);
    setNav({ tab: 'students', subTab: 'health', param: studentId });
  };

  // Open New Visit Form
  const handleOpenNewVisit = (studentId?: string) => {
    if (studentId) {
      setSelectedStudentId(studentId);
    }
    setIsEmergencyReferral(false);
    setNav({ tab: 'infirmary', subTab: 'new-visit', param: studentId });
  };

  // Open New Visit Form preconfigured for Emergency Referral
  const handleOpenNewVisitWithReferral = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsEmergencyReferral(true);
    setNav({ tab: 'infirmary', subTab: 'new-visit', param: studentId });
  };

  const handleAddNewStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleVisitSuccess = (_visit: InfirmaryVisit) => {
    // Navigate to visit history to see the newly logged visit
    setNav({ tab: 'infirmary', subTab: 'visit-history' });
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      {/* Header */}
      <Header
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onNavigate={handleNavigate}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Responsive Sidebar */}
        <Sidebar
          currentTab={nav.tab}
          currentSubTab={nav.subTab}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onSelectTab={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full transition-all duration-300">
          {/* 1. VIEW: Dashboard */}
          {nav.tab === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} />
          )}

          {/* 2. VIEW: Students Group */}
          {nav.tab === 'students' && (
            <>
              {/* 2.1 Students List */}
              {(!nav.subTab || nav.subTab === 'list') && (
                <StudentListView
                  onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'summary')}
                  onAddNewStudent={handleAddNewStudent}
                  onEditStudent={handleEditStudent}
                />
              )}

              {/* 2.2 Student Health & Medical Devices */}
              {nav.subTab === 'health' && (
                selectedStudent ? (
                  <StudentHealthView
                    student={selectedStudent}
                    initialSubTab={activeHealthSubTab}
                    onBack={() => {
                      setSelectedStudentId(null);
                      setNav({ tab: 'students', subTab: 'health' });
                    }}
                    onNavigateToNewVisit={(id) => handleOpenNewVisit(id)}
                  />
                ) : (
                  <StudentHealthDirectoryView
                    onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'devices')}
                    onNewVisit={(id) => handleOpenNewVisit(id)}
                  />
                )
              )}

              {/* 2.3 Student History shortcut */}
              {nav.subTab === 'history' && (
                <VisitHistoryView
                  onNewVisit={() => handleOpenNewVisit()}
                  onSelectStudent={(id) => handleSelectStudent(id, 'visits')}
                />
              )}

              {/* 2.4 นักเรียนแพ้ยาและแพ้อาหาร (Allergies Card View) */}
              {nav.subTab === 'allergies' && (
                <AllergiesCardView
                  onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'summary')}
                  onNewVisit={(id) => handleOpenNewVisit(id)}
                  onShowQR={(student) => setQrStudent(student)}
                />
              )}

              {/* 2.5 นักเรียนที่กินยาประจำตัว (Daily Medications Card View) */}
              {nav.subTab === 'daily-meds' && (
                <DailyMedicationsCardView
                  onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'medications')}
                  onNewVisit={(id) => handleOpenNewVisit(id)}
                  onShowQR={(student) => setQrStudent(student)}
                />
              )}

              {/* 2.6 นักเรียนที่ใส่ท่อ/อุปกรณ์พิเศษ (Medical Devices / Tubes Card View) */}
              {nav.subTab === 'tubes' && (
                <MedicalDevicesCardView
                  onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'devices')}
                  onNewVisit={(id) => handleOpenNewVisit(id)}
                  onShowQR={(student) => setQrStudent(student)}
                />
              )}

              {/* 2.7 นักเรียนที่เป็นโรคประจำตัว (Chronic Diseases Card View) */}
              {nav.subTab === 'chronic-diseases' && (
                <ChronicDiseasesCardView
                  onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'diseases')}
                  onNewVisit={(id) => handleOpenNewVisit(id)}
                  onNewVisitWithReferral={(id) => handleOpenNewVisitWithReferral(id)}
                  onShowQR={(student) => setQrStudent(student)}
                />
              )}

              {/* 2.8 นักเรียนโภชนาการและรูปร่างตาม BMI (Nutrition Card View) */}
              {nav.subTab === 'nutrition' && (
                <StudentNutritionCardView
                  onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'nutrition')}
                  onNewVisit={(id) => handleOpenNewVisit(id)}
                  onShowQR={(student) => setQrStudent(student)}
                />
              )}

              {/* 2.9 คลังเอกสาร & รูปภาพ Cloud Real-time */}
              {nav.subTab === 'documents' && (
                <CloudDocumentsView
                  onSelectStudent={(student) => handleSelectStudent(student.id, 'documents')}
                />
              )}
            </>
          )}

          {/* Direct tab for documents */}
          {nav.tab === 'documents' && (
            <CloudDocumentsView
              onSelectStudent={(student) => handleSelectStudent(student.id, 'documents')}
            />
          )}

          {/* 3. VIEW: Emergency Quick Profile View */}
          {nav.tab === 'emergency' && (
            <EmergencyView
              onSelectStudent={(student, sub) => handleSelectStudent(student.id, sub || 'emergency')}
              onNewVisitWithReferral={(studentId) => handleOpenNewVisitWithReferral(studentId)}
            />
          )}

          {/* 3.5 VIEW: Doctor Appointments Calendar */}
          {nav.tab === 'appointments' && (
            <DoctorAppointmentCalendarView />
          )}

          {/* 3.8 VIEW: Sickness Status (Direct tab) */}
          {nav.tab === 'illness-status' && (
            <IllnessStatusView
              onSelectStudent={(id) => handleSelectStudent(id, 'visits')}
              onNewVisitForStudent={(studentId, episodeId) => {
                if (studentId) setSelectedStudentId(studentId);
                handleNavigate('infirmary', 'new-visit');
              }}
            />
          )}

          {/* 4. VIEW: Infirmary Visits Group */}
          {nav.tab === 'infirmary' && (
            <>
              {/* 4.0 Sickness Status Tracking */}
              {nav.subTab === 'illness-status' && (
                <IllnessStatusView
                  onSelectStudent={(id) => handleSelectStudent(id, 'visits')}
                  onNewVisitForStudent={(studentId, episodeId) => {
                    if (studentId) setSelectedStudentId(studentId);
                    handleNavigate('infirmary', 'new-visit');
                  }}
                />
              )}

              {/* 4.1 New Visit Form */}
              {nav.subTab === 'new-visit' && (
                <NewVisitForm
                  initialStudentId={selectedStudentId || undefined}
                  initialIsReferral={isEmergencyReferral}
                  onSuccess={handleVisitSuccess}
                  onCancel={() => handleNavigate('infirmary', 'visit-history')}
                />
              )}

              {/* 4.2 Visit History */}
              {(!nav.subTab || nav.subTab === 'visit-history') && (
                <VisitHistoryView
                  onNewVisit={() => handleOpenNewVisit()}
                  onSelectStudent={(id) => handleSelectStudent(id, 'visits')}
                />
              )}

              {/* 4.3 Hospital Referrals */}
              {nav.subTab === 'referrals' && (
                <ReferralsView onSelectStudent={(id) => handleSelectStudent(id, 'emergency')} />
              )}
            </>
          )}

          {/* 5. VIEW: Pharmacy & Drug Stock */}
          {nav.tab === 'pharmacy' && (
            <PharmacyView initialSubTab={nav.subTab as any || 'medicine-list'} />
          )}

          {/* 6. VIEW: Analytics Dashboard */}
          {nav.tab === 'analytics' && (
            <AnalyticsView />
          )}

          {/* 7. VIEW: Reports & Export */}
          {nav.tab === 'reports' && (
            <ReportsView initialReportType={nav.subTab as any || 'visits'} />
          )}

          {/* 8. VIEW: Admin & Settings Menus */}
          {nav.tab === 'settings' && (
            <SettingsView initialTab={nav.subTab as any || 'config'} />
          )}

          {nav.tab === 'users' && (
            <SettingsView initialTab="users" />
          )}

          {nav.tab === 'audit' && (
            <SettingsView initialTab="audit" />
          )}
        </main>
      </div>

      {/* Emergency Profile QR Code Modal */}
      {qrStudent && (
        <QRCodeModal
          student={qrStudent}
          isOpen={!!qrStudent}
          onClose={() => setQrStudent(null)}
          onViewEmergency={(id) => handleSelectStudent(id, 'emergency')}
        />
      )}

      {/* Add / Edit Student Modal */}
      {isStudentModalOpen && (
        <StudentFormModal
          studentToEdit={studentToEdit}
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
