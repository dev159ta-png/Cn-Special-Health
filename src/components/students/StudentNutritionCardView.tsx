import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, NutritionRecord } from '../../types';
import { 
  Scale, 
  Search, 
  Filter, 
  Activity, 
  Calendar, 
  Utensils, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  QrCode, 
  Printer, 
  ChevronRight, 
  Plus, 
  Edit2, 
  X, 
  Copy, 
  Users, 
  AlertTriangle,
  HeartHandshake,
  ShieldAlert
} from 'lucide-react';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { StudentAvatar } from '../common/StudentAvatar';

interface StudentNutritionCardViewProps {
  onSelectStudent: (student: Student, subTab?: string) => void;
  onNewVisit?: (studentId: string) => void;
  onShowQR?: (student: Student) => void;
}

// Helper to determine BMI status
export function calculateBmiStatus(bmi: number): NutritionRecord['bmiStatus'] {
  if (bmi < 16.0) return 'ผอมมาก';
  if (bmi < 18.5) return 'น้ำหนักน้อย';
  if (bmi <= 22.9) return 'สมส่วน';
  if (bmi <= 24.9) return 'ท้วม';
  if (bmi <= 29.9) return 'อ้วน';
  return 'อ้วนมาก';
}

export const StudentNutritionCardView: React.FC<StudentNutritionCardViewProps> = ({
  onSelectStudent,
  onNewVisit,
  onShowQR
}) => {
  const { students, systemConfig, currentUser, updateStudent } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBmiStatus, setFilterBmiStatus] = useState<string>('all');
  const [filterDietType, setFilterDietType] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [selectedBmiGroupFilter, setSelectedBmiGroupFilter] = useState<string>('all');

  // Admin Add/Update Measurement Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formWeight, setFormWeight] = useState<string>('20.0');
  const [formHeight, setFormHeight] = useState<string>('115.0');
  const [formDietType, setFormDietType] = useState<NutritionRecord['dietType']>('อาหารปกติ');
  const [formNotes, setFormNotes] = useState('');

  const canAdmin = currentUser.role === 'admin' || currentUser.role === 'nurse';

  // Extract latest nutrition record for each student
  const studentNutritionData = useMemo(() => {
    return students.map(student => {
      const history = student.nutritionHistory || [];
      const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0] || null;

      let calculatedBmi = 0;
      let status: NutritionRecord['bmiStatus'] = 'สมส่วน';

      if (latest && latest.weight > 0 && latest.height > 0) {
        calculatedBmi = Number((latest.weight / Math.pow(latest.height / 100, 2)).toFixed(1));
        status = latest.bmiStatus || calculateBmiStatus(calculatedBmi);
      }

      return {
        student,
        latest,
        history,
        bmi: calculatedBmi,
        bmiStatus: status
      };
    });
  }, [students]);

  // Compute BMI status groups and duplicates
  const bmiGroups = useMemo(() => {
    const map: Record<string, number> = {
      'ผอมมาก': 0,
      'น้ำหนักน้อย': 0,
      'สมส่วน': 0,
      'ท้วม': 0,
      'อ้วน': 0,
      'อ้วนมาก': 0
    };

    studentNutritionData.forEach(item => {
      if (item.latest) {
        map[item.bmiStatus] = (map[item.bmiStatus] || 0) + 1;
      }
    });

    return map;
  }, [studentNutritionData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return studentNutritionData.filter(({ student, latest, bmi, bmiStatus }) => {
      // Classroom filter
      if (filterClassroom !== 'all' && student.classroom !== filterClassroom && student.grade !== filterClassroom) return false;

      // BMI Status filter
      if (filterBmiStatus !== 'all' && bmiStatus !== filterBmiStatus) return false;

      // Diet Type filter
      if (filterDietType !== 'all') {
        const diet = latest?.dietType || 'อาหารปกติ';
        if (diet !== filterDietType) return false;
      }

      // BMI Group duplicate filter
      if (selectedBmiGroupFilter !== 'all' && bmiStatus !== selectedBmiGroupFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = `${student.prefix}${student.firstName} ${student.lastName}`.toLowerCase().includes(q);
        const matchNick = (student.nickname || '').toLowerCase().includes(q);
        const matchCode = (student.studentCode || '').toLowerCase().includes(q);
        const matchClass = (student.classroom || '').toLowerCase().includes(q);
        const matchStatus = bmiStatus.toLowerCase().includes(q);
        const matchDiet = (latest?.dietType || '').toLowerCase().includes(q);

        return matchName || matchNick || matchCode || matchClass || matchStatus || matchDiet;
      }

      return true;
    });
  }, [studentNutritionData, filterClassroom, filterBmiStatus, filterDietType, selectedBmiGroupFilter, searchQuery]);

  // Statistics
  const totalWithData = studentNutritionData.filter(d => d.latest !== null).length;
  const normalWeightCount = studentNutritionData.filter(d => d.bmiStatus === 'สมส่วน').length;
  const underweightCount = studentNutritionData.filter(d => d.bmiStatus === 'ผอมมาก' || d.bmiStatus === 'น้ำหนักน้อย').length;
  const overweightCount = studentNutritionData.filter(d => d.bmiStatus === 'ท้วม' || d.bmiStatus === 'อ้วน' || d.bmiStatus === 'อ้วนมาก').length;
  const tubeFeedingCount = studentNutritionData.filter(d => d.latest?.dietType === 'การให้อาหารทางสาย (Tube Feeding)' || d.latest?.dietType === 'อาหารปั่น').length;

  // Realtime BMI calculation for the Modal form
  const modalCalculatedBmi = useMemo(() => {
    const w = parseFloat(formWeight);
    const h = parseFloat(formHeight);
    if (!w || !h || h <= 0) return { bmi: 0, status: 'สมส่วน' as const };
    const bmiVal = Number((w / Math.pow(h / 100, 2)).toFixed(1));
    return {
      bmi: bmiVal,
      status: calculateBmiStatus(bmiVal)
    };
  }, [formWeight, formHeight]);

  const handleOpenAddModal = (studentId?: string) => {
    const target = studentId ? students.find(s => s.id === studentId) : students[0];
    setTargetStudentId(target?.id || '');
    
    if (target && target.nutritionHistory && target.nutritionHistory.length > 0) {
      const latest = target.nutritionHistory[target.nutritionHistory.length - 1];
      setFormWeight(String(latest.weight));
      setFormHeight(String(latest.height));
      setFormDietType(latest.dietType || 'อาหารปกติ');
      setFormNotes(latest.notes || '');
    } else {
      setFormWeight('20.0');
      setFormHeight('115.0');
      setFormDietType('อาหารปกติ');
      setFormNotes('');
    }

    setFormDate(new Date().toISOString().slice(0, 10));
    setModalOpen(true);
  };

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId) return;

    const student = students.find(s => s.id === targetStudentId);
    if (!student) return;

    const w = parseFloat(formWeight);
    const h = parseFloat(formHeight);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

    const bmi = Number((w / Math.pow(h / 100, 2)).toFixed(1));
    const status = calculateBmiStatus(bmi);

    const newRecord: NutritionRecord = {
      id: `nut-${Date.now()}`,
      date: formDate,
      weight: w,
      height: h,
      bmi,
      bmiStatus: status,
      dietType: formDietType,
      notes: formNotes.trim() || undefined
    };

    const currentHistory = [...(student.nutritionHistory || [])];
    updateStudent(student.id, {
      nutritionHistory: [...currentHistory, newRecord]
    });

    setModalOpen(false);
  };

  // Color helper for BMI status badge
  const getBmiBadgeStyle = (status: NutritionRecord['bmiStatus']) => {
    switch (status) {
      case 'สมส่วน':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'น้ำหนักน้อย':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ผอมมาก':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ท้วม':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'อ้วน':
      case 'อ้วนมาก':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              โภชนาการและรูปร่างนักเรียน (BMI & Nutrition Cards)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ติดตามการเจริญเติบโต ดัชนีมวลกาย (BMI) น้ำหนัก ส่วนสูง ภาวะโภชนาการ และประเภทอาหารของนักเรียน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAdmin && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกชั่งน้ำหนัก/วัดส่วนสูง</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์รายงานโภชนาการ</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => { setFilterBmiStatus('all'); setFilterDietType('all'); setSelectedBmiGroupFilter('all'); }}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterBmiStatus === 'all' && filterDietType === 'all' && selectedBmiGroupFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">นักเรียนที่มีข้อมูล BMI</div>
          <div className="text-2xl font-bold mt-1">
            {totalWithData} <span className="text-xs font-normal opacity-80">/ {students.length} คน</span>
          </div>
          <div className="text-[10px] opacity-70 mt-0.5">วัดผลล่าสุดปี พ.ศ. 2569</div>
        </div>

        <div 
          onClick={() => setFilterBmiStatus(filterBmiStatus === 'สมส่วน' ? 'all' : 'สมส่วน')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterBmiStatus === 'สมส่วน'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-800 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>✨ รูปร่างสมส่วน (Normal)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {normalWeightCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">BMI 18.5 - 22.9 กก./ตร.ม.</div>
        </div>

        <div 
          onClick={() => setFilterBmiStatus(filterBmiStatus === 'น้ำหนักน้อย' ? 'all' : 'น้ำหนักน้อย')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterBmiStatus === 'น้ำหนักน้อย'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-800 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>📉 น้ำหนักน้อย / ผอม</span>
            <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {underweightCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5 font-medium">BMI &lt; 18.5 เสริมโภชนาการ</div>
        </div>

        <div 
          onClick={() => setFilterBmiStatus(filterBmiStatus === 'ท้วม' ? 'all' : 'ท้วม')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            filterBmiStatus === 'ท้วม'
              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
              : 'bg-white text-orange-800 border-orange-200 hover:border-orange-300'
          }`}
        >
          <div className="text-[11px] font-medium flex items-center justify-between">
            <span>📈 ท้วม / เริ่มอ้วน / อ้วน</span>
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">
            {overweightCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-orange-700 mt-0.5 font-medium">BMI ≥ 23.0 คุมอาหาร/ออกกำลังกาย</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อนักเรียน, รูปร่าง, BMI, อาหาร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Duplicate / BMI Category Group Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>กรองรูปร่างซ้ำ:</span>
            </span>
            <select
              value={selectedBmiGroupFilter}
              onChange={(e) => setSelectedBmiGroupFilter(e.target.value)}
              className={`text-xs rounded-xl border py-2 px-2.5 font-medium transition-colors ${
                selectedBmiGroupFilter !== 'all'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-200'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <option value="all">ทุกเกณฑ์รูปร่าง (ทั้งหมด)</option>
              <optgroup label="-- กรองนักเรียนที่มีรูปร่างตามเกณฑ์เหมือนกัน --">
                <option value="สมส่วน">✨ สมส่วน ({bmiGroups['สมส่วน'] || 0} คน)</option>
                <option value="น้ำหนักน้อย">📉 น้ำหนักน้อย ({bmiGroups['น้ำหนักน้อย'] || 0} คน)</option>
                <option value="ผอมมาก">⚠️ ผอมมาก ({bmiGroups['ผอมมาก'] || 0} คน)</option>
                <option value="ท้วม">📈 ท้วม / น้ำหนักเกิน ({bmiGroups['ท้วม'] || 0} คน)</option>
                <option value="อ้วน">🍔 อ้วน ({bmiGroups['อ้วน'] || 0} คน)</option>
                <option value="อ้วนมาก">🚨 อ้วนมาก ({bmiGroups['อ้วนมาก'] || 0} คน)</option>
              </optgroup>
            </select>
          </div>

          {/* Classroom Filter */}
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-emerald-500 font-semibold"
          >
            <option value="all">ทุกระดับชั้น/ห้อง</option>
            {(systemConfig.classrooms || []).map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Diet Type Filter */}
          <select
            value={filterDietType}
            onChange={(e) => setFilterDietType(e.target.value)}
            className="text-xs rounded-xl border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:ring-emerald-500"
          >
            <option value="all">ทุกประเภทอาหาร</option>
            <option value="อาหารปกติ">🍚 อาหารปกติ</option>
            <option value="อาหารอ่อน">🥣 อาหารอ่อน</option>
            <option value="อาหารปั่น">🥤 อาหารปั่น</option>
            <option value="อาหารเฉพาะโรค">🥗 อาหารเฉพาะโรค</option>
            <option value="การให้อาหารทางสาย (Tube Feeding)">🩺 การให้อาหารทางสายยาง</option>
          </select>
        </div>
      </div>

      {/* Student Nutrition Cards Grid */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Scale className="w-6 h-6" />
          </div>
          <p className="font-medium text-slate-700 text-sm">ไม่พบข้อมูลโภชนาการนักเรียนตามเงื่อนไขที่เลือก</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรอง</p>
          {selectedBmiGroupFilter !== 'all' && (
            <button
              onClick={() => setSelectedBmiGroupFilter('all')}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100"
            >
              ล้างตัวกรองรูปร่าง
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map(({ student, latest, bmi, bmiStatus }) => {
            const hasFoodAllergy = (student.foodAllergies || []).length > 0;
            const isTubeFeeding = latest?.dietType === 'การให้อาหารทางสาย (Tube Feeding)';

            return (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between hover:shadow-md"
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            ห้อง {student.classroom}
                          </span>
                          {canAdmin && (
                            <button
                              onClick={() => handleOpenAddModal(student.id)}
                              title="บันทึกค่าน้ำหนัก-ส่วนสูงให้นักเรียนคนนี้"
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
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
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                          ชื่อเล่น: {student.nickname}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          อายุ {student.age} ปี
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Metrics & BMI Section */}
                  <div className="p-4 space-y-3">
                    {latest ? (
                      <>
                        {/* Latest Measurement Date in Thai */}
                        <div className="text-[11px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="flex items-center space-x-1 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>ชั่งล่าสุด:</span>
                          </span>
                          <span className="font-semibold text-slate-800">
                            {formatThaiDatePattern(latest.date)}
                          </span>
                        </div>

                        {/* Weight, Height, BMI KPI Trio */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">น้ำหนัก</span>
                            <span className="font-bold text-base text-slate-800">
                              {latest.weight} <span className="text-[10px] font-normal text-slate-500">กก.</span>
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">ส่วนสูง</span>
                            <span className="font-bold text-base text-slate-800">
                              {latest.height} <span className="text-[10px] font-normal text-slate-500">ซม.</span>
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                            <span className="text-[10px] text-emerald-700 block font-semibold">ดัชนี BMI</span>
                            <span className="font-bold text-base text-emerald-900">
                              {bmi}
                            </span>
                          </div>
                        </div>

                        {/* BMI Status Interpretation Pill */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl border bg-white border-slate-200">
                          <div className="text-xs">
                            <span className="text-slate-500 block text-[10px]">แปลผลรูปร่าง:</span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mt-0.5 ${getBmiBadgeStyle(bmiStatus)}`}>
                              {bmiStatus}
                            </span>
                          </div>

                          {/* Visual Indicator Bar */}
                          <div className="w-28 space-y-1">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                              <div className="w-1/4 bg-amber-300" title="ผอม (<18.5)" />
                              <div className="w-2/4 bg-emerald-400" title="สมส่วน (18.5-22.9)" />
                              <div className="w-1/4 bg-rose-400" title="ท้วม/อ้วน (≥23.0)" />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                              <span>18.5</span>
                              <span>23.0</span>
                            </div>
                          </div>
                        </div>

                        {/* Diet Type */}
                        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isTubeFeeding 
                            ? 'bg-purple-50 border-purple-200 text-purple-900' 
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                          <div className="flex items-center space-x-1.5">
                            <Utensils className={`w-3.5 h-3.5 ${isTubeFeeding ? 'text-purple-600' : 'text-slate-500'}`} />
                            <span className="font-semibold text-[11px]">ประเภทอาหาร:</span>
                          </div>
                          <span className="font-bold text-[11px]">
                            {latest.dietType || 'อาหารปกติ'}
                          </span>
                        </div>

                        {latest.notes && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            หมายเหตุโภชนาการ: {latest.notes}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        <Scale className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        ยังไม่มีบันทึกน้ำหนัก-ส่วนสูง
                        {canAdmin && (
                          <button
                            onClick={() => handleOpenAddModal(student.id)}
                            className="mt-2 block mx-auto text-emerald-600 font-bold hover:underline"
                          >
                            + บันทึกครั้งแรก
                          </button>
                        )}
                      </div>
                    )}

                    {/* Food Allergies Warning Alert */}
                    {hasFoodAllergy && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="truncate">
                          <strong>แพ้อาหาร: </strong>
                          {(student.foodAllergies || []).map(f => f.foodName).join(', ')}
                        </span>
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
                        title="เปิด QR ประวัติสุขภาพ"
                        className="p-2 rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200 transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-slate-700" />
                      </button>
                    )}
                    {canAdmin && (
                      <button
                        onClick={() => handleOpenAddModal(student.id)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>อัปเดต BMI</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectStudent(student, 'nutrition')}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
                  >
                    <span>ดูกราฟเติบโต</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add/Update Measurement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-emerald-50/60">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    บันทึกค่าน้ำหนักและส่วนสูง (BMI)
                  </h3>
                  <p className="text-[11px] text-slate-500">คำนวณดัชนีมวลกายอัตโนมัติตามเกณฑ์สุขภาพ</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="p-4 space-y-3.5 text-xs">
              {/* Student Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">นักเรียน</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.prefix}{s.firstName} {s.lastName} (ห้อง {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">วันที่ชั่งน้ำหนัก/วัดส่วนสูง</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
                {formDate && (
                  <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                    🗓️ {formatThaiDatePattern(formDate)}
                  </p>
                )}
              </div>

              {/* Weight & Height Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    น้ำหนัก (กก.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="150"
                    required
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ส่วนสูง (ซม.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="220"
                    required
                    value={formHeight}
                    onChange={(e) => setFormHeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Realtime Calculated BMI Card */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 font-semibold block">คำนวณ BMI อัตโนมัติ:</span>
                  <div className="text-lg font-bold text-emerald-950">
                    {modalCalculatedBmi.bmi} <span className="text-xs font-normal">กก./ตร.ม.</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block text-right">เกณฑ์รูปร่าง:</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBmiBadgeStyle(modalCalculatedBmi.status)}`}>
                    {modalCalculatedBmi.status}
                  </span>
                </div>
              </div>

              {/* Diet Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ประเภทอาหาร</label>
                <select
                  value={formDietType}
                  onChange={(e) => setFormDietType(e.target.value as NutritionRecord['dietType'])}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="อาหารปกติ">🍚 อาหารปกติ</option>
                  <option value="อาหารอ่อน">🥣 อาหารอ่อน</option>
                  <option value="อาหารปั่น">🥤 อาหารปั่น</option>
                  <option value="อาหารเฉพาะโรค">🥗 อาหารเฉพาะโรค</option>
                  <option value="การให้อาหารทางสาย (Tube Feeding)">🩺 การให้อาหารทางสาย (Tube Feeding)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุ / แผนการดูแลโภชนาการ</label>
                <textarea
                  rows={2}
                  placeholder="เช่น เสริมไข่ต้มและนมวันละ 2 กล่อง, ต้องป้อนช้าๆ ป้องกันสำลัก..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-emerald-500"
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
