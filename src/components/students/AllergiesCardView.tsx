import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, DrugAllergy, FoodAllergy } from '../../types';
import { 
  AlertTriangle, 
  Search, 
  Pill, 
  Utensils, 
  Phone, 
  QrCode, 
  Filter,
  Printer,
  ChevronRight,
  HeartHandshake,
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  Check,
  Sparkles,
  ShieldAlert,
  LayoutGrid,
  Table,
  FileDown
} from 'lucide-react';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { exportTableAsPDF } from '../../utils/tablePdfExport';
import { StudentAvatar } from '../common/StudentAvatar';

interface AllergiesCardViewProps {
  onSelectStudent: (student: Student, subTab?: string) => void;
  onNewVisit?: (studentId: string) => void;
  onShowQR?: (student: Student) => void;
}

export const AllergiesCardView: React.FC<AllergiesCardViewProps> = ({
  onSelectStudent,
  onNewVisit,
  onShowQR
}) => {
  const { students, systemConfig, currentUser, updateStudent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'drug' | 'food' | 'severe'>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [selectedDuplicateFilter, setSelectedDuplicateFilter] = useState<string>('all'); // 'all', 'only-duplicates', or allergen name
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  // Admin Edit/Add Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [allergyCategory, setAllergyCategory] = useState<'drug' | 'food'>('drug');
  const [editingId, setEditingId] = useState<string | null>(null); // null = new, string = edit
  const [formName, setFormName] = useState('');
  const [formSeverity, setFormSeverity] = useState('รุนแรง');
  const [formReaction, setFormReaction] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    studentId: string;
    studentName: string;
    type: 'drug' | 'food';
    id: string;
    name: string;
  } | null>(null);

  const canAdmin = currentUser.role === 'admin' || currentUser.role === 'nurse';

  // Extract all unique allergies and detect duplicates across all students
  const allergyDuplicates = useMemo(() => {
    const map: Record<string, { type: 'drug' | 'food'; label: string; count: number; studentIds: Set<string> }> = {};

    students.forEach(student => {
      (student.drugAllergies || []).forEach(d => {
        const clean = d.drugName.trim();
        const norm = clean.toLowerCase();
        if (!norm) return;
        if (!map[norm]) {
          map[norm] = { type: 'drug', label: clean, count: 0, studentIds: new Set() };
        }
        map[norm].count += 1;
        map[norm].studentIds.add(student.id);
      });

      (student.foodAllergies || []).forEach(f => {
        const clean = f.foodName.trim();
        const norm = clean.toLowerCase();
        if (!norm) return;
        if (!map[norm]) {
          map[norm] = { type: 'food', label: clean, count: 0, studentIds: new Set() };
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

  // List of only duplicate allergens (>= 2 students)
  const duplicateOnlyItems = useMemo(() => {
    return allergyDuplicates.filter(item => item.count >= 2);
  }, [allergyDuplicates]);

  // Filter students who have at least one drug allergy or food allergy
  const allergyStudents = useMemo(() => {
    return students.filter(s => {
      const hasDrug = (s.drugAllergies || []).length > 0;
      const hasFood = (s.foodAllergies || []).length > 0;
      return hasDrug || hasFood;
    });
  }, [students]);

  // Apply search, category, and duplicate filters
  const filteredStudents = useMemo(() => {
    return allergyStudents.filter(s => {
      // Unified Classroom / Grade filter
      if (filterClassroom !== 'all' && s.classroom !== filterClassroom && s.grade !== filterClassroom) return false;

      // Filter by allergy type
      const hasDrug = (s.drugAllergies || []).length > 0;
      const hasFood = (s.foodAllergies || []).length > 0;
      const hasSevere = 
        (s.drugAllergies || []).some(a => a.severity.includes('รุนแรง') || a.severity.includes('Anaphylaxis')) ||
        (s.foodAllergies || []).some(a => a.severity.includes('รุนแรง') || a.severity.includes('Anaphylaxis'));

      if (filterType === 'drug' && !hasDrug) return false;
      if (filterType === 'food' && !hasFood) return false;
      if (filterType === 'severe' && !hasSevere) return false;

      // Duplicate filter
      if (selectedDuplicateFilter === 'only-duplicates') {
        // Must have at least one allergy that appears in duplicateOnlyItems
        const hasAnyDuplicate = 
          (s.drugAllergies || []).some(d => duplicateOnlyItems.some(item => item.norm === d.drugName.trim().toLowerCase())) ||
          (s.foodAllergies || []).some(f => duplicateOnlyItems.some(item => item.norm === f.foodName.trim().toLowerCase()));
        if (!hasAnyDuplicate) return false;
      } else if (selectedDuplicateFilter !== 'all') {
        // Specific allergen chosen
        const matchSpecific = 
          (s.drugAllergies || []).some(d => d.drugName.trim().toLowerCase() === selectedDuplicateFilter.toLowerCase()) ||
          (s.foodAllergies || []).some(f => f.foodName.trim().toLowerCase() === selectedDuplicateFilter.toLowerCase());
        if (!matchSpecific) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
        const matchNick = (s.nickname || '').toLowerCase().includes(q);
        const matchCode = (s.studentCode || '').toLowerCase().includes(q);
        const matchClass = (s.classroom || '').toLowerCase().includes(q);
        const matchDrug = (s.drugAllergies || []).some(d => 
          d.drugName.toLowerCase().includes(q) || 
          d.reaction.toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q)
        );
        const matchFood = (s.foodAllergies || []).some(f => 
          f.foodName.toLowerCase().includes(q) || 
          f.reaction.toLowerCase().includes(q) ||
          (f.notes || '').toLowerCase().includes(q)
        );

        return matchName || matchNick || matchCode || matchClass || matchDrug || matchFood;
      }

      return true;
    });
  }, [allergyStudents, filterType, filterClassroom, selectedDuplicateFilter, duplicateOnlyItems, searchQuery]);

  // Statistics
  const totalAllergyStudents = allergyStudents.length;
  const totalDrugAllergiesCount = allergyStudents.reduce((sum, s) => sum + (s.drugAllergies || []).length, 0);
  const totalFoodAllergiesCount = allergyStudents.reduce((sum, s) => sum + (s.foodAllergies || []).length, 0);
  const totalSevereCount = allergyStudents.filter(s => 
    (s.drugAllergies || []).some(a => a.severity.includes('รุนแรง') || a.severity.includes('Anaphylaxis')) ||
    (s.foodAllergies || []).some(a => a.severity.includes('รุนแรง') || a.severity.includes('Anaphylaxis'))
  ).length;

  // Open Modal for Adding New Allergy
  const handleOpenAddModal = (studentId?: string) => {
    setTargetStudentId(studentId || (students[0]?.id || ''));
    setEditingId(null);
    setAllergyCategory('drug');
    setFormName('');
    setFormSeverity('รุนแรง');
    setFormReaction('');
    setFormNotes('');
    setModalOpen(true);
  };

  // Open Modal for Editing an existing allergy
  const handleOpenEditModal = (studentId: string, type: 'drug' | 'food', item: DrugAllergy | FoodAllergy) => {
    setTargetStudentId(studentId);
    setEditingId(item.id);
    setAllergyCategory(type);
    setFormName(type === 'drug' ? (item as DrugAllergy).drugName : (item as FoodAllergy).foodName);
    setFormSeverity(item.severity);
    setFormReaction(item.reaction);
    setFormNotes(item.notes || '');
    setModalOpen(true);
  };

  // Save Add / Edit
  const handleSaveAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !formName.trim()) return;

    const student = students.find(s => s.id === targetStudentId);
    if (!student) return;

    if (allergyCategory === 'drug') {
      const currentList = student.drugAllergies || [];
      let updatedList: DrugAllergy[];
      if (editingId) {
        updatedList = currentList.map(a => a.id === editingId ? {
          ...a,
          drugName: formName.trim(),
          severity: formSeverity as any,
          reaction: formReaction.trim(),
          notes: formNotes.trim()
        } : a);
      } else {
        const newItem: DrugAllergy = {
          id: `da-${Date.now()}`,
          drugName: formName.trim(),
          severity: formSeverity as any,
          reaction: formReaction.trim(),
          notes: formNotes.trim()
        };
        updatedList = [...currentList, newItem];
      }
      updateStudent(targetStudentId, { drugAllergies: updatedList });
    } else {
      const currentList = student.foodAllergies || [];
      let updatedList: FoodAllergy[];
      if (editingId) {
        updatedList = currentList.map(a => a.id === editingId ? {
          ...a,
          foodName: formName.trim(),
          severity: formSeverity as any,
          reaction: formReaction.trim(),
          notes: formNotes.trim()
        } : a);
      } else {
        const newItem: FoodAllergy = {
          id: `fa-${Date.now()}`,
          foodName: formName.trim(),
          severity: formSeverity as any,
          reaction: formReaction.trim(),
          notes: formNotes.trim()
        };
        updatedList = [...currentList, newItem];
      }
      updateStudent(targetStudentId, { foodAllergies: updatedList });
    }

    setModalOpen(false);
  };

  // Perform Delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { studentId, type, id } = deleteTarget;
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (type === 'drug') {
      const updated = (student.drugAllergies || []).filter(a => a.id !== id);
      updateStudent(studentId, { drugAllergies: updated });
    } else {
      const updated = (student.foodAllergies || []).filter(a => a.id !== id);
      updateStudent(studentId, { foodAllergies: updated });
    }

    setDeleteTarget(null);
  };

  // Download PDF Report
  const handleDownloadPdf = () => {
    exportTableAsPDF({
      title: 'รายงานรายชื่อนักเรียนที่มีประวัติแพ้ยาและแพ้อาหาร',
      schoolName: systemConfig?.schoolName || 'โรงเรียนศึกษาพิเศษชัยนาท',
      schoolLogo: systemConfig?.schoolLogo,
      showIndex: true,
      columns: [
        { header: 'รหัส', key: 'studentCode', width: '80px', align: 'center' },
        { header: 'ชื่อ-นามสกุล (ชื่อเล่น)', key: 'fullName', width: '180px', align: 'left' },
        { header: 'ระดับชั้น/ห้อง', key: 'classroom', width: '90px', align: 'center' },
        { header: 'หมู่เลือด', key: 'bloodType', width: '65px', align: 'center' },
        { header: 'ประวัติแพ้ยา (ความรุนแรง / อาการ)', key: 'drugAllergies', width: '250px', align: 'left' },
        { header: 'ประวัติแพ้อาหาร (ความรุนแรง / อาการ)', key: 'foodAllergies', width: '250px', align: 'left' }
      ],
      rows: filteredStudents.map((s) => ({
        studentCode: s.studentCode,
        fullName: `${s.prefix}${s.firstName} ${s.lastName} (${s.nickname})`,
        classroom: s.classroom,
        bloodType: s.bloodType,
        drugAllergies: (s.drugAllergies || []).length > 0 
          ? (s.drugAllergies || []).map(d => `• ${d.drugName} [${d.severity}] : ${d.reaction || '-'}`).join('\n') 
          : '-',
        foodAllergies: (s.foodAllergies || []).length > 0
          ? (s.foodAllergies || []).map(f => `• ${f.foodName} [${f.severity}] : ${f.reaction || '-'}`).join('\n')
          : '-'
      })),
      summaryStats: [
        { label: 'จำนวนนักเรียนที่พบ', value: `${filteredStudents.length} คน` },
        { label: 'รายการแพ้ยา', value: `${totalDrugAllergiesCount} รายการ` },
        { label: 'รายการแพ้อาหาร', value: `${totalFoodAllergiesCount} รายการ` },
        { label: 'ระดับรุนแรง/วิกฤต', value: `${totalSevereCount} คน` }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                รายชื่อนักเรียนที่มีประวัติแพ้ยาและแพ้อาหาร
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                เฝ้าระวังความปลอดภัยด้านยาและโภชนาการสำหรับนักเรียน ปรับมุมมองการ์ดหรือตาราง และดาวน์โหลดเป็น PDF ได้
              </p>
            </div>
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
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มประวัติแพ้ยา/อาหาร</span>
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

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => { setFilterType('all'); setSelectedDuplicateFilter('all'); }}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'all' && selectedDuplicateFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">นักเรียนที่มีประวัติแพ้ทั้งหมด</div>
          <div className="text-2xl font-bold mt-1">{totalAllergyStudents} <span className="text-xs font-normal opacity-80">คน</span></div>
        </div>

        <div 
          onClick={() => { setFilterType('drug'); setSelectedDuplicateFilter('all'); }}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'drug'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-rose-700 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>🚨 แพ้ยา</span>
            <Pill className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {allergyStudents.filter(s => (s.drugAllergies || []).length > 0).length}{' '}
            <span className="text-xs font-normal text-slate-500">คน ({totalDrugAllergiesCount} รายการ)</span>
          </div>
        </div>

        <div 
          onClick={() => { setFilterType('food'); setSelectedDuplicateFilter('all'); }}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'food'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>⚠️ แพ้อาหาร</span>
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {allergyStudents.filter(s => (s.foodAllergies || []).length > 0).length}{' '}
            <span className="text-xs font-normal text-slate-500">คน ({totalFoodAllergiesCount} รายการ)</span>
          </div>
        </div>

        <div 
          onClick={() => { setFilterType('severe'); setSelectedDuplicateFilter('all'); }}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'severe'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-red-700 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>🔴 แพ้รุนแรง (Anaphylaxis)</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {totalSevereCount}{' '}
            <span className="text-xs font-normal text-slate-500">คน (เสี่ยงวิกฤต)</span>
          </div>
        </div>
      </div>

      {/* Duplicate Filter Banner & Controls */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-4 rounded-2xl border border-rose-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-rose-900">
              ตัวกรองคำซ้ำ: ตรวจจับนักเรียนที่แพ้ยาหรืออาหารตัวเดียวกัน
            </span>
          </div>
          <span className="text-[11px] text-rose-700 font-medium">
            พบกลุ่มที่แพ้ตัวยา/อาหารซ้ำกัน {duplicateOnlyItems.length} รายการ
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedDuplicateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedDuplicateFilter === 'all'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            แสดงทั้งหมด ({allergyStudents.length})
          </button>

          <button
            onClick={() => setSelectedDuplicateFilter('only-duplicates')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
              selectedDuplicateFilter === 'only-duplicates'
                ? 'bg-rose-700 text-white shadow-xs font-bold'
                : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
            }`}
          >
            <span>⚡ แสดงเฉพาะกลุ่มที่แพ้ซ้ำกัน (≥ 2 คน)</span>
          </button>

          {/* Quick Duplicate Pills */}
          {duplicateOnlyItems.map(item => (
            <button
              key={item.norm}
              onClick={() => setSelectedDuplicateFilter(item.norm)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1 ${
                selectedDuplicateFilter.toLowerCase() === item.norm
                  ? 'bg-amber-600 text-white shadow-xs font-bold ring-2 ring-amber-300'
                  : 'bg-white text-slate-800 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              <span>{item.type === 'drug' ? '💊' : '🍲'}</span>
              <span>{item.label}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                {item.count} คน
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, ยา, อาหารที่แพ้, อาการ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>ระดับชั้น/ห้อง:</span>
          </div>
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-rose-500 font-semibold"
          >
            <option value="all">ทุกระดับชั้น/ห้อง</option>
            {(systemConfig.classrooms || []).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilterType('drug')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'drug' ? 'bg-rose-500 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แพ้ยา
            </button>
            <button
              onClick={() => setFilterType('food')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'food' ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แพ้อาหาร
            </button>
            <button
              onClick={() => setFilterType('severe')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === 'severe' ? 'bg-red-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รุนแรงมาก
            </button>
          </div>
        </div>
      </div>

      {/* Content Display: Cards vs Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="font-medium text-slate-700 text-sm">ไม่พบข้อมูลนักเรียนที่มีประวัติแพ้ยาหรือแพ้อาหารตามเงื่อนไขที่เลือก</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองคำซ้ำ</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-3 text-center w-14">ลำดับ</th>
                  <th className="py-3.5 px-3 w-48">ข้อมูลนักเรียน</th>
                  <th className="py-3.5 px-3 text-center w-24">ห้อง / เลือด</th>
                  <th className="py-3.5 px-4 min-w-[220px]">ประวัติแพ้ยา</th>
                  <th className="py-3.5 px-4 min-w-[220px]">ประวัติแพ้อาหาร</th>
                  <th className="py-3.5 px-3 w-44">ผู้ปกครอง / เบอร์โทร</th>
                  <th className="py-3.5 px-3 text-center w-36">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const drugList = student.drugAllergies || [];
                  const foodList = student.foodAllergies || [];
                  const hasSevere = 
                    drugList.some(d => d.severity.includes('รุนแรง') || d.severity.includes('Anaphylaxis')) ||
                    foodList.some(f => f.severity.includes('รุนแรง') || f.severity.includes('Anaphylaxis'));

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasSevere ? 'bg-rose-50/20' : ''
                      }`}
                    >
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
                              <span className="font-mono text-teal-700 bg-teal-50 px-1 rounded">{student.studentCode}</span>
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
                        {drugList.length === 0 ? (
                          <span className="text-slate-400 text-[11px]">- ไม่มี -</span>
                        ) : (
                          <div className="space-y-1.5">
                            {drugList.map(d => {
                              const isSev = d.severity.includes('รุนแรง') || d.severity.includes('Anaphylaxis');
                              return (
                                <div key={d.id} className="p-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px]">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-rose-900 truncate">
                                      💊 {d.drugName}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                      isSev ? 'bg-rose-600 text-white' : 'bg-rose-200 text-rose-800'
                                    }`}>
                                      {d.severity}
                                    </span>
                                  </div>
                                  {d.reaction && (
                                    <div className="text-slate-600 text-[10px] mt-0.5">
                                      อาการ: {d.reaction}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {foodList.length === 0 ? (
                          <span className="text-slate-400 text-[11px]">- ไม่มี -</span>
                        ) : (
                          <div className="space-y-1.5">
                            {foodList.map(f => {
                              const isSev = f.severity.includes('รุนแรง') || f.severity.includes('Anaphylaxis');
                              return (
                                <div key={f.id} className="p-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px]">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-amber-900 truncate">
                                      🍽️ {f.foodName}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                      isSev ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-800'
                                    }`}>
                                      {f.severity}
                                    </span>
                                  </div>
                                  {f.reaction && (
                                    <div className="text-slate-600 text-[10px] mt-0.5">
                                      อาการ: {f.reaction}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 text-xs">
                          {student.guardianName || '-'}
                        </div>
                        <div className="text-[11px] text-teal-700 font-mono mt-0.5">
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
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                              title="บันทึกการรับบริการห้องพยาบาล"
                            >
                              <HeartHandshake className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student, 'allergies')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[11px] transition-colors"
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
            const drugList = student.drugAllergies || [];
            const foodList = student.foodAllergies || [];
            const hasSevereAllergy = 
              drugList.some(d => d.severity.includes('รุนแรง') || d.severity.includes('Anaphylaxis')) ||
              foodList.some(f => f.severity.includes('รุนแรง') || f.severity.includes('Anaphylaxis'));

            return (
              <div 
                key={student.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                  hasSevereAllergy 
                    ? 'border-rose-300 ring-1 ring-rose-200' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
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
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            หมู่เลือด {student.bloodType}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-100">
                            ห้อง {student.classroom}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-800 text-sm truncate mt-0.5">
                        {student.prefix}{student.firstName} {student.lastName}
                      </h3>

                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50/60 px-1.5 py-0.2 rounded">
                          ชื่อเล่น: {student.nickname}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          อายุ {student.age} ปี
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Allergy Details Section */}
                  <div className="p-4 space-y-3.5">
                    {/* Admin Add Quick Action on Card */}
                    {canAdmin && (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setTargetStudentId(student.id);
                            setEditingId(null);
                            setAllergyCategory('drug');
                            setFormName('');
                            setFormSeverity('รุนแรง');
                            setFormReaction('');
                            setFormNotes('');
                            setModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ เพิ่มแพ้ยา</span>
                        </button>
                        <button
                          onClick={() => {
                            setTargetStudentId(student.id);
                            setEditingId(null);
                            setAllergyCategory('food');
                            setFormName('');
                            setFormSeverity('ปานกลาง');
                            setFormReaction('');
                            setFormNotes('');
                            setModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ เพิ่มแพ้อาหาร</span>
                        </button>
                      </div>
                    )}

                    {/* 1. Drug Allergies */}
                    {drugList.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-700 flex items-center space-x-1.5">
                            <Pill className="w-3.5 h-3.5 text-rose-600" />
                            <span>ประวัติแพ้ยา ({drugList.length} รายการ)</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                            ห้ามจ่ายเด็ดขาด!
                          </span>
                        </div>

                        <div className="space-y-2">
                          {drugList.map((allergy) => {
                            const isAnaphylaxis = allergy.severity.includes('Anaphylaxis') || allergy.severity.includes('รุนแรงมาก');
                            const dupMatch = allergyDuplicates.find(d => d.norm === allergy.drugName.trim().toLowerCase());
                            const isDuplicate = dupMatch && dupMatch.count >= 2;

                            return (
                              <div
                                key={allergy.id}
                                className={`p-2.5 rounded-xl border text-xs transition-all ${
                                  isAnaphylaxis
                                    ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                                    : 'bg-red-50/50 border-red-200 text-slate-800'
                                } ${
                                  selectedDuplicateFilter.toLowerCase() === allergy.drugName.trim().toLowerCase()
                                    ? 'ring-2 ring-amber-500 bg-amber-50/90'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <strong className="text-rose-800 font-bold text-xs truncate">
                                      💊 {allergy.drugName}
                                    </strong>
                                    {isDuplicate && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-0.5">
                                        <Users className="w-2.5 h-2.5" />
                                        <span>ซ้ำ {dupMatch.count} คน</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                                      isAnaphylaxis 
                                        ? 'bg-rose-600 text-white' 
                                        : 'bg-rose-200 text-rose-800'
                                    }`}>
                                      {allergy.severity}
                                    </span>

                                    {/* Admin Edit & Delete buttons */}
                                    {canAdmin && (
                                      <div className="flex items-center space-x-0.5 ml-1">
                                        <button
                                          onClick={() => handleOpenEditModal(student.id, 'drug', allergy)}
                                          title="แก้ไขรายการแพ้ยานี้"
                                          className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-200/60 rounded transition-colors"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => setDeleteTarget({
                                            studentId: student.id,
                                            studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
                                            type: 'drug',
                                            id: allergy.id,
                                            name: allergy.drugName
                                          })}
                                          title="ลบรายการแพ้ยานี้"
                                          className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[11px] text-slate-600 mt-1">
                                  <strong className="text-slate-700">อาการ: </strong>
                                  <span>{allergy.reaction}</span>
                                </div>
                                {allergy.notes && (
                                  <div className="text-[10px] text-rose-700 font-medium mt-1 bg-rose-100/50 p-1.5 rounded">
                                    ⚠️ {allergy.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. Food Allergies */}
                    {foodList.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-700 flex items-center space-x-1.5">
                            <Utensils className="w-3.5 h-3.5 text-amber-600" />
                            <span>ประวัติแพ้อาหาร ({foodList.length} รายการ)</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            ระวังอาหาร
                          </span>
                        </div>

                        <div className="space-y-2">
                          {foodList.map((allergy) => {
                            const dupMatch = allergyDuplicates.find(d => d.norm === allergy.foodName.trim().toLowerCase());
                            const isDuplicate = dupMatch && dupMatch.count >= 2;

                            return (
                              <div
                                key={allergy.id}
                                className={`p-2.5 rounded-xl border bg-amber-50/70 border-amber-200 text-xs text-slate-800 ${
                                  selectedDuplicateFilter.toLowerCase() === allergy.foodName.trim().toLowerCase()
                                    ? 'ring-2 ring-amber-500 bg-amber-100/80'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <strong className="text-amber-900 font-bold text-xs truncate">
                                      🍲 {allergy.foodName}
                                    </strong>
                                    {isDuplicate && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900 border border-amber-400 flex items-center space-x-0.5">
                                        <Users className="w-2.5 h-2.5" />
                                        <span>ซ้ำ {dupMatch.count} คน</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-800">
                                      {allergy.severity}
                                    </span>

                                    {/* Admin Edit & Delete buttons */}
                                    {canAdmin && (
                                      <div className="flex items-center space-x-0.5 ml-1">
                                        <button
                                          onClick={() => handleOpenEditModal(student.id, 'food', allergy)}
                                          title="แก้ไขรายการแพ้อาหารนี้"
                                          className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-200/60 rounded transition-colors"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => setDeleteTarget({
                                            studentId: student.id,
                                            studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
                                            type: 'food',
                                            id: allergy.id,
                                            name: allergy.foodName
                                          })}
                                          title="ลบรายการแพ้อาหารนี้"
                                          className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[11px] text-slate-600 mt-1">
                                  <strong className="text-slate-700">อาการ: </strong>
                                  <span>{allergy.reaction}</span>
                                </div>
                                {allergy.notes && (
                                  <div className="text-[10px] text-amber-800 font-medium mt-1 bg-amber-100/50 p-1.5 rounded">
                                    ⚠️ {allergy.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Homeroom & Guardian Contact */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="truncate">
                        <span className="text-slate-400">ครู: </span>
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
                        title="เปิด Emergency QR Code"
                        className="p-2 rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200 transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-slate-700" />
                      </button>
                    )}
                    {onNewVisit && (
                      <button
                        onClick={() => onNewVisit(student.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 transition-colors"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
                        <span>บันทึกพยาบาล</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectStudent(student, 'allergies')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-2xs"
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

      {/* ADMIN ADD / EDIT ALLERGY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-100" />
                <h3 className="font-bold text-base">
                  {editingId ? 'แก้ไขข้อมูลการแพ้' : 'เพิ่มประวัติแพ้ยา / แพ้อาหาร (แอดมิน)'}
                </h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-rose-100 hover:text-white hover:bg-rose-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAllergy} className="p-5 space-y-4">
              {/* Target Student Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกนักเรียน *
                </label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  disabled={!!editingId}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 disabled:bg-slate-100"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.prefix}{s.firstName} {s.lastName} (ห้อง {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเภทการแพ้ *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllergyCategory('drug')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
                      allergyCategory === 'drug'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Pill className="w-4 h-4 text-rose-600" />
                    <span>แพ้ยา (Drug Allergy)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllergyCategory('food')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
                      allergyCategory === 'food'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Utensils className="w-4 h-4 text-amber-600" />
                    <span>แพ้อาหาร (Food Allergy)</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {allergyCategory === 'drug' ? 'ชื่อยาที่แพ้ *' : 'ชื่ออาหาร/สารที่แพ้ *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={allergyCategory === 'drug' ? 'เช่น Penicillin, Amoxicillin, Ibuprofen' : 'เช่น อาหารทะเล, กุ้ง, ไข่ไก่, ถั่วลิสง'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ระดับความรุนแรง *
                </label>
                <select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="รุนแรงมาก (Anaphylaxis)">รุนแรงมาก (Anaphylaxis) - เสี่ยงชีวิต</option>
                  <option value="รุนแรง">รุนแรง</option>
                  <option value="ปานกลาง">ปานกลาง</option>
                  <option value="เล็กน้อย">เล็กน้อย</option>
                </select>
              </div>

              {/* Reaction */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อาการที่แสดงเมื่อแพ้ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ผื่นคัน ลมพิษ ตาบวม ปากบวม หายใจไม่ออก แน่นหน้าอก"
                  value={formReaction}
                  onChange={(e) => setFormReaction(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำแนะนำ/ข้อควรระวังเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น มี EpiPen ประจำตัวที่ห้องพยาบาล, หลีกเลี่ยงยากลุ่มเดียวกัน"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลการแพ้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">ยืนยันการลบรายการแพ้?</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ต้องการลบประวัติการ{deleteTarget.type === 'drug' ? 'แพ้ยา' : 'แพ้อาหาร'} <strong className="text-rose-700 font-bold">"{deleteTarget.name}"</strong> ของ <strong className="text-slate-800">{deleteTarget.studentName}</strong> ใช่หรือไม่? การลบนี้จะมีผลทันที
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

