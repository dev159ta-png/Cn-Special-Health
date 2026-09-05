import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, Medicine, DispensedMedicineItem, InfirmaryVisit, IllnessStatus } from '../../types';
import { formatThaiDatePattern, formatThaiDateNumeric } from '../../utils/dateUtils';
import { 
  HeartPulse, 
  Stethoscope, 
  AlertOctagon, 
  AlertTriangle, 
  Pill, 
  CheckCircle2, 
  Bed, 
  Ambulance, 
  User, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  Search,
  Activity,
  Calendar,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface NewVisitFormProps {
  initialStudentId?: string;
  initialIsReferral?: boolean;
  onSuccess: (visit: InfirmaryVisit) => void;
  onCancel: () => void;
}

export const NewVisitForm: React.FC<NewVisitFormProps> = ({
  initialStudentId,
  initialIsReferral = false,
  onSuccess,
  onCancel
}) => {
  const { 
    students, 
    medicines, 
    currentUser, 
    systemConfig, 
    checkDrugSafety, 
    addVisit,
    illnessEpisodes
  } = useApp();

  // Selected student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Find if student has an active illness episode
  const activeStudentEpisode = useMemo(() => {
    if (!selectedStudentId) return null;
    return illnessEpisodes.find(ep => ep.studentId === selectedStudentId && ep.status === 'กำลังป่วย');
  }, [illnessEpisodes, selectedStudentId]);

  // Sickness status tracking: 'กำลังป่วย' | 'หายแล้ว' | 'ทั่วไป'
  const [symptomStatus, setSymptomStatus] = useState<IllnessStatus | 'ทั่วไป'>('กำลังป่วย');
  const [linkToExistingEpisode, setLinkToExistingEpisode] = useState<boolean>(true);

  useEffect(() => {
    if (activeStudentEpisode) {
      setSymptomStatus('กำลังป่วย');
      setLinkToExistingEpisode(true);
    }
  }, [activeStudentEpisode]);

  // Visit details
  const [visitDate, setVisitDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [visitTime, setVisitTime] = useState<string>(
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [serviceType, setServiceType] = useState<InfirmaryVisit['serviceType']>('จ่ายยา');
  const [broughtBy, setBroughtBy] = useState<string>('มาด้วยตนเอง');
  const [incidentLocation, setIncidentLocation] = useState<string>('ห้องเรียน');

  // Symptoms
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['ปวดศีรษะ']);
  const [symptomDetails, setSymptomDetails] = useState<string>('');

  // Vitals
  const [temp, setTemp] = useState<number | undefined>(36.8);
  const [bpSys, setBpSys] = useState<number | undefined>(110);
  const [bpDia, setBpDia] = useState<number | undefined>(70);
  const [pulse, setPulse] = useState<number | undefined>(78);
  const [o2Sat, setO2Sat] = useState<number | undefined>(98);

  // Treatments
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>(['จ่ายยารับประทาน']);
  const [treatmentDetails, setTreatmentDetails] = useState<string>('');

  // Resting in bed
  const [bedNumber, setBedNumber] = useState<string>('');
  const [bedTimeIn, setBedTimeIn] = useState<string>('');
  const [bedTimeOut, setBedTimeOut] = useState<string>('');

  // Medicines to dispense
  const [dispensedList, setDispensedList] = useState<Array<{
    medicineId: string;
    quantity: number;
    dosage: string;
  }>>([]);

  // Outcome
  const [outcome, setOutcome] = useState<InfirmaryVisit['outcome']>('ดีขึ้น');
  const [outcomeDetails, setOutcomeDetails] = useState<string>('อาการดีขึ้น อนุญาตให้กลับเข้าห้องเรียน');

  // Referral
  const [isReferral, setIsReferral] = useState<boolean>(initialIsReferral);
  const [hospitalName, setHospitalName] = useState<string>(systemConfig.nearbyHospital);
  const [referralReason, setReferralReason] = useState<string>('');
  const [patientCondition, setPatientCondition] = useState<string>('รู้สึกตัวดี หายใจเหนื่อยเล็กน้อย');
  const [transportMethod, setTransportMethod] = useState<string>('เรียกรถพยาบาล 1669');
  const [accompanyingStaff, setAccompanyingStaff] = useState<string>(currentUser.name);
  const [guardianNotified, setGuardianNotified] = useState<boolean>(true);
  const [guardianNotifiedTime, setGuardianNotifiedTime] = useState<string>(
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  useEffect(() => {
    if (initialIsReferral) {
      setIsReferral(true);
      setServiceType('ส่งต่อโรงพยาบาล');
      setOutcome('ส่งต่อโรงพยาบาล');
    }
  }, [initialIsReferral]);

  // Form validation errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick filter for student dropdown
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return students;
    const q = studentSearchQuery.toLowerCase();
    return students.filter(s => 
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.nickname.toLowerCase().includes(q) ||
      s.studentCode.toLowerCase().includes(q) ||
      s.classroom.toLowerCase().includes(q)
    );
  }, [students, studentSearchQuery]);

  // Symptom toggler
  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(x => x !== sym) : [...prev, sym]
    );
  };

  // Treatment toggler
  const toggleTreatment = (t: string) => {
    setSelectedTreatments(prev => 
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  // Add a medicine row
  const addMedicineRow = () => {
    const defaultMed = medicines.find(m => m.currentStock > 0);
    if (!defaultMed) {
      alert('ไม่มียาที่มีสต๊อกในระบบ');
      return;
    }
    setDispensedList(prev => [
      ...prev,
      {
        medicineId: defaultMed.id,
        quantity: 1,
        dosage: defaultMed.dosageInstruction || '1 เม็ด หลังอาหารทันที'
      }
    ]);
  };

  // When medicine changes in a row, update default dosage
  const handleMedChange = (index: number, newMedId: string) => {
    const med = medicines.find(m => m.id === newMedId);
    setDispensedList(prev => prev.map((item, i) => i === index ? {
      ...item,
      medicineId: newMedId,
      dosage: med?.dosageInstruction || item.dosage
    } : item));
  };

  // Submit Visit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedStudent) {
      setErrorMessage('กรุณาเลือกนักเรียนผู้เข้ารับบริการ');
      return;
    }

    if (selectedSymptoms.length === 0 && !symptomDetails) {
      setErrorMessage('กรุณาระบุอาการที่พบอย่างน้อย 1 รายการ');
      return;
    }

    // Safety check all medicines before submitting!
    const finalDispensed: DispensedMedicineItem[] = [];

    for (const item of dispensedList) {
      const med = medicines.find(m => m.id === item.medicineId);
      if (!med) continue;

      const safety = checkDrugSafety(selectedStudent.id, med.id, item.quantity);

      // Block if allergic or expired or out of stock!
      if (!safety.isSafe) {
        setErrorMessage(`⚠️ ไม่สามารถจ่ายยา ${med.tradeName} ได้: ${safety.errors.join(' | ')}`);
        return;
      }

      finalDispensed.push({
        medicineId: med.id,
        medicineCode: med.code,
        medicineName: `${med.tradeName} (${med.genericName})`,
        lotNumber: med.lotNumber,
        expiryDate: med.expiryDate,
        quantity: item.quantity,
        unit: med.unit,
        dosage: item.dosage
      });
    }

    // Build visit payload
    const newVisit = addVisit({
      studentId: selectedStudent.id,
      studentName: `${selectedStudent.prefix} ${selectedStudent.firstName} ${selectedStudent.lastName}`,
      studentCode: selectedStudent.studentCode,
      nickname: selectedStudent.nickname,
      classroom: selectedStudent.classroom,
      grade: selectedStudent.grade,
      broughtBy,
      incidentLocation,
      visitDate,
      visitTime,
      serviceType,
      symptoms: selectedSymptoms,
      symptomDetails,
      vitals: {
        temperature: temp,
        bloodPressureSys: bpSys,
        bloodPressureDia: bpDia,
        pulse,
        oxygenSaturation: o2Sat
      },
      treatments: selectedTreatments,
      treatmentDetails,
      symptomStatus: symptomStatus === 'ทั่วไป' ? undefined : symptomStatus,
      illnessEpisodeId: (symptomStatus && linkToExistingEpisode && activeStudentEpisode) ? activeStudentEpisode.id : undefined,
      restingRecord: bedNumber ? {
        bedNumber,
        timeIn: bedTimeIn || visitTime,
        timeOut: bedTimeOut
      } : undefined,
      dispensedMedicines: finalDispensed,
      outcome: isReferral ? 'ส่งต่อโรงพยาบาล' : outcome,
      outcomeDetails,
      referral: isReferral ? {
        hospitalName,
        referralReason,
        patientCondition,
        transportMethod,
        accompanyingStaff,
        guardianNotified,
        guardianNotifiedTime
      } : undefined,
      attendantId: currentUser.id,
      attendantName: currentUser.name
    });

    onSuccess(newVisit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-100 text-teal-800">
              บันทึกการให้บริการใหม่
            </span>
            <span className="text-xs text-slate-500">
              ระบบเชื่อมโยงข้อมูลสุขภาพและตัดสต็อกยาอัตโนมัติ
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl text-slate-800 mt-1">
            บันทึกการรับบริการห้องพยาบาล & การจ่ายยา
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการให้บริการ & ตัดสต็อก</span>
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs flex items-center space-x-3 shadow-xs animate-shake">
          <AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0" />
          <div>
            <strong className="font-bold text-sm block">การตรวจสอบความปลอดภัยล้มเหลว:</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Step 1: Select Student & Health Warning Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
          <User className="w-4 h-4 text-teal-600" />
          <span>1. เลือกนักเรียนผู้เข้ารับบริการ (Student Information)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">ค้นหา / เลือกนักเรียน *</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="พิมพ์ค้นหาชื่อหรือรหัสนักเรียน..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 mb-2 focus:ring-teal-500"
              />
            </div>
            
            <select
              size={5}
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white focus:ring-teal-500"
            >
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id} className="p-1.5">
                  {s.studentCode} - {s.prefix}{s.firstName} {s.lastName} ({s.nickname}) [ห้อง {s.classroom}]
                </option>
              ))}
            </select>
          </div>

          {/* Student Profile Card with Safety Badges */}
          <div className="md:col-span-2">
            {selectedStudent ? (
              <div className="h-full p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-3">
                <div className="flex items-start space-x-3.5">
                  <img
                    src={selectedStudent.photoUrl}
                    alt={selectedStudent.firstName}
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-200 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                        {selectedStudent.studentCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        ชั้น {selectedStudent.grade} ({selectedStudent.classroom})
                      </span>
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        กรุ๊ป {selectedStudent.bloodType}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-base text-slate-900 mt-1">
                      {selectedStudent.prefix} {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.nickname})
                    </h4>

                    <p className="text-xs text-slate-500">
                      ครูประจำชั้น: {selectedStudent.homeroomTeacher} • ผู้ปกครอง: {selectedStudent.guardianName} ({selectedStudent.guardianPhone})
                    </p>
                  </div>
                </div>

                {/* Real-time Health Warnings for this student */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                  {(selectedStudent.drugAllergies || []).length > 0 ? (
                    <div className="p-2 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 flex items-center space-x-2 font-bold animate-pulse">
                      <AlertOctagon className="w-4 h-4 text-rose-700 flex-shrink-0" />
                      <span>
                        ⚠️ ประวัติแพ้ยา: {(selectedStudent.drugAllergies || []).map(d => `${d.drugName} (${d.severity})`).join(', ')} (ระบบจะระงับการจ่ายยาดังกล่าวอัตโนมัติ)
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ไม่มีประวัติการแพ้ยา</span>
                    </div>
                  )}

                  {(selectedStudent.chronicDiseases || []).length > 0 && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      <strong>โรคประจำตัว: </strong>
                      {(selectedStudent.chronicDiseases || []).map(c => c.diseaseName).join(', ')}
                    </div>
                  )}

                  {(selectedStudent.medicalDevices || []).length > 0 && (
                    <div className="text-[11px] text-purple-800 bg-purple-50 p-1.5 rounded border border-purple-200">
                      <strong>ท่อ/อุปกรณ์พิเศษ: </strong>
                      {(selectedStudent.medicalDevices || []).map(m => m.deviceType).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[140px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                กรุณาคลิกเลือกนักเรียนจากรายการด้านซ้ายเพื่อแสดงข้อมูลสุขภาพ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Date, Time, Service Type & Symptoms */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
          <Stethoscope className="w-4 h-4 text-teal-600" />
          <span>2. ข้อมูลการเข้ารับบริการและอาการที่พบ (Symptoms & Service)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">วันที่รับบริการ *</label>
            <input
              type="date"
              required
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white focus:ring-teal-500"
            />
            {visitDate && (
              <div className="text-[11px] text-teal-700 font-semibold mt-1">
                🗓️ {formatThaiDatePattern(visitDate)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">เวลารับบริการ *</label>
            <input
              type="text"
              required
              value={visitTime}
              onChange={e => setVisitTime(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">ประเภทการรับบริการ *</label>
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value as InfirmaryVisit['serviceType'])}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white font-semibold focus:ring-teal-500"
            >
              <option value="จ่ายยา">จ่ายยา</option>
              <option value="ปฐมพยาบาล">ปฐมพยาบาล</option>
              <option value="นอนพักฟื้น">นอนพักฟื้น</option>
              <option value="สังเกตอาการ">สังเกตอาการ</option>
              <option value="ทำแผล">ทำแผล</option>
              <option value="ส่งต่อโรงพยาบาล">ส่งต่อโรงพยาบาล</option>
            </select>
          </div>
        </div>

        {/* Symptoms Checkboxes */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-2">อาการที่พบ (เลือกได้มากกว่า 1 ข้อ) *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
            {(systemConfig.commonSymptoms || []).map(sym => {
              const isChecked = selectedSymptoms.includes(sym);
              return (
                <label 
                  key={sym}
                  className={`p-2 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSymptom(sym)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="truncate">{sym}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-2">
            <input
              type="text"
              value={symptomDetails}
              onChange={e => setSymptomDetails(e.target.value)}
              placeholder="ระบุรายละเอียดอาการเพิ่มเติม (เช่น หกล้มเข่าขวาถลอก มีไข้หนาวสั่น)..."
              className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Sickness Status Tracking (สถานะอาการเจ็บป่วย) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>สถานะอาการเจ็บป่วย (เชื่อมโยงตารางติดตามสถานะเจ็บป่วย)</span>
            </label>
            <span className="text-[11px] text-slate-400">ระบบจะสร้าง/อัปเดตช่วงเวลาการเจ็บป่วย (Illness ID) อัตโนมัติ</span>
          </div>

          {/* Active Illness Alert Banner if student is currently marked sick */}
          {activeStudentEpisode && (
            <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 animate-pulse">
                    ⚠️ กำลังป่วยต่อเนื่อง
                  </span>
                  <strong className="font-mono text-amber-950 font-bold">{activeStudentEpisode.illnessCode}</strong>
                  <span className="text-amber-800">
                    (เริ่มป่วย: {formatThaiDateNumeric(activeStudentEpisode.startDate)} • มาห้องพยาบาลแล้ว {activeStudentEpisode.visitIds.length} ครั้ง)
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  อาการเดิม: <strong>{activeStudentEpisode.symptoms.join(', ')}</strong> {activeStudentEpisode.symptomDetails ? `(${activeStudentEpisode.symptomDetails})` : ''}
                </p>
              </div>

              <label className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold cursor-pointer shadow-2xs hover:bg-amber-100/50">
                <input
                  type="checkbox"
                  checked={linkToExistingEpisode}
                  onChange={e => setLinkToExistingEpisode(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs">เชื่อมโยงกับ Illness ID เดิมนี้</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Option 1: กำลังป่วย */}
            <label
              className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                symptomStatus === 'กำลังป่วย'
                  ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 text-rose-950'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="symptomStatus"
                value="กำลังป่วย"
                checked={symptomStatus === 'กำลังป่วย'}
                onChange={() => setSymptomStatus('กำลังป่วย')}
                className="mt-0.5 text-rose-600 focus:ring-rose-500"
              />
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <strong className="text-xs font-bold text-rose-900">กำลังป่วย</strong>
                </div>
                <p className="text-[11px] text-slate-500">
                  {activeStudentEpisode && linkToExistingEpisode
                    ? 'บันทึกอาการต่อเนื่องในรอบการป่วยเดิม'
                    : 'เปิดรอบการเจ็บป่วยใหม่ (สร้าง Illness ID)'}
                </p>
              </div>
            </label>

            {/* Option 2: หายแล้ว */}
            <label
              className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                symptomStatus === 'หายแล้ว'
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="symptomStatus"
                value="หายแล้ว"
                checked={symptomStatus === 'หายแล้ว'}
                onChange={() => setSymptomStatus('หายแล้ว')}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <strong className="text-xs font-bold text-emerald-900">หายแล้ว</strong>
                </div>
                <p className="text-[11px] text-slate-500">
                  บันทึกว่าหายป่วยแล้ว และกำหนดวันที่หายเป็นวันนี้
                </p>
              </div>
            </label>

            {/* Option 3: ทั่วไป / ไม่ติดตาม */}
            <label
              className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                symptomStatus === 'ทั่วไป'
                  ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="symptomStatus"
                value="ทั่วไป"
                checked={symptomStatus === 'ทั่วไป'}
                onChange={() => setSymptomStatus('ทั่วไป')}
                className="mt-0.5 text-slate-600 focus:ring-slate-500"
              />
              <div className="space-y-0.5">
                <strong className="text-xs font-bold text-slate-800">ทั่วไป / อื่นๆ</strong>
                <p className="text-[11px] text-slate-500">
                  บริการทั่วไป ไม่เปิดการติดตามโรค (เช่น ทำแผลเล็กน้อย, รับประทานยาบำรุง)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>สัญญาณชีพ (Vital Signs)</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">อุณหภูมิ (°C)</span>
              <input
                type="number"
                step="0.1"
                value={temp || ''}
                onChange={e => setTemp(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="37.0"
                className={`w-full rounded-xl border p-2 font-mono font-bold ${
                  temp && temp >= 37.5 ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <span className="text-slate-500 block mb-1">ความดันบน (Sys)</span>
              <input
                type="number"
                value={bpSys || ''}
                onChange={e => setBpSys(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="120"
                className="w-full rounded-xl border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <span className="text-slate-500 block mb-1">ความดันล่าง (Dia)</span>
              <input
                type="number"
                value={bpDia || ''}
                onChange={e => setBpDia(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="80"
                className="w-full rounded-xl border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <span className="text-slate-500 block mb-1">ชีพจร (bpm)</span>
              <input
                type="number"
                value={pulse || ''}
                onChange={e => setPulse(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="80"
                className="w-full rounded-xl border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <span className="text-slate-500 block mb-1">ออกซิเจน SpO2 (%)</span>
              <input
                type="number"
                value={o2Sat || ''}
                onChange={e => setO2Sat(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="98"
                className={`w-full rounded-xl border p-2 font-mono font-bold ${
                  o2Sat && o2Sat < 95 ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Treatments & Resting in Bed */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
          <HeartPulse className="w-4 h-4 text-emerald-600" />
          <span>3. การรักษาเบื้องต้นและการนอนพักฟื้น (Treatments & Bed)</span>
        </h3>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">การปฐมพยาบาล/การรักษา</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {(systemConfig.treatmentMethods || systemConfig.commonTreatments || []).map(t => {
              const isChecked = selectedTreatments.includes(t);
              return (
                <label 
                  key={t}
                  className={`p-2 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTreatment(t)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="truncate">{t}</span>
                </label>
              );
            })}
          </div>

          <input
            type="text"
            value={treatmentDetails}
            onChange={e => setTreatmentDetails(e.target.value)}
            placeholder="รายละเอียดการรักษาเพิ่มเติม (เช่น ล้างแผลด้วยน้ำเกลือ ทาเบตาดีน ปิดผ้าก๊อซ)..."
            className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-emerald-500 mt-2"
          />
        </div>

        {/* Resting in Bed */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center space-x-1">
              <Bed className="w-3.5 h-3.5 text-teal-600" />
              <span>เตียงพักฟื้น (ถ้ามี)</span>
            </label>
            <select
              value={bedNumber}
              onChange={e => setBedNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white"
            >
              <option value="">-- ไม่ได้นอนพักฟื้น --</option>
              <option value="เตียง 1">เตียง 1</option>
              <option value="เตียง 2">เตียง 2</option>
              <option value="เตียง 3">เตียง 3</option>
              <option value="เตียง 4">เตียง 4</option>
            </select>
          </div>

          {bedNumber && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">เวลาเริ่มนอนพัก</label>
                <input
                  type="text"
                  value={bedTimeIn}
                  onChange={e => setBedTimeIn(e.target.value)}
                  placeholder="เช่น 10:30"
                  className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">เวลาสิ้นสุดนอนพัก</label>
                <input
                  type="text"
                  value={bedTimeOut}
                  onChange={e => setBedTimeOut(e.target.value)}
                  placeholder="เช่น 11:30"
                  className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Step 4: Medicine Dispensing & Safety Verification */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>4. การจ่ายยาและตัดสต็อก (Dispensing & Stock Deduction)</span>
            </h3>
            <p className="text-xs text-slate-500">
              ระบบตรวจสอบประวัติแพ้ยา วันหมดอายุ และปริมาณยาคงเหลือในคลังโดยอัตโนมัติ
            </p>
          </div>

          <button
            type="button"
            onClick={addMedicineRow}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มรายการยาที่จ่าย</span>
          </button>
        </div>

        {dispensedList.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            ยังไม่มีรายการยาที่จ่าย (กด "+ เพิ่มรายการยาที่จ่าย" หากต้องการจ่ายยา)
          </div>
        ) : (
          <div className="space-y-3">
            {dispensedList.map((item, index) => {
              const med = medicines.find(m => m.id === item.medicineId);
              const safety = selectedStudent && med ? checkDrugSafety(selectedStudent.id, med.id, item.quantity) : null;

              return (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border space-y-3 transition-all ${
                    safety && !safety.isSafe 
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      ยาที่จ่ายรายการ #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDispensedList(prev => prev.filter((_, i) => i !== index))}
                      className="text-xs text-rose-600 hover:underline flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-semibold mb-1">เลือกยาในคลัง *</label>
                      <select
                        value={item.medicineId}
                        onChange={e => handleMedChange(index, e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2 bg-white font-semibold text-slate-800"
                      >
                        {medicines.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.tradeName} ({m.genericName}) [คงเหลือ: {m.currentStock} {m.unit}] - Exp: {m.expiryDate}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        จำนวน ({med?.unit || 'หน่วย'}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={med?.currentStock || 100}
                        value={item.quantity}
                        onChange={e => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setDispensedList(prev => prev.map((x, i) => i === index ? { ...x, quantity: val } : x));
                        }}
                        className="w-full rounded-xl border border-slate-300 p-2 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">วิธีรับประทาน / ขนาดยา</label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={e => {
                          const val = e.target.value;
                          setDispensedList(prev => prev.map((x, i) => i === index ? { ...x, dosage: val } : x));
                        }}
                        placeholder="เช่น 1 เม็ด หลังอาหารทันที"
                        className="w-full rounded-xl border border-slate-300 p-2 bg-white"
                      />
                    </div>
                  </div>

                  {/* Safety Inspection Status Badge */}
                  {safety && (
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      {safety.isSafe ? (
                        <div className="flex items-center space-x-2 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ผ่านการตรวจสอบความปลอดภัย: นักเรียนไม่แพ้ยานี้, ยายังไม่หมดอายุ, สต๊อกเพียงพอ</span>
                          {safety.warnings.length > 0 && (
                            <span className="text-amber-600 font-normal">({safety.warnings.join(', ')})</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-start space-x-2 text-rose-800 font-bold bg-rose-100 p-2.5 rounded-lg border border-rose-300 animate-pulse">
                          <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-rose-900 text-sm">⛔ คำเตือนความปลอดภัย ห้ามจ่าย!</span>
                            <ul className="list-disc list-inside font-semibold text-rose-800 mt-0.5">
                              {safety.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 5: Outcome & Hospital Referral Option */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>5. ผลการให้บริการและการส่งต่อโรงพยาบาล (Outcome & Referral)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">ผลการรักษาเบื้องต้น *</label>
            <select
              value={outcome}
              onChange={e => {
                const val = e.target.value as InfirmaryVisit['outcome'];
                setOutcome(val);
                if (val === 'ส่งต่อโรงพยาบาล' || val === 'เรียกรถพยาบาล (1669)') {
                  setIsReferral(true);
                }
              }}
              className="w-full rounded-xl border border-slate-300 p-2 bg-white font-semibold"
            >
              <option value="ดีขึ้น">ดีขึ้น (กลับเข้าห้องเรียนได้)</option>
              <option value="สังเกตอาการต่อ">สังเกตอาการต่อในห้องพยาบาล</option>
              <option value="ผู้ปกครองมารับกลับบ้าน">ผู้ปกครองมารับกลับบ้าน</option>
              <option value="ส่งต่อโรงพยาบาล">ส่งต่อโรงพยาบาล</option>
              <option value="เรียกรถพยาบาล (1669)">เรียกรถพยาบาล (1669 ฉุกเฉิน)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">บันทึกผลเพิ่มเติม</label>
            <input
              type="text"
              value={outcomeDetails}
              onChange={e => setOutcomeDetails(e.target.value)}
              placeholder="ระบุข้อแนะนำเพิ่มเติม..."
              className="w-full rounded-xl border border-slate-300 p-2 bg-white"
            />
          </div>
        </div>

        {/* Toggle Hospital Referral Section */}
        <div className="pt-2">
          <label className="flex items-center space-x-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer">
            <input
              type="checkbox"
              checked={isReferral}
              onChange={e => setIsReferral(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <div className="text-xs">
              <span className="font-bold text-rose-900 flex items-center gap-1.5">
                <Ambulance className="w-4 h-4 text-rose-600" />
                <span>เปิดบันทึกข้อมูลการส่งต่อโรงพยาบาล (Hospital Referral)</span>
              </span>
              <span className="text-slate-500 block">
                ติ๊กเลือกเพื่อกรอกข้อมูล รพ. ปลายทาง, วิธีการเดินทาง, และการติดต่อแจ้งผู้ปกครอง
              </span>
            </div>
          </label>
        </div>

        {/* Hospital Referral Form Fields */}
        {isReferral && (
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/30 space-y-3 text-xs animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-rose-900 font-semibold mb-1">ชื่อโรงพยาบาลปลายทาง *</label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={e => setHospitalName(e.target.value)}
                  className="w-full rounded-lg border border-rose-300 p-2 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-rose-900 font-semibold mb-1">วิธีการเดินทาง *</label>
                <select
                  value={transportMethod}
                  onChange={e => setTransportMethod(e.target.value)}
                  className="w-full rounded-lg border border-rose-300 p-2 bg-white"
                >
                  <option value="เรียกรถพยาบาล 1669">เรียกรถพยาบาลฉุกเฉิน (1669)</option>
                  <option value="รถพยาบาลโรงเรียน">รถพยาบาล/รถยนต์โรงเรียน</option>
                  <option value="ผู้ปกครองนำส่งเอง">ผู้ปกครองนำส่งเอง</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-rose-900 font-semibold mb-1">สาเหตุการส่งต่อ *</label>
                <input
                  type="text"
                  required
                  value={referralReason}
                  onChange={e => setReferralReason(e.target.value)}
                  placeholder="เช่น มีไข้สูง 39.5°C และชักเกร็ง ตาค้าง หายใจลำบาก"
                  className="w-full rounded-lg border border-rose-300 p-2 bg-white font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-rose-900 font-semibold mb-1">สภาพผู้ป่วยก่อนส่ง</label>
                <input
                  type="text"
                  value={patientCondition}
                  onChange={e => setPatientCondition(e.target.value)}
                  className="w-full rounded-lg border border-rose-300 p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-rose-900 font-semibold mb-1">ครู/เจ้าหน้าที่ผู้ร่วมเดินทาง</label>
                <input
                  type="text"
                  value={accompanyingStaff}
                  onChange={e => setAccompanyingStaff(e.target.value)}
                  className="w-full rounded-lg border border-rose-300 p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-rose-900 font-semibold mb-1">เวลาที่แจ้งผู้ปกครอง</label>
                <input
                  type="text"
                  value={guardianNotifiedTime}
                  onChange={e => setGuardianNotifiedTime(e.target.value)}
                  placeholder="เช่น 11:15 น."
                  className="w-full rounded-lg border border-rose-300 p-2 bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>บันทึกการให้บริการและตัดสต็อกยา</span>
        </button>
      </div>
    </form>
  );
};
