import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, ChronicDisease } from '../../types';
import { 
  Heart, 
  Search, 
  Filter, 
  ShieldAlert, 
  Phone, 
  QrCode, 
  Printer, 
  ChevronRight, 
  HeartHandshake,
  Ambulance,
  Zap,
  Wind,
  AlertTriangle,
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

interface ChronicDiseasesCardViewProps {
  onSelectStudent: (student: Student, subTab?: string) => void;
  onNewVisit?: (studentId: string) => void;
  onNewVisitWithReferral?: (studentId: string) => void;
  onShowQR?: (student: Student) => void;
}

export const ChronicDiseasesCardView: React.FC<ChronicDiseasesCardViewProps> = ({
  onSelectStudent,
  onNewVisit,
  onNewVisitWithReferral,
  onShowQR
}) => {
  const { students, systemConfig, currentUser, updateStudent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [selectedDuplicateFilter, setSelectedDuplicateFilter] = useState<string>('all'); // 'all', 'only-duplicates', or diseaseName
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Admin CRUD Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [editingDiseaseId, setEditingDiseaseId] = useState<string | null>(null);
  const [formDiseaseName, setFormDiseaseName] = useState('โรคลมชัก (Epilepsy)');
  const [formSymptoms, setFormSymptoms] = useState('');
  const [formEmergencyCare, setFormEmergencyCare] = useState('');
  const [formDoctorNotes, setFormDoctorNotes] = useState('');

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    studentId: string;
    studentName: string;
    diseaseId: string;
    diseaseName: string;
  } | null>(null);

  const canAdmin = currentUser.role === 'admin' || currentUser.role === 'nurse';

  // Compute duplicate chronic diseases across all students
  const diseaseDuplicates = useMemo(() => {
    const map: Record<string, { label: string; count: number; studentIds: Set<string> }> = {};

    students.forEach(student => {
      (student.chronicDiseases || []).forEach(d => {
        const clean = d.diseaseName.trim();
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

  // Diseases affecting >= 2 students
  const duplicateOnlyItems = useMemo(() => {
    return diseaseDuplicates.filter(item => item.count >= 2);
  }, [diseaseDuplicates]);

  // Filter students who have chronic diseases
  const studentsWithDiseases = useMemo(() => {
    return students.filter(s => (s.chronicDiseases || []).length > 0);
  }, [students]);

  // Apply filters
  const filteredStudents = useMemo(() => {
    return studentsWithDiseases.filter(s => {
      if (filterClassroom !== 'all' && s.classroom !== filterClassroom) return false;

      const diseases = s.chronicDiseases || [];

      // Category quick filter
      if (filterCategory === 'epilepsy') {
        const hasEpilepsy = diseases.some(d => 
          d.diseaseName.toLowerCase().includes('epilepsy') || 
          d.diseaseName.includes('ชัก')
        );
        if (!hasEpilepsy) return false;
      } else if (filterCategory === 'asthma') {
        const hasAsthma = diseases.some(d => 
          d.diseaseName.toLowerCase().includes('asthma') || 
          d.diseaseName.includes('หอบหืด')
        );
        if (!hasAsthma) return false;
      } else if (filterCategory === 'emergency') {
        const hasPlan = diseases.some(d => !!d.emergencyCare);
        if (!hasPlan) return false;
      }

      // Duplicate filter
      if (selectedDuplicateFilter === 'only-duplicates') {
        const hasAnyDuplicate = diseases.some(d => 
          duplicateOnlyItems.some(item => item.norm === d.diseaseName.trim().toLowerCase())
        );
        if (!hasAnyDuplicate) return false;
      } else if (selectedDuplicateFilter !== 'all') {
        const matchSpecific = diseases.some(d => 
          d.diseaseName.trim().toLowerCase() === selectedDuplicateFilter.toLowerCase()
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
        const matchDis = diseases.some(d => 
          d.diseaseName.toLowerCase().includes(q) ||
          d.symptoms.toLowerCase().includes(q) ||
          (d.emergencyCare || '').toLowerCase().includes(q) ||
          (d.doctorNotes || '').toLowerCase().includes(q)
        );

        return matchName || matchNick || matchCode || matchClass || matchDis;
      }

      return true;
    });
  }, [studentsWithDiseases, filterClassroom, filterCategory, selectedDuplicateFilter, searchQuery, duplicateOnlyItems]);

  // Statistics
  const totalStudents = studentsWithDiseases.length;
  const totalDiseasesCount = studentsWithDiseases.reduce((sum, s) => sum + (s.chronicDiseases || []).length, 0);

  const epilepsyCount = studentsWithDiseases.filter(s => 
    (s.chronicDiseases || []).some(d => d.diseaseName.includes('ชัก') || d.diseaseName.toLowerCase().includes('epilepsy'))
  ).length;

  const asthmaCount = studentsWithDiseases.filter(s => 
    (s.chronicDiseases || []).some(d => d.diseaseName.includes('หอบหืด') || d.diseaseName.toLowerCase().includes('asthma'))
  ).length;

  const emergencyPlanCount = studentsWithDiseases.filter(s => 
    (s.chronicDiseases || []).some(d => !!d.emergencyCare)
  ).length;

  const duplicateDiseasesStudentsCount = useMemo(() => {
    return studentsWithDiseases.filter(s => 
      (s.chronicDiseases || []).some(d => duplicateOnlyItems.some(item => item.norm === d.diseaseName.trim().toLowerCase()))
    ).length;
  }, [studentsWithDiseases, duplicateOnlyItems]);

  // Open Add Modal
  const handleOpenAddModal = (studentId?: string) => {
    setTargetStudentId(studentId || (students[0]?.id || ''));
    setEditingDiseaseId(null);
    setFormDiseaseName('โรคลมชัก (Epilepsy)');
    setFormSymptoms('');
    setFormEmergencyCare('');
    setFormDoctorNotes('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (student: Student, disease: ChronicDisease) => {
    setTargetStudentId(student.id);
    setEditingDiseaseId(disease.id);
    setFormDiseaseName(disease.diseaseName);
    setFormSymptoms(disease.symptoms);
    setFormEmergencyCare(disease.emergencyCare || '');
    setFormDoctorNotes(disease.doctorNotes || '');
    setModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveDisease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !formDiseaseName.trim() || !formSymptoms.trim()) return;

    const student = students.find(s => s.id === targetStudentId);
    if (!student) return;

    const currentDiseases = [...(student.chronicDiseases || [])];

    if (editingDiseaseId) {
      const updated = currentDiseases.map(d => {
        if (d.id === editingDiseaseId) {
          return {
            ...d,
            diseaseName: formDiseaseName.trim(),
            symptoms: formSymptoms.trim(),
            emergencyCare: formEmergencyCare.trim() || undefined,
            doctorNotes: formDoctorNotes.trim() || undefined
          };
        }
        return d;
      });
      updateStudent(student.id, { chronicDiseases: updated });
    } else {
      const newDis: ChronicDisease = {
        id: `disease-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        diseaseName: formDiseaseName.trim(),
        symptoms: formSymptoms.trim(),
        emergencyCare: formEmergencyCare.trim() || undefined,
        doctorNotes: formDoctorNotes.trim() || undefined
      };
      updateStudent(student.id, { chronicDiseases: [...currentDiseases, newDis] });
    }

    setModalOpen(false);
  };

  // Delete Disease
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const student = students.find(s => s.id === deleteTarget.studentId);
    if (!student) return;

    const updated = (student.chronicDiseases || []).filter(d => d.id !== deleteTarget.diseaseId);
    updateStudent(student.id, { chronicDiseases: updated });
    setDeleteTarget(null);
  };

  // Download PDF Report
  const handleDownloadPdf = () => {
    exportTableAsPDF({
      title: 'รายงานรายชื่อนักเรียนที่มีโรคประจำตัว',
      subtitle: `ประเภทโรค: ${filterCategory === 'all' ? 'ทุกกลุ่มโรค' : filterCategory} | ชั้นเรียน: ${filterClassroom === 'all' ? 'ทุกห้องเรียน' : filterClassroom}`,
      schoolName: systemConfig?.schoolName || 'ศูนย์การศึกษาพิเศษ ประจำจังหวัดชัยนาท',
      columns: [
        { header: 'ลำดับ', key: 'index', width: '45px', align: 'center' },
        { header: 'รหัส', key: 'studentCode', width: '70px', align: 'center' },
        { header: 'ชื่อ-นามสกุล (ชื่อเล่น)', key: 'fullName', width: '160px', align: 'left' },
        { header: 'ห้องเรียน', key: 'classroom', width: '60px', align: 'center' },
        { header: 'โรคประจำตัว', key: 'diseases', width: '170px', align: 'left' },
        { header: 'อาการ / ปัจจัยกระตุ้น', key: 'symptoms', width: '170px', align: 'left' },
        { header: 'แผนช่วยเหลือฉุกเฉิน', key: 'emergencyCare', width: '180px', align: 'left' },
        { header: 'ผู้ปกครอง & เบอร์โทร', key: 'guardian', width: '135px', align: 'left' }
      ],
      rows: filteredStudents.map((s, idx) => ({
        index: idx + 1,
        studentCode: s.studentCode,
        fullName: `${s.prefix}${s.firstName} ${s.lastName} (${s.nickname})`,
        classroom: s.classroom,
        diseases: (s.chronicDiseases || []).map(d => `• ${d.diseaseName}`).join('\n') || '-',
        symptoms: (s.chronicDiseases || []).map(d => `• ${d.symptoms || '-'}`).join('\n') || '-',
        emergencyCare: (s.chronicDiseases || []).map(d => `• ${d.emergencyCare || '-'}`).join('\n') || '-',
        guardian: `${s.guardianName || '-'}\nโทร: ${s.guardianPhone || s.emergencyPhone || '-'}`
      })),
      summaryStats: [
        { label: 'จำนวนนักเรียน', value: `${filteredStudents.length} คน` },
        { label: 'จำนวนโรคประจำตัว', value: `${totalDiseasesCount} รายการ` },
        { label: 'โรคลมชัก/ชักเกร็ง', value: `${epilepsyCount} คน` },
        { label: 'โรคหอบหืด/ทางเดินหายใจ', value: `${asthmaCount} คน` }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              รายชื่อนักเรียนที่มีโรคประจำตัว
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              เฝ้าระวังอาการกำเริบ แผนปฐมพยาบาลฉุกเฉิน ปรับมุมมองการ์ดหรือตาราง และดาวน์โหลดเป็น PDF ได้
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
                viewMode === 'card' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>แบบการ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
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
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs"
            title="ดาวน์โหลดข้อมูลเป็นเอกสาร PDF แบบตาราง"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            <span>ดาวน์โหลด PDF (ตาราง)</span>
          </button>

          {canAdmin && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มโรคประจำตัวใหม่</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์รายชื่อเฝ้าระวัง</span>
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
          <div className="text-[11px] font-medium opacity-80">นักเรียนที่มีโรคประจำตัว</div>
          <div className="text-2xl font-bold mt-1">
            {totalStudents} <span className="text-xs font-normal opacity-80">คน</span>
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">รวมทั้งหมด {totalDiseasesCount} โรค</div>
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
            <span>👥 เป็นโรคเดียวกัน</span>
            <Copy className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1">
            {duplicateDiseasesStudentsCount} <span className="text-xs font-normal opacity-80">คน</span>
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">{duplicateOnlyItems.length} โรคที่ซ้ำกัน</div>
        </div>

        <div 
          onClick={() => setFilterCategory(filterCategory === 'epilepsy' ? 'all' : 'epilepsy')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterCategory === 'epilepsy'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>⚡ โรคลมชัก (Epilepsy)</span>
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {epilepsyCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5 font-medium">เฝ้าระวังอาการชัก</div>
        </div>

        <div 
          onClick={() => setFilterCategory(filterCategory === 'asthma' ? 'all' : 'asthma')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterCategory === 'asthma'
              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
              : 'bg-white text-teal-700 border-teal-200 hover:border-teal-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>🫁 หอบหืด (Asthma)</span>
            <Wind className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {asthmaCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-teal-700 mt-0.5 font-medium">เตรียมยาพ่นขยายหลอดลม</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อนักเรียน, โรค, อาการ, วิธีปฐมพยาบาล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Duplicate Disease Filter Dropdown */}
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
              <option value="all">ตัวกรองโรคทั้งหมด</option>
              {duplicateOnlyItems.length > 0 && (
                <option value="only-duplicates">
                  ⚡ เฉพาะโรคที่ซ้ำกัน ({duplicateOnlyItems.length} โรค)
                </option>
              )}
              <optgroup label="-- โรคที่มีนักเรียนเป็นซ้ำกัน --">
                {duplicateOnlyItems.map(item => (
                  <option key={item.norm} value={item.label}>
                    ❤️ {item.label} (ซ้ำ {item.count} คน)
                  </option>
                ))}
              </optgroup>
              {diseaseDuplicates.filter(i => i.count === 1).length > 0 && (
                <optgroup label="-- โรคเฉพาะบุคคล --">
                  {diseaseDuplicates.filter(i => i.count === 1).map(item => (
                    <option key={item.norm} value={item.label}>
                      ❤️ {item.label} (1 คน)
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
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-rose-500"
          >
            <option value="all">ทุกห้องเรียน</option>
            {(systemConfig.classrooms || []).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-rose-500"
          >
            <option value="all">ทุกโรคประจำตัว</option>
            <option value="epilepsy">⚡ โรคลมชัก (Epilepsy)</option>
            <option value="asthma">🫁 หอบหืด (Asthma)</option>
            <option value="emergency">🛡️ มีแผนปฐมพยาบาลฉุกเฉิน</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid / Table View */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Heart className="w-6 h-6" />
          </div>
          <p className="font-medium text-slate-700 text-sm">ไม่พบข้อมูลนักเรียนที่มีโรคประจำตัวตามเงื่อนไขที่ค้นหา</p>
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
                  <th className="py-3.5 px-3 text-center w-24">ห้อง / เลือด</th>
                  <th className="py-3.5 px-4 min-w-[200px]">โรคประจำตัว</th>
                  <th className="py-3.5 px-4 min-w-[220px]">อาการ / ปัจจัยกระตุ้น</th>
                  <th className="py-3.5 px-4 min-w-[220px]">แผนช่วยเหลือฉุกเฉิน</th>
                  <th className="py-3.5 px-3 w-44">ผู้ปกครอง / เบอร์โทร</th>
                  <th className="py-3.5 px-3 text-center w-40">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const diseases = student.chronicDiseases || [];
                  const hasSevere = diseases.some(d => 
                    d.diseaseName.includes('ชัก') || 
                    d.diseaseName.includes('หอบหืด') ||
                    d.diseaseName.toLowerCase().includes('epilepsy')
                  );

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasSevere ? 'bg-rose-50/15' : ''
                      }`}
                    >
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
                              <span className="font-mono text-rose-700 bg-rose-50 px-1 rounded">{student.studentCode}</span>
                              <span>ชื่อเล่น: <strong className="text-slate-700">{student.nickname}</strong></span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-slate-800 text-xs">
                          {student.classroom}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {student.bloodType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {diseases.map(d => {
                            const isEp = d.diseaseName.includes('ชัก') || d.diseaseName.toLowerCase().includes('epilepsy');
                            const isAs = d.diseaseName.includes('หอบหืด') || d.diseaseName.toLowerCase().includes('asthma');
                            return (
                              <div key={d.id} className="p-1.5 rounded-lg bg-rose-50/70 border border-rose-200/60 text-[11px]">
                                <span className="font-bold text-rose-900">
                                  {isEp ? '⚡ ' : isAs ? '🫁 ' : '❤️ '}
                                  {d.diseaseName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {diseases.map(d => (
                            <div key={d.id} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                              {d.symptoms || '-'}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          {diseases.map(d => (
                            <div key={d.id} className="text-[11px]">
                              {d.emergencyCare ? (
                                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                                  🛡️ {d.emergencyCare}
                                </div>
                              ) : (
                                <span className="text-slate-400">- ไม่ได้ระบุ -</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 text-xs">
                          {student.guardianName || '-'}
                        </div>
                        <div className="text-[11px] text-rose-700 font-mono mt-0.5">
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
                              title="แสดง QR Code ฉุกเฉิน"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                          {onNewVisit && (
                            <button
                              type="button"
                              onClick={() => onNewVisit(student.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                              title="บันทึกการปฐมพยาบาล"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </button>
                          )}
                          {onNewVisitWithReferral && (
                            <button
                              type="button"
                              onClick={() => onNewVisitWithReferral(student.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                              title="ส่งต่อโรงพยาบาล"
                            >
                              <Ambulance className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student, 'diseases')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors"
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
            const diseases = student.chronicDiseases || [];

            return (
              <div 
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-rose-300 transition-all duration-200 flex flex-col justify-between hover:shadow-md"
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-100">
                            ห้อง {student.classroom}
                          </span>
                          {canAdmin && (
                            <button
                              onClick={() => handleOpenAddModal(student.id)}
                              title="เพิ่มโรคประจำตัวให้นักเรียนคนนี้"
                              className="p-1 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
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
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                          ชื่อเล่น: {student.nickname}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          อายุ {student.age} ปี
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diseases List */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        <span>โรคประจำตัว ({diseases.length} โรค)</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      {diseases.map((disease) => {
                        const isSeizure = disease.diseaseName.includes('ชัก') || disease.diseaseName.toLowerCase().includes('epilepsy');
                        const isAsthma = disease.diseaseName.includes('หอบหืด') || disease.diseaseName.toLowerCase().includes('asthma');
                        const dupInfo = duplicateOnlyItems.find(d => d.norm === disease.diseaseName.trim().toLowerCase());

                        return (
                          <div
                            key={disease.id}
                            className={`p-3 rounded-xl border text-xs space-y-2 relative ${
                              isSeizure 
                                ? 'bg-amber-50/70 border-amber-200' 
                                : isAsthma
                                ? 'bg-teal-50/70 border-teal-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                                    <span>{isSeizure ? '⚡' : isAsthma ? '🫁' : '🫀'}</span>
                                    <span className="text-slate-900">{disease.diseaseName}</span>
                                  </h4>
                                  {dupInfo && (
                                    <span 
                                      className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                                      onClick={() => setSelectedDuplicateFilter(dupInfo.label)}
                                      title={`มีเพื่อนเป็นโรคนี้เหมือนกันอีก ${dupInfo.count - 1} คน คลิกเพื่อกรอง`}
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                      <span>ซ้ำ {dupInfo.count} คน</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                {canAdmin && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditModal(student, disease)}
                                      title="แก้ไขข้อมูลโรคนี้"
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({
                                        studentId: student.id,
                                        studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
                                        diseaseId: disease.id,
                                        diseaseName: disease.diseaseName
                                      })}
                                      title="ลบโรคนี้"
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Symptoms */}
                            <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100">
                              <strong className="text-slate-700">อาการที่พบ/เฝ้าระวัง: </strong>
                              <span className="text-slate-800">{disease.symptoms}</span>
                            </div>

                            {/* Emergency Care Protocol */}
                            {disease.emergencyCare && (
                              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-[11px]">
                                <div className="font-bold text-rose-900 flex items-center space-x-1 mb-0.5">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  <span>วิธีปฐมพยาบาลฉุกเฉินเมื่อกำเริบ:</span>
                                </div>
                                <p className="leading-relaxed font-medium">{disease.emergencyCare}</p>
                              </div>
                            )}

                            {/* Doctor Notes */}
                            {disease.doctorNotes && (
                              <p className="text-[10px] text-slate-500 italic bg-white/60 p-1.5 rounded">
                                ติดตามการรักษา: {disease.doctorNotes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Daily Medications Summary if any */}
                    {(student.dailyMedications || []).length > 0 && (
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-900">
                        <strong className="text-blue-950">ยาประจำตัวที่ต้องรับประทาน: </strong>
                        {(student.dailyMedications || []).map(m => `${m.medicineName} (${m.dosage})`).join(', ')}
                      </div>
                    )}

                    {/* Homeroom & Guardian Contact */}
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
                        title="เปิด QR ฉุกเฉิน"
                        className="p-2 rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200 transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-slate-700" />
                      </button>
                    )}
                    {onNewVisit && (
                      <button
                        onClick={() => onNewVisit(student.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                        <span>ปฐมพยาบาล</span>
                      </button>
                    )}
                    {onNewVisitWithReferral && (
                      <button
                        onClick={() => onNewVisitWithReferral(student.id)}
                        title="ส่งต่อโรงพยาบาลกรณีฉุกเฉิน"
                        className="p-2 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                      >
                        <Ambulance className="w-4 h-4 text-rose-700" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectStudent(student, 'diseases')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs"
                  >
                    <span>ดูประวัติเต็ม</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add/Edit Disease Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/60 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editingDiseaseId ? 'แก้ไขข้อมูลโรคประจำตัว' : 'เพิ่มโรคประจำตัวใหม่'}
                  </h3>
                  <p className="text-[11px] text-slate-500">จัดการข้อมูลโรคประจำตัว อาการ และแผนปฐมพยาบาล</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDisease} className="p-4 space-y-3.5 text-xs overflow-y-auto">
              {/* Student Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">นักเรียน</label>
                <select
                  value={targetStudentId}
                  disabled={!!editingDiseaseId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-rose-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.prefix}{s.firstName} {s.lastName} (ห้อง {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Disease Name with suggestions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อโรคประจำตัว <span className="text-rose-500">*</span></label>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {[
                    'โรคลมชัก (Epilepsy)',
                    'โรคหอบหืด (Asthma)',
                    'โรคหัวใจพิการแต่กำเนิด',
                    'เบาหวานชนิดที่ 1 (Type 1 DM)',
                    'ธาลัสซีเมีย (Thalassemia)',
                    'โรคสมาธิสั้น (ADHD)'
                  ].map(dis => (
                    <button
                      type="button"
                      key={dis}
                      onClick={() => setFormDiseaseName(dis)}
                      className={`px-2 py-1 rounded-lg text-[10px] border transition-colors ${
                        formDiseaseName === dis 
                          ? 'bg-rose-600 text-white border-rose-600' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dis}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="ระบุชื่อโรคประจำตัว..."
                  value={formDiseaseName}
                  onChange={(e) => setFormDiseaseName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">อาการที่พบ / สิ่งที่ต้องเฝ้าระวัง <span className="text-rose-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="เช่น ชักเกร็ง ตาค้าง นิ่งเหม่อ, หายใจมีเสียงวี้ด เหนื่อยหอบ, หน้ามืด ปากเขียวคล้ำ..."
                  value={formSymptoms}
                  onChange={(e) => setFormSymptoms(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Emergency Care */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วิธีปฐมพยาบาลฉุกเฉินเมื่อกำเริบ</label>
                <textarea
                  rows={3}
                  placeholder="เช่น จับนอนตะแคงซ้าย ป้องกันการสำลัก ห้ามนำช้อนหรืองัดฟันเด็ดขาด หากชักเกิน 3 นาที โทร 1669..."
                  value={formEmergencyCare}
                  onChange={(e) => setFormEmergencyCare(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ข้อมูลการติดตามรักษากับโรงพยาบาล / แพทย์</label>
                <input
                  type="text"
                  placeholder="เช่น นัดติดตามอาการ รพ.ชัยนาทนเรนทร ทุก 3 เดือน..."
                  value={formDoctorNotes}
                  onChange={(e) => setFormDoctorNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-rose-500"
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-2xs transition-colors"
                >
                  {editingDiseaseId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลโรค'}
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
                <h3 className="font-bold text-slate-900 text-sm">ยืนยันการลบโรคประจำตัว</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ต้องการลบโรค <strong>"{deleteTarget.diseaseName}"</strong> ของนักเรียน <strong>"{deleteTarget.studentName}"</strong> ออกจากระบบใช่หรือไม่?
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
