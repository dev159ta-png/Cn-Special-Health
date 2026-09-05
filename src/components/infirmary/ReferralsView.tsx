import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InfirmaryVisit } from '../../types';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { 
  Ambulance, 
  Search, 
  Printer, 
  Phone, 
  Clock, 
  Calendar, 
  AlertTriangle,
  Hospital,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';

interface ReferralsViewProps {
  onSelectStudent: (studentId: string) => void;
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({ onSelectStudent }) => {
  const { visits } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlipVisit, setSelectedSlipVisit] = useState<InfirmaryVisit | null>(null);

  // Filter visits that have referral data
  const referralVisits = visits.filter(v => v.referral !== undefined);

  const filteredReferrals = referralVisits.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.studentName.toLowerCase().includes(q) ||
      v.referral?.hospitalName.toLowerCase().includes(q) ||
      v.referral?.referralReason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
              <Ambulance className="w-3.5 h-3.5" />
              <span>การส่งต่อโรงพยาบาล</span>
            </span>
            <span className="text-xs text-slate-500">
              {filteredReferrals.length} รายการส่งต่อ
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-800 mt-1">
            ทะเบียนประวัติการส่งต่อนักเรียนไปโรงพยาบาล (Hospital Referrals)
          </h2>
          <p className="text-xs text-slate-500">
            ระบบติดตามการส่งต่อนักเรียนที่มีภาวะฉุกเฉิน การประสานงาน 1669 และการแจ้งผู้ปกครอง
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อนักเรียน, โรงพยาบาล หรือสาเหตุการส่งต่อ..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Referrals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReferrals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            ไม่มีประวัติการส่งต่อโรงพยาบาลที่บันทึกไว้
          </div>
        ) : (
          filteredReferrals.map(v => {
            const ref = v.referral!;
            return (
              <div 
                key={v.id}
                className="bg-white rounded-2xl border border-rose-200 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="p-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Hospital className="w-4 h-4 text-rose-700" />
                      <span className="font-heading font-bold text-sm text-rose-900">
                        {ref.hospitalName}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-rose-700 font-semibold">
                      {formatThaiDatePattern(v.visitDate)} ({v.visitTime} น.)
                    </span>
                  </div>

                  <div className="p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <button
                          onClick={() => onSelectStudent(v.studentId)}
                          className="font-bold text-slate-900 hover:text-teal-600 text-sm block"
                        >
                          {v.studentName} ({v.nickname})
                        </button>
                        <span className="text-[11px] text-slate-500">ห้อง {v.classroom}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        VN: {v.visitNumber}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                      <div>
                        <strong className="text-rose-700">สาเหตุการส่งต่อ: </strong>
                        <span className="text-slate-800">{ref.referralReason}</span>
                      </div>
                      <div>
                        <strong className="text-slate-600">สภาพผู้ป่วยก่อนส่ง: </strong>
                        <span className="text-slate-700">{(ref as any).patientCondition || ref.conditionBeforeTransfer || '-'}</span>
                      </div>
                      <div>
                        <strong className="text-slate-600">วิธีการเดินทาง: </strong>
                        <span className="text-slate-800 font-semibold">{ref.transportMethod}</span>
                      </div>
                      <div>
                        <strong className="text-slate-600">เจ้าหน้าที่ร่วมเดินทาง: </strong>
                        <span className="text-slate-700">{(ref as any).accompanyingStaff || ref.accompanyingPerson || '-'}</span>
                      </div>
                      {(ref as any).guardianNotified && (
                        <div className="text-emerald-700 font-medium flex items-center gap-1 pt-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>แจ้งผู้ปกครองแล้วเมื่อเวลา {(ref as any).guardianNotifiedTime || ''} น.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    ผู้ส่งต่อ: {v.attendantName}
                  </span>
                  <button
                    onClick={() => setSelectedSlipVisit(v)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 font-medium hover:bg-rose-50 flex items-center space-x-1 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์ใบส่งต่อ (Referral Slip)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Printable Referral Slip Modal */}
      {selectedSlipVisit && selectedSlipVisit.referral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="px-5 py-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-rose-200" />
                <h3 className="font-heading font-bold text-sm">
                  ใบส่งต่อผู้ป่วยโรงเรียนสำหรับนักเรียนพิการ
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSlipVisit(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-xs text-slate-800 space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="font-heading font-bold text-base text-slate-900">โรงเรียนศึกษาพิเศษชัยนาท</h4>
                <p className="text-[11px] text-slate-500">แบบฟอร์มส่งต่อผู้ป่วย (Patient Referral Slip)</p>
                <p className="font-mono text-rose-700 font-bold mt-0.5">
                  ส่งต่อถึง: {selectedSlipVisit.referral.hospitalName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">ชื่อนักเรียน: </span>
                  <strong className="text-slate-900">{selectedSlipVisit.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">ห้องเรียน: </span>
                  <strong>{selectedSlipVisit.classroom}</strong>
                </div>
                <div>
                  <span className="text-slate-500">วันที่ส่งต่อ: </span>
                  <strong className="text-slate-900">{formatThaiDatePattern(selectedSlipVisit.visitDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">เวลา: </span>
                  <strong>{selectedSlipVisit.visitTime} น.</strong>
                </div>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl space-y-1.5 border border-rose-100">
                <div>
                  <strong className="text-rose-800">สาเหตุที่ส่งต่อ: </strong>
                  <span>{selectedSlipVisit.referral.referralReason}</span>
                </div>
                <div>
                  <strong className="text-slate-700">สภาพผู้ป่วย: </strong>
                  <span>{(selectedSlipVisit.referral as any).patientCondition || selectedSlipVisit.referral.conditionBeforeTransfer || '-'}</span>
                </div>
                <div>
                  <strong className="text-slate-700">สัญญาณชีพล่าสุด: </strong>
                  <span className="font-mono">
                    T: {selectedSlipVisit.vitals?.temperature || '-'}°C, BP: {selectedSlipVisit.vitals?.bloodPressureSys || '-'}/{selectedSlipVisit.vitals?.bloodPressureDia || '-'}, O2: {selectedSlipVisit.vitals?.oxygenSaturation || '-'}%
                  </span>
                </div>
                <div>
                  <strong className="text-slate-700">การปฐมพยาบาลเบื้องต้น: </strong>
                  <span>{(selectedSlipVisit.treatments || (selectedSlipVisit as any).treatment || []).join(', ')}</span>
                </div>
                <div>
                  <strong className="text-slate-700">พาหนะที่ใช้เดินทาง: </strong>
                  <span>{selectedSlipVisit.referral.transportMethod} (ผู้ร่วมเดินทาง: {(selectedSlipVisit.referral as any).accompanyingStaff || selectedSlipVisit.referral.accompanyingPerson || '-'})</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-end border-t border-slate-200">
                <div className="text-[11px] text-slate-400">
                  ออก ณ {formatThaiDatePattern(new Date())}
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 pb-1 mb-1">
                    {selectedSlipVisit.attendantName}
                  </div>
                  <span className="text-[10px] text-slate-500">ครูอนามัย / ผู้ส่งต่อ</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setSelectedSlipVisit(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600"
                >
                  ปิด
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์เอกสารส่งต่อ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
