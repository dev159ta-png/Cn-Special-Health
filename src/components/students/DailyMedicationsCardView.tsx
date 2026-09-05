import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, DailyMedication } from '../../types';
import { 
  Pill, 
  Clock, 
  Search, 
  Filter, 
  ThermometerSnowflake, 
  ThermometerSun, 
  Phone, 
  Printer, 
  QrCode, 
  ChevronRight,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Copy,
  Users,
  AlertTriangle,
  LayoutGrid,
  Table,
  FileDown
} from 'lucide-react';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { exportTableAsPDF } from '../../utils/tablePdfExport';

interface DailyMedicationsCardViewProps {
  onSelectStudent: (student: Student, subTab?: string) => void;
  onNewVisit?: (studentId: string) => void;
  onShowQR?: (student: Student) => void;
}

export const DailyMedicationsCardView: React.FC<DailyMedicationsCardViewProps> = ({
  onSelectStudent,
  onNewVisit,
  onShowQR
}) => {
  const { students, systemConfig, currentUser, updateStudent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTiming, setFilterTiming] = useState<string>('all');
  const [filterStorage, setFilterStorage] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [selectedDuplicateFilter, setSelectedDuplicateFilter] = useState<string>('all'); // 'all', 'only-duplicates', or medName
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Admin CRUD Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [formMedicineName, setFormMedicineName] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formTiming, setFormTiming] = useState('มื้อกลางวัน (12:00 น.)');
  const [formStorage, setFormStorage] = useState<DailyMedication['storage']>('อุณหภูมิห้อง');
  const [formNotes, setFormNotes] = useState('');

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    studentId: string;
    studentName: string;
    medId: string;
    medicineName: string;
  } | null>(null);

  const canAdmin = currentUser.role === 'admin' || currentUser.role === 'nurse';

  // Compute duplicate medications across all students
  const medicationDuplicates = useMemo(() => {
    const map: Record<string, { label: string; count: number; studentIds: Set<string> }> = {};

    students.forEach(student => {
      (student.dailyMedications || []).forEach(m => {
        const clean = m.medicineName.trim();
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

  // List of only duplicate medications (>= 2 students taking same medication)
  const duplicateOnlyItems = useMemo(() => {
    return medicationDuplicates.filter(item => item.count >= 2);
  }, [medicationDuplicates]);

  // Filter students who take daily medications
  const studentsWithDailyMeds = useMemo(() => {
    return students.filter(s => (s.dailyMedications || []).length > 0);
  }, [students]);

  // Apply filters
  const filteredStudents = useMemo(() => {
    return studentsWithDailyMeds.filter(s => {
      if (filterClassroom !== 'all' && s.classroom !== filterClassroom) return false;

      const meds = s.dailyMedications || [];

      // Filter by timing
      if (filterTiming !== 'all') {
        const hasTiming = meds.some(m => m.timing.toLowerCase().includes(filterTiming.toLowerCase()));
        if (!hasTiming) return false;
      }

      // Filter by storage
      if (filterStorage !== 'all') {
        const hasStorage = meds.some(m => m.storage === filterStorage);
        if (!hasStorage) return false;
      }

      // Duplicate filter
      if (selectedDuplicateFilter === 'only-duplicates') {
        const hasAnyDuplicate = meds.some(m => 
          duplicateOnlyItems.some(item => item.norm === m.medicineName.trim().toLowerCase())
        );
        if (!hasAnyDuplicate) return false;
      } else if (selectedDuplicateFilter !== 'all') {
        const matchSpecific = meds.some(m => 
          m.medicineName.trim().toLowerCase() === selectedDuplicateFilter.toLowerCase()
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
        const matchMed = meds.some(m => 
          m.medicineName.toLowerCase().includes(q) ||
          m.dosage.toLowerCase().includes(q) ||
          m.timing.toLowerCase().includes(q) ||
          (m.notes || '').toLowerCase().includes(q)
        );

        return matchName || matchNick || matchCode || matchClass || matchMed;
      }

      return true;
    });
  }, [studentsWithDailyMeds, filterClassroom, filterTiming, filterStorage, selectedDuplicateFilter, searchQuery, duplicateOnlyItems]);

  // Statistics
  const totalStudents = studentsWithDailyMeds.length;
  const totalMedsCount = studentsWithDailyMeds.reduce((sum, s) => sum + (s.dailyMedications || []).length, 0);
  const lunchMedsCount = studentsWithDailyMeds.reduce((sum, s) => {
    return sum + (s.dailyMedications || []).filter(m => m.timing.includes('กลางวัน') || m.timing.includes('12:')).length;
  }, 0);
  const fridgeMedsCount = studentsWithDailyMeds.reduce((sum, s) => {
    return sum + (s.dailyMedications || []).filter(m => m.storage.includes('ตู้เย็น')).length;
  }, 0);
  const duplicateMedsStudentsCount = useMemo(() => {
    return studentsWithDailyMeds.filter(s => 
      (s.dailyMedications || []).some(m => duplicateOnlyItems.some(d => d.norm === m.medicineName.trim().toLowerCase()))
    ).length;
  }, [studentsWithDailyMeds, duplicateOnlyItems]);

  // Modal open handlers
  const handleOpenAddModal = (studentId?: string) => {
    setTargetStudentId(studentId || (students[0]?.id || ''));
    setEditingMedId(null);
    setFormMedicineName('');
    setFormDosage('');
    setFormTiming('มื้อกลางวัน (12:00 น.)');
    setFormStorage('อุณหภูมิห้อง');
    setFormNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (student: Student, med: DailyMedication) => {
    setTargetStudentId(student.id);
    setEditingMedId(med.id);
    setFormMedicineName(med.medicineName);
    setFormDosage(med.dosage);
    setFormTiming(med.timing);
    setFormStorage(med.storage);
    setFormNotes(med.notes || '');
    setModalOpen(true);
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !formMedicineName.trim() || !formDosage.trim()) return;

    const student = students.find(s => s.id === targetStudentId);
    if (!student) return;

    const currentMeds = [...(student.dailyMedications || [])];

    if (editingMedId) {
      // Edit existing
      const updatedMeds = currentMeds.map(m => {
        if (m.id === editingMedId) {
          return {
            ...m,
            medicineName: formMedicineName.trim(),
            dosage: formDosage.trim(),
            timing: formTiming.trim(),
            storage: formStorage,
            notes: formNotes.trim() || undefined
          };
        }
        return m;
      });
      updateStudent(student.id, { dailyMedications: updatedMeds });
    } else {
      // Add new
      const newMed: DailyMedication = {
        id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        medicineName: formMedicineName.trim(),
        dosage: formDosage.trim(),
        timing: formTiming.trim(),
        storage: formStorage,
        notes: formNotes.trim() || undefined
      };
      updateStudent(student.id, { dailyMedications: [...currentMeds, newMed] });
    }

    setModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const student = students.find(s => s.id === deleteTarget.studentId);
    if (!student) return;

    const updatedMeds = (student.dailyMedications || []).filter(m => m.id !== deleteTarget.medId);
    updateStudent(student.id, { dailyMedications: updatedMeds });
    setDeleteTarget(null);
  };

  // Download PDF Report
  const handleDownloadPdf = () => {
    exportTableAsPDF({
      title: 'รายงานรายชื่อนักเรียนที่ต้องรับประทานยาประจำตัว',
      subtitle: `ตัวกรองมื้อยา: ${filterTiming === 'all' ? 'ทุกมื้อ' : filterTiming} | การจัดเก็บ: ${filterStorage === 'all' ? 'ทุกรูปแบบ' : filterStorage} | ชั้นเรียน: ${filterClassroom === 'all' ? 'ทุกห้องเรียน' : filterClassroom}`,
      schoolName: systemConfig?.schoolName || 'ศูนย์การศึกษาพิเศษ ประจำจังหวัดชัยนาท',
      columns: [
        { header: 'ลำดับ', key: 'index', width: '45px', align: 'center' },
        { header: 'รหัส', key: 'studentCode', width: '70px', align: 'center' },
        { header: 'ชื่อ-นามสกุล (ชื่อเล่น)', key: 'fullName', width: '160px', align: 'left' },
        { header: 'ห้องเรียน', key: 'classroom', width: '60px', align: 'center' },
        { header: 'รายการยาประจำตัว', key: 'medicineName', width: '160px', align: 'left' },
        { header: 'ขนาด / วิธีรับประทาน', key: 'dosage', width: '140px', align: 'left' },
        { header: 'เวลาที่รับประทาน', key: 'timing', width: '130px', align: 'left' },
        { header: 'การจัดเก็บ', key: 'storage', width: '95px', align: 'center' },
        { header: 'ผู้ปกครอง & เบอร์โทร', key: 'guardian', width: '135px', align: 'left' }
      ],
      rows: filteredStudents.map((s, idx) => ({
        index: idx + 1,
        studentCode: s.studentCode,
        fullName: `${s.prefix}${s.firstName} ${s.lastName} (${s.nickname})`,
        classroom: s.classroom,
        medicineName: (s.dailyMedications || []).map(m => `• ${m.medicineName}`).join('\n') || '-',
        dosage: (s.dailyMedications || []).map(m => `• ${m.dosage}`).join('\n') || '-',
        timing: (s.dailyMedications || []).map(m => `• ${m.timing}`).join('\n') || '-',
        storage: (s.dailyMedications || []).map(m => m.storage).join(', ') || '-',
        guardian: `${s.guardianName || '-'}\nโทร: ${s.guardianPhone || s.emergencyPhone || '-'}`
      })),
      summaryStats: [
        { label: 'จำนวนนักเรียนที่รับประทานยา', value: `${filteredStudents.length} คน` },
        { label: 'จำนวนรายการยาทั้งหมด', value: `${totalMedsCount} รายการ` },
        { label: 'มื้อกลางวัน (ที่โรงเรียน)', value: `${lunchMedsCount} รายการ` },
        { label: 'ยาที่ต้องแช่เย็น', value: `${fridgeMedsCount} รายการ` }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              รายชื่อนักเรียนที่ต้องรับประทานยาประจำตัว
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามตารางจ่ายยา ขนาดยา การจัดเก็บ ปรับมุมมองการ์ดหรือตาราง และดาวน์โหลดเป็น PDF ได้
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
                viewMode === 'card' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>แบบการ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
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
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs"
            title="ดาวน์โหลดข้อมูลเป็นเอกสาร PDF แบบตาราง"
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>ดาวน์โหลด PDF (ตาราง)</span>
          </button>

          {canAdmin && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มยาประจำตัวใหม่</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์ตารางจ่ายยา</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => { setFilterTiming('all'); setFilterStorage('all'); setSelectedDuplicateFilter('all'); }}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterTiming === 'all' && filterStorage === 'all' && selectedDuplicateFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">นักเรียนที่กินยาประจำตัว</div>
          <div className="text-2xl font-bold mt-1">
            {totalStudents} <span className="text-xs font-normal opacity-80">คน</span>
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">รวมทั้งหมด {totalMedsCount} ขนานยา</div>
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
            <span>👥 กินยาขนานเดียวกัน</span>
            <Copy className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1">
            {duplicateMedsStudentsCount} <span className="text-xs font-normal opacity-80">คน</span>
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">{duplicateOnlyItems.length} ตัวยาที่ซ้ำกัน</div>
        </div>

        <div 
          onClick={() => setFilterTiming(filterTiming === 'กลางวัน' ? 'all' : 'กลางวัน')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterTiming === 'กลางวัน'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-blue-700 border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>⏰ มื้อกลางวันที่โรงเรียน</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1">
            {lunchMedsCount} <span className="text-xs font-normal opacity-80">รายการ</span>
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">12:00 - 13:00 น.</div>
        </div>

        <div 
          onClick={() => setFilterStorage(filterStorage.includes('ตู้เย็น') ? 'all' : 'ตู้เย็น (2-8°C)')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterStorage.includes('ตู้เย็น')
              ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
              : 'bg-white text-cyan-800 border-cyan-200 hover:border-cyan-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>❄️ เก็บในตู้เย็น</span>
            <ThermometerSnowflake className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1">
            {fridgeMedsCount} <span className="text-xs font-normal opacity-80">รายการ</span>
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">อุณหภูมิ 2 - 8°C</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อนักเรียน, ชื่อยา, ขนาดยา, เวลา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Duplicate Medication Filter Dropdown */}
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
              <option value="all">ตัวกรองยาทั้งหมด</option>
              {duplicateOnlyItems.length > 0 && (
                <option value="only-duplicates">
                  ⚡ เฉพาะยาที่ซ้ำกัน ({duplicateOnlyItems.length} ตัวยา)
                </option>
              )}
              <optgroup label="-- ยาที่มีนักเรียนกินซ้ำกัน --">
                {duplicateOnlyItems.map(item => (
                  <option key={item.norm} value={item.label}>
                    💊 {item.label} (ซ้ำ {item.count} คน)
                  </option>
                ))}
              </optgroup>
              {medicationDuplicates.filter(i => i.count === 1).length > 0 && (
                <optgroup label="-- ยาเฉพาะบุคคล --">
                  {medicationDuplicates.filter(i => i.count === 1).map(item => (
                    <option key={item.norm} value={item.label}>
                      💊 {item.label} (1 คน)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Classroom */}
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-blue-500"
          >
            <option value="all">ทุกห้องเรียน</option>
            {(systemConfig.classrooms || []).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Timing Filter */}
          <select
            value={filterTiming}
            onChange={(e) => setFilterTiming(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-blue-500"
          >
            <option value="all">ทุกช่วงเวลา</option>
            <option value="เช้า">ช่วงเช้า</option>
            <option value="กลางวัน">มื้อกลางวัน (12:00-13:00)</option>
            <option value="เย็น">ช่วงเย็น</option>
            <option value="ก่อนนอน">ก่อนนอน</option>
          </select>

          {/* Storage Filter */}
          <select
            value={filterStorage}
            onChange={(e) => setFilterStorage(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-blue-500"
          >
            <option value="all">การจัดเก็บทั้งหมด</option>
            <option value="อุณหภูมิห้อง">🌡️ อุณหภูมิห้อง</option>
            <option value="ตู้เย็น (2-8°C)">❄️ ตู้เย็น (2-8°C)</option>
          </select>
        </div>
      </div>

      {/* Student Medication Cards / Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Pill className="w-6 h-6" />
          </div>
          <p className="font-medium text-slate-700 text-sm">ไม่พบข้อมูลนักเรียนที่กินยาประจำตัวตามเงื่อนไขที่เลือก</p>
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
                  <th className="py-3.5 px-4 min-w-[240px]">รายการยาและขนาดยา</th>
                  <th className="py-3.5 px-3 w-40">เวลาที่รับประทาน</th>
                  <th className="py-3.5 px-3 text-center w-32">การจัดเก็บ</th>
                  <th className="py-3.5 px-3 w-44">ผู้ปกครอง / เบอร์โทร</th>
                  <th className="py-3.5 px-3 text-center w-36">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const meds = student.dailyMedications || [];

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={student.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                            alt={student.firstName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-xs truncate">
                              {student.prefix}{student.firstName} {student.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                              <span className="font-mono text-blue-700 bg-blue-50 px-1 rounded">{student.studentCode}</span>
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
                          {meds.map(med => (
                            <div key={med.id} className="p-1.5 rounded-lg bg-blue-50/70 border border-blue-200/60 text-[11px]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-blue-900 truncate">
                                  💊 {med.medicineName}
                                </span>
                                <span className="text-slate-600 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                                  {med.dosage}
                                </span>
                              </div>
                              {med.notes && (
                                <div className="text-amber-800 text-[10px] mt-0.5 font-medium">
                                  ⚠️ {med.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {meds.map(med => (
                            <div key={med.id} className="text-[11px] font-medium text-slate-700 flex items-center space-x-1">
                              <span>⏰</span>
                              <span>{med.timing}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="space-y-1">
                          {meds.map(med => {
                            const isFridge = med.storage.includes('ตู้เย็น');
                            return (
                              <div key={med.id}>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isFridge ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isFridge ? '❄️ ตู้เย็น 2-8°C' : '🌡️ อุณหภูมิห้อง'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 text-xs">
                          {student.guardianName || '-'}
                        </div>
                        <div className="text-[11px] text-blue-700 font-mono mt-0.5">
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
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                              title="บันทึกการกินยา"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student, 'medications')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors"
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
            const meds = student.dailyMedications || [];

            return (
              <div 
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-200 flex flex-col justify-between hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 flex items-start space-x-3">
                    <img
                      src={student.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                      alt={student.firstName}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          {student.studentCode}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                            ห้อง {student.classroom}
                          </span>
                          {canAdmin && (
                            <button
                              onClick={() => handleOpenAddModal(student.id)}
                              title="เพิ่มยาให้นักเรียนคนนี้"
                              className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
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
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          ชื่อเล่น: {student.nickname}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          หมู่เลือด {student.bloodType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medications List */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                        <Pill className="w-3.5 h-3.5 text-blue-600" />
                        <span>ยาประจำตัว ({meds.length} รายการ)</span>
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {meds.map((med) => {
                        const isFridge = med.storage.includes('ตู้เย็น');
                        const isLunch = med.timing.includes('กลางวัน') || med.timing.includes('12:');
                        const dupInfo = duplicateOnlyItems.find(d => d.norm === med.medicineName.trim().toLowerCase());

                        return (
                          <div
                            key={med.id}
                            className={`p-3 rounded-xl border text-xs relative group ${
                              isLunch 
                                ? 'bg-blue-50/70 border-blue-200' 
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-slate-900 text-xs">
                                    💊 {med.medicineName}
                                  </h4>
                                  {dupInfo && (
                                    <span 
                                      className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                                      onClick={() => setSelectedDuplicateFilter(dupInfo.label)}
                                      title={`มีเพื่อนกินยานี้เหมือนกันอีก ${dupInfo.count - 1} คน คลิกเพื่อกรอง`}
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                      <span>ซ้ำ {dupInfo.count} คน</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-600 mt-0.5">
                                  <strong className="text-slate-700">ขนาดยา: </strong>
                                  <span className="font-bold text-blue-800">{med.dosage}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center space-x-1 ${
                                  isFridge 
                                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' 
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {isFridge ? (
                                    <>
                                      <ThermometerSnowflake className="w-3 h-3 text-cyan-700" />
                                      <span>แช่ตู้เย็น</span>
                                    </>
                                  ) : (
                                    <>
                                      <ThermometerSun className="w-3 h-3 text-amber-700" />
                                      <span>อุณหภูมิห้อง</span>
                                    </>
                                  )}
                                </span>

                                {/* Admin Action Icons */}
                                {canAdmin && (
                                  <div className="flex items-center space-x-0.5 pl-1">
                                    <button
                                      onClick={() => handleOpenEditModal(student, med)}
                                      title="แก้ไขข้อมูลยานี้"
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({
                                        studentId: student.id,
                                        studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
                                        medId: med.id,
                                        medicineName: med.medicineName
                                      })}
                                      title="ลบรายการยานี้"
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Timing */}
                            <div className="mt-2 flex items-center space-x-1.5 text-blue-800 font-semibold text-[11px] bg-white/80 p-1.5 rounded-lg border border-blue-100">
                              <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span>{med.timing}</span>
                            </div>

                            {/* Notes */}
                            {med.notes && (
                              <p className="mt-1.5 text-[11px] text-slate-500 italic bg-white/60 p-1 rounded">
                                หมายเหตุ: {med.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Chronic diseases link */}
                    {(student.chronicDiseases || []).length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-500">
                        <strong className="text-slate-700">โรคประจำตัว: </strong>
                        {(student.chronicDiseases || []).map(c => c.diseaseName).join(', ')}
                      </div>
                    )}

                    {/* Guardian & Homeroom contact */}
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
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 transition-colors"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
                        <span>บันทึกการกินยา</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectStudent(student, 'medications')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
                  >
                    <span>ดูประวัติยา</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add / Edit Medication Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-blue-50/60">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingMedId ? 'แก้ไขข้อมูลยาประจำตัว' : 'เพิ่มยาประจำตัวใหม่'}
                  </h3>
                  <p className="text-[11px] text-slate-500">จัดการข้อมูลยา ขนาดยา และเวลาจ่ายยา</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedication} className="p-4 space-y-3.5 text-xs">
              {/* Student Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">นักเรียน</label>
                <select
                  value={targetStudentId}
                  disabled={!!editingMedId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.prefix}{s.firstName} {s.lastName} (ห้อง {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Medicine Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อยาประจำตัว <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Sodium Valproate, Salbutamol Inhaler, Concerta..."
                  value={formMedicineName}
                  onChange={(e) => setFormMedicineName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ขนาดยา / วิธีรับประทาน <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 200 mg 1 เม็ด, พ่น 2 กด, 5 ml..."
                  value={formDosage}
                  onChange={(e) => setFormDosage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Timing */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ช่วงเวลาที่ต้องรับประทาน</label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {['มื้อกลางวัน (12:00 น.)', 'ช่วงเช้า (08:30 น.)', 'ช่วงเย็น (16:00 น.)', 'ก่อนนอน (20:00 น.)', 'เมื่อมีอาการชัก/หอบ'].map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setFormTiming(t)}
                      className={`px-2 py-1 rounded-lg text-[10px] border transition-colors ${
                        formTiming === t 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="ระบุเวลาเพิ่มเติม..."
                  value={formTiming}
                  onChange={(e) => setFormTiming(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Storage */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">การจัดเก็บยา</label>
                <select
                  value={formStorage}
                  onChange={(e) => setFormStorage(e.target.value as DailyMedication['storage'])}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="อุณหภูมิห้อง">🌡️ อุณหภูมิห้อง</option>
                  <option value="ตู้เย็น (2-8°C)">❄️ ตู้เย็น (2-8°C)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ / ข้อควรระวังพิเศษ</label>
                <textarea
                  rows={2}
                  placeholder="เช่น ต้องกินหลังอาหารทันที, เก็บให้พ้นแสง, ครูห้องเรียนเป็นผู้ดูแล..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs transition-colors"
                >
                  {editingMedId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลยา'}
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
                <h3 className="font-bold text-slate-900 text-sm">ยืนยันการลบยาประจำตัว</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ต้องการลบยา <strong>"{deleteTarget.medicineName}"</strong> ของนักเรียน <strong>"{deleteTarget.studentName}"</strong> ออกจากระบบใช่หรือไม่?
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
