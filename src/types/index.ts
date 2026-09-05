// Type definitions for School Infirmary System for Students with Disabilities
// ระบบห้องพยาบาลโรงเรียนสำหรับนักเรียนพิการ

export type Role = 'admin' | 'nurse' | 'teacher';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  roleTitle: string;
  position?: string;
  email?: string;
  phone?: string;
  assignedGrade?: string; // For homeroom teachers e.g. "ป.1"
  assignedClassroom?: string; // For homeroom teachers e.g. "ป.1/1"
  isActive: boolean;
  avatarUrl?: string;
  lastLogin?: string;
}

// 9 Categories of Disability (ประกาศกระทรวงศึกษาธิการ)
export type DisabilityCategoryId = 
  | 'visual'
  | 'hearing'
  | 'intellectual'
  | 'physical'
  | 'learning'
  | 'speech'
  | 'behavioral'
  | 'autism'
  | 'multiple';

export interface DisabilityItem {
  typeId: string;
  typeName: string; // e.g. "บุคคลที่มีความบกพร่องทางการเห็น"
  details: string; // e.g. "สายตาเลือนรางข้างซ้าย ตาบอดสนิทข้างขวา"
  assistanceLevel: 'น้อย' | 'ปานกลาง' | 'มาก' | 'มากเป็นพิเศษ';
  notes?: string;
}

export interface DrugAllergy {
  id: string;
  drugName: string;
  reaction: string; // e.g. "ผื่นลมพิษ หายใจติดขัด บวมที่ใบหน้า"
  severity: 'เล็กน้อย' | 'ปานกลาง' | 'รุนแรง' | 'รุนแรงมาก (Anaphylaxis)';
  notes?: string;
}

export interface FoodAllergy {
  id: string;
  foodName: string;
  reaction: string;
  severity: 'เล็กน้อย' | 'ปานกลาง' | 'รุนแรง' | 'รุนแรงมาก (Anaphylaxis)';
  notes?: string;
}

export interface ChronicDisease {
  id: string;
  diseaseName: string; // e.g. "โรคลมชัก (Epilepsy)", "หอบหืด", "โรคหัวใจพิการแต่กำเนิด"
  symptoms: string;
  doctorNotes?: string;
  emergencyCare?: string; // First-aid care when triggered
}

export interface DailyMedication {
  id: string;
  medicineName: string;
  dosage: string; // e.g. "1 เม็ด"
  timing: string; // e.g. "หลังอาหารกลางวัน 12:30 น."
  storage: 'อุณหภูมิห้อง' | 'ตู้เย็น (2-8°C)';
  notes?: string;
}

export interface MedicalDevice {
  id: string;
  deviceType: string; // e.g. "NG Tube (สายให้อาหารทางจมูก)", "Tracheostomy (ท่อเจาะคอ)", "PEG", "สายสวนปัสสาวะ", "เครื่องช่วยฟัง", "วีลแชร์ไฟฟ้า"
  startDate: string;
  details: string;
  careInstructions: string;
  replacementSchedule?: string;
  notes?: string;
}

export interface VaccineRecord {
  id: string;
  vaccineName: string;
  preventsDisease?: string; // เช่น วัณโรค, ไวรัสตับอักเสบบี, โปลิโอ
  ageGroup?: string; // เช่น แรกเกิด, 1 เดือน, 2 เดือน, ป.5, ป.6
  dateReceived: string;
  doseNumber: number;
  location: string;
  nextDueDate?: string;
  status?: 'ฉีดแล้ว' | 'ยังไม่ได้รับ' | 'นัดหมาย';
  batchNumber?: string;
  notes?: string;
}

export interface MasterVaccineItem {
  id: string;
  ageGroup: string; // เช่น แรกเกิด, 1 เดือน, 2 เดือน...
  vaccineCode: string; // เช่น BCG, HB1, DTwP-HB-Hib1...
  vaccineName: string; // ชื่อเต็ม/ทางการ
  preventsDisease: string; // ป้องกันโรค เช่น วัณโรค, ไวรัสตับอักเสบบี...
  doseNumber: number;
  mandatory?: boolean;
}

// 6 หมวดเอกสารที่เกี่ยวข้อง
export type StudentDocumentType = 
  | 'national_id' // 1. บัตรประจำตัวประชาชน
  | 'disability_card' // 2. บัตรคนพิการ
  | 'house_registration' // 3. สำเนาทะเบียนบ้าน
  | 'vaccine_book' // 4. สมุดวัคซีน
  | 'birth_certificate' // 5. สูติบัตร
  | 'other'; // 6. เอกสารอื่นๆ

export interface StudentDocument {
  id: string;
  type: StudentDocumentType;
  title: string; // หัวข้อเอกสาร เช่น บัตรประจำตัวประชาชน, สูติบัตร
  customTitle?: string; // สำหรับเอกสารอื่นๆ
  fileName: string;
  fileType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' | string;
  fileSize?: string; // เช่น "1.2 MB"
  fileData: string; // Base64 data URL หรือ URL
  uploadDate: string;
  notes?: string;
}

export interface NutritionRecord {
  id: string;
  date: string;
  weight: number; // kg
  height: number; // cm
  bmi: number;
  bmiStatus: 'ผอมมาก' | 'น้ำหนักน้อย' | 'สมส่วน' | 'ท้วม' | 'อ้วน' | 'อ้วนมาก';
  dietType: 'อาหารปกติ' | 'อาหารอ่อน' | 'อาหารปั่น' | 'อาหารเฉพาะโรค' | 'การให้อาหารทางสาย (Tube Feeding)';
  notes?: string;
}

export interface Student {
  id: string;
  studentCode: string; // รหัสนักเรียน เช่น "STU-001"
  nationalId: string; // เลขบัตรประชาชน 13 หลัก
  prefix: 'เด็กชาย' | 'เด็กหญิง' | 'นาย' | 'นางสาว' | string;
  firstName: string;
  lastName: string;
  nickname: string;
  photoUrl: string;
  birthDate: string;
  age: number;
  gender: 'ชาย' | 'หญิง';
  bloodType: 'A' | 'B' | 'AB' | 'O' | 'ไม่ระบุ';
  grade: string; // เช่น "ป.1", "ป.2", "ม.1"
  classroom: string; // เช่น "ป.1/1", "ป.1/2"
  homeroomTeacher: string; // ชื่อครูประจำชั้น
  guardianName: string;
  guardianRelationship: string;
  guardianPhone: string;
  emergencyPhone: string;
  address: string;
  specialPrecautions?: string; // ข้อควรระวังพิเศษ เช่น "ระวังการสำลักง่าย หลีกเลี่ยงเสียงดัง"
  disabilities: DisabilityItem[];
  chronicDiseases: ChronicDisease[];
  drugAllergies: DrugAllergy[];
  foodAllergies: FoodAllergy[];
  dailyMedications: DailyMedication[];
  medicalDevices: MedicalDevice[];
  vaccines: VaccineRecord[];
  nutritionHistory: NutritionRecord[];
  documents?: StudentDocument[]; // 6 หมวดเอกสารที่เกี่ยวข้อง
  createdAt: string;
  updatedAt: string;
}

export interface VitalSigns {
  temperature?: number; // °C
  bloodPressureSys?: number; // mmHg
  bloodPressureDia?: number; // mmHg
  pulse?: number; // bpm
  respiratoryRate?: number; // /min
  oxygenSaturation?: number; // %
  weight?: number; // kg
  painScore?: number; // 0 - 10
}

export interface DispensedMedicineItem {
  medicineId: string;
  medicineCode?: string;
  medicineName: string;
  genericName?: string;
  lotNumber: string;
  expiryDate?: string;
  quantity: number;
  unit: string;
  dosage: string;
  instructions?: string;
  timing?: string;
}

export type TreatmentOutcome = 
  | 'กลับเข้าชั้นเรียน'
  | 'พักห้องพยาบาล'
  | 'ติดต่อผู้ปกครอง'
  | 'กลับบ้าน'
  | 'ส่งต่อโรงพยาบาล'
  | 'เรียกรถพยาบาล (1669)'
  | 'ดีขึ้น'
  | 'อื่น ๆ';

export interface HospitalReferral {
  hospitalName: string;
  referralReason: string;
  conditionBeforeTransfer?: string;
  patientCondition?: string;
  transportMethod: 'รถพยาบาลฉุกเฉิน (1669)' | 'รถโรงเรียน' | 'ผู้ปกครองมารับ' | 'อื่น ๆ' | string;
  accompanyingPerson?: string;
  accompanyingStaff?: string;
  departureTime?: string;
  responsibleOfficer?: string;
  hospitalContactPhone?: string;
  guardianNotified?: boolean;
  guardianNotifiedTime?: string;
  notes?: string;
}

export interface RestingRecord {
  bedNumber: string;
  timeIn: string;
  timeOut?: string;
}

// สถานะการเจ็บป่วย (Illness Status)
export type IllnessStatus = 'กำลังป่วย' | 'หายแล้ว';

export interface IllnessEpisode {
  id: string; // e.g. "ill-123456"
  illnessCode: string; // e.g. "ILL-20260904-001"
  studentId: string;
  studentName: string;
  nickname?: string;
  studentCode: string;
  grade: string;
  classroom: string;
  symptoms: string[];
  symptomDetails?: string;
  startDate: string; // วันที่เริ่มป่วย YYYY-MM-DD
  recoveredDate?: string; // วันที่หายป่วย YYYY-MM-DD
  status: IllnessStatus; // 'กำลังป่วย' | 'หายแล้ว'
  initialVisitId?: string;
  visitIds: string[]; // รายการรับบริการทั้งหมดที่เกี่ยวกับการป่วยครั้งนี้
  notes?: string;
  recoveryNote?: string; // บันทึกเมื่อกดหายแล้ว
  recordedBy: string;
  recoveredBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InfirmaryVisit {
  id: string;
  visitNumber: string; // e.g. "VIS-202609-001"
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:mm
  studentId: string;
  studentName: string;
  nickname?: string;
  studentCode: string;
  grade: string;
  classroom: string;
  broughtBy?: string; // ผู้พามา
  incidentLocation?: string; // สถานที่เกิดเหตุ
  serviceType: 'ป่วย' | 'อุบัติเหตุจากการเรียน' | 'อุบัติเหตุจากกิจกรรม' | 'รับยาตามนัด' | 'ทำแผล' | 'ตรวจสุขภาพ' | 'ดูแลอุปกรณ์ทางการแพทย์' | 'จ่ายยา' | 'ส่งต่อโรงพยาบาล' | 'อื่น ๆ' | string;
  symptoms: string[];
  symptomDetails: string;
  symptomStatus?: IllnessStatus; // 🔴 'กำลังป่วย' | 🟢 'หายแล้ว'
  illnessEpisodeId?: string; // รหัสเชื่อมโยงเหตุการณ์เจ็บป่วย e.g. "ill-..."
  vitals: VitalSigns;
  treatments: string[];
  treatmentDetails?: string;
  restingRecord?: RestingRecord;
  dispensedMedicines: DispensedMedicineItem[];
  outcome: TreatmentOutcome;
  outcomeDetails?: string;
  referral?: HospitalReferral;
  attendantId: string;
  attendantName: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  code: string; // รหัสยา เช่น "MED-001"
  tradeName: string; // ชื่อการค้า เช่น "พาราเซตามอล ไซรัป 120mg/5ml"
  genericName: string; // ชื่อสามัญ เช่น "Paracetamol Syrup"
  category: string;
  dosageForm: string;
  strength: string; // e.g. "500 mg", "120 mg/5ml"
  dosageInstruction?: string;
  unit: string; // e.g. "เม็ด", "ขวด", "หลอด", "ซอง"
  currentStock: number;
  minimumStock: number;
  lotNumber: string;
  receivedDate?: string;
  manufactureDate?: string;
  expiryDate: string;
  locationStorage?: string; // e.g. "ตู้ยา A ชั้น 2", "ตู้เย็นช่อง 2-8°C"
  manufacturer?: string;
  notes?: string;
}

export interface StockMovementLog {
  id: string;
  date: string;
  medicineId: string;
  medicineName: string;
  movementType: 'รับเข้าคลัง' | 'จ่ายให้ผู้ป่วย' | 'ปรับยอด' | 'ทิ้งยาหมดอายุ';
  quantity: number;
  previousStock: number;
  newStock: number;
  lotNumber: string;
  referenceId?: string; // visit id
  referenceNote?: string;
  performedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: 'เข้าสู่ระบบ' | 'ออกจากระบบ' | 'เพิ่ม' | 'แก้ไข' | 'ลบ' | 'จ่ายยา' | 'ส่งต่อ' | 'สำรองข้อมูล' | 'นำเข้าข้อมูล';
  entityType: 'นักเรียน' | 'การรักษา' | 'คลังยา' | 'ผู้ใช้งาน' | 'ตั้งค่าระบบ' | 'เอกสาร';
  details: string;
}

export interface MedicalAppointment {
  id: string;
  studentId: string;
  studentName: string;
  nickname?: string;
  studentCode: string;
  grade: string;
  classroom: string;
  doctorName?: string;
  hospitalName: string;
  clinicOrDepartment: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  purpose: string;
  preparation?: string;
  status: 'upcoming' | 'completed' | 'postponed' | 'cancelled';
  statusNote?: string;
  accompanyingPerson?: string;
  remindDaysBefore?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassroomOption {
  id?: string;
  grade: string; // เช่น "อนุบาล 1", "ป.1", "ป.2", "ม.1", "ม.ปลาย"
  name: string; // เช่น "ห้องเตรียมความพร้อม", "ป.1/1", "ป.1/2"
  roomNumber?: string; // เช่น "อาคาร 2 ห้อง 201"
  homeroomTeacher?: string; // ชื่อครูประจำชั้นเริ่มต้น
  description?: string;
}

export interface SystemConfig {
  schoolName: string;
  schoolLogo?: string;
  schoolAffiliation?: string;
  schoolAddress?: string;
  infirmaryRoomName: string;
  schoolPhone: string;
  emergencyPhone: string;
  nearbyHospital: string;
  nearbyHospitalPhone: string;
  hospitalPhone: string;
  activeAcademicYear: string;
  activeSemester: string;
  disabilityCategories: { id: string; name: string; description: string }[];
  commonSymptoms: string[];
  commonTreatments: string[];
  treatmentMethods: string[];
  medicineCategories: string[];
  classrooms: ClassroomOption[];
}

export interface UploadedDocumentItem {
  id: string;
  studentId?: string;
  studentName?: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  category: string;
  title: string;
  fileData: string; // Base64 data URL
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}
