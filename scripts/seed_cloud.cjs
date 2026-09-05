const { initializeApp } = require('firebase/app');
const { getFirestore, writeBatch, doc, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const cfg = require('../firebase-applet-config.json');
const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function seed() {
  console.log('Seeding data to Cloud Firestore database:', cfg.firestoreDatabaseId);

  // Read initialData / students
  // Since studentsData is a typescript file, we can read initialData using regex or bundle
  const tsStudents = fs.readFileSync(path.join(__dirname, '../src/data/studentsData.ts'), 'utf8');
  // Extract JSON array
  const jsonMatch = tsStudents.match(/export const CHAINAT_STUDENTS: Student\[\] = (\[[\s\S]*?\]);\s*$/);
  if (!jsonMatch) {
    throw new Error('Could not parse CHAINAT_STUDENTS from studentsData.ts');
  }
  const students = JSON.parse(jsonMatch[1]);
  console.log('Parsed students count:', students.length);

  // Parse initialMedicines
  const tsInitial = fs.readFileSync(path.join(__dirname, '../src/data/initialData.ts'), 'utf8');
  const medMatch = tsInitial.match(/export const INITIAL_MEDICINES: Medicine\[\] = (\[[\s\S]*?\]);\s*export/);
  let medicines = [];
  if (medMatch) {
    // Remove comments
    const cleanMed = medMatch[1].replace(/\/\/.*$/gm, '');
    medicines = eval(cleanMed);
  }
  console.log('Parsed medicines count:', medicines.length);

  // Default system config
  const systemConfig = {
    id: 'default',
    schoolName: 'สถานศึกษาศึกษาพิเศษชัยนาท',
    schoolLogo: '',
    schoolAffiliation: 'สำนักบริหารงานการศึกษาพิเศษ สพฐ.',
    schoolAddress: 'จังหวัดชัยนาท',
    infirmaryRoomName: 'งานห้องพยาบาลและส่งเสริมสุขภาพนักเรียน',
    schoolPhone: '056-411-xxx',
    emergencyPhone: '1669',
    nearbyHospital: 'โรงพยาบาลชัยนาทนเรนทร',
    hospitalPhone: '056-411-055',
    activeAcademicYear: '2569',
    activeSemester: '1'
  };

  const batch = writeBatch(db);

  // Add students
  for (const s of students) {
    const ref = doc(db, 'students', s.id);
    batch.set(ref, s);
  }

  // Add medicines
  for (const m of medicines) {
    const ref = doc(db, 'medicines', m.id);
    batch.set(ref, m);
  }

  // Add system config
  const cfgRef = doc(db, 'systemConfig', 'default');
  batch.set(cfgRef, systemConfig);

  console.log('Committing batch write...');
  await batch.commit();
  console.log('SUCCESSFULLY SEEDED TO CLOUD FIRESTORE!');

  // Verify
  const snap = await getDocs(collection(db, 'students'));
  console.log('Verification: students count in cloud now =', snap.size);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
