import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Role, ClassroomOption } from '../../types';
import { UserFormModal } from './UserFormModal';
import { ClassroomFormModal } from './ClassroomFormModal';
import { 
  Settings, 
  Shield, 
  Users, 
  Database, 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  History, 
  School, 
  Phone, 
  Ambulance, 
  CheckCircle2, 
  AlertTriangle,
  UserPlus,
  Edit,
  Trash2,
  KeyRound,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  GraduationCap,
  Plus,
  Cloud,
  CloudCheck,
  Loader2,
  LogIn,
  LogOut,
  FileText
} from 'lucide-react';
import { formatThaiDatePattern } from '../../utils/dateUtils';

interface SettingsViewProps {
  initialTab?: 'config' | 'users' | 'classrooms' | 'backup' | 'audit';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ initialTab = 'config' }) => {
  const { 
    systemConfig, 
    updateSystemConfig, 
    addClassroom,
    updateClassroom,
    deleteClassroom,
    users, 
    currentUser, 
    auditLogs,
    students,
    medicines,
    visits,
    dispenseLogs,
    restoreAllData,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    switchUser,
    firebaseUser,
    isFirebaseConnected,
    isSyncing,
    syncError,
    loginWithGoogle,
    logoutFirebase,
    syncAllToFirebase,
    clearAndSyncRealStudentsToFirebase,
    resetToDefaultData,
    uploadedDocuments
  } = useApp();

  const [schoolName, setSchoolName] = useState(systemConfig.schoolName || '');
  const [schoolPhone, setSchoolPhone] = useState(systemConfig.schoolPhone || '');
  const [emergencyPhone, setEmergencyPhone] = useState(systemConfig.emergencyPhone || '');
  const [nearbyHospital, setNearbyHospital] = useState(systemConfig.nearbyHospital || '');
  const [hospitalPhone, setHospitalPhone] = useState(systemConfig.hospitalPhone || systemConfig.nearbyHospitalPhone || '');
  const [activeAcademicYear, setActiveAcademicYear] = useState(systemConfig.activeAcademicYear || '2569');
  const [activeSemester, setActiveSemester] = useState(systemConfig.activeSemester || '1');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'users' | 'classrooms' | 'backup' | 'audit'>(initialTab);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<{ text: string; success: boolean } | null>(null);

  const [isClearingAndSyncing, setIsClearingAndSyncing] = useState(false);
  const [clearMsg, setClearMsg] = useState<{ text: string; success: boolean } | null>(null);

  const handleResetToChainatStudents = () => {
    if (window.confirm('คุณต้องการเคลียร์ข้อมูลทดลองทิ้งทั้งหมด และโหลดข้อมูลนักเรียนจริง 173 คนของสถานศึกษาศึกษาพิเศษชัยนาท ใช่หรือไม่?')) {
      resetToDefaultData();
      setClearMsg({ text: 'เคลียร์ข้อมูลทดลองเรียบร้อย พร้อมโหลดข้อมูลนักเรียนจริง 173 คนแล้ว!', success: true });
      setTimeout(() => setClearMsg(null), 5000);
    }
  };

  const handleClearAndSyncFirebase = async () => {
    if (!window.confirm('คุณต้องการล้างข้อมูลทดลองบน Firebase Cloud แล้วซิงค์ข้อมูลนักเรียนจริงทั้ง 173 คนขึ้นระบบคลาวด์ ใช่หรือไม่?')) {
      return;
    }
    setIsClearingAndSyncing(true);
    setClearMsg(null);
    try {
      const count = await clearAndSyncRealStudentsToFirebase();
      setClearMsg({ text: `ล้างข้อมูลทดลองและซิงค์ข้อมูลนักเรียนจริง 173 คนขึ้น Firebase Firestore สำเร็จ (${count} รายการ)!`, success: true });
      setTimeout(() => setClearMsg(null), 6000);
    } catch (err: any) {
      setClearMsg({ text: err?.message || 'เกิดข้อผิดพลาดในการล้างและซิงค์ข้อมูล', success: false });
    } finally {
      setIsClearingAndSyncing(false);
    }
  };

  const handleTriggerCloudSync = async () => {
    setIsCloudSyncing(true);
    setCloudSyncMsg(null);
    try {
      await syncAllToFirebase();
      setCloudSyncMsg({ text: 'ซิงค์ข้อมูลขึ้น Firebase Firestore สำเร็จเรียบร้อย!', success: true });
      setTimeout(() => setCloudSyncMsg(null), 5000);
    } catch (err: any) {
      setCloudSyncMsg({ text: err.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล', success: false });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Classroom Management States
  const [classroomSearch, setClassroomSearch] = useState('');
  const [classroomGradeFilter, setClassroomGradeFilter] = useState('all');
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [editingClassroomIndex, setEditingClassroomIndex] = useState<number | null>(null);
  const [deletingClassroomIndex, setDeletingClassroomIndex] = useState<number | null>(null);

  // Count active students per classroom
  const studentCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach(s => {
      const key = (s.classroom || '').trim();
      if (key) {
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [students]);

  // Filtered Classrooms
  const filteredClassrooms = useMemo(() => {
    return (systemConfig.classrooms || []).map((c, index) => ({ ...c, originalIndex: index }))
      .filter(c => {
        if (classroomGradeFilter !== 'all') {
          if (classroomGradeFilter === 'อนุบาล' && !c.grade.includes('อนุบาล') && !c.grade.includes('เตรียม')) return false;
          if (classroomGradeFilter === 'ประถม' && !c.grade.includes('ป.')) return false;
          if (classroomGradeFilter === 'มัธยม' && !c.grade.includes('ม.')) return false;
          if (classroomGradeFilter === 'อื่นๆ' && (c.grade.includes('อนุบาล') || c.grade.includes('เตรียม') || c.grade.includes('ป.') || c.grade.includes('ม.'))) return false;
        }

        const q = classroomSearch.toLowerCase().trim();
        if (q) {
          const matchGrade = (c.grade || '').toLowerCase().includes(q);
          const matchName = (c.name || '').toLowerCase().includes(q);
          const matchTeacher = (c.homeroomTeacher || '').toLowerCase().includes(q);
          const matchRoom = (c.roomNumber || '').toLowerCase().includes(q);
          if (!matchGrade && !matchName && !matchTeacher && !matchRoom) return false;
        }
        return true;
      });
  }, [systemConfig.classrooms, classroomGradeFilter, classroomSearch]);

  // User Management States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'nurse' | 'teacher'>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const q = userSearch.toLowerCase().trim();
      const matchSearch = !q || 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.assignedClassroom && u.assignedClassroom.toLowerCase().includes(q)) ||
        (u.position && u.position.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [users, userRoleFilter, userSearch]);

  const userStats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      nurses: users.filter(u => u.role === 'nurse').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      active: users.filter(u => u.isActive !== false).length
    };
  }, [users]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  useEffect(() => {
    setSchoolName(systemConfig.schoolName || '');
    setSchoolPhone(systemConfig.schoolPhone || '');
    setEmergencyPhone(systemConfig.emergencyPhone || '');
    setNearbyHospital(systemConfig.nearbyHospital || '');
    setHospitalPhone(systemConfig.hospitalPhone || systemConfig.nearbyHospitalPhone || '');
    setActiveAcademicYear(systemConfig.activeAcademicYear || '2569');
    setActiveSemester(systemConfig.activeSemester || '1');
  }, [systemConfig]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle saving general system config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemConfig({
      schoolName,
      schoolPhone,
      emergencyPhone,
      nearbyHospital,
      hospitalPhone,
      activeAcademicYear,
      activeSemester
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Backup data to JSON file download
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      systemConfig,
      students,
      medicines,
      visits,
      dispenseLogs,
      auditLogs
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chainat_infirmary_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore data from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.students && json.medicines && json.visits) {
          if (confirm('คุณแน่ใจหรือไม่ที่จะกู้คืนข้อมูลทับข้อมูลปัจจุบันทั้งหมด?')) {
            restoreAllData({
              students: json.students,
              medicines: json.medicines,
              visits: json.visits,
              dispenseLogs: json.dispenseLogs || [],
              systemConfig: json.systemConfig || systemConfig
            });
            alert('กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว');
          }
        } else {
          alert('ไฟล์ข้อมูลสำรองไม่ถูกต้องตามรูปแบบ');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800">
              ระบบการตั้งค่า & ผู้ดูแลระบบ
            </span>
            <span className="text-xs text-slate-500">
              ควบคุมการทำงานและความปลอดภัยของระบบห้องพยาบาล
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-800 mt-1">
            ตั้งค่าระบบและตรวจสอบประวัติ (System Settings & Audit)
          </h2>
        </div>

        {saveSuccess && (
          <div className="px-3.5 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>บันทึกการตั้งค่าสำเร็จ</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs overflow-x-auto flex space-x-1 text-xs">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'config' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <School className="w-4 h-4" />
          <span>ข้อมูลโรงเรียน & ปีการศึกษา</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'users' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ผู้ใช้งาน & สิทธิ์ (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('classrooms')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'classrooms' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>ชั้นเรียน & ห้องเรียน ({systemConfig.classrooms?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'backup' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>สำรอง & กู้คืนข้อมูล (Backup/Restore)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'audit' ? 'bg-purple-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>บันทึกประวัติการใช้งาน (Audit Trail)</span>
        </button>
      </div>

      {/* TAB 1: General School Config */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 text-xs">
          <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
            <School className="w-4 h-4 text-purple-600" />
            <span>ข้อมูลโรงเรียนและหมายเลขติดต่อฉุกเฉิน</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">ชื่อโรงเรียน / สถาบันการศึกษา *</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์โรงเรียน</label>
              <input
                type="tel"
                value={schoolPhone}
                onChange={e => setSchoolPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">เบอร์สายด่วนฉุกเฉิน (เช่น 1669)</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-rose-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">โรงพยาบาลใกล้เคียงสำหรับส่งต่อ</label>
              <input
                type="text"
                value={nearbyHospital}
                onChange={e => setNearbyHospital(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรห้องฉุกเฉินโรงพยาบาล</label>
              <input
                type="tel"
                value={hospitalPhone}
                onChange={e => setHospitalPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ปีการศึกษาปัจจุบัน</label>
              <input
                type="text"
                value={activeAcademicYear}
                onChange={e => setActiveAcademicYear(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ภาคเรียนปัจจุบัน</label>
              <input
                type="text"
                value={activeSemester}
                onChange={e => setActiveSemester(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-bold"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าระบบ</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Users and Roles (RBAC) - User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* User Statistics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-semibold">ผู้ใช้งานทั้งหมด</div>
              <div className="text-xl font-heading font-bold text-slate-900 mt-1">{userStats.total} <span className="text-xs font-normal text-slate-400">บัญชี</span></div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-2xs">
              <div className="text-[11px] text-purple-600 font-semibold">ผู้ดูแลระบบ (Admin)</div>
              <div className="text-xl font-heading font-bold text-purple-700 mt-1">{userStats.admins} <span className="text-xs font-normal text-purple-400">คน</span></div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-teal-100 shadow-2xs">
              <div className="text-[11px] text-teal-600 font-semibold">ครูอนามัย (Nurse)</div>
              <div className="text-xl font-heading font-bold text-teal-700 mt-1">{userStats.nurses} <span className="text-xs font-normal text-teal-400">คน</span></div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-blue-100 shadow-2xs">
              <div className="text-[11px] text-blue-600 font-semibold">ครูประจำชั้น (Teacher)</div>
              <div className="text-xl font-heading font-bold text-blue-700 mt-1">{userStats.teachers} <span className="text-xs font-normal text-blue-400">คน</span></div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs col-span-2 sm:col-span-1">
              <div className="text-[11px] text-emerald-600 font-semibold">สถานะเปิดใช้งาน</div>
              <div className="text-xl font-heading font-bold text-emerald-700 mt-1">{userStats.active} <span className="text-xs font-normal text-emerald-400">บัญชี</span></div>
            </div>
          </div>

          {/* Search, Filter & Add Button Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, Username, ชั้นเรียน..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-xs"
                />
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    userRoleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('admin')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    userRoleFilter === 'admin'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin ({userStats.admins})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('nurse')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    userRoleFilter === 'nurse'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nurse ({userStats.nurses})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('teacher')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    userRoleFilter === 'teacher'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Teacher ({userStats.teachers})
                </button>
              </div>
            </div>

            {/* Add User Button */}
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setIsUserModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-slate-800">
                รายชื่อผู้ใช้งานและกำหนดสิทธิ์ (พบ {filteredUsers.length} รายการ)
              </h3>
              <span className="text-[11px] text-slate-400">
                คลิก "แก้ไข" เพื่อจัดการข้อมูล หรือ "สลับใช้บัญชีนี้" เพื่อทดสอบสิทธิ์
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-heading font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3">ผู้ใช้งาน</th>
                    <th className="px-4 py-3">ตำแหน่ง & ห้องที่รับผิดชอบ</th>
                    <th className="px-4 py-3">บทบาท (Role)</th>
                    <th className="px-4 py-3 text-center">สถานะ</th>
                    <th className="px-4 py-3 text-right min-w-[170px]">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        ไม่พบข้อมูลผู้ใช้งานตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const isSelf = u.id === currentUser.id;
                      const isActive = u.isActive !== false;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          
                          {/* User Name & Info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : u.role === 'nurse'
                                  ? 'bg-teal-100 text-teal-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {u.name ? u.name.charAt(0) : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                                      บัญชีปัจจุบัน
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                  <span>@{u.username}</span>
                                  {u.phone && <span>· โทร: {u.phone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Position & Assigned Classroom */}
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              {u.position || u.roleTitle || '-'}
                            </div>
                            {u.role === 'teacher' && u.assignedClassroom && (
                              <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                                ครูประจำชั้น {u.assignedClassroom}
                              </div>
                            )}
                          </td>

                          {/* Role Badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 ${
                              u.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : u.role === 'nurse'
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              <Shield className="w-3 h-3" />
                              <span>
                                {u.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : u.role === 'nurse' ? 'ครูอนามัย (Nurse)' : 'ครูประจำชั้น (Teacher)'}
                              </span>
                            </span>
                          </td>

                          {/* Status Toggle */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                toggleUserStatus(u.id);
                                showNotification(`เปลี่ยนสถานะของ ${u.name} เป็น ${isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} แล้ว`);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 transition-all ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title="คลิกเพื่อเปิด/ปิดการใช้งานบัญชี"
                            >
                              {isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>ใช้งานอยู่</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  <span>ปิดใช้งาน</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              
                              {/* Switch User Button */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    switchUser(u.id);
                                    showNotification(`สลับใช้งานเป็น: ${u.name} (${u.roleTitle})`);
                                  }}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                                  title="สลับเข้าใช้งานด้วยบัญชีนี้"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(u);
                                  setIsUserModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                                title="แก้ไขข้อมูลผู้ใช้"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  resetUserPassword(u.id);
                                  showNotification(`รีเซ็ตรหัสผ่านของ ${u.name} เป็น 123456 เรียบร้อยแล้ว`);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                                title="รีเซ็ตรหัสผ่าน (เป็น 123456)"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => {
                                  if (!isSelf) {
                                    setDeletingUserId(u.id);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isSelf
                                    ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                }`}
                                title={isSelf ? 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' : 'ลบบัญชีผู้ใช้นี้'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB: Classrooms & Grades Management */}
      {activeTab === 'classrooms' && (
        <div className="space-y-4">
          {/* Top Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-semibold">ห้องเรียนทั้งหมด</div>
              <div className="text-xl font-heading font-bold text-slate-900 mt-1">
                {(systemConfig.classrooms || []).length} <span className="text-xs font-normal text-slate-400">ห้อง</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-2xs">
              <div className="text-[11px] text-purple-600 font-semibold">จำนวนระดับชั้น</div>
              <div className="text-xl font-heading font-bold text-purple-700 mt-1">
                {new Set((systemConfig.classrooms || []).map(c => c.grade)).size} <span className="text-xs font-normal text-purple-400">ระดับชั้น</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-teal-100 shadow-2xs">
              <div className="text-[11px] text-teal-600 font-semibold">นักเรียนที่มีห้องเรียน</div>
              <div className="text-xl font-heading font-bold text-teal-700 mt-1">
                {students.filter(s => !!s.classroom).length} <span className="text-xs font-normal text-teal-400">คน</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
              <div className="text-[11px] text-emerald-600 font-semibold">สิทธิ์จัดการข้อมูล</div>
              <div className="text-sm font-heading font-bold text-emerald-700 mt-1">
                ผู้ดูแลระบบ (Admin)
              </div>
            </div>
          </div>

          {/* Search, Filter & Add Classroom Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาระดับชั้น, ชื่อห้องเรียน, ครูประจำชั้น..."
                  value={classroomSearch}
                  onChange={e => setClassroomSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-xs"
                />
              </div>

              {/* Grade Group Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setClassroomGradeFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    classroomGradeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({(systemConfig.classrooms || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setClassroomGradeFilter('อนุบาล')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    classroomGradeFilter === 'อนุบาล'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  อนุบาล/เตรียม
                </button>
                <button
                  type="button"
                  onClick={() => setClassroomGradeFilter('ประถม')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    classroomGradeFilter === 'ประถม'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ประถมศึกษา (ป.1 - ป.6)
                </button>
                <button
                  type="button"
                  onClick={() => setClassroomGradeFilter('มัธยม')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    classroomGradeFilter === 'มัธยม'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  มัธยมศึกษา (ม.1 - ม.ปลาย)
                </button>
                <button
                  type="button"
                  onClick={() => setClassroomGradeFilter('อื่นๆ')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    classroomGradeFilter === 'อื่นๆ'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  อื่นๆ
                </button>
              </div>
            </div>

            {/* Add Classroom Button */}
            <button
              type="button"
              onClick={() => {
                setEditingClassroomIndex(null);
                setIsClassroomModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มห้องเรียนใหม่</span>
            </button>
          </div>

          {/* Classrooms Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-14 text-center">ลำดับ</th>
                    <th className="px-4 py-3">ระดับชั้น (Grade)</th>
                    <th className="px-4 py-3">ชื่อห้องเรียน (Classroom)</th>
                    <th className="px-4 py-3">ครูประจำชั้น</th>
                    <th className="px-4 py-3">อาคาร / ห้อง</th>
                    <th className="px-4 py-3 text-center">นักเรียนในระบบ</th>
                    <th className="px-4 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClassrooms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <div>ไม่พบข้อมูลห้องเรียนตามเงื่อนไขที่ค้นหา</div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClassroomIndex(null);
                            setIsClassroomModalOpen(true);
                          }}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200"
                        >
                          + เพิ่มห้องเรียนใหม่ตอนนี้
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredClassrooms.map((c, displayIndex) => {
                      const enrolledCount = studentCountMap[c.name] || 0;
                      return (
                        <tr key={c.originalIndex} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">
                            {displayIndex + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {c.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                            {c.name}
                            {c.description && (
                              <span className="block text-[11px] font-normal text-slate-400">
                                {c.description}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {c.homeroomTeacher ? (
                              <span className="font-medium text-slate-800">{c.homeroomTeacher}</span>
                            ) : (
                              <span className="text-slate-400 italic">ยังไม่ระบุ</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {c.roomNumber ? (
                              <span>{c.roomNumber}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {enrolledCount > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                {enrolledCount} คน
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">0 คน</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingClassroomIndex(c.originalIndex);
                                  setIsClassroomModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                                title="แก้ไขห้องเรียน"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeletingClassroomIndex(c.originalIndex)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                                title="ลบห้องเรียน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Backup and Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Firebase Cloud Real-time Database Card */}
          <div className="bg-white rounded-2xl p-6 border border-teal-200 shadow-2xs space-y-4 text-xs bg-linear-to-br from-white via-teal-50/20 to-teal-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-base text-slate-800">
                      ฐานข้อมูลคลาวด์ Firebase Firestore (Real-time Sync)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      Real-time
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    เชื่อมต่อฐานข้อมูล Google Cloud Firestore ซิงค์ข้อมูลนักเรียน, ประวัติสุขภาพ, คลังยา และเอกสาร PDF/รูปภาพแบบ Real-time อัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {firebaseUser ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>เชื่อมต่อแล้ว ({firebaseUser.email})</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>ยังไม่ได้เชื่อมต่อบัญชี Google</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cloud Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[11px]">นักเรียนในระบบ</div>
                <div className="text-lg font-bold text-teal-700 mt-0.5">{students.length} คน</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ซิงค์แบบเรียลไทม์</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[11px]">คลังยาและเวชภัณฑ์</div>
                <div className="text-lg font-bold text-teal-700 mt-0.5">{medicines.length} รายการ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ซิงค์แบบเรียลไทม์</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[11px]">ประวัติการรับบริการ</div>
                <div className="text-lg font-bold text-teal-700 mt-0.5">{visits.length} รายการ</div>
                <div className="text-[10px] text-slate-400 mt-0.5">ซิงค์แบบเรียลไทม์</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[11px]">เอกสารและรูปภาพ (PDF/Images)</div>
                <div className="text-lg font-bold text-teal-700 mt-0.5">{uploadedDocuments.length} ไฟล์</div>
                <div className="text-[10px] text-slate-400 mt-0.5">จัดเก็บบน Firestore</div>
              </div>
            </div>

            {cloudSyncMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                cloudSyncMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {cloudSyncMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{cloudSyncMsg.text}</span>
              </div>
            )}

            {syncError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>ข้อผิดพลาดการซิงค์: {syncError}</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {firebaseUser ? (
                  <button
                    type="button"
                    onClick={logoutFirebase}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ Firebase</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center space-x-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบด้วย Google (เชื่อมต่อ Firebase)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTriggerCloudSync}
                  disabled={isCloudSyncing || isSyncing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-2 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isCloudSyncing || isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังซิงค์ขึ้น Firebase Firestore...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>ซิงค์ข้อมูลทั้งหมดขึ้น Firebase Cloud เดี๋ยวนี้</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 text-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-800">
                  สำรองข้อมูลระบบ (Export Backup)
                </h3>
                <p className="text-slate-500 mt-1">
                  ดาวน์โหลดข้อมูลทั้งหมดของระบบ (ข้อมูลนักเรียน, ประวัติสุขภาพ, คลังยา, ประวัติการให้บริการ, และประวัติการจ่ายยา) เป็นไฟล์ JSON เพื่อความปลอดภัย
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1 text-slate-600">
                  <div>• นักเรียนทั้งหมด: {students.length} คน</div>
                  <div>• ยาและเวชภัณฑ์ในคลัง: {medicines.length} รายการ</div>
                  <div>• ประวัติการรับบริการห้องพยาบาล: {visits.length} รายการ</div>
                  <div>• บันทึกการตัดสต็อกยา: {dispenseLogs.length} รายการ</div>
                </div>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full mt-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์สำรองข้อมูล (.json)</span>
              </button>
            </div>

            {/* Restore */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 text-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-800">
                  กู้คืนข้อมูลระบบ (Restore Data)
                </h3>
                <p className="text-slate-500 mt-1">
                  นำเข้าไฟล์ข้อมูลสำรอง JSON เพื่อกู้คืนฐานข้อมูลกลับสู่สถานะก่อนหน้า
                </p>

                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1 font-medium">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>คำเตือน:</span>
                  </div>
                  <div>การกู้คืนข้อมูลจะเขียนทับข้อมูลปัจจุบันทั้งหมดในระบบ โปรดตรวจสอบไฟล์ให้ถูกต้องก่อนดำเนินการ</div>
                </div>
              </div>

              <label className="w-full mt-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center space-x-2 cursor-pointer transition-colors text-center">
                <Upload className="w-4 h-4" />
                <span>เลือกไฟล์กู้คืนข้อมูล (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Real Students Data & Clear Mock Section */}
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-blue-50/50 rounded-2xl p-6 border border-teal-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-800 flex items-center gap-2">
                    <span>ข้อมูลนักเรียนจริง 173 คน (สถานศึกษาศึกษาพิเศษชัยนาท)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
                      ปัจจุบัน {students.length} คน
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    นำเข้าข้อมูลจริงครบทั้ง 173 คน (ป.1 ถึง ม.6) พร้อมรหัสนักเรียน เลข 13 หลัก ข้อมูลสรีระ น้ำหนัก ส่วนสูง ค่า BMI และล้างข้อมูลทดลอง
                  </p>
                </div>
              </div>
            </div>

            {clearMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                clearMsg.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {clearMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span className="font-medium">{clearMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white/80 rounded-xl border border-teal-100">
                <span className="text-slate-500 block">ระดับชั้นในระบบ:</span>
                <span className="font-bold text-slate-800">ป.1 - ม.6 (รวม 25 ห้องเรียน)</span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-teal-100">
                <span className="text-slate-500 block">ประวัติการตรวจโภชนาการ:</span>
                <span className="font-bold text-teal-700">คำนวณ BMI และเกณฑ์ครบ 173 คน</span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-teal-100">
                <span className="text-slate-500 block">สถานะข้อมูลทดลอง:</span>
                <span className="font-bold text-emerald-700">เคลียร์เคสทดลอง (0 รายการ)</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleResetToChainatStudents}
                className="px-4 py-2.5 rounded-xl border border-teal-300 bg-white hover:bg-teal-50 text-teal-800 font-bold text-xs flex items-center space-x-2 transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รีเซ็ต & โหลดข้อมูลนักเรียนชัยนาท 173 คน (Local)</span>
              </button>

              {firebaseUser && (
                <button
                  type="button"
                  onClick={handleClearAndSyncFirebase}
                  disabled={isClearingAndSyncing}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isClearingAndSyncing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังล้างและซิงค์ 173 คนขึ้น Firebase Firestore...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ล้างข้อมูลเก่า & ซิงค์ 173 คนขึ้น Firebase Cloud เดี๋ยวนี้</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-slate-800">
              บันทึกกิจกรรมและความปลอดภัยของระบบ (Audit Trail)
            </h3>
            <span className="text-xs text-slate-500">
              สะสม {auditLogs.length} บันทึก
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-heading font-semibold border-b border-slate-200 uppercase text-[11px] sticky top-0">
                <tr>
                  <th className="px-4 py-3">วัน-เวลา</th>
                  <th className="px-4 py-3">ประเภทกิจกรรม</th>
                  <th className="px-4 py-3">รายละเอียดการทำงาน</th>
                  <th className="px-4 py-3">ผู้ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {formatThaiDatePattern(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.userName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Form Modal (Create / Edit User) */}
      <UserFormModal
        user={editingUser}
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={(userData) => {
          if (editingUser) {
            updateUser(editingUser.id, userData);
            showNotification(`อัปเดตข้อมูลของ ${userData.name} เรียบร้อยแล้ว`);
          } else {
            addUser(userData);
            showNotification(`เพิ่มผู้ใช้งาน ${userData.name} สำเร็จ`);
          }
        }}
      />

      {/* Classroom Form Modal (Create / Edit Classroom) */}
      <ClassroomFormModal
        isOpen={isClassroomModalOpen}
        onClose={() => {
          setIsClassroomModalOpen(false);
          setEditingClassroomIndex(null);
        }}
        existingClassrooms={systemConfig.classrooms || []}
        currentIndex={editingClassroomIndex !== null ? editingClassroomIndex : undefined}
        initialData={
          editingClassroomIndex !== null && systemConfig.classrooms && systemConfig.classrooms[editingClassroomIndex]
            ? systemConfig.classrooms[editingClassroomIndex]
            : null
        }
        onSave={(newClassroom) => {
          if (editingClassroomIndex !== null) {
            updateClassroom(editingClassroomIndex, newClassroom);
            showNotification(`อัปเดตข้อมูลห้องเรียน "${newClassroom.name}" เรียบร้อยแล้ว`);
          } else {
            addClassroom(newClassroom);
            showNotification(`เพิ่มห้องเรียน "${newClassroom.name}" สำเร็จ`);
          }
          setIsClassroomModalOpen(false);
          setEditingClassroomIndex(null);
        }}
      />

      {/* Delete Classroom Confirmation Modal */}
      {deletingClassroomIndex !== null && systemConfig.classrooms && systemConfig.classrooms[deletingClassroomIndex] && (() => {
        const targetClassroom = systemConfig.classrooms[deletingClassroomIndex];
        const studentCount = studentCountMap[targetClassroom.name] || 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 text-center space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                studentCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  ยืนยันการลบห้องเรียน?
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  ห้องเรียน: {targetClassroom.name} ({targetClassroom.grade})
                </p>
                {studentCount > 0 ? (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
                    ⚠️ <strong>คำเตือน:</strong> มีนักเรียนจำนวน <strong>{studentCount} คน</strong> ที่กำลังสังกัดห้องเรียนนี้ การลบจะไม่ลบข้อมูลนักเรียน แต่นักเรียนจะไม่มีห้องเรียนที่ตรงกันในตัวเลือก
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    ห้องเรียนนี้ไม่มีนักเรียนสังกัดอยู่ สามารถลบได้อย่างปลอดภัย
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingClassroomIndex(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteClassroom(deletingClassroomIndex);
                    setDeletingClassroomIndex(null);
                    showNotification(`ลบห้องเรียน "${targetClassroom.name}" เรียบร้อยแล้ว`);
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  ยืนยันลบ
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete User Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                ยืนยันการลบบัญชีผู้ใช้งาน?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {users.find(u => u.id === deletingUserId)?.name} (@{users.find(u => u.id === deletingUserId)?.username}) จะถูกนำออกจากระบบอย่างถาวร
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetUser = users.find(u => u.id === deletingUserId);
                  deleteUser(deletingUserId);
                  setDeletingUserId(null);
                  showNotification(`ลบผู้ใช้งาน ${targetUser?.name || ''} เรียบร้อยแล้ว`);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-medium border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

    </div>
  );
};
