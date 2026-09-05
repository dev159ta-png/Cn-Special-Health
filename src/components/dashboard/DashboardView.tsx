import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { 
  Users, 
  UserCheck, 
  HeartHandshake, 
  AlertOctagon, 
  Pill, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Activity, 
  Sparkles,
  Heart,
  HeartPulse,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string, subTab?: string, param?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { 
    currentUser,
    students, 
    filteredStudentsForUser, 
    visits, 
    medicines, 
    systemConfig,
    lowStockMedicinesCount,
    expiringMedicinesCount,
    expiredMedicinesCount,
    activeIllnessEpisodesCount
  } = useApp();

  // Filters
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterDisability, setFilterDisability] = useState<string>('all');
  const [symptomsPeriod, setSymptomsPeriod] = useState<'1d' | '3d' | '7d' | '30d' | 'all'>('all');

  // Filtered Students
  const activeStudents = useMemo(() => {
    return filteredStudentsForUser.filter(s => {
      if (filterGrade !== 'all' && s.grade !== filterGrade) return false;
      if (filterClassroom !== 'all' && s.classroom !== filterClassroom) return false;
      if (filterGender !== 'all' && s.gender !== filterGender) return false;
      if (filterDisability !== 'all' && !s.disabilities.some(d => d.typeId === filterDisability)) return false;
      return true;
    });
  }, [filteredStudentsForUser, filterGrade, filterClassroom, filterGender, filterDisability]);

  // Visits today & total
  const todayStr = new Date().toISOString().slice(0, 10);
  const visitsToday = visits.filter(v => v.visitDate === todayStr);

  // Student metrics
  const totalStudents = activeStudents.length;
  const maleCount = activeStudents.filter(s => s.gender === 'ชาย').length;
  const femaleCount = activeStudents.filter(s => s.gender === 'หญิง').length;
  const withChronicDiseases = activeStudents.filter(s => (s.chronicDiseases || []).length > 0).length;
  const withDrugAllergies = activeStudents.filter(s => (s.drugAllergies || []).length > 0).length;
  const withFoodAllergies = activeStudents.filter(s => (s.foodAllergies || []).length > 0).length;
  const withMedicalDevices = activeStudents.filter(s => (s.medicalDevices || []).length > 0).length;

  // Disability Type Breakdown (9 types)
  const disabilityStats = useMemo(() => {
    const counts: Record<string, { name: string; count: number; color: string }> = {
      visual: { name: 'การเห็น', count: 0, color: 'bg-indigo-500' },
      hearing: { name: 'การได้ยิน', count: 0, color: 'bg-sky-500' },
      intellectual: { name: 'สติปัญญา', count: 0, color: 'bg-amber-500' },
      physical: { name: 'ร่างกาย/การเคลื่อนไหว', count: 0, color: 'bg-teal-500' },
      learning: { name: 'การเรียนรู้ (LD)', count: 0, color: 'bg-emerald-500' },
      speech: { name: 'การพูดและภาษา', count: 0, color: 'bg-blue-500' },
      behavioral: { name: 'พฤติกรรม/อารมณ์', count: 0, color: 'bg-orange-500' },
      autism: { name: 'ออทิสติก', count: 0, color: 'bg-purple-500' },
      multiple: { name: 'พิการซ้อน', count: 0, color: 'bg-rose-500' }
    };

    activeStudents.forEach(s => {
      (s.disabilities || []).forEach(d => {
        if (counts[d.typeId]) {
          counts[d.typeId].count += 1;
        }
      });
    });

    return Object.entries(counts).map(([id, val]) => ({
      id,
      ...val
    }));
  }, [activeStudents]);

  // Most common chronic diseases
  const topDiseases = useMemo(() => {
    const map: Record<string, number> = {};
    activeStudents.forEach(s => {
      (s.chronicDiseases || []).forEach(c => {
        map[c.diseaseName] = (map[c.diseaseName] || 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [activeStudents]);

  // Most common symptoms in infirmary (with time period filter)
  const topSymptoms = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = visits.filter(v => {
      if (symptomsPeriod === 'all') return true;
      if (!v.visitDate) return false;
      const [y, m, d] = v.visitDate.split('-').map(Number);
      const vDate = new Date(y, m - 1, d);
      const diffTime = today.getTime() - vDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (symptomsPeriod === '1d') return diffDays === 0;
      if (symptomsPeriod === '3d') return diffDays >= 0 && diffDays < 3;
      if (symptomsPeriod === '7d') return diffDays >= 0 && diffDays < 7;
      if (symptomsPeriod === '30d') return diffDays >= 0 && diffDays < 30;
      return true;
    });

    const map: Record<string, number> = {};
    filtered.forEach(v => {
      (v.symptoms || []).forEach(sym => {
        map[sym] = (map[sym] || 0) + 1;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [visits, symptomsPeriod]);

  // Top dispensed medicines
  const topMedicines = useMemo(() => {
    const map: Record<string, { count: number; unit: string }> = {};
    visits.forEach(v => {
      v.dispensedMedicines.forEach(m => {
        if (!map[m.medicineName]) {
          map[m.medicineName] = { count: 0, unit: m.unit };
        }
        map[m.medicineName].count += m.quantity;
      });
    });
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [visits]);

  // Frequent visitors
  const frequentVisitors = useMemo(() => {
    const map: Record<string, { studentName: string; studentId: string; classroom: string; count: number }> = {};
    visits.forEach(v => {
      if (!map[v.studentId]) {
        map[v.studentId] = {
          studentId: v.studentId,
          studentName: v.studentName,
          classroom: v.classroom,
          count: 0
        };
      }
      map[v.studentId].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visits]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-100 text-teal-800">
                แดชบอร์ดภาพรวมสุขภาพ
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ข้อมูลประจำ {formatThaiDatePattern(new Date())}
              </span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 mt-1">
              ระบบสารสนเทศห้องพยาบาลเพื่อการดูแลนักเรียนพิการ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              ติดตามสถิติสุขภาพ อาการป่วย การจ่ายยาตัดสต็อก และเฝ้าระวังความเสี่ยงอย่างทันท่วงที
            </p>
          </div>

          {/* Emergency Quick Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('emergency')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>ค้นหาข้อมูลฉุกเฉินด่วน</span>
            </button>
            {currentUser.role !== 'teacher' && (
              <button
                onClick={() => onNavigate('infirmary', 'new-visit')}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-2 shadow-xs transition-colors"
              >
                <Stethoscope className="w-4 h-4" />
                <span>+ รับนักเรียนเข้าห้องพยาบาล</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">ระดับชั้น</label>
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกระดับชั้น</option>
              <option value="ป.1">ป.1</option>
              <option value="ป.2">ป.2</option>
              <option value="ม.1">ม.1</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">ห้องเรียน</label>
            <select
              value={filterClassroom}
              onChange={e => setFilterClassroom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกห้องเรียน</option>
              {(systemConfig.classrooms || []).map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">เพศ</label>
            <select
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">ประเภทความพิการ</label>
            <select
              value={filterDisability}
              onChange={e => setFilterDisability(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">ทุกประเภทความพิการ</option>
              {(systemConfig.disabilityCategories || []).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sickness Status Alert Banner */}
      {activeIllnessEpisodesCount > 0 && (
        <div 
          onClick={() => onNavigate('infirmary', 'illness-status')}
          className="bg-rose-50/90 border border-rose-300 hover:border-rose-400 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-bold text-sm sm:text-base text-rose-950">
                  เฝ้าระวังอาการ: มีนักเรียนกำลังป่วยอยู่ {activeIllnessEpisodesCount} คน
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
              </div>
              <p className="text-xs text-rose-800/80 mt-0.5">
                คลิกเพื่อดูตารางสถานะเจ็บป่วย (Sickness Status Tracking) ติดตามอาการ หรือบันทึกว่าหายป่วยแล้ว
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-rose-600 group-hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors">
              <span>เปิดตารางสถานะเจ็บป่วย</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Students */}
        <div 
          onClick={() => onNavigate('students', 'list')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">นักเรียนทั้งหมด</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-slate-800">
            {totalStudents} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="text-blue-600 font-medium">ชาย {maleCount}</span>
            <span>•</span>
            <span className="text-rose-600 font-medium">หญิง {femaleCount}</span>
          </div>
        </div>

        {/* Visits Today */}
        <div 
          onClick={() => onNavigate('infirmary', 'visit-history')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ผู้ใช้บริการวันนี้</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-emerald-600">
            {visitsToday.length} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            สะสมทั้งหมด {visits.length} ครั้ง
          </div>
        </div>

        {/* Chronic Diseases */}
        <div 
          onClick={() => onNavigate('students', 'chronic-diseases')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">มีโรคประจำตัว (Card)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-amber-700">
            {withChronicDiseases} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-medium">
            เช่น ลมชัก, หอบหืด
          </div>
        </div>

        {/* Drug Allergy */}
        <div 
          onClick={() => onNavigate('students', 'allergies')}
          className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/40 shadow-2xs hover:border-rose-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-rose-700">⚠️ มีประวัติแพ้ยา (Card)</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-rose-700">
            {withDrugAllergies} <span className="text-xs font-normal text-rose-600">คน</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-semibold">
            มีระบบเตือนก่อนจ่ายยา
          </div>
        </div>

        {/* Medical Devices / Tubes */}
        <div 
          onClick={() => onNavigate('students', 'tubes')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-purple-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ใส่ท่อ/อุปกรณ์ (Card)</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-purple-700">
            {withMedicalDevices} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            NG Tube, ท่อเจาะคอ
          </div>
        </div>

        {/* Medicine Alerts */}
        <div 
          onClick={() => onNavigate('pharmacy', 'low-stock')}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">เตือนคลังยา</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-slate-800">
            {lowStockMedicinesCount + expiringMedicinesCount + expiredMedicinesCount}
            <span className="text-xs font-normal text-slate-500"> รายการ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            ใกล้หมด {lowStockMedicinesCount} / ใกล้หมดอายุ {expiringMedicinesCount}
          </div>
        </div>

      </div>

      {/* Row 2: Disability Classification Graph + Symptoms Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 9 Disability Categories Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-800">
                สัดส่วนประเภทความพิการ 9 ประเภท (กระทรวงศึกษาธิการ)
              </h3>
              <p className="text-xs text-slate-500">
                จำแนกตามจำนวนนักเรียนที่ได้รับการรับรองสิทธิทางการศึกษาพิเศษ
              </p>
            </div>
            <button
              onClick={() => onNavigate('students', 'list')}
              className="text-teal-600 hover:text-teal-700 text-xs font-medium flex items-center space-x-1"
            >
              <span>ดูรายชื่อ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {disabilityStats.map(item => {
              const percentage = totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.name}
                    </span>
                    <span className="text-slate-500">
                      <strong>{item.count}</strong> คน ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Frequent Symptoms */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-base text-slate-800">
                อาการที่พบมากที่สุด
              </h3>
              <span className="text-[11px] font-medium text-slate-400">จากประวัติรับบริการ</span>
            </div>

            {/* Time Period Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-3 text-xs">
              <button
                type="button"
                onClick={() => setSymptomsPeriod('1d')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium text-[11px] text-center transition-all ${
                  symptomsPeriod === '1d'
                    ? 'bg-white text-teal-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 วัน
              </button>
              <button
                type="button"
                onClick={() => setSymptomsPeriod('3d')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium text-[11px] text-center transition-all ${
                  symptomsPeriod === '3d'
                    ? 'bg-white text-teal-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3 วัน
              </button>
              <button
                type="button"
                onClick={() => setSymptomsPeriod('7d')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium text-[11px] text-center transition-all ${
                  symptomsPeriod === '7d'
                    ? 'bg-white text-teal-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 วัน
              </button>
              <button
                type="button"
                onClick={() => setSymptomsPeriod('30d')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium text-[11px] text-center transition-all ${
                  symptomsPeriod === '30d'
                    ? 'bg-white text-teal-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 เดือน
              </button>
              <button
                type="button"
                onClick={() => setSymptomsPeriod('all')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-medium text-[11px] text-center transition-all ${
                  symptomsPeriod === 'all'
                    ? 'bg-white text-teal-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
            </div>

            <div className="space-y-2.5 mt-2">
              {topSymptoms.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีข้อมูลการเข้ารับบริการ</p>
              ) : (
                topSymptoms.map(([symptom, count], idx) => (
                  <div key={symptom} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{symptom}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white text-slate-700 border border-slate-200">
                      {count} ครั้ง
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('infirmary', 'visit-history')}
              className="w-full py-2 rounded-xl text-center text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              ดูสถิติการรักษาทั้งหมด →
            </button>
          </div>
        </div>

      </div>

      {/* Row 3: Top Dispensed Drugs + Frequent Visitors + Medical Tube Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Dispensed Drugs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-800">
              ยาที่จ่ายมากที่สุด
            </h3>
            <Pill className="w-4 h-4 text-teal-600" />
          </div>

          <div className="space-y-2">
            {topMedicines.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีการจ่ายยา</p>
            ) : (
              topMedicines.map(([name, data], idx) => (
                <div key={name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-medium text-slate-800 block truncate">{name}</span>
                  </div>
                  <span className="font-bold text-teal-700 flex-shrink-0">
                    {data.count} {data.unit}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('pharmacy', 'dispense-history')}
            className="w-full mt-4 text-xs font-medium text-teal-600 hover:text-teal-700 text-center block"
          >
            ดูประวัติการจ่ายยาในคลัง →
          </button>
        </div>

        {/* Frequent Infirmary Visitors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-800">
              นักเรียนที่เข้าห้องพยาบาลบ่อย
            </h3>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>

          <div className="space-y-2">
            {frequentVisitors.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีข้อมูล</p>
            ) : (
              frequentVisitors.map((item, idx) => (
                <div 
                  key={item.studentId}
                  onClick={() => onNavigate('students', 'health', item.studentId)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-800 block truncate">{item.studentName}</span>
                    <span className="text-[11px] text-slate-500">ห้อง {item.classroom}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-xs flex-shrink-0">
                    {item.count} ครั้ง
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('infirmary', 'visit-history')}
            className="w-full mt-4 text-xs font-medium text-teal-600 hover:text-teal-700 text-center block"
          >
            เปิดดูรายละเอียดผู้เข้ารับบริการ →
          </button>
        </div>

        {/* Medical Devices Watchlist */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-800">
              รายชื่อนักเรียนที่มีสาย/อุปกรณ์พิเศษ
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
          </div>

          <div className="space-y-2">
            {activeStudents.filter(s => (s.medicalDevices || []).length > 0).map(s => (
              <div 
                key={s.id}
                onClick={() => onNavigate('students', 'health', s.id)}
                className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 hover:border-purple-300 flex items-start space-x-2.5 cursor-pointer transition-colors"
              >
                <img
                  src={s.photoUrl}
                  alt={s.nickname}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0 ring-1 ring-purple-200"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">{s.nickname} ({s.firstName})</span>
                    <span className="text-[10px] text-purple-700 font-semibold">{s.classroom}</span>
                  </div>
                  <p className="text-[11px] text-purple-900 truncate mt-0.5">
                    {(s.medicalDevices || []).map(m => m.deviceType).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('students', 'health')}
            className="w-full mt-4 text-xs font-medium text-purple-700 hover:text-purple-800 text-center block"
          >
            จัดการข้อมูลอุปกรณ์ทางการแพทย์ทั้งหมด →
          </button>
        </div>

      </div>

    </div>
  );
};
