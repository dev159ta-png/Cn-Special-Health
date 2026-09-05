import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { InfirmaryVisit, Student, IllnessEpisode } from '../../types';
import { formatThaiDatePattern, formatThaiDateNumeric } from '../../utils/dateUtils';
import { VisitDetailModal } from './VisitDetailModal';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar, 
  History, 
  Clock, 
  Pill, 
  Stethoscope, 
  HeartPulse, 
  AlertOctagon, 
  AlertTriangle, 
  Ambulance, 
  Printer, 
  FileText, 
  Plus, 
  CheckCircle2,
  ChevronRight,
  User,
  RotateCcw,
  Sparkles,
  X,
  Info
} from 'lucide-react';

interface StudentIndividualVisitHistoryViewProps {
  studentId: string;
  onBack: () => void;
  onNewVisit?: (studentId: string) => void;
  onSelectOtherStudent?: (studentId: string) => void;
  showBackButton?: boolean;
}

export const StudentIndividualVisitHistoryView: React.FC<StudentIndividualVisitHistoryViewProps> = ({
  studentId,
  onBack,
  onNewVisit,
  onSelectOtherStudent,
  showBackButton = true
}) => {
  const { students, visits, illnessEpisodes, markIllnessRecovered, currentUser } = useApp();

  // Selected visit for Detail Modal (Requirement 2 & 4)
  const [selectedVisitForModal, setSelectedVisitForModal] = useState<InfirmaryVisit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Filter by specific illness episode (null = show all)
  const [selectedEpisodeFilter, setSelectedEpisodeFilter] = useState<string | null>(null);

  // Recovery modal for episode in this view
  const [recoveringEpisode, setRecoveringEpisode] = useState<IllnessEpisode | null>(null);
  const [recoveryDate, setRecoveryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [recoveryNote, setRecoveryNote] = useState<string>('อาการดีขึ้น หายป่วยแล้ว');

  // Filters (Requirement 6)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterSymptom, setFilterSymptom] = useState<string>('all');
  const [filterOutcome, setFilterOutcome] = useState<string>('all');
  const [filterReferral, setFilterReferral] = useState<string>('all'); // 'all', 'yes', 'no'

  // 1. Find Student by Student ID (Requirement 5: เชื่อมโยงข้อมูลด้วยรหัสนักเรียน)
  const student = useMemo(() => {
    return students.find(s => s.id === studentId);
  }, [students, studentId]);

  // 1.5 Student Illness Episodes (Requirement 4 Part 1: สรุปประวัติการเจ็บป่วยตามช่วงเวลา)
  const studentEpisodes = useMemo(() => {
    return (illnessEpisodes || [])
      .filter(ep => ep.studentId === studentId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [illnessEpisodes, studentId]);

  // 2. Filter ALL visits belonging strictly to this student (Requirement 5)
  const studentAllVisits = useMemo(() => {
    return visits
      .filter(v => v.studentId === studentId)
      // Sort newest to oldest (Requirement 4: รายการล่าสุด → รายการเก่าสุด)
      .sort((a, b) => {
        const dateTimeA = `${a.visitDate} ${a.visitTime}`;
        const dateTimeB = `${b.visitDate} ${b.visitTime}`;
        return dateTimeB.localeCompare(dateTimeA);
      });
  }, [visits, studentId]);

  // Extract all symptoms from this student's history for dropdown filter
  const allUniqueSymptoms = useMemo(() => {
    const set = new Set<string>();
    studentAllVisits.forEach(v => {
      (v.symptoms || []).forEach(s => set.add(s));
    });
    return Array.from(set);
  }, [studentAllVisits]);

  // 3. Calculate Summary Statistics (Requirement 7: สรุปประวัติ)
  const summaryStats = useMemo(() => {
    const totalVisits = studentAllVisits.length;
    const latestVisit = studentAllVisits.length > 0 ? studentAllVisits[0] : null;

    // อาการที่พบบ่อย (Most common symptom)
    const symptomCount: Record<string, number> = {};
    studentAllVisits.forEach(v => {
      (v.symptoms || []).forEach(sym => {
        symptomCount[sym] = (symptomCount[sym] || 0) + 1;
      });
    });

    let topSymptom = 'ไม่มีข้อมูล';
    let topSymptomCount = 0;
    Object.entries(symptomCount).forEach(([sym, count]) => {
      if (count > topSymptomCount) {
        topSymptom = sym;
        topSymptomCount = count;
      }
    });

    // จำนวนครั้งที่ได้รับยา
    const visitsWithMedicine = studentAllVisits.filter(
      v => (v.dispensedMedicines || []).length > 0
    ).length;

    // จำนวนครั้งที่ส่งต่อ
    const visitsWithReferral = studentAllVisits.filter(
      v => !!v.referral || v.outcome === 'ส่งต่อโรงพยาบาล' || v.outcome === 'เรียกรถพยาบาล (1669)'
    ).length;

    return {
      totalVisits,
      latestVisitDate: latestVisit ? latestVisit.visitDate : null,
      latestVisitTime: latestVisit ? latestVisit.visitTime : null,
      topSymptom: topSymptomCount > 0 ? `${topSymptom} (${topSymptomCount} ครั้ง)` : '-',
      visitsWithMedicine,
      visitsWithReferral
    };
  }, [studentAllVisits]);

  // 4. Apply Filters (Requirement 6: ค้นหาประวัติ)
  const filteredVisits = useMemo(() => {
    return studentAllVisits.filter(v => {
      // Free text search in symptoms, diagnosis, treatment, meds
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchSym = (v.symptoms || []).some(s => s.toLowerCase().includes(q));
        const matchDetails = (v.symptomDetails || '').toLowerCase().includes(q);
        const matchTreatment = (v.treatments || (v as any).treatment || []).some((t: string) => t.toLowerCase().includes(q));
        const matchMed = (v.dispensedMedicines || []).some(m => m.medicineName.toLowerCase().includes(q));
        const matchAttendant = (v.attendantName || '').toLowerCase().includes(q);
        const matchOutcome = (v.outcome || '').toLowerCase().includes(q);
        const matchVn = (v.visitNumber || '').toLowerCase().includes(q);
        const matchDate = v.visitDate.includes(q) || formatThaiDateNumeric(v.visitDate).includes(q);

        if (!matchSym && !matchDetails && !matchTreatment && !matchMed && !matchAttendant && !matchOutcome && !matchVn && !matchDate) {
          return false;
        }
      }

      // Single Date or Date Range filter
      if (filterStartDate && filterEndDate) {
        if (v.visitDate < filterStartDate || v.visitDate > filterEndDate) {
          return false;
        }
      } else if (filterStartDate) {
        if (v.visitDate < filterStartDate) return false;
      } else if (filterEndDate) {
        if (v.visitDate > filterEndDate) return false;
      }

      // Symptom filter
      if (filterSymptom !== 'all') {
        if (!(v.symptoms || []).includes(filterSymptom)) return false;
      }

      // Outcome filter
      if (filterOutcome !== 'all') {
        if (v.outcome !== filterOutcome) return false;
      }

      // Referral filter
      if (filterReferral === 'yes') {
        const hasReferral = !!v.referral || v.outcome === 'ส่งต่อโรงพยาบาล' || v.outcome === 'เรียกรถพยาบาล (1669)';
        if (!hasReferral) return false;
      } else if (filterReferral === 'no') {
        const hasReferral = !!v.referral || v.outcome === 'ส่งต่อโรงพยาบาล' || v.outcome === 'เรียกรถพยาบาล (1669)';
        if (hasReferral) return false;
      }

      // Filter by Illness Episode
      if (selectedEpisodeFilter) {
        if (v.illnessEpisodeId !== selectedEpisodeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [studentAllVisits, searchQuery, filterStartDate, filterEndDate, filterSymptom, filterOutcome, filterReferral, selectedEpisodeFilter]);

  const hasActiveFilters = Boolean(
    searchQuery || filterStartDate || filterEndDate || filterSymptom !== 'all' || filterOutcome !== 'all' || filterReferral !== 'all' || selectedEpisodeFilter
  );

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterSymptom('all');
    setFilterOutcome('all');
    setFilterReferral('all');
    setSelectedEpisodeFilter(null);
  };

  const handleOpenDetailModal = (visit: InfirmaryVisit) => {
    setSelectedVisitForModal(visit);
    setIsDetailModalOpen(true);
  };

  const getOutcomeBadgeStyle = (outcome: string) => {
    switch (outcome) {
      case 'ส่งต่อโรงพยาบาล':
      case 'เรียกรถพยาบาล (1669)':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ติดต่อผู้ปกครอง':
      case 'กลับบ้าน':
      case 'ผู้ปกครองมารับกลับบ้าน':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'พักห้องพยาบาล':
      case 'สังเกตอาการต่อ':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'กลับเข้าชั้นเรียน':
      case 'ดีขึ้น':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* 1. Navigation & Student Profile Header (Requirement 8 & 5) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        
        {/* Top bar with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors self-start cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-teal-700" />
              <span>← กลับไปยังรายการรับบริการทั้งหมด</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 text-teal-800 font-heading font-bold text-sm">
              <History className="w-4 h-4" />
              <span>ประวัติการเข้ารับบริการห้องพยาบาล</span>
            </div>
          )}

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {currentUser.role !== 'teacher' && onNewVisit && (
              <button
                onClick={() => onNewVisit(studentId)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ บันทึกรับบริการใหม่</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center space-x-1"
              title="พิมพ์ประวัติทั้งหมด"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">พิมพ์ประวัติ</span>
            </button>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <img
              src={student?.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
              alt={student ? `${student.firstName} ${student.lastName}` : 'นักเรียน'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-xs"
            />
            {student?.drugAllergies && student.drugAllergies.length > 0 && (
              <span className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full shadow-xs" title="มีประวัติแพ้ยา">
                <AlertOctagon className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900">
                {student ? `${student.prefix} ${student.firstName} ${student.lastName}` : 'นักเรียน'}
              </h3>
              {student?.nickname && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  น้อง{student.nickname}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                ชั้น {student?.classroom || '-'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
              <span>
                รหัสนักเรียน: <strong className="font-mono text-slate-800">{student?.studentCode || studentId}</strong>
              </span>
              <span>•</span>
              <span>
                ครูประจำชั้น: <strong className="text-slate-700">{student?.homeroomTeacher || '-'}</strong>
              </span>
              <span>•</span>
              <span>
                ผู้ปกครอง: <strong className="text-slate-700">{student?.guardianName || '-'} ({student?.guardianPhone || '-'})</strong>
              </span>
            </div>

            {/* Health alert badges */}
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {student?.drugAllergies && student.drugAllergies.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold flex items-center space-x-1">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>แพ้ยา: {student.drugAllergies.map(a => a.drugName).join(', ')}</span>
                </span>
              )}

              {student?.chronicDiseases && student.chronicDiseases.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-xs font-medium flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>โรคประจำตัว: {student.chronicDiseases.map(d => d.diseaseName).join(', ')}</span>
                </span>
              )}

              {student?.specialPrecautions && (
                <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-medium">
                  ⚠️ {student.specialPrecautions}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 2. Top Summary Cards (Requirement 7: สรุปประวัติ) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Metric 1: จำนวนครั้งที่มารับบริการทั้งหมด */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">รับบริการทั้งหมด</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-heading font-bold text-2xl text-teal-900">
              {summaryStats.totalVisits}
            </span>
            <span className="text-xs text-slate-500">ครั้ง</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">ประวัติทั้งหมดในระบบ</p>
        </div>

        {/* Metric 2: วันที่มารับบริการล่าสุด */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">รับบริการล่าสุด</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-bold text-sm text-slate-900 truncate">
            {summaryStats.latestVisitDate ? formatThaiDateNumeric(summaryStats.latestVisitDate) : '-'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate" title={summaryStats.latestVisitDate ? formatThaiDatePattern(summaryStats.latestVisitDate) : '-'}>
            {summaryStats.latestVisitDate ? `${formatThaiDatePattern(summaryStats.latestVisitDate).slice(0, 24)}...` : 'ยังไม่มีประวัติ'}
          </p>
        </div>

        {/* Metric 3: อาการที่พบบ่อย */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">อาการที่พบบ่อย</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading font-bold text-sm text-amber-900 truncate" title={summaryStats.topSymptom}>
            {summaryStats.topSymptom}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">อาการที่มาบ่อยที่สุด</p>
        </div>

        {/* Metric 4: จำนวนครั้งที่ได้รับยา */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ครั้งที่ได้รับยา</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-heading font-bold text-2xl text-emerald-900">
              {summaryStats.visitsWithMedicine}
            </span>
            <span className="text-xs text-slate-500">ครั้ง</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summaryStats.totalVisits > 0 
              ? `คิดเป็น ${Math.round((summaryStats.visitsWithMedicine / summaryStats.totalVisits) * 100)}% ของการมา`
              : '-'}
          </p>
        </div>

        {/* Metric 5: จำนวนครั้งที่ส่งต่อ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-teal-400 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ส่งต่อโรงพยาบาล</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Ambulance className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-heading font-bold text-2xl text-rose-800">
              {summaryStats.visitsWithReferral}
            </span>
            <span className="text-xs text-slate-500">ครั้ง</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">กรณีฉุกเฉิน/ส่งต่อ รพ.</p>
        </div>

      </div>

      {/* ========================================================
          ส่วนที่ 1: สรุปประวัติการเจ็บป่วย (สรุปตามช่วงเวลา / Illness Episodes)
          Requirement 4: แสดงข้อมูลที่จัดกลุ่มตาม Illness ID
          - โรค / อาการ
          - ช่วงเวลา
          - จำนวนครั้งที่มาห้องพยาบาล
          - สถานะ
         ======================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-base text-slate-900">
                  ส่วนที่ 1: สรุปประวัติการเจ็บป่วย (สรุปตามช่วงเวลา)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800">
                  {studentEpisodes.length} รอบการเจ็บป่วย
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                จัดกลุ่มข้อมูลตามรอบการเจ็บป่วย (Illness ID) แสดงช่วงเวลาการป่วยและจำนวนครั้งที่มาห้องพยาบาล
              </p>
            </div>
          </div>

          {selectedEpisodeFilter && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                กำลังกรองเฉพาะรอบ: {studentEpisodes.find(e => e.id === selectedEpisodeFilter)?.illnessCode}
              </span>
              <button
                onClick={() => setSelectedEpisodeFilter(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                title="ยกเลิกการกรองรอบนี้"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {studentEpisodes.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            ยังไม่มีบันทึกรอบการเจ็บป่วย (เมื่อบันทึกรับบริการและเลือก "กำลังป่วย" ระบบจะสร้างรอบการเจ็บป่วยให้อัตโนมัติ)
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {studentEpisodes.map(ep => {
              const isSick = ep.status === 'กำลังป่วย';
              const isSelected = selectedEpisodeFilter === ep.id;

              return (
                <div
                  key={ep.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-xs' 
                      : isSick 
                        ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400' 
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-white border border-slate-200 text-slate-800 shadow-2xs">
                        {ep.illnessCode}
                      </span>
                      {isSick ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1 animate-pulse" />
                          กำลังป่วย
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                          หายแล้ว
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isSick && (
                        <button
                          onClick={() => {
                            setRecoveringEpisode(ep);
                            setRecoveryDate(new Date().toISOString().slice(0, 10));
                            setRecoveryNote('อาการดีขึ้น หายป่วยแล้ว');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                          title="บันทึกว่าหายแล้ว"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>หายแล้ว</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedEpisodeFilter(isSelected ? null : ep.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ แสดงเฉพาะรอบนี้' : 'กรองรอบนี้'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-900 font-medium">
                      <span className="text-slate-500">โรค / อาการ: </span>
                      <strong className="text-amber-950 font-bold">
                        {ep.symptoms.join(', ')}
                      </strong>
                      {ep.symptomDetails && (
                        <span className="text-slate-600 font-normal ml-1">
                          ({ep.symptomDetails})
                        </span>
                      )}
                    </div>

                    <div className="text-slate-700 flex items-center space-x-1">
                      <span className="text-slate-500">ช่วงเวลา: </span>
                      <span className="font-medium">
                        {formatThaiDateNumeric(ep.startDate)} – {ep.recoveredDate ? formatThaiDateNumeric(ep.recoveredDate) : 'ปัจจุบัน (ยังไม่หาย)'}
                      </span>
                    </div>

                    <div className="text-slate-700 flex items-center justify-between pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500">จำนวนครั้งที่มาห้องพยาบาล: </span>
                        <strong className="text-teal-800 font-bold">
                          {ep.visitIds.length} ครั้ง
                        </strong>
                      </div>

                      {ep.recoveredDate && (
                        <span className="text-[11px] text-emerald-700">
                          ✓ หายเมื่อ {formatThaiDateNumeric(ep.recoveredDate)}
                        </span>
                      )}
                    </div>

                    {ep.recoveryNote && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                        บันทึกการหายป่วย: {ep.recoveryNote}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          ส่วนที่ 2: รายการรับบริการแต่ละครั้ง (รายละเอียด)
          Requirement 4: แสดงเฉพาะวันที่เด็กมาห้องพยาบาลจริง
         ======================================================== */}
      {/* 3. Search & Filters (Requirement 6: ค้นหาประวัติ) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <div>
              <h4 className="font-heading font-bold text-sm text-slate-800">
                ส่วนที่ 2: รายการรับบริการแต่ละครั้ง (รายละเอียด)
              </h4>
              <p className="text-[11px] text-slate-400">
                แสดงบันทึกเฉพาะวันที่เด็กมาห้องพยาบาลจริง พร้อมค้นหาและกรองข้อมูล
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 ml-2">
              {filteredVisits.length} / {studentAllVisits.length} รายการ
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาอาการ, ยา, ผู้ตรวจ..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Date Range: Start & End Date */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                title="ตั้งแต่วันที่"
                className="w-full px-2 py-2 rounded-xl border border-slate-300 bg-white text-slate-700"
              />
            </div>
            <div>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                title="ถึงวันที่"
                className="w-full px-2 py-2 rounded-xl border border-slate-300 bg-white text-slate-700"
              />
            </div>
          </div>

          {/* Symptom Filter */}
          <div>
            <select
              value={filterSymptom}
              onChange={e => setFilterSymptom(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700"
            >
              <option value="all">ทุกอาการสำคัญ</option>
              {allUniqueSymptoms.map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </div>

          {/* Outcome & Referral Filter */}
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={filterOutcome}
              onChange={e => setFilterOutcome(e.target.value)}
              className="w-full py-2 px-2 rounded-xl border border-slate-300 bg-white text-slate-700"
            >
              <option value="all">ทุกผลการรักษา</option>
              <option value="กลับเข้าชั้นเรียน">กลับเข้าชั้นเรียน</option>
              <option value="พักห้องพยาบาล">พักห้องพยาบาล</option>
              <option value="ติดต่อผู้ปกครอง">ติดต่อผู้ปกครอง</option>
              <option value="ผู้ปกครองมารับกลับบ้าน">กลับบ้าน</option>
              <option value="ส่งต่อโรงพยาบาล">ส่งต่อ รพ.</option>
              <option value="ดีขึ้น">ดีขึ้น</option>
            </select>

            <select
              value={filterReferral}
              onChange={e => setFilterReferral(e.target.value)}
              className="w-full py-2 px-2 rounded-xl border border-slate-300 bg-white text-slate-700"
            >
              <option value="all">การส่งต่อ (ทั้งหมด)</option>
              <option value="yes">มีการส่งต่อ รพ.</option>
              <option value="no">ไม่มีการส่งต่อ</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. Visits Timeline / Cards List (Requirement 4: รายการล่าสุด → รายการเก่าสุด) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="font-heading font-bold text-sm text-slate-700 flex items-center space-x-2">
            <span>ลำดับประวัติการรับบริการ (เรียงจากล่าสุด → เก่าสุด)</span>
            <span className="text-xs text-slate-400 font-normal">
              (คลิกที่รายการใดก็ได้เพื่อดูข้อมูลฉบับเต็ม)
            </span>
          </h4>
        </div>

        {filteredVisits.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h5 className="font-heading font-semibold text-slate-700">
              {hasActiveFilters ? 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มีประวัติการเข้ารับบริการของนักเรียนคนนี้'}
            </h5>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {hasActiveFilters 
                ? 'ลองปรับเปลี่ยนช่วงวันที่ อาการสำคัญ หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงข้อมูลทั้งหมด'
                : 'เมื่อนักเรียนมาใช้บริการห้องพยาบาล สามารถกดปุ่ม "+ บันทึกรับบริการใหม่" เพื่อบันทึกประวัติ'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVisits.map((visit, index) => (
              <div
                key={visit.id}
                onClick={() => handleOpenDetailModal(visit)}
                className="group bg-white hover:bg-slate-50/80 rounded-2xl p-5 border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative"
              >
                {/* Index badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  
                  {/* Date & Time Header (Requirement 4 Format) */}
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-heading font-bold text-sm sm:text-base text-teal-950">
                          {formatThaiDateNumeric(visit.visitDate)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium hidden md:inline">
                          ({formatThaiDatePattern(visit.visitDate)})
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          ⏰ {visit.visitTime} น.
                        </span>
                        {visit.illnessEpisodeId && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            {studentEpisodes.find(ep => ep.id === visit.illnessEpisodeId)?.illnessCode || 'Illness ID'}
                          </span>
                        )}
                        {visit.symptomStatus === 'กำลังป่วย' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            <span>กำลังป่วย</span>
                          </span>
                        )}
                        {visit.symptomStatus === 'หายแล้ว' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ หายแล้ว
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-teal-700 font-medium">
                        เลขที่ VN: {visit.visitNumber}
                      </span>
                    </div>
                  </div>

                  {/* Outcome Badge & Detail Button */}
                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getOutcomeBadgeStyle(visit.outcome)}`}>
                      ผล: {visit.outcome}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailModal(visit);
                      }}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-400 group-hover:text-teal-600 group-hover:border-teal-300 hover:bg-white transition-colors"
                      title="คลิกเพื่อดูรายละเอียดฉบับเต็ม"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Content strictly matching prompt format:
                    อาการ: ...
                    การรักษา: ...
                    ผลการให้บริการ: ...
                    ผู้ให้บริการ: ...
                */}
                <div className="space-y-2 text-xs sm:text-sm">
                  
                  {/* อาการ (Symptoms) */}
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-700 min-w-[90px] flex-shrink-0">
                      อาการ:
                    </span>
                    <div className="text-slate-800 flex-1">
                      <span className="font-semibold text-amber-900">
                        {(visit.symptoms || []).join(', ')}
                      </span>
                      {visit.symptomDetails && (
                        <span className="text-slate-600 block sm:inline sm:ml-1 font-normal">
                          — {visit.symptomDetails}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* การรักษา (Treatment) */}
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-700 min-w-[90px] flex-shrink-0">
                      การรักษา:
                    </span>
                    <div className="text-slate-800 flex-1">
                      <span className="font-medium">
                        {(visit.treatments || (visit as any).treatment || []).join(', ')}
                      </span>
                      {visit.treatmentDetails && (
                        <span className="text-slate-600 block sm:inline sm:ml-1 font-normal">
                          ({visit.treatmentDetails})
                        </span>
                      )}

                      {/* Dispensed medicines summary */}
                      {(visit.dispensedMedicines || []).length > 0 && (
                        <div className="mt-1 flex items-center space-x-1 text-teal-800 font-medium">
                          <Pill className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>
                            ยาที่ได้รับ: {(visit.dispensedMedicines || []).map(m => `${m.medicineName} (${m.quantity} ${m.unit}) - ${m.dosage}`).join('; ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ผลการให้บริการ (Outcome) */}
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-700 min-w-[90px] flex-shrink-0">
                      ผลการให้บริการ:
                    </span>
                    <div className="text-slate-800 flex-1 font-medium">
                      <span>{visit.outcome}</span>
                      {visit.outcomeDetails && (
                        <span className="text-slate-500 font-normal ml-1">
                          ({visit.outcomeDetails})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ผู้ให้บริการ (Attendant) */}
                  <div className="flex items-start space-x-2 pt-1 border-t border-slate-100/80">
                    <span className="font-bold text-slate-500 min-w-[90px] flex-shrink-0">
                      ผู้ให้บริการ:
                    </span>
                    <div className="text-slate-700 flex-1">
                      <span>{visit.attendantName || 'พว. วันเพ็ญ สุขใจ (พยาบาลวิชาชีพ)'}</span>
                    </div>
                  </div>

                </div>

                {/* Additional footer: Vital Signs quick pill bar */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                    <span>T: <strong className="text-slate-700">{visit.vitals?.temperature || '-'}°C</strong></span>
                    <span>BP: <strong className="text-slate-700">{visit.vitals?.bloodPressureSys || '-'}/{visit.vitals?.bloodPressureDia || '-'}</strong></span>
                    <span>PR: <strong className="text-slate-700">{visit.vitals?.pulse || '-'} bpm</strong></span>
                    <span>O2: <strong className="text-slate-700">{visit.vitals?.oxygenSaturation || '-'}%</strong></span>
                  </div>

                  <span className="text-teal-600 group-hover:text-teal-700 font-semibold flex items-center space-x-1">
                    <span>คลิกเพื่อเปิดดูรายละเอียดฉบับเต็ม</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Visit Detail Modal (Requirement 2 & 4: แต่ละรายการในประวัติสามารถคลิกเพื่อเปิดดูรายละเอียดได้) */}
      <VisitDetailModal
        visit={selectedVisitForModal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onViewStudentHistory={(sId) => {
          setIsDetailModalOpen(false);
          // If viewing this student, we are already here
          if (onSelectOtherStudent && sId !== studentId) {
            onSelectOtherStudent(sId);
          }
        }}
        onPrintSlip={(v) => {
          // Can trigger print
          window.print();
        }}
      />

      {/* Modal บันทึกว่าหายป่วยแล้ว (Closure of illness episode) */}
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

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">
                อาการ: {recoveringEpisode.symptoms.join(', ')}
              </div>
              <div className="text-slate-500 text-[11px]">
                เริ่มป่วยเมื่อ: {formatThaiDateNumeric(recoveringEpisode.startDate)} ({formatThaiDatePattern(recoveringEpisode.startDate)})
              </div>
            </div>

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
                  🗓️ {formatThaiDatePattern(recoveryDate)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                บันทึกเพิ่มเติม / ข้อสังเกตเมื่อหายป่วย
              </label>
              <textarea
                rows={3}
                value={recoveryNote}
                onChange={e => setRecoveryNote(e.target.value)}
                placeholder="ระบุข้อสังเกต เช่น ไม่มีอาการไข้แล้ว อาการดีขึ้น..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                ระบบจะอัปเดตสถานะเป็น "หายแล้ว" โดยตรงในข้อมูลรอบเจ็บป่วย ไม่สร้างรายการรับบริการซ้ำซ้อน
              </span>
            </div>

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
                onClick={() => {
                  markIllnessRecovered(recoveringEpisode.id, recoveryDate, recoveryNote);
                  setRecoveringEpisode(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ยืนยันหายป่วยแล้ว</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
