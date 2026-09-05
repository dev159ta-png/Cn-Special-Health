import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  GraduationCap, 
  HeartHandshake, 
  Pill, 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  FileClock,
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  AlertTriangle,
  HeartPulse,
  PlusCircle,
  History,
  Ambulance,
  CalendarDays,
  PackagePlus,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  X,
  Heart,
  Activity,
  Utensils,
  Scale
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  currentSubTab?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string, subTab?: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  currentSubTab,
  isOpen,
  onClose,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { 
    currentUser, 
    students,
    uploadedDocuments = [],
    lowStockMedicinesCount, 
    expiringMedicinesCount, 
    expiredMedicinesCount,
    upcomingAppointmentsCount,
    activeIllnessEpisodesCount
  } = useApp();

  const allergyStudentsCount = (students || []).filter(s => (s.drugAllergies || []).length > 0 || (s.foodAllergies || []).length > 0).length;
  const dailyMedsStudentsCount = (students || []).filter(s => (s.dailyMedications || []).length > 0).length;
  const tubesStudentsCount = (students || []).filter(s => (s.medicalDevices || []).length > 0).length;
  const chronicDiseasesStudentsCount = (students || []).filter(s => (s.chronicDiseases || []).length > 0).length;
  const nutritionStudentsCount = (students || []).filter(s => (s.nutritionHistory || []).length > 0).length;

  // Collapsible menu groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    students: true,
    infirmary: true,
    pharmacy: true,
    reports: false
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isTeacher = currentUser.role === 'teacher';
  const isAdmin = currentUser.role === 'admin';
  const isNurse = currentUser.role === 'nurse';

  const handleNav = (tab: string, subTab?: string) => {
    onSelectTab(tab, subTab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Floating Expand Button when sidebar is collapsed (Desktop) */}
      {isCollapsed && onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="fixed top-20 left-0 z-30 hidden lg:flex items-center space-x-1.5 px-3 py-2 bg-white/95 hover:bg-teal-50 text-teal-800 rounded-r-2xl border-y border-r border-teal-300 shadow-md transition-all hover:pl-4 cursor-pointer group animate-in fade-in"
          title="คลิกเพื่อขยายแถบเมนูกลับมา"
        >
          <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
          <span className="text-xs font-heading font-bold text-teal-900">แสดงเมนู</span>
        </button>
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out
        lg:static lg:z-10
        ${isOpen ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed 
          ? 'lg:w-0 lg:min-w-0 lg:border-r-0 lg:overflow-hidden lg:opacity-0 pointer-events-none lg:pointer-events-none' 
          : 'lg:w-72 lg:min-w-[18rem] lg:opacity-100'
        }
      `}>
        <div className="w-72 flex flex-col h-full min-h-0 flex-1">
          {/* Sidebar Header (Mobile) */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 lg:hidden">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-6 h-6 text-teal-600" />
              <span className="font-heading font-bold text-slate-800 text-sm">
                ระบบห้องพยาบาลโรงเรียน
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Header (Desktop) with Collapse Button */}
          <div className="hidden lg:flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center space-x-2 text-slate-700 font-heading font-bold text-xs">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              <span>เมนูนำทาง</span>
            </div>
            {onToggleCollapse && (
              <button 
                onClick={onToggleCollapse}
                className="px-2 py-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-heading font-medium flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                title="หุบเมนูไปด้านซ้าย เพื่อเพิ่มพื้นที่ตาราง"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>หุบเมนู</span>
              </button>
            )}
          </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm">
          
          {/* 1. Dashboard */}
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-5 h-5" />
              <span>🏠 หน้าหลัก (Dashboard)</span>
            </div>
          </button>

          {/* 2. ข้อมูลนักเรียน (Student Info) */}
          <div className="pt-2">
            <button
              onClick={() => toggleGroup('students')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
            >
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span>👩‍🎓 ข้อมูลนักเรียน</span>
              </div>
              {openGroups.students ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {openGroups.students && (
              <div className="mt-1 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-3">
                <button
                  onClick={() => handleNav('students', 'list')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'students' && currentSubTab === 'list'
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  • รายชื่อนักเรียน {isTeacher && `(ห้อง ${currentUser.assignedClassroom || ''})`}
                </button>

                {/* 1. เมนูแสดงนักเรียนแพ้ยาและอาหาร (Card) */}
                <button
                  onClick={() => handleNav('students', 'allergies')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    currentTab === 'students' && currentSubTab === 'allergies'
                      ? 'bg-rose-50 text-rose-800 font-bold border-l-2 border-rose-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>แพ้ยาและแพ้อาหาร (Card)</span>
                  </span>
                  {allergyStudentsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                      {allergyStudentsCount}
                    </span>
                  )}
                </button>

                {/* 2. เมนูแสดงนักเรียนที่กินยาประจำตัว (Card) */}
                <button
                  onClick={() => handleNav('students', 'daily-meds')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    currentTab === 'students' && currentSubTab === 'daily-meds'
                      ? 'bg-blue-50 text-blue-800 font-bold border-l-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <Pill className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>กินยาประจำตัว (Card)</span>
                  </span>
                  {dailyMedsStudentsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                      {dailyMedsStudentsCount}
                    </span>
                  )}
                </button>

                {/* 3. เมนูแสดงนักเรียนที่ใส่ท่อ (Card) */}
                <button
                  onClick={() => handleNav('students', 'tubes')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    currentTab === 'students' && currentSubTab === 'tubes'
                      ? 'bg-purple-50 text-purple-800 font-bold border-l-2 border-purple-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <Activity className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>นักเรียนที่ใส่ท่อ/อุปกรณ์ (Card)</span>
                  </span>
                  {tubesStudentsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
                      {tubesStudentsCount}
                    </span>
                  )}
                </button>

                {/* 6. เมนูแสดงนักเรียนที่เป็นโรคประจำตัว (Card) */}
                <button
                  onClick={() => handleNav('students', 'chronic-diseases')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    currentTab === 'students' && currentSubTab === 'chronic-diseases'
                      ? 'bg-amber-50 text-amber-900 font-bold border-l-2 border-amber-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <Heart className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>โรคประจำตัว (Card)</span>
                  </span>
                  {chronicDiseasesStudentsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                      {chronicDiseasesStudentsCount}
                    </span>
                  )}
                </button>

                {/* 5. เมนูแสดงนักเรียนโภชนาการและรูปร่างตาม BMI (Card) */}
                <button
                  onClick={() => handleNav('students', 'nutrition')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    currentTab === 'students' && currentSubTab === 'nutrition'
                      ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <Scale className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>โภชนาการ & BMI (Card)</span>
                  </span>
                  {nutritionStudentsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      {nutritionStudentsCount}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => handleNav('students', 'health')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'students' && currentSubTab === 'health'
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  • ข้อมูลสุขภาพ & แฟ้มประวัติ
                </button>

                <button
                  onClick={() => handleNav('students', 'history')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'students' && currentSubTab === 'history'
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  • ประวัติการรักษาของนักเรียน
                </button>

                {/* เมนูคลังเอกสาร & รูปภาพ Cloud Real-time */}
                <button
                  onClick={() => handleNav('students', 'documents')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    (currentTab === 'students' && currentSubTab === 'documents') || currentTab === 'documents'
                      ? 'bg-teal-50 text-teal-800 font-bold border-l-2 border-teal-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                    <span>คลังเอกสาร & รูปภาพ (Cloud)</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-teal-800 font-bold">
                    {uploadedDocuments.length}
                  </span>
                </button>

                <button
                  onClick={() => handleNav('emergency')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    currentTab === 'emergency'
                      ? 'bg-rose-50 text-rose-800 font-bold'
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <span className="flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Emergency Profile ด่วน</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 font-bold">🚨</span>
                </button>
              </div>
            )}
          </div>

          {/* 2.5 ปฏิทินนัดพบหมอสำหรับนักเรียน */}
          <div className="pt-2">
            <button
              onClick={() => handleNav('appointments')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                currentTab === 'appointments'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CalendarDays className={`w-5 h-5 ${currentTab === 'appointments' ? 'text-white' : 'text-teal-600'}`} />
                <span>🗓️ ปฏิทินนัดพบหมอ</span>
              </div>
              {upcomingAppointmentsCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  currentTab === 'appointments' 
                    ? 'bg-white text-teal-800' 
                    : 'bg-teal-100 text-teal-800'
                }`}>
                  {upcomingAppointmentsCount}
                </span>
              )}
            </button>
          </div>

          {/* 3. บริการห้องพยาบาล (Infirmary Visits) */}
          {!isTeacher && (
            <div className="pt-2">
              <button
                onClick={() => toggleGroup('infirmary')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
              >
                <div className="flex items-center space-x-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>🏥 บริการห้องพยาบาล</span>
                </div>
                {openGroups.infirmary ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openGroups.infirmary && (
                <div className="mt-1 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-3">
                  <button
                    onClick={() => handleNav('infirmary', 'illness-status')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      currentTab === 'infirmary' && currentSubTab === 'illness-status'
                        ? 'bg-rose-50 text-rose-800 font-bold border-l-2 border-rose-600'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5 truncate">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span>สถานะเจ็บป่วย (Sickness Status)</span>
                    </span>
                    {activeIllnessEpisodesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                        {activeIllnessEpisodesCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleNav('infirmary', 'new-visit')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                      currentTab === 'infirmary' && currentSubTab === 'new-visit'
                        ? 'bg-teal-50 text-teal-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>เพิ่มการให้บริการ / จ่ายยา</span>
                  </button>

                  <button
                    onClick={() => handleNav('infirmary', 'visit-history')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                      currentTab === 'infirmary' && currentSubTab === 'visit-history'
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>ประวัติการให้บริการทั้งหมด</span>
                  </button>

                  <button
                    onClick={() => handleNav('infirmary', 'referrals')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                      currentTab === 'infirmary' && currentSubTab === 'referrals'
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Ambulance className="w-3.5 h-3.5 text-rose-500" />
                    <span>การส่งต่อโรงพยาบาล</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. คลังยา (Pharmacy & Inventory) */}
          {!isTeacher && (
            <div className="pt-2">
              <button
                onClick={() => toggleGroup('pharmacy')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
              >
                <div className="flex items-center space-x-2">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>💊 คลังยา</span>
                </div>
                {openGroups.pharmacy ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openGroups.pharmacy && (
                <div className="mt-1 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-3">
                  <button
                    onClick={() => handleNav('pharmacy', 'medicine-list')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'pharmacy' && currentSubTab === 'medicine-list'
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    • รายการยาและเวชภัณฑ์
                  </button>

                  <button
                    onClick={() => handleNav('pharmacy', 'restock')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                      currentTab === 'pharmacy' && currentSubTab === 'restock'
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <PackagePlus className="w-3.5 h-3.5 text-blue-500" />
                    <span>รับยาเข้าคลัง</span>
                  </button>

                  <button
                    onClick={() => handleNav('pharmacy', 'dispense-history')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'pharmacy' && currentSubTab === 'dispense-history'
                        ? 'bg-teal-50 text-teal-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    • ประวัติการจ่ายยา / ตัดสต็อก
                  </button>

                  <button
                    onClick={() => handleNav('pharmacy', 'low-stock')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      currentTab === 'pharmacy' && currentSubTab === 'low-stock'
                        ? 'bg-amber-50 text-amber-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>• ยาใกล้หมดสต็อก</span>
                    {lowStockMedicinesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                        {lowStockMedicinesCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleNav('pharmacy', 'expiring')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      currentTab === 'pharmacy' && currentSubTab === 'expiring'
                        ? 'bg-yellow-50 text-yellow-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>• ยาใกล้หมดอายุ</span>
                    {expiringMedicinesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold">
                        {expiringMedicinesCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleNav('pharmacy', 'expired')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      currentTab === 'pharmacy' && currentSubTab === 'expired'
                        ? 'bg-red-50 text-red-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>• ยาหมดอายุ</span>
                    {expiredMedicinesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-800 font-bold">
                        {expiredMedicinesCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. Dashboard และ Analytics */}
          <div className="pt-2">
            <button
              onClick={() => handleNav('analytics')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                currentTab === 'analytics'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5" />
                <span>📊 สถิติและการวิเคราะห์</span>
              </div>
            </button>
          </div>

          {/* 6. ระบบรายงาน (Reports) */}
          <div className="pt-1">
            <button
              onClick={() => toggleGroup('reports')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>📄 ระบบรายงาน & Export</span>
              </div>
              {openGroups.reports ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {openGroups.reports && (
              <div className="mt-1 space-y-0.5 pl-3 border-l-2 border-slate-100 ml-3">
                <button
                  onClick={() => handleNav('reports', 'visits')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'reports' && currentSubTab === 'visits'
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  • รายงานการให้บริการ
                </button>
                
                {!isTeacher && (
                  <>
                    <button
                      onClick={() => handleNav('reports', 'dispensing')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        currentTab === 'reports' && currentSubTab === 'dispensing'
                          ? 'bg-teal-50 text-teal-800 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      • รายงานการจ่ายยา
                    </button>

                    <button
                      onClick={() => handleNav('reports', 'inventory')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        currentTab === 'reports' && currentSubTab === 'inventory'
                          ? 'bg-teal-50 text-teal-800 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      • รายงานคลังยาและวันหมดอายุ
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleNav('reports', 'student-health')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'reports' && currentSubTab === 'student-health'
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  • รายงานสุขภาพนักเรียนรายบุคคล
                </button>
              </div>
            )}
          </div>

          {/* 7. Admin Specific Sections: Users, Settings, Audit Logs */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-200 mt-3 space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-600 flex items-center space-x-1">
                <span>สำหรับผู้ดูแลระบบ (Admin)</span>
              </div>

              <button
                onClick={() => handleNav('users')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  currentTab === 'users'
                    ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 text-purple-600" />
                <span>👥 จัดการผู้ใช้งานและสิทธิ์</span>
              </button>

              <button
                onClick={() => handleNav('audit')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  currentTab === 'audit'
                    ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileClock className="w-4 h-4 text-purple-600" />
                <span>📜 ประวัติระบบ (Audit Log)</span>
              </button>

              <button
                onClick={() => handleNav('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  currentTab === 'settings'
                    ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4 text-purple-600" />
                <span>⚙️ ตั้งค่าระบบ & สำรองข้อมูล</span>
              </button>
            </div>
          )}

        </div>

        {/* Sidebar Footer: School Info & Current Role Card */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
              isAdmin ? 'bg-purple-600' : isNurse ? 'bg-teal-600' : 'bg-blue-600'
            }`}>
              {isAdmin ? 'AD' : isNurse ? 'RN' : 'TC'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUser.roleTitle}
              </p>
            </div>
          </div>
        </div>

        </div>

      </aside>
    </>
  );
};
