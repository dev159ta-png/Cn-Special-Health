import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { 
  ShieldAlert, 
  Phone, 
  Ambulance, 
  AlertTriangle, 
  Heart, 
  Activity, 
  QrCode, 
  Search, 
  Filter, 
  Stethoscope, 
  User, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { QRCodeModal } from '../common/QRCodeModal';
import { StudentAvatar } from '../common/StudentAvatar';

interface EmergencyViewProps {
  onSelectStudent: (student: Student, initialTab?: string) => void;
  onNewVisitWithReferral: (studentId: string) => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({
  onSelectStudent,
  onNewVisitWithReferral
}) => {
  const { filteredStudentsForUser, systemConfig, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'severe-allergy' | 'chronic-risk' | 'medical-device'>('all');
  const [filterClassroom, setFilterClassroom] = useState('all');
  const [selectedQRStudent, setSelectedQRStudent] = useState<Student | null>(null);

  // Classroom options
  const classrooms = useMemo(() => {
    const set = new Set(filteredStudentsForUser.map(s => s.classroom));
    return Array.from(set).sort();
  }, [filteredStudentsForUser]);

  // Filter students
  const emergencyStudents = useMemo(() => {
    return filteredStudentsForUser.filter(s => {
      // Risk filter
      const drugAllergies = s.drugAllergies || [];
      const chronicDiseases = s.chronicDiseases || [];
      const medicalDevices = s.medicalDevices || [];

      const hasSevereAllergy = drugAllergies.some(d => d.severity === 'รุนแรง' || d.severity?.includes('รุนแรง'));
      const hasChronicRisk = chronicDiseases.some(c => 
        (c.diseaseName || '').includes('ชัก') || 
        (c.diseaseName || '').includes('หอบ') || 
        (c.diseaseName || '').includes('หัวใจ') ||
        (c.diseaseName || '').includes('เบาหวาน') ||
        (c.emergencyCare || '').length > 0
      );
      const hasDevice = medicalDevices.length > 0;

      if (filterRisk === 'severe-allergy' && !hasSevereAllergy) return false;
      if (filterRisk === 'chronic-risk' && !hasChronicRisk) return false;
      if (filterRisk === 'medical-device' && !hasDevice) return false;

      // Classroom filter
      if (filterClassroom !== 'all' && s.classroom !== filterClassroom && s.grade !== filterClassroom) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${s.prefix || ''}${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const nick = (s.nickname || '').toLowerCase();
        const code = (s.studentCode || '').toLowerCase();
        const room = (s.classroom || '').toLowerCase();
        const allergy = drugAllergies.map(a => (a.drugName || '').toLowerCase()).join(' ');
        const chronic = chronicDiseases.map(c => (c.diseaseName || '').toLowerCase()).join(' ');

        if (!fullName.includes(q) && !nick.includes(q) && !code.includes(q) && !room.includes(q) && !allergy.includes(q) && !chronic.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [filteredStudentsForUser, filterRisk, filterClassroom, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Urgent Emergency Hotline Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-200 animate-pulse" />
              <span>ระบบข้อมูลสุขภาพฉุกเฉิน (Emergency Response)</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight">
              ศูนย์ข้อมูลฉุกเฉินและแนวทางกู้ชีพเร่งด่วน
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              สืบค้นข้อมูลสุขภาพฉุกเฉิน ประวัติแพ้ยารุนแรง แนวทางปฐมพยาบาลเฉพาะบุคคล (เช่น ภาวะชัก/หอบหืด/อุปกรณ์ท่อหลุด) และเบอร์ติดต่อผู้ปกครองทันที
            </p>
          </div>

          {/* Hotline Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="tel:1669"
              className="flex items-center space-x-2.5 px-5 py-3.5 rounded-2xl bg-white text-rose-700 font-heading font-bold text-sm sm:text-base shadow-md hover:bg-rose-50 transition-all transform active:scale-95"
            >
              <Phone className="w-5 h-5 text-rose-600 animate-bounce" />
              <span>โทร 1669 ด่วน (EMS)</span>
            </a>

            <a
              href={`tel:${systemConfig.hospitalPhone}`}
              className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-rose-800/60 hover:bg-rose-800 text-white font-semibold text-xs sm:text-sm border border-rose-400/40 backdrop-blur-xs transition-colors"
            >
              <Ambulance className="w-4 h-4 text-rose-200" />
              <span>{systemConfig.nearbyHospital} ({systemConfig.hospitalPhone})</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Fast Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Instant Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด่วน: ชื่อนักเรียน, ชื่อเล่น, รหัสประจำตัว, ห้องเรียน, ชื่อยาที่แพ้, โรคประจำตัว..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm font-medium outline-hidden transition-all bg-rose-50/20 placeholder-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold px-1.5 py-0.5 rounded bg-slate-200"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setFilterRisk('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterRisk === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({filteredStudentsForUser.length})
            </button>
            <button
              onClick={() => setFilterRisk('severe-allergy')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
                filterRisk === 'severe-allergy'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>แพ้ยารุนแรง</span>
            </button>
            <button
              onClick={() => setFilterRisk('chronic-risk')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
                filterRisk === 'chronic-risk'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>ชัก/หอบหืด/เสี่ยงสูง</span>
            </button>
            <button
              onClick={() => setFilterRisk('medical-device')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
                filterRisk === 'medical-device'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>มีท่อ/อุปกรณ์พิเศษ</span>
            </button>
          </div>
        </div>

        {/* Classroom selector */}
        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>กรองตามระดับชั้น/ห้อง:</span>
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">ทุกระดับชั้น/ห้อง</option>
            {classrooms.map(c => (
              <option key={c} value={c}>ห้อง {c}</option>
            ))}
          </select>
          <span className="ml-auto font-medium text-slate-600">
            พบข้อมูลฉุกเฉิน {emergencyStudents.length} ราย
          </span>
        </div>
      </div>

      {/* 3. Emergency Student Cards Grid */}
      {emergencyStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-700">
            ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่ค้นหา
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ทั้งหมด" เพื่อดูรายชื่อนักเรียนที่มีข้อมูลฉุกเฉินในระบบ
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilterRisk('all'); setFilterClassroom('all'); }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
          >
            รีเซ็ตตัวกรอง
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {emergencyStudents.map(student => {
            const hasSevereAllergy = student.drugAllergies.some(d => d.severity === 'รุนแรง');
            const hasChronicDiseases = student.chronicDiseases.length > 0;
            const hasDevices = student.medicalDevices.length > 0;

            return (
              <div 
                key={student.id}
                className="bg-white rounded-3xl border-2 border-slate-200 hover:border-rose-300 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header of Student Card */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3.5">
                      <StudentAvatar
                        src={student.photoUrl}
                        gender={student.gender}
                        name={student.firstName}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-xs flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {student.studentCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                            ห้อง {student.classroom}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            กรุ๊ป {student.bloodType}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-lg text-slate-900 mt-1">
                          {student.prefix} {student.firstName} {student.lastName} ({student.nickname})
                        </h3>
                        <p className="text-xs text-slate-500">
                          {(student.disabilities || []).map(d => d.typeName).join(', ')} • อายุ {student.age} ปี
                        </p>
                      </div>
                    </div>

                    {/* QR Code Action Button */}
                    <button
                      onClick={() => setSelectedQRStudent(student)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex flex-col items-center gap-0.5"
                      title="เปิด QR Code สุขภาพฉุกเฉิน"
                    >
                      <QrCode className="w-5 h-5 text-teal-600" />
                      <span className="text-[10px] font-semibold text-slate-600">QR Code</span>
                    </button>
                  </div>

                  {/* CRITICAL ALERTS BOX */}
                  <div className="mt-4 space-y-2.5">
                    {/* 1. Severe Drug Allergies */}
                    {(student.drugAllergies || []).length > 0 ? (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold text-rose-800 mb-1">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>ประวัติแพ้ยา (ห้ามให้เด็ดขาด):</span>
                        </div>
                        <div className="space-y-1 pl-5">
                          {(student.drugAllergies || []).map((a, idx) => (
                            <div key={idx} className="text-rose-900 font-semibold">
                              • <span className="underline">{a.drugName}</span> ({a.severity}) - อาการ: {a.reaction}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ไม่มีประวัติแพ้ยาที่บันทึกไว้</span>
                      </div>
                    )}

                    {/* 2. Personalized Emergency Care / Chronic Diseases */}
                    {(student.chronicDiseases || []).length > 0 && (
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                        <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                          <Heart className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>โรคประจำตัว & แนวทางปฐมพยาบาลฉุกเฉินเฉพาะบุคคล:</span>
                        </div>
                        {(student.chronicDiseases || []).map((c, idx) => (
                          <div key={idx} className="pl-5 space-y-0.5">
                            <p className="font-bold text-amber-950">• {c.diseaseName}</p>
                            {c.emergencyCare ? (
                              <p className="text-slate-800 font-medium bg-white/80 p-2 rounded-lg border border-amber-200">
                                <strong className="text-rose-700">การปฐมพยาบาล: </strong>{c.emergencyCare}
                              </p>
                            ) : (
                              <p className="text-slate-600 italic">ไม่มีบันทึกแนวทางปฐมพยาบาลพิเศษ</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Medical Devices (Tubes, Shunts, Wheelchair) */}
                    {(student.medicalDevices || []).length > 0 && (
                      <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-purple-900">อุปกรณ์/สายท่อการแพทย์: </span>
                          <span className="text-purple-800 font-medium">
                            {(student.medicalDevices || []).map(m => `${m.deviceType} (${m.careInstructions})`).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 4. Special Precautions */}
                    {student.specialPrecautions && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <strong className="text-slate-900">ข้อควรระวังพิเศษ: </strong>
                        {student.specialPrecautions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Parent Phone & Rapid Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Guardian Direct Call Link */}
                  <div className="flex items-center space-x-2">
                    <a
                      href={`tel:${student.guardianPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>โทรผู้ปกครอง: {student.guardianPhone}</span>
                    </a>
                    <span className="text-slate-500 text-[11px] truncate max-w-[130px]">
                      ({student.guardianName} - {student.guardianRelationship})
                    </span>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onNewVisitWithReferral(student.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                      title="เปิดแบบฟอร์มส่งตัวไปโรงพยาบาล"
                    >
                      <Ambulance className="w-3.5 h-3.5" />
                      <span>ส่งตัวไป รพ.</span>
                    </button>

                    <button
                      onClick={() => onSelectStudent(student, 'emergency')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <span>เวชระเบียนเต็ม</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Emergency QR Code Modal */}
      {selectedQRStudent && (
        <QRCodeModal
          student={selectedQRStudent}
          isOpen={!!selectedQRStudent}
          onClose={() => setSelectedQRStudent(null)}
          onViewEmergency={() => onSelectStudent(selectedQRStudent, 'emergency')}
        />
      )}
    </div>
  );
};
