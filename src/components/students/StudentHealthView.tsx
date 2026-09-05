import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { 
  Student, 
  ChronicDisease, 
  DrugAllergy, 
  FoodAllergy, 
  DailyMedication, 
  DisabilityItem, 
  MedicalDevice, 
  VaccineRecord, 
  NutritionRecord,
  StudentDocument 
} from '../../types';
import { StudentIndividualVisitHistoryView } from '../infirmary/StudentIndividualVisitHistoryView';
import { StudentDocumentsSection } from './StudentDocumentsSection';
import { VACCINE_GROUPED_OPTIONS, ALL_VACCINE_NAMES } from '../../data/vaccineSchedule';
import { 
  Heart, 
  AlertOctagon, 
  Utensils, 
  Pill, 
  GraduationCap, 
  Activity, 
  Syringe, 
  Scale, 
  History, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Printer, 
  Phone, 
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Ambulance,
  CheckCircle2,
  Stethoscope,
  FileText
} from 'lucide-react';

interface StudentHealthViewProps {
  student: Student;
  initialSubTab?: string;
  onBack: () => void;
  onNavigateToNewVisit?: (studentId: string) => void;
}

export const StudentHealthView: React.FC<StudentHealthViewProps> = ({
  student,
  initialSubTab = 'summary',
  onBack,
  onNavigateToNewVisit
}) => {
  const { updateStudent, visits, currentUser, systemConfig } = useApp();
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync initialSubTab when changed
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Editable local state cloned from student
  const [chronicDiseases, setChronicDiseases] = useState<ChronicDisease[]>(student.chronicDiseases || []);
  const [drugAllergies, setDrugAllergies] = useState<DrugAllergy[]>(student.drugAllergies || []);
  const [foodAllergies, setFoodAllergies] = useState<FoodAllergy[]>(student.foodAllergies || []);
  const [dailyMedications, setDailyMedications] = useState<DailyMedication[]>(student.dailyMedications || []);
  const [disabilities, setDisabilities] = useState<DisabilityItem[]>(student.disabilities || []);
  const [medicalDevices, setMedicalDevices] = useState<MedicalDevice[]>(student.medicalDevices || []);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>(student.vaccines || []);
  const [nutritionHistory, setNutritionHistory] = useState<NutritionRecord[]>(student.nutritionHistory || []);
  const [documents, setDocuments] = useState<StudentDocument[]>(student.documents || []);
  const [specialPrecautions, setSpecialPrecautions] = useState<string>(student.specialPrecautions || '');

  // Sync student data if student prop updates
  useEffect(() => {
    setChronicDiseases(student.chronicDiseases || []);
    setDrugAllergies(student.drugAllergies || []);
    setFoodAllergies(student.foodAllergies || []);
    setDailyMedications(student.dailyMedications || []);
    setDisabilities(student.disabilities || []);
    setMedicalDevices(student.medicalDevices || []);
    setVaccines(student.vaccines || []);
    setNutritionHistory(student.nutritionHistory || []);
    setDocuments(student.documents || []);
    setSpecialPrecautions(student.specialPrecautions || '');
  }, [student]);

  // Nutrition entry form fields
  const [nutWeight, setNutWeight] = useState<number>(18.5);
  const [nutHeight, setNutHeight] = useState<number>(112);
  const [nutDietType, setNutDietType] = useState<NutritionRecord['dietType']>('อาหารปกติ');
  const [nutDate, setNutDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nutNotes, setNutNotes] = useState<string>('');

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'nurse';

  // Treatment history for this student
  const studentVisits = visits.filter(v => v.studentId === student.id);

  // Save changes
  const handleSave = () => {
    if (!canEdit) return;
    updateStudent(student.id, {
      chronicDiseases,
      drugAllergies,
      foodAllergies,
      dailyMedications,
      disabilities,
      medicalDevices,
      vaccines,
      nutritionHistory,
      documents,
      specialPrecautions
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Dynamic Item Adders
  const addDrugAllergy = () => {
    setDrugAllergies(prev => [
      ...prev,
      {
        id: `da-${Date.now()}`,
        drugName: '',
        reaction: '',
        severity: 'รุนแรง',
        notes: ''
      }
    ]);
  };

  const addFoodAllergy = () => {
    setFoodAllergies(prev => [
      ...prev,
      {
        id: `fa-${Date.now()}`,
        foodName: '',
        reaction: '',
        severity: 'ปานกลาง',
        notes: ''
      }
    ]);
  };

  const addChronicDisease = () => {
    setChronicDiseases(prev => [
      ...prev,
      {
        id: `cd-${Date.now()}`,
        diseaseName: '',
        symptoms: '',
        doctorNotes: '',
        emergencyCare: ''
      }
    ]);
  };

  const addDailyMed = () => {
    setDailyMedications(prev => [
      ...prev,
      {
        id: `dm-${Date.now()}`,
        medicineName: '',
        dosage: '',
        timing: 'หลังอาหารกลางวัน',
        storage: 'อุณหภูมิห้อง',
        notes: ''
      }
    ]);
  };

  const addDisability = () => {
    setDisabilities(prev => [
      ...prev,
      {
        typeId: systemConfig.disabilityCategories[0].id,
        typeName: systemConfig.disabilityCategories[0].name,
        details: '',
        assistanceLevel: 'ปานกลาง',
        notes: ''
      }
    ]);
  };

  const addMedicalDevice = () => {
    setMedicalDevices(prev => [
      ...prev,
      {
        id: `md-${Date.now()}`,
        deviceType: 'NG Tube (สายให้อาหารทางจมูก)',
        startDate: new Date().toISOString().slice(0, 10),
        details: '',
        careInstructions: '',
        replacementSchedule: 'ทุก 1 เดือน',
        notes: ''
      }
    ]);
  };

  const addVaccine = () => {
    setVaccines(prev => [
      ...prev,
      {
        id: `vac-${Date.now()}`,
        vaccineName: '',
        dateReceived: new Date().toISOString().slice(0, 10),
        doseNumber: 1,
        location: systemConfig.nearbyHospital,
        nextDueDate: ''
      }
    ]);
  };

  const addNutritionRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nutWeight || !nutHeight) return;
    const heightM = nutHeight / 100;
    const bmiVal = parseFloat((nutWeight / (heightM * heightM)).toFixed(1));

    let status: NutritionRecord['bmiStatus'] = 'สมส่วน';
    if (bmiVal < 14) status = 'ผอมมาก';
    else if (bmiVal < 16) status = 'น้ำหนักน้อย';
    else if (bmiVal <= 21) status = 'สมส่วน';
    else if (bmiVal <= 25) status = 'ท้วม';
    else status = 'อ้วน';

    const newRecord: NutritionRecord = {
      id: `nut-${Date.now()}`,
      date: nutDate,
      weight: nutWeight,
      height: nutHeight,
      bmi: bmiVal,
      bmiStatus: status,
      dietType: nutDietType,
      notes: nutNotes
    };

    setNutritionHistory(prev => [...prev, newRecord]);
    setNutNotes('');
  };

  const tabs = [
    { id: 'summary', label: 'ภาพรวมสุขภาพ', icon: Heart },
    { id: 'allergies', label: 'ประวัติแพ้ยา/แพ้อาหาร', icon: AlertOctagon, count: drugAllergies.length + foodAllergies.length },
    { id: 'diseases', label: 'โรคประจำตัว & ยา', icon: Pill, count: chronicDiseases.length + dailyMedications.length },
    { id: 'disabilities', label: 'ประเภทความพิการ (9 ประเภท)', icon: GraduationCap, count: disabilities.length },
    { id: 'devices', label: 'ท่อ & อุปกรณ์การแพทย์', icon: Activity, count: medicalDevices.length },
    { id: 'vaccines', label: 'ระบบวัคซีน', icon: Syringe, count: vaccines.length },
    { id: 'documents', label: 'เอกสารที่เกี่ยวข้อง', icon: FileText, count: documents.length },
    { id: 'nutrition', label: 'โภชนาการ & กราฟ BMI', icon: Scale },
    { id: 'visits', label: 'ประวัติการรักษา', icon: History, count: studentVisits.length },
    { id: 'emergency', label: 'Emergency Profile', icon: ShieldAlert }
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner with Student Identity */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors mt-1"
              title="ย้อนกลับ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <img
              src={student.photoUrl}
              alt={student.firstName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-teal-100 shadow-xs flex-shrink-0"
            />

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {student.studentCode}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                  ชั้น {student.grade} ({student.classroom})
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  กรุ๊ป {student.bloodType}
                </span>
              </div>

              <h1 className="font-heading font-bold text-lg sm:text-2xl text-slate-900 mt-1">
                {student.prefix} {student.firstName} {student.lastName}
                <span className="ml-2 text-sm font-normal text-slate-500 font-sans">
                  (น้อง{student.nickname} • อายุ {student.age} ปี • {student.gender})
                </span>
              </h1>

              <p className="text-xs text-slate-500 mt-0.5">
                ครูประจำชั้น: <strong className="text-slate-700">{student.homeroomTeacher}</strong> • ผู้ปกครอง: <strong className="text-slate-700">{student.guardianName}</strong> ({student.guardianRelationship}) • โทร: <a href={`tel:${student.guardianPhone}`} className="text-teal-600 font-semibold">{student.guardianPhone}</a>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 self-end lg:self-center">
            {onNavigateToNewVisit && canEdit && (
              <button
                onClick={() => onNavigateToNewVisit(student.id)}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Stethoscope className="w-4 h-4" />
                <span>+ บันทึกรับบริการ</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">บันทึกข้อมูลสุขภาพของนักเรียนเรียบร้อยแล้ว</span>
          </div>
        )}
      </div>

      {/* Prominent Safety Alert Banner (Must show on top of health profile) */}
      {(drugAllergies.length > 0 || specialPrecautions || medicalDevices.length > 0) && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-rose-900 font-heading font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            <span>ข้อควรระวังพิเศษทางการแพทย์ & การแพ้ยา (สำคัญมาก)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {drugAllergies.length > 0 && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200">
                <span className="font-bold text-rose-700 block">🔴 ประวัติแพ้ยา:</span>
                <span className="text-slate-800 font-semibold">
                  {drugAllergies.map(d => `${d.drugName} (${d.severity})`).join(', ')}
                </span>
              </div>
            )}

            {medicalDevices.length > 0 && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-purple-200">
                <span className="font-bold text-purple-700 block">🩺 อุปกรณ์/สายท่อ:</span>
                <span className="text-slate-800 font-semibold">
                  {medicalDevices.map(m => m.deviceType).join(', ')}
                </span>
              </div>
            )}

            {specialPrecautions && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 md:col-span-1">
                <span className="font-bold text-amber-700 block">⚠️ ข้อควรระวังพิเศษ:</span>
                <span className="text-slate-800 font-medium">{specialPrecautions}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs overflow-x-auto flex space-x-1 text-xs">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-700'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* General Health Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
              <Heart className="w-4 h-4 text-teal-600" />
              <span>สรุปข้อมูลสุขภาพทั่วไป</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">หมู่เลือด (Blood Group):</span>
                <span className="font-bold text-slate-800">{student.bloodType}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">วันเกิด / อายุ:</span>
                <span className="font-semibold text-slate-800">{formatThaiDatePattern(student.birthDate)} ({student.age} ปี)</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">ระดับชั้น / ห้องเรียน:</span>
                <span className="font-semibold text-slate-800">{student.grade} ห้อง {student.classroom}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">ครูประจำชั้น:</span>
                <span className="font-semibold text-slate-800">{student.homeroomTeacher}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">ผู้ปกครอง & โทรศัพท์:</span>
                <span className="font-semibold text-slate-800">{student.guardianName} ({student.guardianPhone})</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">เบอร์โทรฉุกเฉิน:</span>
                <span className="font-bold text-rose-600">{student.emergencyPhone || student.guardianPhone}</span>
              </div>

              <div className="py-1.5 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">ที่อยู่ตามทะเบียน:</span>
                <span className="font-medium text-slate-800">{student.address}</span>
              </div>
            </div>

            {/* Special Precautions input */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ข้อควรระวังพิเศษสำหรับครูและบุคลากร:
              </label>
              <textarea
                value={specialPrecautions}
                onChange={e => setSpecialPrecautions(e.target.value)}
                disabled={!canEdit}
                rows={3}
                placeholder="ระบุข้อควรระวังพิเศษ เช่น ห้ามให้กินของแข็ง ระวังอาการชักเมื่อไข้ขึ้น ฯลฯ"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Quick Health Status Highlights */}
          <div className="space-y-4">
            {/* Disabilities highlight */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  <span>ประเภทความพิการ</span>
                </h4>
                <button
                  onClick={() => setActiveTab('disabilities')}
                  className="text-xs text-teal-600 hover:underline"
                >
                  แก้ไข/ดูรายละเอียด →
                </button>
              </div>

              <div className="space-y-2">
                {disabilities.map(d => (
                  <div key={d.typeId} className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900">{d.typeName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-200 text-teal-900">
                        ต้องการช่วยเหลือ: {d.assistanceLevel}
                      </span>
                    </div>
                    {d.details && <p className="text-slate-600 mt-1">{d.details}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Chronic diseases highlight */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                  <Pill className="w-4 h-4 text-amber-600" />
                  <span>โรคประจำตัว & ยาที่ต้องรับประทาน</span>
                </h4>
                <button
                  onClick={() => setActiveTab('diseases')}
                  className="text-xs text-teal-600 hover:underline"
                >
                  จัดการ →
                </button>
              </div>

              {chronicDiseases.length === 0 ? (
                <p className="text-xs text-slate-400">ไม่มีประวัติโรคประจำตัว</p>
              ) : (
                <div className="space-y-2">
                  {chronicDiseases.map(c => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs">
                      <span className="font-bold text-amber-900 block">{c.diseaseName}</span>
                      <p className="text-slate-600 mt-0.5">{c.symptoms}</p>
                      {c.emergencyCare && (
                        <p className="text-rose-700 font-semibold mt-1">
                          🚨 ปฐมพยาบาล: {c.emergencyCare}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical Devices highlight */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-slate-800 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>การใส่ท่อและอุปกรณ์ทางการแพทย์</span>
                </h4>
                <button
                  onClick={() => setActiveTab('devices')}
                  className="text-xs text-teal-600 hover:underline"
                >
                  จัดการ →
                </button>
              </div>

              {medicalDevices.length === 0 ? (
                <p className="text-xs text-slate-400">ไม่มีการใช้อุปกรณ์หรือท่อทางการแพทย์</p>
              ) : (
                <div className="space-y-2">
                  {medicalDevices.map(m => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
                      <span className="font-bold text-purple-900 block">{m.deviceType}</span>
                      <p className="text-slate-600 mt-0.5">{m.careInstructions}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC FORM - ALLERGIES (แพ้ยา & แพ้อาหาร) */}
      {activeTab === 'allergies' && (
        <div className="space-y-6">
          {/* Section 1: Drug Allergies Dynamic Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-rose-700 flex items-center space-x-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600" />
                  <span>ประวัติการแพ้ยา (Drug Allergy)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ข้อมูลนี้จะถูกเชื่อมโยงไปยังระบบจ่ายยาเพื่อแจ้งเตือนอัตโนมัติก่อนจ่ายยาทุกครั้ง
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={addDrugAllergy}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มรายการแพ้ยา</span>
                </button>
              )}
            </div>

            {drugAllergies.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                ไม่มีประวัติการแพ้ยาที่บันทึกไว้
              </div>
            ) : (
              <div className="space-y-3">
                {drugAllergies.map((allergy, index) => (
                  <div 
                    key={allergy.id} 
                    className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800">
                        รายการแพ้ยาที่ #{index + 1}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setDrugAllergies(prev => prev.filter(x => x.id !== allergy.id))}
                          className="p-1 rounded text-rose-600 hover:bg-rose-100 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบรายการ</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">ชื่อยาที่แพ้ *</label>
                        <input
                          type="text"
                          value={allergy.drugName}
                          onChange={e => {
                            const val = e.target.value;
                            setDrugAllergies(prev => prev.map(x => x.id === allergy.id ? { ...x, drugName: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น Amoxicillin, Penicillin, Bactrim"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-rose-500 font-semibold text-rose-900"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">ระดับความรุนแรง *</label>
                        <select
                          value={allergy.severity}
                          onChange={e => {
                            const val = e.target.value as DrugAllergy['severity'];
                            setDrugAllergies(prev => prev.map(x => x.id === allergy.id ? { ...x, severity: val } : x));
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-rose-500"
                        >
                          <option value="เล็กน้อย">เล็กน้อย (ผื่นคันธรรมดา)</option>
                          <option value="ปานกลาง">ปานกลาง (ผื่นลมพิษ บวม)</option>
                          <option value="รุนแรง">รุนแรง (แน่นหน้าอก หายใจลำบาก)</option>
                          <option value="รุนแรงมาก (Anaphylaxis)">รุนแรงมาก (Anaphylaxis - ถึงแก่ชีวิต)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">อาการที่เกิดขึ้น</label>
                        <input
                          type="text"
                          value={allergy.reaction}
                          onChange={e => {
                            const val = e.target.value;
                            setDrugAllergies(prev => prev.map(x => x.id === allergy.id ? { ...x, reaction: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น หน้าบวม ปากบวม หายใจมีเสียงหวีด"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-rose-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-slate-600 font-medium mb-1">หมายเหตุเพิ่มเติม</label>
                        <input
                          type="text"
                          value={allergy.notes || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setDrugAllergies(prev => prev.map(x => x.id === allergy.id ? { ...x, notes: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น ห้ามจ่ายยากลุ่ม Beta-lactam ทั้งหมด"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Food Allergies Dynamic Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-amber-700 flex items-center space-x-2">
                  <Utensils className="w-5 h-5 text-amber-600" />
                  <span>ประวัติการแพ้อาหาร (Food Allergy)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  อาหารที่นักเรียนรับประทานไม่ได้ เพื่อแจ้งแก่ฝ่ายโภชนาการและครูผู้ดูแล
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={addFoodAllergy}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มรายการแพ้อาหาร</span>
                </button>
              )}
            </div>

            {foodAllergies.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                ไม่มีประวัติการแพ้อาหาร
              </div>
            ) : (
              <div className="space-y-3">
                {foodAllergies.map((allergy, index) => (
                  <div 
                    key={allergy.id} 
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800">
                        รายการแพ้อาหาร #{index + 1}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setFoodAllergies(prev => prev.filter(x => x.id !== allergy.id))}
                          className="p-1 rounded text-amber-700 hover:bg-amber-100 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบรายการ</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">ชื่ออาหารที่แพ้ *</label>
                        <input
                          type="text"
                          value={allergy.foodName}
                          onChange={e => {
                            const val = e.target.value;
                            setFoodAllergies(prev => prev.map(x => x.id === allergy.id ? { ...x, foodName: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น ถั่วลิสง, กุ้ง, ไข่ไก่, นมวัว"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-amber-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">ระดับความรุนแรง</label>
                        <select
                          value={allergy.severity}
                          onChange={e => {
                            const val = e.target.value as FoodAllergy['severity'];
                            setFoodAllergies(prev => prev.map(x => x.id === allergy.id ? { ...x, severity: val } : x));
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-amber-500"
                        >
                          <option value="เล็กน้อย">เล็กน้อย</option>
                          <option value="ปานกลาง">ปานกลาง</option>
                          <option value="รุนแรง">รุนแรง</option>
                          <option value="รุนแรงมาก (Anaphylaxis)">รุนแรงมาก (Anaphylaxis)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">อาการแพ้</label>
                        <input
                          type="text"
                          value={allergy.reaction}
                          onChange={e => {
                            const val = e.target.value;
                            setFoodAllergies(prev => prev.map(x => x.id === allergy.id ? { ...x, reaction: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น ผื่นคัน อาเจียน ถ่ายเหลว"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHRONIC DISEASES & DAILY MEDICATIONS */}
      {activeTab === 'diseases' && (
        <div className="space-y-6">
          {/* Chronic Diseases */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
                  <Pill className="w-5 h-5 text-amber-600" />
                  <span>โรคประจำตัว (Chronic Diseases)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ระบุโรคประจำตัว อาการที่แสดง และวิธีปฐมพยาบาลเบื้องต้นเมื่อเกิดอาการฉุกเฉิน
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={addChronicDisease}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มโรคประจำตัว</span>
                </button>
              )}
            </div>

            {chronicDiseases.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                ไม่มีประวัติโรคประจำตัว
              </div>
            ) : (
              <div className="space-y-3">
                {chronicDiseases.map((item, index) => (
                  <div key={item.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">
                        โรคประจำตัว #{index + 1}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setChronicDiseases(prev => prev.filter(x => x.id !== item.id))}
                          className="p-1 rounded text-amber-700 hover:bg-amber-100 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">ชื่อโรคประจำตัว *</label>
                        <input
                          type="text"
                          value={item.diseaseName}
                          onChange={e => {
                            const val = e.target.value;
                            setChronicDiseases(prev => prev.map(x => x.id === item.id ? { ...x, diseaseName: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น โรคลมชัก, หอบหืด, เบาหวาน, โรคหัวใจ"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">คำแนะนำจากแพทย์</label>
                        <input
                          type="text"
                          value={item.doctorNotes || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setChronicDiseases(prev => prev.map(x => x.id === item.id ? { ...x, doctorNotes: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น ติดตามผลที่ รพ. ทุก 3 เดือน"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-medium mb-1">อาการที่พบบ่อย</label>
                        <input
                          type="text"
                          value={item.symptoms}
                          onChange={e => {
                            const val = e.target.value;
                            setChronicDiseases(prev => prev.map(x => x.id === item.id ? { ...x, symptoms: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น ชักเกร็ง ตาค้าง กัดลิ้น หายใจไม่ออก"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-rose-700 font-bold mb-1">วิธีปฐมพยาบาลเบื้องต้นกรณีฉุกเฉิน *</label>
                        <input
                          type="text"
                          value={item.emergencyCare || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setChronicDiseases(prev => prev.map(x => x.id === item.id ? { ...x, emergencyCare: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น จับนอนตะแคงซ้าย ห้ามงัดปาก จัดทางเดินหายใจ พ่นยา Ventolin"
                          className="w-full rounded-lg border border-rose-300 p-2 text-xs bg-white font-semibold text-rose-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Medications */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
                  <Pill className="w-5 h-5 text-teal-600" />
                  <span>ยาประจำตัวที่ต้องรับประทานที่โรงเรียน</span>
                </h3>
                <p className="text-xs text-slate-500">
                  ยาที่ผู้ปกครองนำมาฝากครูอนามัยหรือครูประจำชั้นให้ป้อนระหว่างวัน
                </p>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={addDailyMed}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มยาประจำตัว</span>
                </button>
              )}
            </div>

            {dailyMedications.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                ไม่มีรายการยาประจำตัวที่ต้องรับประทานที่โรงเรียน
              </div>
            ) : (
              <div className="space-y-3">
                {dailyMedications.map((item, index) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        ยาประจำตัว #{index + 1}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setDailyMedications(prev => prev.filter(x => x.id !== item.id))}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-slate-100 text-xs flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-medium mb-1">ชื่อยา *</label>
                        <input
                          type="text"
                          value={item.medicineName}
                          onChange={e => {
                            const val = e.target.value;
                            setDailyMedications(prev => prev.map(x => x.id === item.id ? { ...x, medicineName: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น Depakine Syrup, Flixotide Inhaler"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">ขนาดยา (Dosage)</label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={e => {
                            const val = e.target.value;
                            setDailyMedications(prev => prev.map(x => x.id === item.id ? { ...x, dosage: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น 3.5 ml, 1 เม็ด"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">เวลาที่ต้องรับประทาน</label>
                        <input
                          type="text"
                          value={item.timing}
                          onChange={e => {
                            const val = e.target.value;
                            setDailyMedications(prev => prev.map(x => x.id === item.id ? { ...x, timing: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น หลังอาหารกลางวัน 12:30 น."
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">การเก็บรักษา</label>
                        <select
                          value={item.storage}
                          onChange={e => {
                            const val = e.target.value as DailyMedication['storage'];
                            setDailyMedications(prev => prev.map(x => x.id === item.id ? { ...x, storage: val } : x));
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        >
                          <option value="อุณหภูมิห้อง">อุณหภูมิห้อง</option>
                          <option value="ตู้เย็น (2-8°C)">ตู้เย็น (2-8°C)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-slate-600 font-medium mb-1">หมายเหตุ/วิธีป้อน</label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setDailyMedications(prev => prev.map(x => x.id === item.id ? { ...x, notes: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น ป้อนผ่าน NG Tube แล้วตามด้วยน้ำสะอาด"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: 9 DISABILITY CATEGORIES */}
      {activeTab === 'disabilities' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                <span>ประเภทความพิการ 9 ประเภท (กระทรวงศึกษาธิการ)</span>
              </h3>
              <p className="text-xs text-slate-500">
                รองรับการเลือกมากกว่า 1 ประเภท (กรณีพิการซ้อน) พร้อมระบุระดับความต้องการช่วยเหลือ
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={addDisability}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มประเภทความพิการ</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {disabilities.map((item, index) => (
              <div key={index} className="p-4 rounded-xl border border-teal-200 bg-teal-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">
                    ประเภทความพิการ #{index + 1}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setDisabilities(prev => prev.filter((_, i) => i !== index))}
                      className="p-1 rounded text-teal-700 hover:text-rose-600 hover:bg-teal-100 text-xs flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">เลือกประเภทความพิการ (9 ประเภท) *</label>
                    <select
                      value={item.typeId}
                      onChange={e => {
                        const selectedId = e.target.value;
                        const foundCat = systemConfig.disabilityCategories.find(c => c.id === selectedId);
                        setDisabilities(prev => prev.map((x, i) => i === index ? {
                          ...x,
                          typeId: selectedId,
                          typeName: foundCat ? foundCat.name : selectedId
                        } : x));
                      }}
                      disabled={!canEdit}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-semibold"
                    >
                      {systemConfig.disabilityCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ระดับความต้องการช่วยเหลือ *</label>
                    <select
                      value={item.assistanceLevel}
                      onChange={e => {
                        const val = e.target.value as DisabilityItem['assistanceLevel'];
                        setDisabilities(prev => prev.map((x, i) => i === index ? { ...x, assistanceLevel: val } : x));
                      }}
                      disabled={!canEdit}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-medium"
                    >
                      <option value="น้อย">น้อย (ช่วยเหลือตนเองได้เป็นส่วนใหญ่)</option>
                      <option value="ปานกลาง">ปานกลาง (ต้องการความช่วยเหลือบางส่วน)</option>
                      <option value="มาก">มาก (ต้องการผู้ดูแลช่วยเหลืออย่างใกล้ชิด)</option>
                      <option value="มากเป็นพิเศษ">มากเป็นพิเศษ (ช่วยเหลือตนเองไม่ได้/ติดเตียง)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">หมายเหตุ</label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setDisabilities(prev => prev.map((x, i) => i === index ? { ...x, notes: val } : x));
                      }}
                      disabled={!canEdit}
                      placeholder="เช่น มีบัตรคนพิการเลขที่..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-600 font-medium mb-1">รายละเอียดลักษณะความพิการ</label>
                    <textarea
                      rows={2}
                      value={item.details}
                      onChange={e => {
                        const val = e.target.value;
                        setDisabilities(prev => prev.map((x, i) => i === index ? { ...x, details: val } : x));
                      }}
                      disabled={!canEdit}
                      placeholder="ระบุรายละเอียดอาการ เช่น ตาบอดสนิททั้งสองข้าง, สมองพิการแขนขาเกร็ง (Spastic Quadriplegia) ฯลฯ"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: MEDICAL DEVICES & TUBES */}
      {activeTab === 'devices' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-purple-800 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>การใส่ท่อและอุปกรณ์ทางการแพทย์ (Medical Tubes & Devices)</span>
              </h3>
              <p className="text-xs text-slate-500">
                บันทึกการใส่ท่อให้อาหาร ท่อเจาะคอ สายสวนปัสสาวะ เครื่องช่วยหายใจ และคำแนะนำการดูแล
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={addMedicalDevice}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มอุปกรณ์ทางการแพทย์</span>
              </button>
            )}
          </div>

          {medicalDevices.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              ไม่มีข้อมูลการใส่ท่อหรืออุปกรณ์ทางการแพทย์
            </div>
          ) : (
            <div className="space-y-4">
              {medicalDevices.map((dev, index) => (
                <div key={dev.id} className="p-4 rounded-xl border border-purple-200 bg-purple-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900">
                      อุปกรณ์ชิ้นที่ #{index + 1}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setMedicalDevices(prev => prev.filter(x => x.id !== dev.id))}
                        className="p-1 rounded text-purple-700 hover:text-rose-600 hover:bg-purple-100 text-xs flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบรายการ</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">ประเภทอุปกรณ์ *</label>
                      <input
                        type="text"
                        value={dev.deviceType}
                        onChange={e => {
                          const val = e.target.value;
                          setMedicalDevices(prev => prev.map(x => x.id === dev.id ? { ...x, deviceType: val } : x));
                        }}
                        disabled={!canEdit}
                        placeholder="เช่น NG Tube, PEG, ท่อเจาะคอ Tracheostomy"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-semibold text-purple-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">วันที่เริ่มใส่/ใช้งาน</label>
                      <input
                        type="date"
                        value={dev.startDate}
                        onChange={e => {
                          const val = e.target.value;
                          setMedicalDevices(prev => prev.map(x => x.id === dev.id ? { ...x, startDate: val } : x));
                        }}
                        disabled={!canEdit}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">กำหนดเปลี่ยนอุปกรณ์</label>
                      <input
                        type="text"
                        value={dev.replacementSchedule || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setMedicalDevices(prev => prev.map(x => x.id === dev.id ? { ...x, replacementSchedule: val } : x));
                        }}
                        disabled={!canEdit}
                        placeholder="เช่น ทุก 1 เดือน หรือระบุวันที่"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-slate-600 font-medium mb-1">รายละเอียดและขนาดอุปกรณ์</label>
                      <input
                        type="text"
                        value={dev.details}
                        onChange={e => {
                          const val = e.target.value;
                          setMedicalDevices(prev => prev.map(x => x.id === dev.id ? { ...x, details: val } : x));
                        }}
                        disabled={!canEdit}
                        placeholder="เช่น สายให้อาหารเบอร์ 10 Fr ลึก 38 cm รูจมูกขวา"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-purple-900 font-bold mb-1">วิธีดูแลรักษา & ข้อควรระวัง *</label>
                      <textarea
                        rows={2}
                        value={dev.careInstructions}
                        onChange={e => {
                          const val = e.target.value;
                          setMedicalDevices(prev => prev.map(x => x.id === dev.id ? { ...x, careInstructions: val } : x));
                        }}
                        disabled={!canEdit}
                        placeholder="ระบุวิธีทำความสะอาด การดูดเสมหะ หรือการตรวจเช็คตำแหน่งสาย"
                        className="w-full rounded-lg border border-purple-300 p-2 text-xs bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: VACCINES */}
      {activeTab === 'vaccines' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
                <Syringe className="w-5 h-5 text-indigo-600" />
                <span>ประวัติและระบบวัคซีน (Immunization Records)</span>
              </h3>
              <p className="text-xs text-slate-500">
                เลือกวัคซีนตามแผนสร้างเสริมภูมิคุ้มกันโรคของกระทรวงสาธารณสุข และวัคซีนเสริมตามฤดูกาล
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={addVaccine}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มประวัติวัคซีน</span>
              </button>
            )}
          </div>

          {vaccines.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              ยังไม่มีประวัติการบันทึกวัคซีน
            </div>
          ) : (
            <div className="space-y-4">
              {vaccines.map((v, index) => {
                const isCustom = v.vaccineName && !ALL_VACCINE_NAMES.includes(v.vaccineName);
                const selectedSelectValue = !v.vaccineName
                  ? ''
                  : ALL_VACCINE_NAMES.includes(v.vaccineName)
                  ? v.vaccineName
                  : 'other';

                return (
                  <div key={v.id} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                          วัคซีนรายการ #{index + 1}
                        </span>
                        {v.vaccineName && (
                          <span className="text-xs font-semibold text-slate-700">
                            {v.vaccineName}
                          </span>
                        )}
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setVaccines(prev => prev.filter(x => x.id !== v.id))}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 text-xs flex items-center space-x-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      {/* Vaccine Dropdown Select */}
                      <div className={selectedSelectValue === 'other' ? 'sm:col-span-2' : 'sm:col-span-2'}>
                        <label className="block text-slate-700 font-semibold mb-1">
                          เลือกรายการวัคซีน (ตามเกณฑ์มาตรฐาน) *
                        </label>
                        <select
                          value={selectedSelectValue}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'other') {
                              setVaccines(prev => prev.map(x => x.id === v.id ? {
                                ...x,
                                vaccineName: x.vaccineName && !ALL_VACCINE_NAMES.includes(x.vaccineName) ? x.vaccineName : 'วัคซีนอื่นๆ'
                              } : x));
                            } else {
                              // Find default dose
                              let defDose = 1;
                              for (const g of VACCINE_GROUPED_OPTIONS) {
                                const found = g.items.find(i => i.name === val);
                                if (found && found.defaultDose) {
                                  defDose = found.defaultDose;
                                  break;
                                }
                              }
                              setVaccines(prev => prev.map(x => x.id === v.id ? {
                                ...x,
                                vaccineName: val,
                                doseNumber: defDose
                              } : x));
                            }
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-lg border border-indigo-300 p-2 text-xs bg-white font-semibold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- กรุณากดเลือกรายการวัคซีน --</option>
                          {VACCINE_GROUPED_OPTIONS.map(group => (
                            <optgroup key={group.groupName} label={group.groupName}>
                              {group.items.map(item => (
                                <option key={item.name} value={item.name}>
                                  {item.name} {item.disease ? `(ป้องกัน: ${item.disease})` : ''}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                          <optgroup label="วัคซีนอื่นๆ">
                            <option value="other">วัคซีนอื่นๆ (ระบุชื่อเอง)</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Custom input if 'other' is selected */}
                      {selectedSelectValue === 'other' && (
                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-semibold mb-1">ระบุชื่อวัคซีน *</label>
                          <input
                            type="text"
                            value={v.vaccineName === 'วัคซีนอื่นๆ' ? '' : v.vaccineName}
                            onChange={e => {
                              const val = e.target.value;
                              setVaccines(prev => prev.map(x => x.id === v.id ? { ...x, vaccineName: val } : x));
                            }}
                            disabled={!canEdit}
                            placeholder="พิมพ์ชื่อวัคซีน เช่น วัคซีนไข้เลือดออก (Qdenga)"
                            className="w-full rounded-lg border border-amber-300 p-2 text-xs bg-white font-semibold focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">วันที่ได้รับ</label>
                        <input
                          type="date"
                          value={v.dateReceived}
                          onChange={e => {
                            const val = e.target.value;
                            setVaccines(prev => prev.map(x => x.id === v.id ? { ...x, dateReceived: val } : x));
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">เข็มที่</label>
                        <input
                          type="number"
                          min="1"
                          value={v.doseNumber}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 1;
                            setVaccines(prev => prev.map(x => x.id === v.id ? { ...x, doseNumber: val } : x));
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-medium mb-1">สถานที่รับวัคซีน</label>
                        <input
                          type="text"
                          value={v.location}
                          onChange={e => {
                            const val = e.target.value;
                            setVaccines(prev => prev.map(x => x.id === v.id ? { ...x, location: val } : x));
                          }}
                          disabled={!canEdit}
                          placeholder="เช่น โรงพยาบาลชัยนาทนเรนทร, รพ.สต."
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-indigo-700 font-bold mb-1">กำหนดเข็มถัดไป (แจ้งเตือน)</label>
                        <input
                          type="date"
                          value={v.nextDueDate || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setVaccines(prev => prev.map(x => x.id === v.id ? { ...x, nextDueDate: val } : x));
                          }}
                          disabled={!canEdit}
                          className="w-full rounded-lg border border-indigo-300 p-2 text-xs bg-white font-medium text-indigo-900"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: RELEVANT DOCUMENTS */}
      {activeTab === 'documents' && (
        <StudentDocumentsSection
          documents={documents}
          onChange={setDocuments}
          canEdit={canEdit}
          studentName={`${student.prefix}${student.firstName} ${student.lastName}`}
          studentId={student.id}
        />
      )}

      {/* TAB 7: NUTRITION & BMI GROWTH CHART */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          {/* Add Nutrition Entry Form */}
          {canEdit && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="font-heading font-bold text-base text-slate-800 mb-3 flex items-center space-x-2">
                <Scale className="w-5 h-5 text-teal-600" />
                <span>บันทึกการเจริญเติบโตและโภชนาการใหม่</span>
              </h3>

              <form onSubmit={addNutritionRecord} className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">วันที่ชั่ง/วัด *</label>
                  <input
                    type="date"
                    required
                    value={nutDate}
                    onChange={e => setNutDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">น้ำหนัก (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={nutWeight}
                    onChange={e => setNutWeight(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">ส่วนสูง (cm) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={nutHeight}
                    onChange={e => setNutHeight(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">ประเภทอาหาร</label>
                  <select
                    value={nutDietType}
                    onChange={e => setNutDietType(e.target.value as NutritionRecord['dietType'])}
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white font-medium"
                  >
                    <option value="อาหารปกติ">อาหารปกติ</option>
                    <option value="อาหารอ่อน">อาหารอ่อน</option>
                    <option value="อาหารปั่น">อาหารปั่น</option>
                    <option value="อาหารเฉพาะโรค">อาหารเฉพาะโรค</option>
                    <option value="การให้อาหารทางสาย (Tube Feeding)">การให้อาหารทางสาย (Tube Feeding)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    + บันทึกส่วนสูง/นน.
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Interactive Visual Growth Chart (SVG) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800">
                  กราฟติดตามการเจริญเติบโตย้อนหลัง (น้ำหนัก, ส่วนสูง, BMI)
                </h3>
                <p className="text-xs text-slate-500">
                  ติดตามภาวะทุพโภชนาการและการดูดซึมอาหารของนักเรียน
                </p>
              </div>

              {nutritionHistory.length > 0 && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">BMI ปัจจุบัน</span>
                  <span className="font-heading font-bold text-lg text-teal-700">
                    {nutritionHistory[nutritionHistory.length - 1].bmi} ({nutritionHistory[nutritionHistory.length - 1].bmiStatus})
                  </span>
                </div>
              )}
            </div>

            {/* SVG Responsive Growth Chart */}
            <div className="h-64 w-full bg-slate-50 rounded-xl p-4 border border-slate-200 relative flex flex-col justify-between">
              {nutritionHistory.length < 2 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  ต้องการข้อมูลการชั่งน้ำหนักอย่างน้อย 2 ครั้งเพื่อแสดงเส้นกราฟแนวโน้ม
                </div>
              ) : (
                <div className="h-full w-full flex items-end justify-between pt-6 px-4">
                  {nutritionHistory.map((item, idx) => {
                    const maxWeight = Math.max(...nutritionHistory.map(n => n.weight), 30);
                    const heightPercent = Math.round((item.weight / maxWeight) * 80);
                    return (
                      <div key={item.id} className="flex flex-col items-center flex-1 max-w-[80px]">
                        <div className="text-[10px] font-bold text-teal-700 mb-1">
                          {item.weight} kg
                        </div>
                        <div 
                          className="w-8 rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-all shadow-xs"
                          style={{ height: `${Math.max(heightPercent, 20)}%` }}
                        />
                        <div className="mt-2 text-[10px] font-medium text-slate-600 text-center">
                          {item.date.slice(5)}
                        </div>
                        <span className="text-[9px] text-slate-400">
                          BMI {item.bmi}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">วันที่</th>
                    <th className="px-3 py-2">น้ำหนัก (kg)</th>
                    <th className="px-3 py-2">ส่วนสูง (cm)</th>
                    <th className="px-3 py-2">BMI</th>
                    <th className="px-3 py-2">สถานะโภชนาการ</th>
                    <th className="px-3 py-2">ประเภทอาหาร</th>
                    <th className="px-3 py-2 text-right">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nutritionHistory.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-800">{formatThaiDatePattern(record.date)}</td>
                      <td className="px-3 py-2 font-bold text-teal-700">{record.weight}</td>
                      <td className="px-3 py-2">{record.height}</td>
                      <td className="px-3 py-2 font-semibold">{record.bmi}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          record.bmiStatus === 'สมส่วน' ? 'bg-emerald-100 text-emerald-800' :
                          record.bmiStatus === 'ผอมมาก' || record.bmiStatus === 'อ้วนมาก' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {record.bmiStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2">{record.dietType}</td>
                      <td className="px-3 py-2 text-right">
                        {canEdit && (
                          <button
                            onClick={() => setNutritionHistory(prev => prev.filter(x => x.id !== record.id))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: TREATMENT HISTORY & TIMELINE */}
      {activeTab === 'visits' && (
        <StudentIndividualVisitHistoryView
          studentId={student.id}
          onBack={onBack}
          onNewVisit={(sId) => onNavigateToNewVisit && onNavigateToNewVisit(sId)}
          showBackButton={false}
        />
      )}

      {/* TAB 9: EMERGENCY PROFILE QUICK PREVIEW */}
      {activeTab === 'emergency' && (
        <div className="bg-white p-6 rounded-2xl border-2 border-rose-400 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
              <h3 className="font-heading font-bold text-lg text-rose-900">
                🚨 บัตรข้อมูลฉุกเฉินประจำตัว (Emergency Response Card)
              </h3>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 flex items-center space-x-1"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์บัตรฉุกเฉิน</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Critical Contact */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="font-bold text-rose-800 block text-sm mb-1">เบอร์ติดต่อด่วนที่สุด</span>
              <p className="text-slate-700 font-medium">ผู้ปกครอง: {student.guardianName} ({student.guardianRelationship})</p>
              <a 
                href={`tel:${student.guardianPhone}`}
                className="text-base font-bold text-rose-600 mt-1 block hover:underline"
              >
                📞 {student.guardianPhone}
              </a>
              <p className="text-[11px] text-slate-500 mt-2">
                เบอร์ฉุกเฉินสำรอง: <span className="font-bold text-slate-800">{student.emergencyPhone || student.guardianPhone}</span>
              </p>
            </div>

            {/* Critical Medical Conditions */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block text-sm mb-1">ข้อมูลชีวิต (Vitals)</span>
              <p className="text-slate-700">กรุ๊ปเลือด: <strong className="text-rose-600 text-sm">{student.bloodType}</strong></p>
              <p className="text-slate-700 mt-1">
                โรคประจำตัว: <strong className="text-slate-900">{chronicDiseases.map(c => c.diseaseName).join(', ') || 'ไม่มี'}</strong>
              </p>
              {chronicDiseases.some(c => c.emergencyCare) && (
                <p className="text-rose-700 font-bold mt-1">
                  วิธีปฐมพยาบาล: {chronicDiseases.map(c => c.emergencyCare).filter(Boolean).join('; ')}
                </p>
              )}
            </div>

            {/* Drug Allergies & Tubes */}
            <div className="p-4 rounded-xl bg-rose-100/70 border border-rose-300">
              <span className="font-bold text-rose-900 block text-sm mb-1">⛔ ห้ามใช้ยาเด็ดขาด!</span>
              <p className="text-rose-800 font-bold text-sm">
                {drugAllergies.map(a => a.drugName).join(', ') || 'ไม่มีประวัติแพ้ยา'}
              </p>
              {medicalDevices.length > 0 && (
                <p className="text-purple-900 font-semibold mt-2">
                  อุปกรณ์ในร่างกาย: {medicalDevices.map(m => m.deviceType).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
