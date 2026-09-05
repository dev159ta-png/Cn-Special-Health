import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { IllnessEpisode, Student } from '../../types';
import { formatThaiDateNumeric, formatThaiDatePattern } from '../../utils/dateUtils';
import { 
  HeartPulse, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  User, 
  PlusCircle, 
  RotateCcw, 
  ChevronRight, 
  FileText,
  Activity,
  History,
  Sparkles,
  X,
  Stethoscope,
  Info
} from 'lucide-react';

interface IllnessStatusViewProps {
  onSelectStudent: (studentId: string) => void;
  onNewVisitForStudent?: (studentId: string, episodeId?: string) => void;
}

export const IllnessStatusView: React.FC<IllnessStatusViewProps> = ({
  onSelectStudent,
  onNewVisitForStudent
}) => {
  const { 
    illnessEpisodes, 
    students, 
    visits, 
    markIllnessRecovered, 
    reopenIllnessEpisode,
    deleteIllnessEpisode,
    activeIllnessEpisodesCount,
    recoveredTodayCount,
    monthlyPatientsCount 
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'กำลังป่วย' | 'หายแล้ว'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Recovery Modal State
  const [recoveringEpisode, setRecoveringEpisode] = useState<IllnessEpisode | null>(null);
  const [recoveryDate, setRecoveryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [recoveryNote, setRecoveryNote] = useState<string>('อาการดีขึ้น หายป่วยแล้ว ไม่พบอาการผิดปกติ');

  // Episode Detail Modal State
  const [viewingEpisode, setViewingEpisode] = useState<IllnessEpisode | null>(null);

  // Helper for student lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  // Unique grades for filter
  const uniqueGrades = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.grade) set.add(s.grade);
      if (s.classroom) set.add(s.classroom);
    });
    return Array.from(set).sort();
  }, [students]);

  // Calculate day difference
  const getDaysSick = (startDate: string, endDate?: string) => {
    try {
      const start = new Date(startDate).getTime();
      const end = endDate ? new Date(endDate).getTime() : new Date().getTime();
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays);
    } catch {
      return 1;
    }
  };

  // Filtered Episodes
  const filteredEpisodes = useMemo(() => {
    return (illnessEpisodes || []).filter(ep => {
      const student = studentMap.get(ep.studentId);
      
      // Status Filter
      if (statusFilter !== 'all' && ep.status !== statusFilter) {
        return false;
      }

      // Grade/Classroom Filter
      if (gradeFilter !== 'all') {
        const matchGrade = student?.grade === gradeFilter || student?.classroom === gradeFilter || ep.classroom === gradeFilter;
        if (!matchGrade) return false;
      }

      // Date Filter
      if (dateFilter) {
        if (ep.startDate !== dateFilter && ep.recoveredDate !== dateFilter) {
          return false;
        }
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (ep.illnessCode || '').toLowerCase().includes(q);
        const matchName = (ep.studentName || '').toLowerCase().includes(q);
        const matchStudentCode = (ep.studentCode || '').toLowerCase().includes(q);
        const matchClass = (ep.classroom || '').toLowerCase().includes(q);
        const matchSymptoms = (ep.symptoms || []).some(s => s.toLowerCase().includes(q));
        const matchDetails = (ep.symptomDetails || '').toLowerCase().includes(q);
        const matchNotes = (ep.notes || '').toLowerCase().includes(q);

        if (!matchCode && !matchName && !matchStudentCode && !matchClass && !matchSymptoms && !matchDetails && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Prioritize active sick students at top, then by start date descending
      if (a.status === 'กำลังป่วย' && b.status !== 'กำลังป่วย') return -1;
      if (a.status !== 'กำลังป่วย' && b.status === 'กำลังป่วย') return 1;
      return b.startDate.localeCompare(a.startDate);
    });
  }, [illnessEpisodes, statusFilter, gradeFilter, dateFilter, searchQuery, studentMap]);

  // Handle opening Recovery modal
  const handleOpenRecoveryModal = (ep: IllnessEpisode) => {
    setRecoveringEpisode(ep);
    setRecoveryDate(new Date().toISOString().slice(0, 10));
    setRecoveryNote('อาการดีขึ้น หายป่วยแล้ว กลับมาเรียนได้ตามปกติ');
  };

  // Handle saving Recovery
  const handleConfirmRecovery = () => {
    if (!recoveringEpisode) return;
    markIllnessRecovered(recoveringEpisode.id, recoveryDate, recoveryNote);
    setRecoveringEpisode(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shadow-2xs">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900">
                  ตารางสถานะเจ็บป่วย (Sickness Status Tracking)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {activeIllnessEpisodesCount} กำลังป่วย
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ติดตามนักเรียนที่กำลังป่วย เชื่อมโยงรอบการเจ็บป่วย (Illness ID) กับบันทึกการรับบริการห้องพยาบาล
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNewVisitForStudent?.('')}
              className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกรับบริการ / เปิดอาการป่วยใหม่</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          
          {/* Metric 1: กำลังป่วยอยู่ */}
          <div 
            onClick={() => setStatusFilter('กำลังป่วย')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'กำลังป่วย' 
                ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20 shadow-xs' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-rose-50/40 hover:border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold text-rose-900">กำลังป่วยอยู่</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-rose-700">
                {activeIllnessEpisodesCount}
              </span>
              <span className="text-xs text-rose-600 font-medium">คน</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ต้องเฝ้าระวังอาการวันนี้</p>
          </div>

          {/* Metric 2: หายป่วยวันนี้ */}
          <div 
            onClick={() => setStatusFilter('หายแล้ว')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'หายแล้ว' 
                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-emerald-50/40 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold text-emerald-900">หายป่วยวันนี้</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-emerald-700">
                {recoveredTodayCount}
              </span>
              <span className="text-xs text-emerald-600 font-medium">คน</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">บันทึกหายป่วยในวันนี้</p>
          </div>

          {/* Metric 3: ผู้ป่วยประจำเดือนนี้ */}
          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/20 shadow-xs' 
                : 'bg-slate-50/70 border-slate-200 hover:bg-blue-50/40 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold text-blue-900">ผู้ป่วยเดือนนี้</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-blue-700">
                {monthlyPatientsCount}
              </span>
              <span className="text-xs text-blue-600 font-medium">รอบเจ็บป่วย</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">สถิติสะสมในเดือนปัจจุบัน</p>
          </div>

          {/* Metric 4: รายการทั้งหมด */}
          <div 
            onClick={() => setStatusFilter('all')}
            className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold text-slate-700">ประวัติการเจ็บป่วยสะสม</span>
              <History className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800">
                {illnessEpisodes.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">รอบ</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ทั้งหมดที่บันทึกในระบบ</p>
          </div>

        </div>
      </div>

      {/* 3. Filters & Search Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({illnessEpisodes.length})
            </button>
            <button
              onClick={() => setStatusFilter('กำลังป่วย')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                statusFilter === 'กำลังป่วย'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>กำลังป่วย ({activeIllnessEpisodesCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('หายแล้ว')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                statusFilter === 'หายแล้ว'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>หายแล้ว ({illnessEpisodes.filter(e => e.status === 'หายแล้ว').length})</span>
            </button>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || statusFilter !== 'all' || gradeFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setGradeFilter('all');
                setDateFilter('');
              }}
              className="text-xs text-slate-500 hover:text-rose-600 flex items-center space-x-1 transition-colors self-end md:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* Search & Select Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสนักเรียน, อาการ, Illness ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกชั้นเรียน / ห้อง</option>
              {uniqueGrades.map(g => (
                <option key={g} value={g}>ชั้น/ห้อง {g}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title="กรองตามวันที่เริ่มป่วย หรือ วันที่หาย"
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Main Sickness Status Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <h3 className="font-heading font-bold text-sm text-slate-800">
              รายชื่อนักเรียนในระบบติดตามสถานะเจ็บป่วย
            </h3>
            <span className="text-xs text-slate-400">
              ({filteredEpisodes.length} รายการ)
            </span>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            กดปุ่ม <strong className="text-emerald-700">"หายแล้ว"</strong> เพื่อปิดรอบการเจ็บป่วยโดยไม่ต้องสร้างรายการบริการใหม่
          </div>
        </div>

        {filteredEpisodes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h4 className="font-heading font-semibold text-slate-700">
              ไม่พบข้อมูลสถานะการเจ็บป่วยที่ตรงกับเงื่อนไข
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              ลองเปลี่ยนคำค้นหา หรือเมื่อนักเรียนมาห้องพยาบาลและเลือก "กำลังป่วย" ระบบจะสร้างข้อมูลในตารางนี้โดยอัตโนมัติ
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-4">รหัสเจ็บป่วย</th>
                  <th className="py-3.5 px-4">นักเรียน</th>
                  <th className="py-3.5 px-4">ชั้น/ห้อง</th>
                  <th className="py-3.5 px-4">อาการที่พบ</th>
                  <th className="py-3.5 px-4">วันที่เริ่มป่วย</th>
                  <th className="py-3.5 px-4">วันที่หาย</th>
                  <th className="py-3.5 px-4 text-center">มาห้องพยาบาล</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredEpisodes.map(ep => {
                  const student = studentMap.get(ep.studentId);
                  const isSick = ep.status === 'กำลังป่วย';
                  const daysSick = getDaysSick(ep.startDate, ep.recoveredDate);

                  return (
                    <tr 
                      key={ep.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSick ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* 1. รหัสการเจ็บป่วย */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {ep.illnessCode}
                        </span>
                      </td>

                      {/* 2. ข้อมูลนักเรียน */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => onSelectStudent(ep.studentId)}
                          className="flex items-center space-x-3 cursor-pointer group"
                        >
                          <img
                            src={student?.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                            alt={ep.studentName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-teal-500 transition-all flex-shrink-0"
                          />
                          <div>
                            <div className="font-heading font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center space-x-1.5">
                              <span>{ep.studentName}</span>
                              {ep.nickname && (
                                <span className="text-[11px] font-normal text-slate-500">
                                  ({ep.nickname})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              ID: {ep.studentCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. ชั้น / ห้อง */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {ep.classroom || student?.classroom || '-'}
                        </span>
                      </td>

                      {/* 4. อาการ */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(ep.symptoms || []).map((s, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        {ep.symptomDetails && (
                          <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[200px]" title={ep.symptomDetails}>
                            {ep.symptomDetails}
                          </p>
                        )}
                      </td>

                      {/* 5. วันที่เริ่มป่วย */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {formatThaiDateNumeric(ep.startDate)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatThaiDatePattern(ep.startDate).slice(0, 16)}
                        </div>
                      </td>

                      {/* 6. วันที่หาย */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {ep.recoveredDate ? (
                          <div>
                            <div className="font-medium text-emerald-800 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{formatThaiDateNumeric(ep.recoveredDate)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              (ป่วยนาน {daysSick} วัน)
                            </div>
                          </div>
                        ) : (
                          <div className="text-rose-700 font-semibold text-[11px] flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            <span>ยังไม่หาย ({daysSick} วันแล้ว)</span>
                          </div>
                        )}
                      </td>

                      {/* 7. จำนวนครั้งที่มาห้องพยาบาล */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span 
                          onClick={() => setViewingEpisode(ep)}
                          className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 cursor-pointer hover:bg-teal-100 transition-colors"
                          title="คลิกดูประวัติการมาห้องพยาบาลในรอบเจ็บป่วยนี้"
                        >
                          {(ep.visitIds || []).length} ครั้ง
                        </span>
                      </td>

                      {/* 8. สถานะ (กำลังป่วย / หายแล้ว) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isSick ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5 animate-pulse" />
                            กำลังป่วย
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                            หายแล้ว
                          </span>
                        )}
                      </td>

                      {/* 9. การจัดการ */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* ปุ่ม "หายแล้ว" (เมื่อเด็กหายป่วยแล้วแต่ไม่ได้มาห้องพยาบาลอีก) */}
                          {isSick ? (
                            <button
                              onClick={() => handleOpenRecoveryModal(ep)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                              title="คลิกเพื่อบันทึกว่าหายป่วยแล้วโดยไม่ต้องสร้างการรับบริการใหม่"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>หายแล้ว</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => reopenIllnessEpisode(ep.id)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors"
                              title="เปิดติดตามอาการใหม่ (กรณีมีอาการกำเริบ)"
                            >
                              เปิดใหม่
                            </button>
                          )}

                          {/* บันทึกรับบริการเพิ่มในรอบนี้ */}
                          <button
                            onClick={() => onNewVisitForStudent?.(ep.studentId, ep.id)}
                            className="p-1.5 rounded-xl border border-teal-200 hover:bg-teal-50 text-teal-700 transition-colors"
                            title="บันทึกการรับบริการห้องพยาบาลเพิ่มสำหรับนักเรียนคนนี้"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* ดูประวัติฉบับเต็ม */}
                          <button
                            onClick={() => onSelectStudent(ep.studentId)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="ดูประวัติการรักษาทั้งหมดของนักเรียนคนนี้"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal: บันทึกว่าหายป่วยแล้ว (Direct Recovery Closure) */}
      {recoveringEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    บันทึกว่าหายป่วยแล้ว
                  </h3>
                  <p className="text-xs text-slate-500">
                    รหัสเจ็บป่วย: <strong className="font-mono text-slate-800">{recoveringEpisode.illnessCode}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRecoveringEpisode(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student mini info */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">
                {recoveringEpisode.studentName} (ห้อง {recoveringEpisode.classroom})
              </div>
              <div className="text-slate-600">
                อาการ: <strong>{recoveringEpisode.symptoms.join(', ')}</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                เริ่มป่วยเมื่อ: {formatThaiDateNumeric(recoveringEpisode.startDate)} ({formatThaiDatePattern(recoveringEpisode.startDate)})
              </div>
            </div>

            {/* Input: Recovery Date */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                วันที่หายป่วย *
              </label>
              <input
                type="date"
                required
                value={recoveryDate}
                onChange={e => setRecoveryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
              {recoveryDate && (
                <p className="text-[11px] text-emerald-700">
                  🗓️ {formatThaiDatePattern(recoveryDate)} (รวมระยะเวลาเจ็บป่วย {getDaysSick(recoveringEpisode.startDate, recoveryDate)} วัน)
                </p>
              )}
            </div>

            {/* Input: Recovery Note */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                บันทึกเพิ่มเติม / ข้อสังเกตเมื่อหายป่วย
              </label>
              <textarea
                rows={3}
                value={recoveryNote}
                onChange={e => setRecoveryNote(e.target.value)}
                placeholder="ระบุข้อสังเกต เช่น อาการไข้ลดลง ไม่มีอาการไอแล้ว..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notice */}
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                ระบบจะอัปเดตสถานะเป็น "หายแล้ว" โดยตรงในฐานข้อมูล โดยไม่ต้องสร้างรายการรับบริการห้องพยาบาลเพิ่มหากนักเรียนไม่ได้มาห้องพยาบาล
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRecoveringEpisode(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRecovery}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันหายป่วยแล้ว</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Modal: ดูรายละเอียดการมาห้องพยาบาลในรอบเจ็บป่วยนี้ (Episode Visits Summary) */}
      {viewingEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    ประวัติการรับบริการในรอบการเจ็บป่วย: {viewingEpisode.illnessCode}
                  </h3>
                  <p className="text-xs text-slate-500">
                    นักเรียน: <strong className="text-slate-800">{viewingEpisode.studentName}</strong> (ห้อง {viewingEpisode.classroom})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingEpisode(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    ช่วงเวลาการป่วย: {formatThaiDateNumeric(viewingEpisode.startDate)} – {viewingEpisode.recoveredDate ? formatThaiDateNumeric(viewingEpisode.recoveredDate) : 'ปัจจุบัน (ยังไม่หาย)'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    viewingEpisode.status === 'กำลังป่วย' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {viewingEpisode.status}
                  </span>
                </div>
                <div className="text-slate-600">
                  อาการ: <strong>{viewingEpisode.symptoms.join(', ')}</strong> {viewingEpisode.symptomDetails ? `(${viewingEpisode.symptomDetails})` : ''}
                </div>
                {viewingEpisode.recoveryNote && (
                  <div className="text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    บันทึกการหายป่วย: {viewingEpisode.recoveryNote}
                  </div>
                )}
              </div>

              <h4 className="font-heading font-bold text-xs text-slate-700 flex items-center space-x-1.5 pt-2">
                <History className="w-4 h-4 text-teal-600" />
                <span>รายการรับบริการที่บันทึกไว้ในรอบนี้ ({viewingEpisode.visitIds.length} ครั้ง):</span>
              </h4>

              {viewingEpisode.visitIds.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center">ยังไม่มีบันทึกการมารับบริการที่เชื่อมโยง</p>
              ) : (
                <div className="space-y-2">
                  {viewingEpisode.visitIds.map(vId => {
                    const visitRecord = visits.find(v => v.id === vId);
                    if (!visitRecord) return null;

                    return (
                      <div 
                        key={vId}
                        className="p-3 rounded-xl border border-slate-200 hover:border-teal-300 bg-white transition-all text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-teal-800">
                            {visitRecord.visitNumber}
                          </span>
                          <span className="text-slate-500 font-medium">
                            🗓️ {formatThaiDateNumeric(visitRecord.visitDate)} เวลา {visitRecord.visitTime} น.
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {(visitRecord.symptoms || []).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[10px]">
                              {s}
                            </span>
                          ))}
                          {visitRecord.symptomStatus && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              visitRecord.symptomStatus === 'กำลังป่วย' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              สถานะ: {visitRecord.symptomStatus}
                            </span>
                          )}
                        </div>

                        {visitRecord.treatmentDetails && (
                          <div className="text-slate-600 text-[11px]">
                            การดูแล: {visitRecord.treatmentDetails}
                          </div>
                        )}

                        {(visitRecord.dispensedMedicines || []).length > 0 && (
                          <div className="text-[11px] text-teal-800">
                            ยาที่จ่าย: {visitRecord.dispensedMedicines?.map(m => `${m.medicineName} (${m.quantity} ${m.unit})`).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const sId = viewingEpisode.studentId;
                  setViewingEpisode(null);
                  onSelectStudent(sId);
                }}
                className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center space-x-1"
              >
                <span>ดูประวัติการรักษาทั้งหมดของนักเรียน</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setViewingEpisode(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                ปิด
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
