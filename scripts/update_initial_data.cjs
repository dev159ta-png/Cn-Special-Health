const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../src/data/initialData.ts');
const originalContent = fs.readFileSync(srcPath, 'utf8');

// Extract INITIAL_USERS
const usersMatch = originalContent.match(/export const INITIAL_USERS: User\[\] = \[[\s\S]*?\n\];/);
if (!usersMatch) {
  console.error('Failed to find INITIAL_USERS');
  process.exit(1);
}
const usersBlock = usersMatch[0];

// Extract INITIAL_MEDICINES
const medicinesMatch = originalContent.match(/export const INITIAL_MEDICINES: Medicine\[\] = \[[\s\S]*?\n\];/);
if (!medicinesMatch) {
  console.error('Failed to find INITIAL_MEDICINES');
  process.exit(1);
}
const medicinesBlock = medicinesMatch[0];

const newContent = `import { 
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

${usersBlock}

/**
 * ข้อมูลนักเรียนจริง 173 คน สถานศึกษาศึกษาพิเศษชัยนาท
 * สำนักบริหารงานการศึกษาพิเศษ ข้อมูลประจำเดือน 07/2569
 */
export const INITIAL_STUDENTS: Student[] = CHAINAT_STUDENTS;

${medicinesBlock}

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
`;

fs.writeFileSync(srcPath, newContent, 'utf8');
console.log('Successfully updated src/data/initialData.ts');
