import React from 'react';
import { useApp } from '../../context/AppContext';
import { InfirmaryVisit } from '../../types';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { 
  X, 
  History, 
  Printer, 
  AlertOctagon, 
  AlertTriangle, 
  Stethoscope, 
  HeartPulse, 
  Pill, 
  Ambulance, 
  User, 
  Calendar, 
  Clock, 
  Bed, 
  MapPin, 
  FileText,
  ShieldAlert,
  ChevronRight,
  Activity,
  Edit,
  Copy,
  Trash2
} from 'lucide-react';

interface VisitDetailModalProps {
  visit: InfirmaryVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onViewStudentHistory: (studentId: string) => void;
  onPrintSlip?: (visit: InfirmaryVisit) => void;
  onEdit?: (visit: InfirmaryVisit) => void;
  onCopy?: (visit: InfirmaryVisit) => void;
  onDelete?: (visitId: string) => void;
}

export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({
  visit,
  isOpen,
  onClose,
  onViewStudentHistory,
  onPrintSlip,
  onEdit,
  onCopy,
  onDelete
}) => {
  const { students, illnessEpisodes } = useApp();

  if (!isOpen || !visit) return null;

  // Find linked student using studentId (Requirement 5)
  const student = students.find(s => s.id === visit.studentId);
  const linkedEpisode = illnessEpisodes?.find(ep => ep.id === visit.illnessEpisodeId);

  const getOutcomeBadge = (outcome: string) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/10 text-teal-200">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-base sm:text-lg">
                  รายละเอียดการรับบริการห้องพยาบาล
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold">
                  {visit.visitNumber}
                </span>
              </div>
              <p className="text-xs text-teal-100 flex items-center space-x-1 mt-0.5">
                <span>🗓️ {formatThaiDatePattern(visit.visitDate)}</span>
                <span>•</span>
                <span>⏰ เวลา {visit.visitTime} น.</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">

          {/* PROMINENT TOP ACTION: ดูประวัติการรักษาของนักเรียน (Requirement 3) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-2 border-teal-300/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs">
                <History className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-teal-900">
                  ต้องการดูประวัติสุขภาพย้อนหลังทั้งหมด?
                </h4>
                <p className="text-xs text-teal-700">
                  ดูประวัติการมารับบริการทุกครั้ง สถิติอาการ และประวัติการรักษาของนักเรียนคนนี้
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onViewStudentHistory(visit.studentId);
              }}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] self-stretch sm:self-auto cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>ดูประวัติการรักษาของนักเรียน</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: ข้อมูลนักเรียน (Student Info) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-teal-600" />
                <span>ข้อมูลนักเรียนผู้เข้ารับบริการ (Student Information)</span>
              </span>
              <span className="font-mono text-xs text-slate-500">
                รหัสนักเรียน (ID): <strong className="text-slate-800">{student?.studentCode || visit.studentCode}</strong>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={student?.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'}
                  alt={visit.studentName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-xs"
                />
                {student?.drugAllergies && student.drugAllergies.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-xs" title="มีประวัติแพ้ยา">
                    <AlertOctagon className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    {student ? `${student.prefix} ${student.firstName} ${student.lastName}` : visit.studentName}
                  </h4>
                  {(student?.nickname || visit.nickname) && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                      น้อง{student?.nickname || visit.nickname}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-100 text-teal-800">
                    ชั้น {student ? `ห้อง ${student.classroom}` : visit.classroom}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400">ผู้พามาห้องพยาบาล: </span>
                    <strong className="text-slate-800">{visit.broughtBy || 'มาด้วยตนเอง'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">สถานที่เกิดเหตุ/พบอาการ: </span>
                    <strong className="text-slate-800">{visit.incidentLocation || 'ห้องเรียน'}</strong>
                  </div>
                </div>

                {/* Warning Flags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {student?.drugAllergies && student.drugAllergies.length > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center space-x-1">
                      <AlertOctagon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>แพ้ยา: {student.drugAllergies.map(a => a.drugName).join(', ')}</span>
                    </div>
                  )}

                  {student?.chronicDiseases && student.chronicDiseases.length > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>โรคประจำตัว: {student.chronicDiseases.map(d => d.diseaseName).join(', ')}</span>
                    </div>
                  )}

                  {student?.foodAllergies && student.foodAllergies.length > 0 && (
                    <div className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium">
                      แพ้อาหาร: {student.foodAllergies.map(f => f.foodName).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: อาการสำคัญ และ สัญญาณชีพ (Chief Complaint & Vitals) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* อาการสำคัญ */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>อาการสำคัญ (Chief Complaint)</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {visit.serviceType}
                </span>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(visit.symptoms || []).map((symptom, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200"
                    >
                      {symptom}
                    </span>
                  ))}
                  {visit.symptomStatus === 'กำลังป่วย' && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>สถานะอาการ: กำลังป่วย</span>
                    </span>
                  )}
                  {visit.symptomStatus === 'หายแล้ว' && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ หายป่วยแล้ว
                    </span>
                  )}
                </div>

                {linkedEpisode && (
                  <div className="mb-2 p-2 rounded-lg bg-teal-50 border border-teal-200 text-xs flex items-center justify-between">
                    <span className="text-teal-900">
                      ช่วงเจ็บป่วย: <strong className="font-mono">{linkedEpisode.illnessCode}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      linkedEpisode.status === 'กำลังป่วย' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {linkedEpisode.status}
                    </span>
                  </div>
                )}

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  <strong className="text-slate-900 block mb-1">รายละเอียดอาการ:</strong>
                  {visit.symptomDetails || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </p>
              </div>
            </div>

            {/* การประเมินสัญญาณชีพ (Vital Signs) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span>การประเมินเบื้องต้น (สัญญาณชีพ)</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`p-2.5 rounded-xl border ${
                  (visit.vitals?.temperature || 0) >= 37.5 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : 'bg-slate-50 border-slate-100 text-slate-800'
                }`}>
                  <span className="text-[10px] text-slate-500 block">อุณหภูมิ (Temp)</span>
                  <span className="font-mono font-bold text-sm">
                    {visit.vitals?.temperature ? `${visit.vitals.temperature}°C` : '-'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                  <span className="text-[10px] text-slate-500 block">ความดัน (BP)</span>
                  <span className="font-mono font-bold text-sm">
                    {visit.vitals?.bloodPressureSys && visit.vitals?.bloodPressureDia 
                      ? `${visit.vitals.bloodPressureSys}/${visit.vitals.bloodPressureDia}` 
                      : '-'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                  <span className="text-[10px] text-slate-500 block">ชีพจร (PR)</span>
                  <span className="font-mono font-bold text-sm">
                    {visit.vitals?.pulse ? `${visit.vitals.pulse} bpm` : '-'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                  <span className="text-[10px] text-slate-500 block">การหายใจ (RR)</span>
                  <span className="font-mono font-bold text-sm">
                    {visit.vitals?.respiratoryRate ? `${visit.vitals.respiratoryRate} /min` : '-'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  (visit.vitals?.oxygenSaturation || 100) < 95 
                    ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' 
                    : 'bg-slate-50 border-slate-100 text-slate-800'
                }`}>
                  <span className="text-[10px] text-slate-500 block">ออกซิเจน (O2)</span>
                  <span className="font-mono font-bold text-sm">
                    {visit.vitals?.oxygenSaturation ? `${visit.vitals.oxygenSaturation}%` : '-'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                  <span className="text-[10px] text-slate-500 block">ระดับปวด (Pain)</span>
                  <span className="font-mono font-bold text-sm">
                    {visit.vitals?.painScore !== undefined ? `${visit.vitals.painScore}/10` : '-'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 3: การรักษาและการดูแล (Treatments) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>การรักษาและการดูแลเบื้องต้น (Treatment & Care)</span>
            </span>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {(visit.treatments || (visit as any).treatment || []).map((t: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-200"
                  >
                    ✓ {t}
                  </span>
                ))}
              </div>

              {visit.treatmentDetails && (
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">รายละเอียดหัตถการ/การดูแล:</strong>
                  {visit.treatmentDetails}
                </p>
              )}

              {/* บันทึกการนอนพักเตียง */}
              {visit.restingRecord && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center space-x-3">
                  <Bed className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">นอนพักฟื้นบนเตียง: </span>
                    <span>เตียงหมายเลข {visit.restingRecord.bedNumber} (เข้าพัก {visit.restingRecord.timeIn} น. {visit.restingRecord.timeOut ? `ถึง ${visit.restingRecord.timeOut} น.` : ''})</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: ยาที่ได้รับ (Dispensed Medications) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>ยาที่ได้รับ (Dispensed Medications)</span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                {(visit.dispensedMedicines || []).length} รายการ
              </span>
            </div>

            {(visit.dispensedMedicines || []).length === 0 ? (
              <div className="text-center py-4 bg-slate-50 rounded-xl text-xs text-slate-400">
                ไม่มีการจ่ายยาในการรับบริการครั้งนี้ (ดูแลด้วยการปฐมพยาบาลหรือสังเกตอาการ)
              </div>
            ) : (
              <div className="space-y-2">
                {visit.dispensedMedicines.map((med, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-teal-950 text-sm">
                        {med.medicineName}
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        <span className="font-semibold text-teal-800">วิธีใช้/ขนาดยา: </span>
                        <span>{med.dosage}</span>
                        {med.instructions && <span> • {med.instructions}</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Lot: {med.lotNumber} {med.timing && `• เวลาที่จ่าย: ${med.timing}`}
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-xs">
                        จำนวน {med.quantity} {med.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: ผลการให้บริการ & การส่งต่อ (Outcome & Referral) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>ผลการให้บริการและการส่งต่อ (Outcome & Referral)</span>
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">ผลการรักษา:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getOutcomeBadge(visit.outcome)}`}>
                  {visit.outcome}
                </span>
              </div>
            </div>

            {visit.outcomeDetails && (
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">บันทึกผลการตรวจรักษา:</strong>
                {visit.outcomeDetails}
              </p>
            )}

            {/* การส่งต่อโรงพยาบาล Referral */}
            {visit.referral && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-rose-900 font-heading font-bold text-sm">
                  <Ambulance className="w-5 h-5 text-rose-600 animate-bounce" />
                  <span>บันทึกการส่งต่อโรงพยาบาลฉุกเฉิน (Hospital Referral)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pt-1">
                  <div>
                    <span className="text-slate-500">โรงพยาบาลปลายทาง: </span>
                    <strong className="text-rose-950 font-bold">{visit.referral.hospitalName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">วิธีการนำส่ง: </span>
                    <strong className="text-rose-900">{visit.referral.transportMethod}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">เหตุผลในการส่งต่อ: </span>
                    <span>{visit.referral.referralReason}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">เจ้าหน้าที่ร่วมเดินทาง: </span>
                    <span>{visit.referral.accompanyingStaff || '-'}</span>
                  </div>
                  {visit.referral.departureTime && (
                    <div>
                      <span className="text-slate-500">เวลาออกเดินทาง: </span>
                      <span>{visit.referral.departureTime} น.</span>
                    </div>
                  )}
                  {visit.referral.guardianNotified && (
                    <div>
                      <span className="text-emerald-700 font-bold">✓ แจ้งผู้ปกครองเรียบร้อยแล้ว</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 6: ผู้ให้บริการและผู้บันทึก (Attendant) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">ผู้ให้บริการ / ผู้ตรวจรักษาห้องพยาบาล:</span>
              <strong className="text-slate-900 font-heading text-sm">
                {visit.attendantName || 'พว. วันเพ็ญ สุขใจ (พยาบาลวิชาชีพ)'}
              </strong>
            </div>

            <div className="text-slate-400 text-right">
              <div>บันทึกในระบบเมื่อ: {visit.createdAt || visit.visitDate}</div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Action buttons: Print Slip & Copy */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onPrintSlip && onPrintSlip(visit)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>พิมพ์ Slip</span>
            </button>

            {onCopy && (
              <button
                onClick={() => onCopy(visit)}
                className="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title="คัดลอกประวัตินี้เป็นบันทึกใหม่ของวันนี้"
              >
                <Copy className="w-3.5 h-3.5 text-teal-600" />
                <span>คัดลอกเป็นบันทึกวันนี้</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(visit)}
                className="px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-amber-600" />
                <span>แก้ไข</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(visit.id)}
                className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                title="ลบบันทึกรายการนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* PROMINENT BUTTON: ดูประวัติการรักษาของนักเรียน (Requirement 3) */}
            <button
              onClick={() => {
                onClose();
                onViewStudentHistory(visit.studentId);
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>ดูประวัตินักเรียนคนนี้</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
