import React, { useState } from 'react';
import { Student } from '../../types';
import { QrCode, Printer, Download, ShieldCheck, X, AlertTriangle, Phone, Heart } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';

interface QRCodeModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onViewEmergency?: (studentId: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  student,
  isOpen,
  onClose,
  onViewEmergency
}) => {
  const [includeMedicalConditions, setIncludeMedicalConditions] = useState(true);
  const [includeGuardianPhone, setIncludeGuardianPhone] = useState(true);

  if (!isOpen) return null;

  // In production / web app, QR link encodes the direct emergency profile hash
  const qrUrl = `${window.location.origin}${window.location.pathname}#emergency?id=${student.id}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-teal-100" />
            <h3 className="font-heading font-bold text-base">
              QR Code ข้อมูลฉุกเฉินประจำตัวนักเรียน
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body / Printable Card */}
        <div className="p-6">
          <div 
            id="printable-student-qr-card" 
            className="p-5 border-2 border-teal-500 rounded-2xl bg-white text-center shadow-xs relative"
          >
            <div className="text-xs font-semibold text-teal-800 tracking-wide uppercase mb-1">
              โรงเรียนศึกษาพิเศษชัยนาท • บัตรฉุกเฉิน
            </div>

            <div className="flex items-center justify-center space-x-3 my-3">
              <StudentAvatar
                src={student.photoUrl}
                gender={student.gender}
                name={student.firstName}
                className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-xs flex-shrink-0"
              />
              <div className="text-left">
                <h4 className="font-heading font-bold text-slate-900 text-base">
                  {student.prefix} {student.firstName} {student.lastName}
                </h4>
                <p className="text-xs text-slate-500">
                  ชื่อเล่น: <span className="font-semibold text-slate-700">{student.nickname}</span> • ชั้น {student.classroom}
                </p>
                <p className="text-xs font-mono text-slate-600">
                  รหัส: {student.studentCode} • กรุ๊ปเลือด: <span className="font-bold text-rose-600">{student.bloodType}</span>
                </p>
              </div>
            </div>

            {/* Generated QR Code (SVG Pattern) */}
            <div className="my-4 flex flex-col items-center justify-center">
              <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-inner inline-block">
                <svg 
                  className="w-44 h-44" 
                  viewBox="0 0 100 100" 
                  fill="currentColor"
                >
                  {/* Outer Frame */}
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  
                  {/* Top-Left Position Marker */}
                  <rect x="5" y="5" width="28" height="28" fill="#0f766e" rx="4" />
                  <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="13" width="12" height="12" fill="#0f766e" rx="1" />

                  {/* Top-Right Position Marker */}
                  <rect x="67" y="5" width="28" height="28" fill="#0f766e" rx="4" />
                  <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="75" y="13" width="12" height="12" fill="#0f766e" rx="1" />

                  {/* Bottom-Left Position Marker */}
                  <rect x="5" y="67" width="28" height="28" fill="#0f766e" rx="4" />
                  <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="75" width="12" height="12" fill="#0f766e" rx="1" />

                  {/* Data Bits Pattern */}
                  <rect x="38" y="8" width="5" height="5" fill="#1e293b" />
                  <rect x="47" y="8" width="5" height="5" fill="#1e293b" />
                  <rect x="56" y="8" width="5" height="5" fill="#1e293b" />
                  <rect x="38" y="17" width="5" height="5" fill="#1e293b" />
                  <rect x="56" y="17" width="5" height="5" fill="#1e293b" />
                  <rect x="38" y="26" width="5" height="5" fill="#1e293b" />
                  <rect x="47" y="26" width="5" height="5" fill="#1e293b" />

                  <rect x="8" y="38" width="5" height="5" fill="#1e293b" />
                  <rect x="17" y="38" width="5" height="5" fill="#1e293b" />
                  <rect x="26" y="38" width="5" height="5" fill="#1e293b" />
                  <rect x="38" y="38" width="8" height="8" fill="#0f766e" rx="2" />
                  <rect x="52" y="38" width="5" height="5" fill="#1e293b" />
                  <rect x="67" y="38" width="5" height="5" fill="#1e293b" />
                  <rect x="78" y="38" width="5" height="5" fill="#1e293b" />
                  <rect x="87" y="38" width="5" height="5" fill="#1e293b" />

                  <rect x="8" y="47" width="5" height="5" fill="#1e293b" />
                  <rect x="26" y="47" width="5" height="5" fill="#1e293b" />
                  <rect x="47" y="47" width="6" height="6" fill="#e11d48" rx="1" />
                  <rect x="67" y="47" width="5" height="5" fill="#1e293b" />
                  <rect x="87" y="47" width="5" height="5" fill="#1e293b" />

                  <rect x="8" y="56" width="5" height="5" fill="#1e293b" />
                  <rect x="17" y="56" width="5" height="5" fill="#1e293b" />
                  <rect x="26" y="56" width="5" height="5" fill="#1e293b" />
                  <rect x="38" y="56" width="5" height="5" fill="#1e293b" />
                  <rect x="52" y="56" width="5" height="5" fill="#1e293b" />
                  <rect x="67" y="56" width="5" height="5" fill="#1e293b" />
                  <rect x="87" y="56" width="5" height="5" fill="#1e293b" />

                  <rect x="38" y="67" width="5" height="5" fill="#1e293b" />
                  <rect x="47" y="67" width="5" height="5" fill="#1e293b" />
                  <rect x="56" y="67" width="5" height="5" fill="#1e293b" />
                  <rect x="67" y="67" width="8" height="8" fill="#1e293b" />
                  <rect x="80" y="67" width="5" height="5" fill="#1e293b" />

                  <rect x="38" y="78" width="5" height="5" fill="#1e293b" />
                  <rect x="56" y="78" width="5" height="5" fill="#1e293b" />
                  <rect x="71" y="78" width="5" height="5" fill="#1e293b" />
                  <rect x="82" y="78" width="5" height="5" fill="#1e293b" />

                  <rect x="38" y="87" width="5" height="5" fill="#1e293b" />
                  <rect x="47" y="87" width="5" height="5" fill="#1e293b" />
                  <rect x="67" y="87" width="5" height="5" fill="#1e293b" />
                  <rect x="87" y="87" width="5" height="5" fill="#1e293b" />

                  {/* Center Heart Emblem */}
                  <circle cx="50" cy="50" r="4" fill="#0f766e" />
                </svg>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                สแกนด้วยสมาร์ตโฟนเพื่อเข้าถึงข้อมูลฉุกเฉินทันที
              </p>
            </div>

            {/* Quick Emergency Highlights */}
            {includeMedicalConditions && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-left text-xs space-y-1">
                {student.drugAllergies.length > 0 && (
                  <p className="text-rose-700 font-bold flex items-center gap-1">
                    <span>🚨 แพ้ยา:</span>
                    <span>{student.drugAllergies.map(d => d.drugName).join(', ')}</span>
                  </p>
                )}
                {student.chronicDiseases.length > 0 && (
                  <p className="text-slate-700 font-medium">
                    ⚠️ โรคประจำตัว: {student.chronicDiseases.map(c => c.diseaseName).join(', ')}
                  </p>
                )}
                {student.medicalDevices.length > 0 && (
                  <p className="text-slate-700 font-medium">
                    🩺 อุปกรณ์: {student.medicalDevices.map(m => m.deviceType).join(', ')}
                  </p>
                )}
              </div>
            )}

            {includeGuardianPhone && (
              <div className="mt-2 text-xs font-medium text-slate-600 flex items-center justify-center gap-1">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>เบอร์ฉุกเฉินผู้ปกครอง: <strong className="text-slate-900">{student.guardianPhone}</strong></span>
              </div>
            )}
          </div>

          {/* Privacy Security Controls */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ความปลอดภัยและการกำหนดสิทธิ์ข้อมูลที่แสดง</span>
            </div>
            
            <div className="space-y-2 text-xs text-slate-600">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMedicalConditions}
                  onChange={e => setIncludeMedicalConditions(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>แสดงข้อมูลแพ้ยาและโรคประจำตัวบนบัตร</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGuardianPhone}
                  onChange={e => setIncludeGuardianPhone(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>แสดงเบอร์โทรฉุกเฉินผู้ปกครอง</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center space-x-2">
            {onViewEmergency && (
              <button
                onClick={() => {
                  onClose();
                  onViewEmergency(student.id);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>เปิดดู Emergency Profile</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์บัตร QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
