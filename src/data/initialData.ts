import { 
  Student, 
  Medicine, 
  InfirmaryVisit, 
  User, 
  AuditLog, 
  StockMovementLog,
  SystemConfig,
  MedicalAppointment,
  IllnessEpisode
} from '../types';
import { CHAINAT_STUDENTS } from './studentsData';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    name: 'ดร.สมชาย ใจดี',
    role: 'admin',
    roleTitle: 'ผู้ดูแลระบบและผู้อำนวยการโรงเรียน',
    email: 'admin@school.ac.th',
    phone: '081-555-1111',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    lastLogin: '2026-09-03 08:15'
  },
  {
    id: 'user-nurse',
    username: 'nurse',
    name: 'พว. วันเพ็ญ สุขใจ (พยาบาลวิชาชีพ)',
    role: 'nurse',
    roleTitle: 'ครูอนามัย / พยาบาลชำนาญการ',
    email: 'wanphen.s@school.ac.th',
    phone: '089-444-2222',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813581-2292f7e7e231?w=150&auto=format&fit=crop&q=80',
    lastLogin: '2026-09-03 08:30'
  },
  {
    id: 'user-teacher-1',
    username: 'teacher1',
    name: 'ครูมานะ มีสุข',
    role: 'teacher',
    roleTitle: 'ครูประจำชั้น ประถมศึกษาปีที่ 1/1',
    email: 'mana.m@school.ac.th',
    phone: '086-333-3333',
    assignedGrade: 'ป.1',
    assignedClassroom: 'ป.1/1',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastLogin: '2026-09-03 07:50'
  },
  {
    id: 'user-teacher-2',
    username: 'teacher2',
    name: 'ครูสมหญิง รักเรียน',
    role: 'teacher',
    roleTitle: 'ครูประจำชั้น มัธยมศึกษาปีที่ 1/1',
    email: 'somying.r@school.ac.th',
    phone: '087-222-4444',
    assignedGrade: 'ม.1',
    assignedClassroom: 'ม.1/1',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    lastLogin: '2026-09-02 16:20'
  }
];

/**
 * ข้อมูลนักเรียนจริง 173 คน สถานศึกษาศึกษาพิเศษชัยนาท
 * สำนักบริหารงานการศึกษาพิเศษ ข้อมูลประจำเดือน 07/2569
 */
export const INITIAL_STUDENTS: Student[] = CHAINAT_STUDENTS;

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-001',
    code: 'MED-001',
    tradeName: 'พาราเซตามอล ไซรัป (Paracetamol 120mg/5ml)',
    genericName: 'Paracetamol Syrup',
    category: 'ยาลดไข้บรรเทาปวด',
    dosageForm: 'น้ำเชื่อม/ยาน้ำ',
    strength: '120 mg/5 ml (ขวด 60 ml)',
    unit: 'ขวด',
    currentStock: 28,
    minimumStock: 10,
    lotNumber: 'LOT-PARA2601',
    receivedDate: '2026-01-15',
    expiryDate: '2027-06-30', // 🟢 ปกติ
    locationStorage: 'ตู้ยา A ชั้น 1',
    notes: 'สำหรับเด็กเล็กและนักเรียนที่กลืนยาเม็ดไม่ได้'
  },
  {
    id: 'med-002',
    code: 'MED-002',
    tradeName: 'พาราเซตามอล 500 มก. (Paracetamol 500mg)',
    genericName: 'Paracetamol Tablet',
    category: 'ยาลดไข้บรรเทาปวด',
    dosageForm: 'เม็ด',
    strength: '500 mg',
    unit: 'เม็ด',
    currentStock: 350,
    minimumStock: 100,
    lotNumber: 'LOT-PARA2602',
    receivedDate: '2026-02-10',
    expiryDate: '2027-12-31', // 🟢 ปกติ
    locationStorage: 'ตู้ยา A ชั้น 1'
  },
  {
    id: 'med-003',
    code: 'MED-003',
    tradeName: 'เซทิริซีน ไซรัป (Cetirizine 5mg/5ml)',
    genericName: 'Cetirizine Dihydrochloride',
    category: 'ยาลดน้ำมูก/แก้แพ้',
    dosageForm: 'น้ำเชื่อม/ยาน้ำ',
    strength: '5 mg/5 ml (ขวด 60 ml)',
    unit: 'ขวด',
    currentStock: 6,
    minimumStock: 8, // 🟠 ใกล้หมดสต๊อก
    lotNumber: 'LOT-CET2504',
    receivedDate: '2025-10-15',
    expiryDate: '2026-11-20', // 🟡 ใกล้หมดอายุภายใน 90 วัน
    locationStorage: 'ตู้ยา A ชั้น 2',
    notes: 'แก้แพ้ ลดน้ำมูก คัน ผื่น ไม่ง่วงซึมมาก'
  },
  {
    id: 'med-004',
    code: 'MED-004',
    tradeName: 'คลอร์เฟนิรามีน 2 มก. (CPM 2mg)',
    genericName: 'Chlorpheniramine Maleate',
    category: 'ยาลดน้ำมูก/แก้แพ้',
    dosageForm: 'เม็ด',
    strength: '2 mg',
    unit: 'เม็ด',
    currentStock: 4,
    minimumStock: 50, // 🟠 ใกล้หมดมาก
    lotNumber: 'LOT-CPM2501',
    receivedDate: '2025-03-01',
    expiryDate: '2026-09-25', // 🟠 ใกล้หมดอายุภายใน 30 วัน!
    locationStorage: 'ตู้ยา A ชั้น 2'
  },
  {
    id: 'med-005',
    code: 'MED-005',
    tradeName: 'ดอมเพอริโดน แขวนตะกอน (Motilium Suspension)',
    genericName: 'Domperidone 1mg/ml',
    category: 'ยาทางเดินอาหาร',
    dosageForm: 'น้ำเชื่อม/ยาน้ำ',
    strength: '1 mg/ml (ขวด 30 ml)',
    unit: 'ขวด',
    currentStock: 0, // 🔴 หมดสต๊อก
    minimumStock: 5,
    lotNumber: 'LOT-DOM2410',
    receivedDate: '2024-10-10',
    expiryDate: '2026-07-31', // 🔴 หมดอายุแล้ว
    locationStorage: 'ตู้ยา B ชั้น 1',
    notes: 'ยาบรรเทาอาการคลื่นไส้ อาเจียน กรดไหลย้อน'
  },
  {
    id: 'med-006',
    code: 'MED-006',
    tradeName: 'เกลือแร่ผง โอ อาร์ เอส (ORS Powder)',
    genericName: 'Oral Rehydration Salts',
    category: 'ยาทางเดินอาหาร',
    dosageForm: 'ผง',
    strength: 'รสส้ม ละลายน้ำ 250 ml',
    unit: 'ซอง',
    currentStock: 120,
    minimumStock: 30,
    lotNumber: 'LOT-ORS2603',
    receivedDate: '2026-03-01',
    expiryDate: '2028-02-28',
    locationStorage: 'ตู้ยา B ชั้น 2'
  },
  {
    id: 'med-007',
    code: 'MED-007',
    tradeName: 'ยาพ่นขยายหลอดลม (Ventolin Inhaler 100mcg)',
    genericName: 'Salbutamol MDI',
    category: 'ยาช่วยชีวิต/ฉุกเฉิน',
    dosageForm: 'สเปรย์',
    strength: '100 mcg / dose (200 doses)',
    unit: 'ขวด',
    currentStock: 5,
    minimumStock: 3,
    lotNumber: 'LOT-VEN2601',
    receivedDate: '2026-01-20',
    expiryDate: '2027-08-31',
    locationStorage: 'ตู้ฉุกเฉิน Emergency Box',
    notes: 'ยาฉุกเฉินสำหรับหอบหืด มี Spacer ประจำตู้'
  },
  {
    id: 'med-008',
    code: 'MED-008',
    tradeName: 'โพวิโดน-ไอโอดีน (Betadine 10% Solution)',
    genericName: 'Povidone Iodine 10%',
    category: 'ยาทาภายนอก/ทำแผล',
    dosageForm: 'น้ำเชื่อม/ยาน้ำ',
    strength: '10% (ขวด 30 ml)',
    unit: 'ขวด',
    currentStock: 14,
    minimumStock: 5,
    lotNumber: 'LOT-BET2602',
    receivedDate: '2026-02-15',
    expiryDate: '2028-01-31',
    locationStorage: 'รถเข็นทำแผล Dressing Cart'
  },
  {
    id: 'med-009',
    code: 'MED-009',
    tradeName: 'น้ำเกลือล้างแผล ปลอดเชื้อ (Normal Saline 0.9%)',
    genericName: 'Sodium Chloride 0.9% Sterile',
    category: 'เวชภัณฑ์และอุปกรณ์',
    dosageForm: 'น้ำเชื่อม/ยาน้ำ',
    strength: '1000 ml',
    unit: 'ขวด',
    currentStock: 18,
    minimumStock: 6,
    lotNumber: 'LOT-NSS2604',
    receivedDate: '2026-04-05',
    expiryDate: '2028-04-30',
    locationStorage: 'ตู้เวชภัณฑ์ล้างแผล'
  },
  {
    id: 'med-010',
    code: 'MED-010',
    tradeName: 'อะม็อกซีซิลลิน 500 มก. (Amoxicillin 500mg)',
    genericName: 'Amoxicillin Trihydrate',
    category: 'ยาลดไข้บรรเทาปวด',
    dosageForm: 'เม็ด',
    strength: '500 mg',
    unit: 'เม็ด',
    currentStock: 100,
    minimumStock: 30,
    lotNumber: 'LOT-AMX2509',
    receivedDate: '2025-09-01',
    expiryDate: '2027-03-31',
    locationStorage: 'ตู้ยาควบคุม',
    notes: 'ยาปฏิชีวนะกลุ่ม Penicillin ระวังประวัติแพ้ยาเด็ดขาด'
  }
];

export const INITIAL_VISITS: InfirmaryVisit[] = [];

export const INITIAL_STOCK_LOGS: StockMovementLog[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  schoolName: 'สถานศึกษาศึกษาพิเศษชัยนาท (สำนักบริหารงานการศึกษาพิเศษ)',
  infirmaryRoomName: 'งานห้องพยาบาลและบริการสุขภาพ สถานศึกษาศึกษาพิเศษชัยนาท',
  schoolPhone: '056-411-222',
  emergencyPhone: '1669 (สายด่วนกู้ชีพฉุกเฉิน)',
  nearbyHospital: 'โรงพยาบาลชัยนาทนเรนทร',
  nearbyHospitalPhone: '056-411-055',
  hospitalPhone: '056-411-055',
  activeAcademicYear: '2569',
  activeSemester: '1',
  medicineCategories: [
    'ยาลดไข้/บรรเทาปวด',
    'ยาแก้แพ้/ลดน้ำมูก',
    'ยาแก้ไอ/ขับเสมหะ',
    'ยาโรคกระเพาะ/ลดกรด',
    'ยาทางเดินอาหาร/แก้ท้องเสีย',
    'ยาดม/แก้วิงเวียน',
    'ยาใส่แผลภายนอก/น้ำยาฆ่าเชื้อ',
    'ยาตา/ยาล้างตา',
    'เวชภัณฑ์/อุปกรณ์ทำแผล',
    'ยาเฉพาะทาง/ควบคุมพิเศษ'
  ],
  treatmentMethods: [
    'พักผ่อนในห้องพยาบาล',
    'เช็ดตัวลดไข้',
    'ทำแผล',
    'ล้างแผล',
    'ประคบเย็น',
    'ประคบร้อน',
    'ปฐมพยาบาล',
    'ดูแลอาการชัก',
    'เปลี่ยนผ้าพันแผล',
    'ดูแลสายให้อาหาร',
    'ดูแลอุปกรณ์ทางการแพทย์',
    'ดูดเสมหะ (Suction)',
    'ให้ออกซิเจน'
  ],
  disabilityCategories: [
    { id: 'visual', name: 'บุคคลที่มีความบกพร่องทางการเห็น', description: 'ตาบอด หรือสายตาเลือนราง' },
    { id: 'hearing', name: 'บุคคลที่มีความบกพร่องทางการได้ยิน', description: 'หูหนวก หรือหูตึง' },
    { id: 'intellectual', name: 'บุคคลที่มีความบกพร่องทางสติปัญญา', description: 'พัฒนาการทางสติปัญญาช้ากว่าวัย' },
    { id: 'physical', name: 'บุคคลที่มีความบกพร่องทางร่างกาย หรือการเคลื่อนไหว หรือสุขภาพ', description: 'อัมพาต สมองพิการ แขนขาผิดรูป โรคเรื้อรัง' },
    { id: 'learning', name: 'บุคคลที่มีความบกพร่องทางการเรียนรู้ (LD)', description: 'บกพร่องด้านการอ่าน เขียน หรือการคำนวณ' },
    { id: 'speech', name: 'บุคคลที่มีความบกพร่องทางการพูดและภาษา', description: 'ออกเสียงไม่ชัด ติดอ่าง สื่อสารด้วยคำพูดไม่ได้' },
    { id: 'behavioral', name: 'บุคคลที่มีความบกพร่องทางพฤติกรรม หรืออารมณ์', description: 'มีพฤติกรรมไม่เหมาะสมกับวัยอย่างรุนแรง' },
    { id: 'autism', name: 'บุคคลออทิสติก', description: 'บกพร่องทางปฏิสัมพันธ์ สังคม การสื่อสาร พฤติกรรมซ้ำ' },
    { id: 'multiple', name: 'บุคคลพิการซ้อน', description: 'มีความบกพร่องตั้งแต่ 2 ประเภทขึ้นไปในบุคคลเดียวกัน' }
  ],
  commonSymptoms: [
    'ไข้',
    'ปวดศีรษะ',
    'ไอ',
    'เจ็บคอ',
    'ปวดท้อง',
    'อาเจียน',
    'ท้องเสีย',
    'บาดแผล',
    'หกล้ม',
    'ชัก',
    'หายใจลำบาก',
    'ผื่นคัน',
    'ตาแดง',
    'แมลงสัตว์กัดต่อย',
    'เลือดกำเดาไหล',
    'ท่อ/สายหลุดหรืออุดกั้น'
  ],
  commonTreatments: [
    'พักผ่อนในห้องพยาบาล',
    'เช็ดตัวลดไข้',
    'ทำแผล',
    'ล้างแผล',
    'ประคบเย็น',
    'ประคบร้อน',
    'ปฐมพยาบาล',
    'ดูแลอาการชัก',
    'เปลี่ยนผ้าพันแผล',
    'ดูแลสายให้อาหาร',
    'ดูแลอุปกรณ์ทางการแพทย์',
    'ดูดเสมหะ (Suction)',
    'ให้ออกซิเจน'
  ],
  classrooms: [
    { grade: 'ป.1', name: 'ป.1/1' },
    { grade: 'ป.1', name: 'ป.1/2' },
    { grade: 'ป.1', name: 'ป.1/3' },
    { grade: 'ป.1', name: 'ป.1/4' },
    { grade: 'ป.2', name: 'ป.2/1' },
    { grade: 'ป.2', name: 'ป.2/2' },
    { grade: 'ป.3', name: 'ป.3/1' },
    { grade: 'ป.3', name: 'ป.3/2' },
    { grade: 'ป.4', name: 'ป.4/1' },
    { grade: 'ป.5', name: 'ป.5/1' },
    { grade: 'ป.6', name: 'ป.6/1' },
    { grade: 'ม.1', name: 'ม.1/1' },
    { grade: 'ม.2', name: 'ม.2/1' },
    { grade: 'ม.2', name: 'ม.2/2' },
    { grade: 'ม.3', name: 'ม.3/1' },
    { grade: 'ม.3', name: 'ม.3/2' },
    { grade: 'ม.4', name: 'ม.4/1' },
    { grade: 'ม.4', name: 'ม.4/2' },
    { grade: 'ม.4', name: 'ม.4/3' },
    { grade: 'ม.5', name: 'ม.5/1' },
    { grade: 'ม.5', name: 'ม.5/2' },
    { grade: 'ม.5', name: 'ม.5/3' },
    { grade: 'ม.5', name: 'ม.5/4' },
    { grade: 'ม.5', name: 'ม.5/5' },
    { grade: 'ม.6', name: 'ม.6/1' }
  ]
};

export const INITIAL_APPOINTMENTS: MedicalAppointment[] = [];

export const INITIAL_ILLNESS_EPISODES: IllnessEpisode[] = [];
