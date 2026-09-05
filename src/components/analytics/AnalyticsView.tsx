import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  Pill, 
  Ambulance, 
  Activity,
  Download,
  Filter,
  PieChart
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { visits, students, medicines, systemConfig } = useApp();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'term' | 'year'>('month');

  // Total metrics
  const totalVisits = visits.length;
  const totalReferrals = visits.filter(v => v.referral !== undefined).length;
  const totalDispensedUnits = visits.reduce((acc, v) => {
    return acc + v.dispensedMedicines.reduce((sum, m) => sum + m.quantity, 0);
  }, 0);

  // Frequent Symptoms
  const symptomBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    visits.forEach(v => {
      v.symptoms.forEach(s => {
        map[s] = (map[s] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [visits]);

  // Visits by Disability Category
  const disabilityVisits = useMemo(() => {
    const map: Record<string, number> = {};
    visits.forEach(v => {
      const student = students.find(s => s.id === v.studentId);
      if (student) {
        student.disabilities.forEach(d => {
          map[d.typeName] = (map[d.typeName] || 0) + 1;
        });
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [visits, students]);

  // Visits by Grade & Classroom
  const classroomVisits = useMemo(() => {
    const map: Record<string, number> = {};
    visits.forEach(v => {
      const key = `ห้อง ${v.classroom}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [visits]);

  // Peak Service Hours (ช่วงเวลาที่มีผู้มาใช้บริการ)
  const peakHours = useMemo(() => {
    const slots = [
      { label: '08:00 - 10:00 (เช้า)', count: 0 },
      { label: '10:00 - 12:00 (สาย)', count: 0 },
      { label: '12:00 - 13:00 (พักเที่ยง)', count: 0 },
      { label: '13:00 - 15:00 (บ่าย)', count: 0 },
      { label: '15:00 - 16:30 (หลังเลิกเรียน)', count: 0 }
    ];

    visits.forEach(v => {
      const hour = parseInt(v.visitTime.slice(0, 2)) || 10;
      if (hour < 10) slots[0].count += 1;
      else if (hour < 12) slots[1].count += 1;
      else if (hour === 12) slots[2].count += 1;
      else if (hour < 15) slots[3].count += 1;
      else slots[4].count += 1;
    });

    return slots;
  }, [visits]);

  // Top Medicines Dispensed
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
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [visits]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-100 text-teal-800">
              ระบบสถิติและการวิเคราะห์เชิงลึก
            </span>
            <span className="text-xs text-slate-500">
              ปีการศึกษา 2568 (ภาคเรียนที่ 1)
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-800 mt-1">
            Dashboard & Analytics ระบบห้องพยาบาล
          </h2>
          <p className="text-xs text-slate-500">
            วิเคราะห์แนวโน้มสุขภาพ สถิติโรคที่พบบ่อย สถิติการจ่ายยา และช่วงเวลาที่มีการรับบริการสูงสุด
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50 text-xs">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              timeframe === 'week' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-600'
            }`}
          >
            รายสัปดาห์
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              timeframe === 'month' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-600'
            }`}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setTimeframe('term')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              timeframe === 'term' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-600'
            }`}
          >
            รายภาคเรียน
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              timeframe === 'year' ? 'bg-white shadow-xs text-teal-700 font-bold' : 'text-slate-600'
            }`}
          >
            รายปีการศึกษา
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>ผู้รับบริการทั้งหมด</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-slate-800">{totalVisits} <span className="text-xs font-normal text-slate-500">ครั้ง</span></div>
          <span className="text-[11px] text-teal-600 font-medium">บันทึกครบถ้วน 100%</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>ยาที่จ่ายทั้งหมด</span>
            <Pill className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-blue-700">{totalDispensedUnits} <span className="text-xs font-normal text-slate-500">หน่วย</span></div>
          <span className="text-[11px] text-slate-500">ตัดสต็อกอัตโนมัติ</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>การส่งต่อโรงพยาบาล</span>
            <Ambulance className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-rose-700">{totalReferrals} <span className="text-xs font-normal text-slate-500">ราย</span></div>
          <span className="text-[11px] text-rose-600 font-medium">แจ้งผู้ปกครองและ 1669</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>ช่วงเวลาที่มีการรับบริการมากสุด</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-heading font-bold text-amber-800">
            {peakHours.sort((a, b) => b.count - a.count)[0]?.label || '-'}
          </div>
          <span className="text-[11px] text-slate-500">ช่วงพักกลางวันและหลังเที่ยง</span>
        </div>
      </div>

      {/* Row 1: Symptoms Bar Distribution & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Symptoms Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <h3 className="font-heading font-bold text-base text-slate-800 mb-1">
            สถิติอาการเจ็บป่วยที่พบมากที่สุด (Common Symptoms)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            จัดอันดับอาการที่นักเรียนเข้ารับการรักษาในห้องพยาบาล
          </p>

          <div className="space-y-3">
            {symptomBreakdown.slice(0, 7).map(([sym, count]) => {
              const pct = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
              return (
                <div key={sym} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{sym}</span>
                    <span className="text-slate-500 font-bold">{count} ครั้ง ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-teal-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Service Hours Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <h3 className="font-heading font-bold text-base text-slate-800 mb-1">
            ช่วงเวลาที่มีการรับบริการมากที่สุด (Peak Hours)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            วิเคราะห์ช่วงเวลาเพื่อการจัดเวรครูอนามัยประจำการอย่างเหมาะสม
          </p>

          <div className="space-y-3">
            {peakHours.map(slot => {
              const maxCount = Math.max(...peakHours.map(p => p.count), 1);
              const pct = Math.round((slot.count / maxCount) * 100);
              return (
                <div key={slot.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{slot.label}</span>
                    </span>
                    <span className="font-bold text-amber-700">{slot.count} ครั้ง</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, slot.count > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Row 2: Visits by Disability Category & Visits by Classroom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visits by Disability Type */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <h3 className="font-heading font-bold text-base text-slate-800 mb-1">
            สถิติการเจ็บป่วยแยกตามประเภทความพิการ
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            ช่วยวางแผนการดูแลและเตรียมเวชภัณฑ์เฉพาะสำหรับแต่ละกลุ่มความพิการ
          </p>

          <div className="space-y-2.5">
            {disabilityVisits.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-medium text-slate-800">{name}</span>
                <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold">
                  {count} ครั้ง
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Dispensed Medicines Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <h3 className="font-heading font-bold text-base text-slate-800 mb-1">
            สถิติยาและเวชภัณฑ์ที่มีการใช้สูงสุด (Top Medicines Used)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            คำนวณจากประวัติการตัดสต็อก เพื่อเตรียมงบประมาณและสั่งซื้อสำรอง
          </p>

          <div className="space-y-2.5">
            {topMedicines.slice(0, 6).map(([name, data]) => (
              <div key={name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-medium text-slate-800 truncate pr-2">{name}</span>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold flex-shrink-0">
                  {data.count} {data.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
