import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, MedicalDevice } from '../../types';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  AlertCircle, 
  Phone, 
  QrCode, 
  Printer, 
  ChevronRight, 
  HeartHandshake,
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  Info,
  Plus,
  Edit2,
  Trash2,
  X,
  Copy,
  Users,
  LayoutGrid,
  Table,
  FileDown
} from 'lucide-react';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { exportTableAsPDF } from '../../utils/tablePdfExport';
import { StudentAvatar } from '../common/StudentAvatar';

interface MedicalDevicesCardViewProps {
  onSelectStudent: (student: Student, subTab?: string) => void;
  onNewVisit?: (studentId: string) => void;
  onShowQR?: (student: Student) => void;
}

export const MedicalDevicesCardView: React.FC<MedicalDevicesCardViewProps> = ({
  onSelectStudent,
  onNewVisit,
  onShowQR
}) => {
  const { students, systemConfig, currentUser, updateStudent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [selectedDuplicateFilter, setSelectedDuplicateFilter] = useState<string>('all'); // 'all', 'only-duplicates', or deviceType
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Admin CRUD Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [formDeviceType, setFormDeviceType] = useState('NG Tube (สายให้อาหารทางจมูก)');
  const [formDetails, setFormDetails] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formReplacementSchedule, setFormReplacementSchedule] = useState('ทุก 1 เดือน');
  const [formCareInstructions, setFormCareInstructions] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    studentId: string;
    studentName: string;
    deviceId: string;
    deviceType: string;
  } | null>(null);

  const canAdmin = currentUser.role === 'admin' || currentUser.role === 'nurse';

  // Compute duplicate devices across all students
  const deviceDuplicates = useMemo(() => {
    const map: Record<string, { label: string; count: number; studentIds: Set<string> }> = {};

    students.forEach(student => {
      (student.medicalDevices || []).forEach(d => {
        const clean = d.deviceType.trim();
        const norm = clean.toLowerCase();
        if (!norm) return;
        if (!map[norm]) {
          map[norm] = { label: clean, count: 0, studentIds: new Set() };
        }
        map[norm].count += 1;
        map[norm].studentIds.add(student.id);
      });
    });

    return Object.entries(map).map(([norm, item]) => ({
      norm,
      ...item,
      studentIds: Array.from(item.studentIds)
    })).sort((a, b) => b.count - a.count);
  }, [students]);

  // Devices used by 2 or more students
  const duplicateOnlyItems = useMemo(() => {
    return deviceDuplicates.filter(item => item.count >= 2);
  }, [deviceDuplicates]);

  // Filter students who have medical devices / tubes
  const studentsWithDevices = useMemo(() => {
    return students.filter(s => (s.medicalDevices || []).length > 0);
  }, [students]);

  // Apply filters
  const filteredStudents = useMemo(() => {
    return studentsWithDevices.filter(s => {
      if (filterClassroom !== 'all' && s.classroom !== filterClassroom && s.grade !== filterClassroom) return false;

      const devices = s.medicalDevices || [];

      // Filter by category
      if (filterCategory === 'feeding') {
        const hasFeeding = devices.some(d => 
          d.deviceType.toLowerCase().includes('ng') || 
          d.deviceType.toLowerCase().includes('peg') || 
          d.deviceType.includes('ให้อาหาร') ||
          d.deviceType.includes('สายยาง')
        );
        if (!hasFeeding) return false;
      } else if (filterCategory === 'airway') {
        const hasAirway = devices.some(d => 
          d.deviceType.toLowerCase().includes('tracheo') || 
          d.deviceType.includes('เจาะคอ') || 
          d.deviceType.includes('ทางเดินหายใจ') ||
          d.deviceType.includes('ดูดเสมหะ') ||
          d.deviceType.toLowerCase().includes('oxygen')
        );
        if (!hasAirway) return false;
      } else if (filterCategory === 'catheter') {
        const hasCatheter = devices.some(d => 
          d.deviceType.toLowerCase().includes('catheter') || 
          d.deviceType.includes('สายสวน') || 
          d.deviceType.includes('ปัสสาวะ') ||
          d.deviceType.toLowerCase().includes('foley')
        );
        if (!hasCatheter) return false;
      } else if (filterCategory === 'shunt') {
        const hasShunt = devices.some(d => 
          d.deviceType.toLowerCase().includes('shunt') || 
          d.deviceType.includes('โพรงสมอง')
        );
        if (!hasShunt) return false;
      }

      // Duplicate filter
      if (selectedDuplicateFilter === 'only-duplicates') {
        const hasAnyDuplicate = devices.some(d => 
          duplicateOnlyItems.some(item => item.norm === d.deviceType.trim().toLowerCase())
        );
        if (!hasAnyDuplicate) return false;
      } else if (selectedDuplicateFilter !== 'all') {
        const matchSpecific = devices.some(d => 
          d.deviceType.trim().toLowerCase() === selectedDuplicateFilter.toLowerCase()
        );
        if (!matchSpecific) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
        const matchNick = (s.nickname || '').toLowerCase().includes(q);
        const matchCode = (s.studentCode || '').toLowerCase().includes(q);
        const matchClass = (s.classroom || '').toLowerCase().includes(q);
        const matchDev = devices.some(d => 
          d.deviceType.toLowerCase().includes(q) ||
          d.details.toLowerCase().includes(q) ||
          d.careInstructions.toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q)
        );

        return matchName || matchNick || matchCode || matchClass || matchDev;
      }

      return true;
    });
  }, [studentsWithDevices, filterClassroom, filterCategory, selectedDuplicateFilter, searchQuery, duplicateOnlyItems]);

  // Statistics
  const totalStudents = studentsWithDevices.length;
  const totalDevices = studentsWithDevices.reduce((sum, s) => sum + (s.medicalDevices || []).length, 0);
  
  const feedingTubesCount = studentsWithDevices.filter(s => 
    (s.medicalDevices || []).some(d => 
      d.deviceType.toLowerCase().includes('ng') || 
      d.deviceType.toLowerCase().includes('peg') || 
      d.deviceType.includes('ให้อาหาร')
    )
  ).length;

  const airwayTubesCount = studentsWithDevices.filter(s => 
    (s.medicalDevices || []).some(d => 
      d.deviceType.toLowerCase().includes('tracheo') || 
      d.deviceType.includes('เจาะคอ') ||
      d.deviceType.includes('หายใจ')
    )
  ).length;

  const duplicateDevicesStudentsCount = useMemo(() => {
    return studentsWithDevices.filter(s => 
      (s.medicalDevices || []).some(d => duplicateOnlyItems.some(item => item.norm === d.deviceType.trim().toLowerCase()))
    ).length;
  }, [studentsWithDevices, duplicateOnlyItems]);

  // Open Add Modal
  const handleOpenAddModal = (studentId?: string) => {
    setTargetStudentId(studentId || (students[0]?.id || ''));
    setEditingDeviceId(null);
    setFormDeviceType('NG Tube (สายให้อาหารทางจมูก)');
    setFormDetails('');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormReplacementSchedule('ทุก 1 เดือน');
    setFormCareInstructions('');
    setFormNotes('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (student: Student, device: MedicalDevice) => {
    setTargetStudentId(student.id);
    setEditingDeviceId(device.id);
    setFormDeviceType(device.deviceType);
    setFormDetails(device.details);
    setFormStartDate(device.startDate || new Date().toISOString().slice(0, 10));
    setFormReplacementSchedule(device.replacementSchedule || 'ทุก 1 เดือน');
    setFormCareInstructions(device.careInstructions);
    setFormNotes(device.notes || '');
    setModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !formDeviceType.trim() || !formDetails.trim()) return;

    const student = students.find(s => s.id === targetStudentId);
    if (!student) return;

    const currentDevices = [...(student.medicalDevices || [])];

    if (editingDeviceId) {
      const updated = currentDevices.map(d => {
        if (d.id === editingDeviceId) {
          return {
            ...d,
            deviceType: formDeviceType.trim(),
            details: formDetails.trim(),
            startDate: formStartDate,
            replacementSchedule: formReplacementSchedule.trim() || undefined,
            careInstructions: formCareInstructions.trim(),
            notes: formNotes.trim() || undefined
          };
        }
        return d;
      });
      updateStudent(student.id, { medicalDevices: updated });
    } else {
      const newDev: MedicalDevice = {
        id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        deviceType: formDeviceType.trim(),
        details: formDetails.trim(),
        startDate: formStartDate,
        replacementSchedule: formReplacementSchedule.trim() || undefined,
        careInstructions: formCareInstructions.trim(),
        notes: formNotes.trim() || undefined
      };
      updateStudent(student.id, { medicalDevices: [...currentDevices, newDev] });
    }

    setModalOpen(false);
  };

  // Delete Device
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const student = students.find(s => s.id === deleteTarget.studentId);
    if (!student) return;

    const updated = (student.medicalDevices || []).filter(d => d.id !== deleteTarget.deviceId);
    updateStudent(student.id, { medicalDevices: updated });
    setDeleteTarget(null);
  };

  // Download PDF Report
  const handleDownloadPdf = () => {
    exportTableAsPDF({
      title: 'รายงานรายชื่อนักเรียนที่ใส่ท่อและอุปกรณ์ทางการแพทย์',
      subtitle: `ประเภทอุปกรณ์: ${filterCategory === 'all' ? 'ทุกประเภท' : filterCategory} | ระดับชั้น/ห้อง: ${filterClassroom === 'all' ? 'ทุกระดับชั้น/ห้อง' : filterClassroom}`,
      schoolName: systemConfig?.schoolName || 'ศูนย์การศึกษาพิเศษ ประจำจังหวัดชัยนาท',
      columns: [
        { header: 'รหัส', key: 'studentCode', width: '80px', align: 'center' },
        { header: 'ชื่อ-นามสกุล (ชื่อเล่น)', key: 'fullName', width: '180px', align: 'left' },
        { header: 'ระดับชั้น/ห้อง', key: 'classroom', width: '90px', align: 'center' },
        { header: 'อุปกรณ์ / ท่อ', key: 'deviceType', width: '190px', align: 'left' },
        { header: 'รายละเอียด / ขนาด', key: 'details', width: '160px', align: 'left' },
        { header: 'รอบเปลี่ยนสาย', key: 'replacement', width: '120px', align: 'left' },
        { header: 'แนวทางการดูแล', key: 'care', width: '210px', align: 'left' }
      ],
      rows: filteredStudents.map((s) => ({
        studentCode: s.studentCode,
        fullName: `${s.prefix}${s.firstName} ${s.lastName} (${s.nickname})`,
        classroom: s.classroom,
        deviceType: (s.medicalDevices || []).map(d => `• ${d.deviceType}`).join('\n') || '-',
        details: (s.medicalDevices || []).map(d => `• ${d.details || '-'}`).join('\n') || '-',
        replacement: (s.medicalDevices || []).map(d => `• ${d.replacementSchedule || '-'}`).join('\n') || '-',
        care: (s.medicalDevices || []).map(d => `• ${d.careInstructions || '-'}`).join('\n') || '-'
      })),
      summaryStats: [
        { label: 'จำนวนนักเรียน', value: `${filteredStudents.length} คน` },
        { label: 'สายให้อาหาร (NG/PEG)', value: `${feedingTubesCount} คน` },
        { label: 'ท่อทางเดินหายใจ/เจาะคอ', value: `${airwayTubesCount} คน` }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              รายชื่อนักเรียนที่ใส่ท่อและอุปกรณ์ทางการแพทย์
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามสายให้อาหาร (NG/PEG), ท่อเจาะคอ, สายสวนปัสสาวะ ปรับมุมมองการ์ดหรือตาราง และดาวน์โหลดเป็น PDF ได้
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Card / Table View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'card' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>แบบการ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-purple-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>แบบตาราง (แถว)</span>
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors shadow-2xs"
            title="ดาวน์โหลดข้อมูลเป็นเอกสาร PDF แบบตาราง"
          >
            <FileDown className="w-4 h-4 text-purple-600" />
            <span>ดาวน์โหลด PDF (ตาราง)</span>
          </button>

          {canAdmin && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มท่อ/อุปกรณ์ใหม่</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => { setFilterCategory('all'); setSelectedDuplicateFilter('all'); }}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterCategory === 'all' && selectedDuplicateFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">นักเรียนที่ใส่อุปกรณ์พิเศษ</div>
          <div className="text-2xl font-bold mt-1">
            {totalStudents} <span className="text-xs font-normal opacity-80">คน</span>
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">รวมทั้งหมด {totalDevices} อุปกรณ์</div>
        </div>

        {/* Duplicate Filter Card */}
        <div 
          onClick={() => setSelectedDuplicateFilter(selectedDuplicateFilter === 'only-duplicates' ? 'all' : 'only-duplicates')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            selectedDuplicateFilter === 'only-duplicates'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white text-indigo-900 border-indigo-200 hover:border-indigo-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>👥 ชนิดท่อ/อุปกรณ์เหมือนกัน</span>
            <Copy className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1">
            {duplicateDevicesStudentsCount} <span className="text-xs font-normal opacity-80">คน</span>
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">{duplicateOnlyItems.length} ชนิดอุปกรณ์ที่ซ้ำกัน</div>
        </div>

        <div 
          onClick={() => setFilterCategory('feeding')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterCategory === 'feeding'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-800 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>🥣 สายให้อาหาร (NG / PEG)</span>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {feedingTubesCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5 font-medium">ระวังการสำลัก/สายเลื่อน</div>
        </div>

        <div 
          onClick={() => setFilterCategory('airway')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterCategory === 'airway'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-purple-800 border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>🫁 ท่อเจาะคอ (Tracheostomy)</span>
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {airwayTubesCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-purple-700 mt-0.5 font-medium">เตรียม Suction ฉุกเฉิน</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อนักเรียน, ชนิดท่อ, วิธีดูแล, ขนาด..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Duplicate Device Filter Dropdown */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>กรองคำซ้ำ:</span>
            </span>
            <select
              value={selectedDuplicateFilter}
              onChange={(e) => setSelectedDuplicateFilter(e.target.value)}
              className={`text-xs rounded-xl border py-2 px-2.5 font-medium transition-colors ${
                selectedDuplicateFilter !== 'all'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-200'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="all">ตัวกรองอุปกรณ์ทั้งหมด</option>
              {duplicateOnlyItems.length > 0 && (
                <option value="only-duplicates">
                  ⚡ เฉพาะอุปกรณ์ที่ซ้ำกัน ({duplicateOnlyItems.length} ชนิด)
                </option>
              )}
              <optgroup label="-- ชนิดท่อ/อุปกรณ์ที่มีนักเรียนใส่ซ้ำกัน --">
                {duplicateOnlyItems.map(item => (
                  <option key={item.norm} value={item.label}>
                    🩺 {item.label} (ซ้ำ {item.count} คน)
                  </option>
                ))}
              </optgroup>
              {deviceDuplicates.filter(i => i.count === 1).length > 0 && (
                <optgroup label="-- อุปกรณ์เฉพาะบุคคล --">
                  {deviceDuplicates.filter(i => i.count === 1).map(item => (
                    <option key={item.norm} value={item.label}>
                      🩺 {item.label} (1 คน)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Classroom / Grade */}
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-purple-500 font-semibold"
          >
            <option value="all">ทุกระดับชั้น/ห้อง</option>
            {(systemConfig.classrooms || []).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-purple-500"
          >
            <option value="all">ทุกประเภทท่อ</option>
            <option value="feeding">🥣 สายให้อาหาร (NG / PEG)</option>
            <option value="airway">🫁 ทางเดินหายใจ (Tracheostomy)</option>
            <option value="catheter">💧 สายสวนปัสสาวะ (Catheter)</option>
            <option value="shunt">🧠 ท่อระบายน้ำในโพรงสมอง (VP Shunt)</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid / Table View */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Activity className="w-6 h-6" />
          </div>
          <p className="font-medium text-slate-700 text-sm">ไม่พบข้อมูลนักเรียนที่ใส่ท่อ/อุปกรณ์ตามเงื่อนไขที่ค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองคำซ้ำ</p>
          {selectedDuplicateFilter !== 'all' && (
            <button
              onClick={() => setSelectedDuplicateFilter('all')}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100"
            >
              ล้างตัวกรองคำซ้ำ
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-3 text-center w-12">#</th>
                  <th className="py-3.5 px-3 w-48">ข้อมูลนักเรียน</th>
                  <th className="py-3.5 px-3 text-center w-24">ห้องเรียน</th>
                  <th className="py-3.5 px-4 min-w-[200px]">อุปกรณ์ / ท่อพิเศษ</th>
                  <th className="py-3.5 px-3 w-36">ขนาด / รายละเอียด</th>
                  <th className="py-3.5 px-3 w-36">รอบเปลี่ยนสาย</th>
                  <th className="py-3.5 px-4 min-w-[220px]">แนวทางการดูแลและข้อควรระวัง</th>
                  <th className="py-3.5 px-3 w-44">ผู้ปกครอง / เบอร์โทร</th>
                  <th className="py-3.5 px-3 text-center w-36">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const devices = student.medicalDevices || [];

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <StudentAvatar
                            src={student.photoUrl}
                            gender={student.gender}
                            name={student.firstName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate">
                              {student.prefix}{student.firstName} {student.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                              <span className="font-mono text-purple-700 bg-purple-50 px-1 rounded">{student.studentCode}</span>
                              <span>ชื่อเล่น: <strong className="text-slate-700">{student.nickname}</strong></span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800 text-xs">
                        {student.classroom}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {devices.map(d => (
                            <div key={d.id} className="p-1.5 rounded-lg bg-purple-50/70 border border-purple-200/60 text-[11px]">
                              <span className="font-bold text-purple-900">
                                🩺 {d.deviceType}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {devices.map(d => (
                            <div key={d.id} className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              {d.details || '-'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {devices.map(d => (
                            <div key={d.id} className="text-[11px] text-slate-700 flex items-center space-x-1">
                              <span>🔄</span>
                              <span className="font-medium">{d.replacementSchedule || 'ตามแพทย์นัด'}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {devices.map(d => (
                            <div key={d.id} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                              <div>💡 {d.careInstructions || '-'}</div>
                              {d.notes && (
                                <div className="text-amber-800 text-[10px] mt-0.5 font-medium">
                                  ⚠️ {d.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 text-xs">
                          {student.guardianName || '-'}
                        </div>
                        <div className="text-[11px] text-purple-700 font-mono mt-0.5">
                          📞 {student.guardianPhone || student.emergencyPhone || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {onShowQR && (
                            <button
                              type="button"
                              onClick={() => onShowQR(student)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                              title="แสดง QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                          {onNewVisit && (
                            <button
                              type="button"
                              onClick={() => onNewVisit(student.id)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 hover:text-purple-800 transition-colors"
                              title="บันทึกการพยาบาล"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student, 'devices')}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            ดูข้อมูล
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map(student => {
            const devices = student.medicalDevices || [];

            return (
              <div 
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 transition-all duration-200 flex flex-col justify-between hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 flex items-start space-x-3">
                    <StudentAvatar
                      src={student.photoUrl}
                      gender={student.gender}
                      name={student.firstName}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          {student.studentCode}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-100">
                            ห้อง {student.classroom}
                          </span>
                          {canAdmin && (
                            <button
                              onClick={() => handleOpenAddModal(student.id)}
                              title="เพิ่มท่อ/อุปกรณ์ให้นักเรียนคนนี้"
                              className="p-1 rounded-md text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 text-sm truncate mt-0.5">
                        {student.prefix}{student.firstName} {student.lastName}
                      </h3>

                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                          ชื่อเล่น: {student.nickname}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          อายุ {student.age} ปี
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Devices List */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                        <span>ท่อและอุปกรณ์พิเศษ ({devices.length} รายการ)</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      {devices.map((device) => {
                        const isFeeding = device.deviceType.toLowerCase().includes('ng') || device.deviceType.toLowerCase().includes('peg') || device.deviceType.includes('ให้อาหาร');
                        const isTracheo = device.deviceType.toLowerCase().includes('tracheo') || device.deviceType.includes('เจาะคอ');
                        const dupInfo = duplicateOnlyItems.find(d => d.norm === device.deviceType.trim().toLowerCase());

                        return (
                          <div
                            key={device.id}
                            className={`p-3 rounded-xl border text-xs space-y-2 relative ${
                              isTracheo 
                                ? 'bg-purple-50/70 border-purple-200' 
                                : isFeeding 
                                ? 'bg-amber-50/70 border-amber-200' 
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                                    <span>{isTracheo ? '🫁' : isFeeding ? '🥣' : '🩺'}</span>
                                    <span>{device.deviceType}</span>
                                  </h4>
                                  {dupInfo && (
                                    <span 
                                      className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                                      onClick={() => setSelectedDuplicateFilter(dupInfo.label)}
                                      title={`มีเพื่อนใส่อุปกรณ์ชนิดนี้อีก ${dupInfo.count - 1} คน คลิกเพื่อกรอง`}
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                      <span>ซ้ำ {dupInfo.count} คน</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 mt-0.5">
                                  <strong className="text-slate-700">รายละเอียด: </strong>
                                  <span className="text-slate-800 font-medium">{device.details}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                {canAdmin && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditModal(student, device)}
                                      title="แก้ไขข้อมูลอุปกรณ์"
                                      className="p-1 text-slate-400 hover:text-purple-600 hover:bg-white rounded transition-colors"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({
                                        studentId: student.id,
                                        studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
                                        deviceId: device.id,
                                        deviceType: device.deviceType
                                      })}
                                      title="ลบอุปกรณ์นี้"
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Date Installed in Thai Format & Replacement Schedule */}
                            <div className="grid grid-cols-1 gap-1 text-[11px] bg-white/80 p-2 rounded-lg border border-slate-200">
                              <div className="text-slate-600 flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="text-slate-700 font-medium">ใส่วันที่: </span>
                                <span className="font-semibold text-slate-800">
                                  {formatThaiDatePattern(device.startDate)}
                                </span>
                              </div>
                              {device.replacementSchedule && (
                                <div className="text-purple-800 font-bold flex items-center space-x-1">
                                  <span className="text-slate-400">•</span>
                                  <span>กำหนดเปลี่ยน: {device.replacementSchedule}</span>
                                </div>
                              )}
                            </div>

                            {/* Care Instructions */}
                            <div className="text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-100">
                              <strong className="text-slate-800">คำแนะนำการดูแล: </strong>
                              <p className="mt-0.5 leading-relaxed">{device.careInstructions}</p>
                            </div>

                            {/* Notes / Special precautions */}
                            {device.notes && (
                              <div className="flex items-start space-x-1 text-[10px] text-rose-700 bg-rose-50/80 p-1.5 rounded-lg border border-rose-100">
                                <ShieldAlert className="w-3 h-3 text-rose-500 mt-0.5 flex-shrink-0" />
                                <span>ข้อควรระวัง: {device.notes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Chronic diseases warning */}
                    {(student.chronicDiseases || []).length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-500">
                        <strong className="text-slate-700">โรคประจำตัว: </strong>
                        {(student.chronicDiseases || []).map(c => c.diseaseName).join(', ')}
                      </div>
                    )}

                    {/* Guardian & Homeroom Contact */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="truncate">
                        <span className="text-slate-400">ครูประจำชั้น: </span>
                        <span className="font-medium text-slate-700">{student.homeroomTeacher}</span>
                      </div>
                      <a
                        href={`tel:${student.guardianPhone}`}
                        className="flex items-center space-x-1 text-teal-700 font-bold hover:underline bg-teal-50 px-2 py-1 rounded-lg"
                      >
                        <Phone className="w-3 h-3 text-teal-600" />
                        <span>{student.guardianPhone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    {onShowQR && (
                      <button
                        onClick={() => onShowQR(student)}
                        title="เปิด QR ประวัติสุขภาพ"
                        className="p-2 rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200 transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-slate-700" />
                      </button>
                    )}
                    {onNewVisit && (
                      <button
                        onClick={() => onNewVisit(student.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 transition-colors"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                        <span>บันทึกการดูแล</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectStudent(student, 'devices')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-2xs"
                  >
                    <span>ดูรายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add/Edit Device Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-purple-50/60 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingDeviceId ? 'แก้ไขข้อมูลท่อ/อุปกรณ์' : 'เพิ่มท่อ/อุปกรณ์ทางการแพทย์ใหม่'}
                  </h3>
                  <p className="text-[11px] text-slate-500">จัดการข้อมูลท่อ สายให้อาหาร และรอบการดูแล</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="p-4 space-y-3.5 text-xs overflow-y-auto">
              {/* Student Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">นักเรียน</label>
                <select
                  value={targetStudentId}
                  disabled={!!editingDeviceId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.prefix}{s.firstName} {s.lastName} (ห้อง {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชนิดท่อ/อุปกรณ์ <span className="text-rose-500">*</span></label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {[
                    'NG Tube (สายให้อาหารทางจมูก)',
                    'Tracheostomy (ท่อเจาะคอ)',
                    'PEG (สายให้อาหารหน้าท้อง)',
                    'Foley Catheter (สายสวนปัสสาวะ)',
                    'VP Shunt (ระบายน้ำโพรงสมอง)',
                    'เครื่องช่วยฟัง (Hearing Aid)'
                  ].map(dev => (
                    <button
                      type="button"
                      key={dev}
                      onClick={() => setFormDeviceType(dev)}
                      className={`px-2 py-1 rounded-lg text-[10px] border transition-colors ${
                        formDeviceType === dev 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dev}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="ระบุชนิดท่อหรืออุปกรณ์..."
                  value={formDeviceType}
                  onChange={(e) => setFormDeviceType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Details / Size */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รายละเอียด / ขนาด / เบอร์ <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เบอร์ 14 Fr, สายซิลิโคน เบอร์ 4.0 มี cuff..."
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันที่ใส่สายล่าสุด</label>
                <input
                  type="date"
                  required
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
                {formStartDate && (
                  <p className="mt-1 text-[11px] text-purple-700 font-medium">
                    🗓️ {formatThaiDatePattern(formStartDate)}
                  </p>
                )}
              </div>

              {/* Replacement Schedule */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">กำหนดเปลี่ยน / รอบการเปลี่ยน</label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {['ทุก 2 สัปดาห์', 'ทุก 1 เดือน', 'ทุก 3 เดือน', 'ตามนัดแพทย์'].map(sched => (
                    <button
                      type="button"
                      key={sched}
                      onClick={() => setFormReplacementSchedule(sched)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] border transition-colors ${
                        formReplacementSchedule === sched 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sched}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="เช่น ทุก 1 เดือน หรือระบุวันที่แพทย์นัด..."
                  value={formReplacementSchedule}
                  onChange={(e) => setFormReplacementSchedule(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Care Instructions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วิธีดูแลรักษา / ทำความสะอาด</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ทำความสะอาดแผล stoma วันละ 2 ครั้ง, ดูดเสมหะเมื่อมีเสียงครืดคราด..."
                  value={formCareInstructions}
                  onChange={(e) => setFormCareInstructions(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ข้อควรระวังพิเศษ</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ห้ามดึงสายเด็ดขาด, หากสายหลุดให้รีบติดต่อพยาบาล/ผู้ปกครองทันที..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-2xs transition-colors"
                >
                  {editingDeviceId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลอุปกรณ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">ยืนยันการลบท่อ/อุปกรณ์</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ต้องการลบอุปกรณ์ <strong>"{deleteTarget.deviceType}"</strong> ของนักเรียน <strong>"{deleteTarget.studentName}"</strong> ออกจากระบบใช่หรือไม่?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-2xs transition-colors"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
