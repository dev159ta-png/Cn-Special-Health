import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { InfirmaryVisit, TreatmentOutcome } from '../../types';
import { 
  X, 
  Save, 
  Trash2, 
  Stethoscope, 
  HeartPulse, 
  Clock, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  Bed,
  MapPin,
  User,
  Activity
} from 'lucide-react';
import { formatThaiDatePattern } from '../../utils/dateUtils';

interface EditVisitModalProps {
  visit: InfirmaryVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<InfirmaryVisit>) => void;
  onDelete?: (id: string) => void;
}

const COMMON_SYMPTOMS_LIST = [
  'ปวดศีรษะ', 'มีไข้/ตัวร้อน', 'ปวดท้อง', 'คลื่นไส้/อาเจียน', 'เวียนศีรษะ',
  'มีบาดแผลถลอก', 'ฟกช้ำ', 'เลือดกำเดาไหล', 'ผื่นคัน/แพ้', 'ชักเกร็ง',
  'หายใจเหนื่อย/หอบ', 'เจ็บคอ', 'ไอ/มีน้ำมูก', 'ปวดฟัน', 'เป็นลม/หน้ามืด'
];

const COMMON_TREATMENTS_LIST = [
  'ให้นอนพักผ่อน', 'เช็ดตัวลดไข้', 'ประคบเย็น', 'ประคบร้อน', 'ทำแผล/ล้างแผล',
  'จ่ายยาสามัญประจำบ้าน', 'ปฐมพยาบาลเบื้องต้น', 'สังเกตอาการ', 'วัดสัญญาณชีพ',
  'ตรวจน้ำตาลปลายนิ้ว', 'แจ้งครูประจำชั้น', 'โทรแจ้งผู้ปกครอง'
];

export const EditVisitModal: React.FC<EditVisitModalProps> = ({
  visit,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const { systemConfig, currentUser } = useApp();

  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [serviceType, setServiceType] = useState('ป่วย');
  const [broughtBy, setBroughtBy] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [symptomDetails, setSymptomDetails] = useState('');
  
  // Vitals
  const [temperature, setTemperature] = useState<string>('');
  const [pulseRate, setPulseRate] = useState<string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('');
  const [bpSystolic, setBpSystolic] = useState<string>('');
  const [bpDiastolic, setBpDiastolic] = useState<string>('');
  const [oxygenSaturation, setOxygenSaturation] = useState<string>('');

  // Treatment & Outcome
  const [treatments, setTreatments] = useState<string[]>([]);
  const [customTreatment, setCustomTreatment] = useState('');
  const [treatmentDetails, setTreatmentDetails] = useState('');
  const [outcome, setOutcome] = useState<TreatmentOutcome>('กลับเข้าชั้นเรียน');
  const [outcomeDetails, setOutcomeDetails] = useState('');
  const [attendantName, setAttendantName] = useState('');

  // Bed resting
  const [hasResting, setHasResting] = useState(false);
  const [bedNumber, setBedNumber] = useState('');
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (visit) {
      setVisitDate(visit.visitDate || '');
      setVisitTime(visit.visitTime || '');
      setServiceType(visit.serviceType || 'ป่วย');
      setBroughtBy(visit.broughtBy || '');
      setIncidentLocation(visit.incidentLocation || '');
      setSymptoms(visit.symptoms || []);
      setSymptomDetails(visit.symptomDetails || '');

      setTemperature(visit.vitals?.temperature?.toString() || '');
      setPulseRate(visit.vitals?.pulse?.toString() || '');
      setRespiratoryRate(visit.vitals?.respiratoryRate?.toString() || '');
      setBpSystolic(visit.vitals?.bloodPressureSys?.toString() || '');
      setBpDiastolic(visit.vitals?.bloodPressureDia?.toString() || '');
      setOxygenSaturation(visit.vitals?.oxygenSaturation?.toString() || '');

      setTreatments(visit.treatments || []);
      setTreatmentDetails(visit.treatmentDetails || '');
      setOutcome(visit.outcome || 'กลับเข้าชั้นเรียน');
      setOutcomeDetails(visit.outcomeDetails || '');
      setAttendantName(visit.attendantName || currentUser.name || '');

      if (visit.restingRecord) {
        setHasResting(true);
        setBedNumber(visit.restingRecord.bedNumber || '');
        setTimeIn(visit.restingRecord.timeIn || '');
        setTimeOut(visit.restingRecord.timeOut || '');
      } else {
        setHasResting(false);
        setBedNumber('');
        setTimeIn('');
        setTimeOut('');
      }

      setShowDeleteConfirm(false);
    }
  }, [visit, currentUser]);

  if (!isOpen || !visit) return null;

  const toggleSymptom = (sym: string) => {
    setSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleAddCustomSymptom = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customSymptom.trim()) {
      e.preventDefault();
      if (!symptoms.includes(customSymptom.trim())) {
        setSymptoms(prev => [...prev, customSymptom.trim()]);
      }
      setCustomSymptom('');
    }
  };

  const toggleTreatment = (trt: string) => {
    setTreatments(prev => 
      prev.includes(trt) ? prev.filter(t => t !== trt) : [...prev, trt]
    );
  };

  const handleAddCustomTreatment = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTreatment.trim()) {
      e.preventDefault();
      if (!treatments.includes(customTreatment.trim())) {
        setTreatments(prev => [...prev, customTreatment.trim()]);
      }
      setCustomTreatment('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: Partial<InfirmaryVisit> = {
      visitDate,
      visitTime,
      serviceType,
      broughtBy: broughtBy.trim() || undefined,
      incidentLocation: incidentLocation.trim() || undefined,
      symptoms,
      symptomDetails: symptomDetails.trim(),
      vitals: {
        temperature: temperature ? parseFloat(temperature) : undefined,
        pulse: pulseRate ? parseInt(pulseRate, 10) : undefined,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate, 10) : undefined,
        bloodPressureSys: bpSystolic ? parseInt(bpSystolic, 10) : undefined,
        bloodPressureDia: bpDiastolic ? parseInt(bpDiastolic, 10) : undefined,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation, 10) : undefined
      },
      treatments,
      treatmentDetails: treatmentDetails.trim() || undefined,
      restingRecord: hasResting && bedNumber ? {
        bedNumber,
        timeIn: timeIn || visitTime,
        timeOut: timeOut || undefined
      } : undefined,
      outcome,
      outcomeDetails: outcomeDetails.trim() || undefined,
      attendantName: attendantName.trim() || currentUser.name
    };

    onSave(updatedData);
    onClose();
  };

  const handleDeleteConfirm = () => {
    if (onDelete && visit) {
      onDelete(visit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-base sm:text-lg">
                  แก้ไขบันทึกการรับบริการห้องพยาบาล
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold">
                  {visit.visitNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {visit.studentName} {visit.nickname ? `(${visit.nickname})` : ''} · ชั้น {visit.classroom}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: วันที่และเวลา */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>ข้อมูลวันเวลาและประเภทบริการ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่รับบริการ *
                </label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เวลารับบริการ *
                </label>
                <input
                  type="time"
                  required
                  value={visitTime}
                  onChange={e => setVisitTime(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทการรับบริการ
                </label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="ป่วย">ป่วยทั่วไป</option>
                  <option value="อุบัติเหตุจากการเรียน">อุบัติเหตุจากการเรียน</option>
                  <option value="อุบัติเหตุจากกิจกรรม">อุบัติเหตุจากกิจกรรม/กีฬา</option>
                  <option value="รับยาตามนัด">รับยาตามนัด</option>
                  <option value="ทำแผล">ทำแผล/ล้างแผล</option>
                  <option value="ดูแลอุปกรณ์ทางการแพทย์">ดูแลอุปกรณ์ทางการแพทย์</option>
                  <option value="ส่งต่อโรงพยาบาล">ส่งต่อโรงพยาบาล</option>
                  <option value="อื่น ๆ">อื่น ๆ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผู้พามา / ส่งมา
                </label>
                <input
                  type="text"
                  placeholder="เช่น ครูประจำชั้น, เพื่อน, เดินมาเอง"
                  value={broughtBy}
                  onChange={e => setBroughtBy(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานที่เกิดเหตุ / จุดเกิดอาการ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ห้องเรียน, สนามกีฬา, โรงอาหาร"
                  value={incidentLocation}
                  onChange={e => setIncidentLocation(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: สัญญาณชีพ (Vital Signs) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              <span>สัญญาณชีพ (Vital Signs)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  อุณหภูมิ (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ชีพจร (bpm)
                </label>
                <input
                  type="number"
                  placeholder="80"
                  value={pulseRate}
                  onChange={e => setPulseRate(e.target.value)}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  การหายใจ (/นาที)
                </label>
                <input
                  type="number"
                  placeholder="20"
                  value={respiratoryRate}
                  onChange={e => setRespiratoryRate(e.target.value)}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  BP บน (SYS)
                </label>
                <input
                  type="number"
                  placeholder="110"
                  value={bpSystolic}
                  onChange={e => setBpSystolic(e.target.value)}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  BP ล่าง (DIA)
                </label>
                <input
                  type="number"
                  placeholder="70"
                  value={bpDiastolic}
                  onChange={e => setBpDiastolic(e.target.value)}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  placeholder="98"
                  value={oxygenSaturation}
                  onChange={e => setOxygenSaturation(e.target.value)}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: อาการสำคัญ (Symptoms) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>อาการสำคัญที่พบ</span>
            </h4>

            {/* Quick symptom pills */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SYMPTOMS_LIST.map(sym => {
                const isSelected = symptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${sym}` : `+ ${sym}`}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="พิมพ์อาการอื่นๆ แล้วกด Enter..."
                value={customSymptom}
                onChange={e => setCustomSymptom(e.target.value)}
                onKeyDown={handleAddCustomSymptom}
                className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดอาการเพิ่มเติม
              </label>
              <textarea
                rows={2}
                placeholder="ระบุตำแหน่งของแผล พฤติกรรม หรือลักษณะอาการที่ตรวจพบ..."
                value={symptomDetails}
                onChange={e => setSymptomDetails(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Section 4: การรักษา & หัตถการ */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>การรักษาและการพยาบาล</span>
            </h4>

            {/* Quick treatment pills */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TREATMENTS_LIST.map(trt => {
                const isSelected = treatments.includes(trt);
                return (
                  <button
                    key={trt}
                    type="button"
                    onClick={() => toggleTreatment(trt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${trt}` : `+ ${trt}`}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="พิมพ์การรักษาอื่นๆ แล้วกด Enter..."
                value={customTreatment}
                onChange={e => setCustomTreatment(e.target.value)}
                onKeyDown={handleAddCustomTreatment}
                className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดการรักษาเพิ่มเติม
              </label>
              <textarea
                rows={2}
                placeholder="ระบุการรักษาเพิ่มเติม..."
                value={treatmentDetails}
                onChange={e => setTreatmentDetails(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Section 5: การนอนพักห้องพยาบาล */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasResting}
                  onChange={e => setHasResting(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-blue-600" />
                  <span>มีการนอนพักในห้องพยาบาล</span>
                </span>
              </label>
            </div>

            {hasResting && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เตียงหมายเลข
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เตียง 1, เตียง 2"
                    value={bedNumber}
                    onChange={e => setBedNumber(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เวลาเข้าพัก
                  </label>
                  <input
                    type="time"
                    value={timeIn}
                    onChange={e => setTimeIn(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เวลาออกจากห้องพัก
                  </label>
                  <input
                    type="time"
                    value={timeOut}
                    onChange={e => setTimeOut(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: ผลการรักษา & ผู้ให้บริการ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ผลการรักษา / การจัดการ *
              </label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value as TreatmentOutcome)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="กลับเข้าชั้นเรียน">กลับเข้าชั้นเรียน</option>
                <option value="พักห้องพยาบาล">พักห้องพยาบาลต่อ</option>
                <option value="ติดต่อผู้ปกครอง">ติดต่อผู้ปกครอง</option>
                <option value="ส่งต่อโรงพยาบาล">ส่งต่อโรงพยาบาล</option>
                <option value="เรียกรถพยาบาล (1669)">เรียกรถพยาบาล (1669)</option>
                <option value="ดีขึ้น">ดีขึ้น / หายจากอาการ</option>
                <option value="อื่น ๆ">อื่น ๆ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ผู้ให้บริการพยาบาล *
              </label>
              <input
                type="text"
                required
                value={attendantName}
                onChange={e => setAttendantName(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บันทึกผลการติดตามอาการเพิ่มเติม
              </label>
              <input
                type="text"
                placeholder="เช่น วัดไข้ซ้ำได้ 36.8°C หลังพัก 30 นาที, ผู้ปกครองรับทราบแล้ว"
                value={outcomeDetails}
                onChange={e => setOutcomeDetails(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Delete Warning Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 animate-in fade-in">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>ยืนยันการลบรายการรับบริการนี้?</span>
              </div>
              <p className="text-xs text-rose-700">
                การลบรายการบันทึกนี้จะถูกนำออกจากระบบอย่างถาวรและบันทึกใน Audit Log
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  ยืนยันลบรายการ
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <div>
              {onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบรายการนี้</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
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
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
