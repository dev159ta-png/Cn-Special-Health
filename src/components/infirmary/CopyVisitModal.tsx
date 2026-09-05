import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { InfirmaryVisit } from '../../types';
import { 
  X, 
  Copy, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  Stethoscope,
  Activity,
  ArrowRight
} from 'lucide-react';
import { formatThaiDatePattern } from '../../utils/dateUtils';

interface CopyVisitModalProps {
  visit: InfirmaryVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CopyVisitModal: React.FC<CopyVisitModalProps> = ({
  visit,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addVisit, currentUser } = useApp();

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toTimeString().slice(0, 5);

  const [newVisitDate, setNewVisitDate] = useState(todayStr);
  const [newVisitTime, setNewVisitTime] = useState(nowTimeStr);
  const [newServiceType, setNewServiceType] = useState('ป่วย');
  const [newSymptomDetails, setNewSymptomDetails] = useState('');
  const [newTreatmentDetails, setNewTreatmentDetails] = useState('');
  const [newAttendantName, setNewAttendantName] = useState('');
  const [includeVitals, setIncludeVitals] = useState(false);

  useEffect(() => {
    if (visit) {
      setNewVisitDate(new Date().toISOString().slice(0, 10));
      setNewVisitTime(new Date().toTimeString().slice(0, 5));
      setNewServiceType(visit.serviceType || 'ป่วย');
      setNewSymptomDetails(visit.symptomDetails || '');
      setNewTreatmentDetails(visit.treatmentDetails || '');
      setNewAttendantName(currentUser.name || visit.attendantName || '');
      setIncludeVitals(false);
    }
  }, [visit, currentUser]);

  if (!isOpen || !visit) return null;

  const handleConfirmCopy = (e: React.FormEvent) => {
    e.preventDefault();

    addVisit({
      studentId: visit.studentId,
      studentName: visit.studentName,
      nickname: visit.nickname,
      studentCode: visit.studentCode,
      grade: visit.grade,
      classroom: visit.classroom,
      visitDate: newVisitDate,
      visitTime: newVisitTime,
      serviceType: newServiceType,
      broughtBy: visit.broughtBy,
      incidentLocation: visit.incidentLocation,
      symptoms: [...(visit.symptoms || [])],
      symptomDetails: newSymptomDetails,
      vitals: includeVitals && visit.vitals ? {
        ...visit.vitals
      } : {},
      treatments: [...(visit.treatments || [])],
      treatmentDetails: newTreatmentDetails,
      dispensedMedicines: [], // empty by default for safety
      outcome: visit.outcome || 'กลับเข้าชั้นเรียน',
      outcomeDetails: `คัดลอกจากประวัติเดิมเมื่อวันที่ ${visit.visitDate} (${visit.visitNumber})`,
      attendantId: currentUser.id,
      attendantName: newAttendantName || currentUser.name
    });

    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg">
                คัดลอกประวัติการรับบริการ
              </h3>
              <p className="text-xs text-teal-100">
                นำข้อมูลประวัติเดิมมาสร้างเป็นบันทึกบริการของวันนี้ (หรือวันที่ระบุ)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirmCopy} className="p-6 space-y-4">
          
          {/* Compare Card: Original vs New */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-teal-900">นักเรียน:</span>
              <span className="font-bold text-slate-800">
                {visit.studentName} {visit.nickname ? `(${visit.nickname})` : ''} · ชั้น {visit.classroom}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-teal-100 pt-2">
              <div>
                <span className="text-[11px] text-slate-500 block">ประวัติต้นฉบับ:</span>
                <span className="font-semibold text-slate-700">
                  {formatThaiDatePattern(visit.visitDate)} ({visit.visitTime} น.)
                </span>
                <span className="block text-[10px] font-mono text-teal-800 font-bold">{visit.visitNumber}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600" />
              <div className="text-right">
                <span className="text-[11px] text-teal-700 font-bold block">บันทึกใหม่:</span>
                <span className="font-bold text-teal-900">
                  {newVisitDate === todayStr ? 'วันนี้' : newVisitDate} ({newVisitTime} น.)
                </span>
                <span className="block text-[10px] text-teal-600">สร้าง VN ใหม่อัตโนมัติ</span>
              </div>
            </div>
          </div>

          {/* New Date & Time Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่รับบริการใหม่ *
              </label>
              <input
                type="date"
                required
                value={newVisitDate}
                onChange={e => setNewVisitDate(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เวลารับบริการใหม่ *
              </label>
              <input
                type="time"
                required
                value={newVisitTime}
                onChange={e => setNewVisitTime(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Summary of what will be copied */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>ข้อมูลอาการและการรักษาที่จะคัดลอกมา:</span>
            </div>

            <div className="text-slate-600 space-y-1">
              <p>
                <strong>อาการสำคัญ:</strong> {(visit.symptoms || []).join(', ') || 'ไม่มี'}
              </p>
              <p>
                <strong>การรักษา:</strong> {(visit.treatments || []).join(', ') || 'ไม่มี'}
              </p>
            </div>

            <label className="flex items-center space-x-2 pt-2 border-t border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeVitals}
                onChange={e => setIncludeVitals(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="text-[11px] text-slate-700">
                คัดลอกค่าสัญญาณชีพเดิมด้วย (หากไม่ติ๊ก จะต้องวัดใหม่)
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ผู้ให้บริการพยาบาล *
            </label>
            <input
              type="text"
              required
              value={newAttendantName}
              onChange={e => setNewAttendantName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>ยืนยันสร้างบันทึกใหม่</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
