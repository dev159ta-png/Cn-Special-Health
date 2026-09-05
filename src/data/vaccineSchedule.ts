export interface VaccineGroupItem {
  name: string;
  code?: string;
  defaultDose?: number;
  disease?: string;
}

export interface VaccineGroup {
  groupName: string;
  items: VaccineGroupItem[];
}

export const VACCINE_GROUPED_OPTIONS: VaccineGroup[] = [
  {
    groupName: '1. แรกเกิด',
    items: [
      { name: 'บีซีจี (BCG)', code: 'BCG', defaultDose: 1, disease: 'วัณโรค' },
      { name: 'ตับอักเสบบี 1 (HB1)', code: 'HB1', defaultDose: 1, disease: 'ไวรัสตับอักเสบบี' }
    ]
  },
  {
    groupName: '2. อายุ 1 เดือน',
    items: [
      { name: 'ตับอักเสบบี 2 (HB2)', code: 'HB2', defaultDose: 2, disease: 'ไวรัสตับอักเสบบี' }
    ]
  },
  {
    groupName: '3. อายุ 2 เดือน',
    items: [
      { name: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี 1 (DTP-HB1)', code: 'DTP-HB1', defaultDose: 1, disease: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี' },
      { name: 'โปลิโอแบบกิน 1 (OPV1)', code: 'OPV1', defaultDose: 1, disease: 'โปลิโอ' },
      { name: 'โรต้า 1 (Rota1)', code: 'Rota1', defaultDose: 1, disease: 'ไวรัสโรต้า (อุจจาระร่วง)' }
    ]
  },
  {
    groupName: '4. อายุ 4 เดือน',
    items: [
      { name: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี 2 (DTP-HB2)', code: 'DTP-HB2', defaultDose: 2, disease: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี' },
      { name: 'โปลิโอแบบกิน 2 (OPV2)', code: 'OPV2', defaultDose: 2, disease: 'โปลิโอ' },
      { name: 'โปลิโอแบบฉีด (IPV)', code: 'IPV', defaultDose: 1, disease: 'โปลิโอ' },
      { name: 'โรต้า 2 (Rota2)', code: 'Rota2', defaultDose: 2, disease: 'ไวรัสโรต้า (อุจจาระร่วง)' }
    ]
  },
  {
    groupName: '5. อายุ 6 เดือน',
    items: [
      { name: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี 3 (DTP-HB3)', code: 'DTP-HB3', defaultDose: 3, disease: 'คอตีบ-บาดทะยัก-ไอกรน-ตับอักเสบบี' },
      { name: 'โปลิโอแบบกิน 3 (OPV3)', code: 'OPV3', defaultDose: 3, disease: 'โปลิโอ' },
      { name: 'โรต้า 3 (Rota3)', code: 'Rota3', defaultDose: 3, disease: 'ไวรัสโรต้า (อุจจาระร่วง)' }
    ]
  },
  {
    groupName: '6. อายุ 9 เดือน',
    items: [
      { name: 'หัด-คางทูม-หัดเยอรมัน 1 (MMR1)', code: 'MMR1', defaultDose: 1, disease: 'หัด-คางทูม-หัดเยอรมัน' }
    ]
  },
  {
    groupName: '7. อายุ 1 ปี',
    items: [
      { name: 'ไข้สมองอักเสบเจอี 1-2 (JE1 - JE2)', code: 'JE1-JE2', defaultDose: 1, disease: 'ไข้สมองอักเสบเจอี' }
    ]
  },
  {
    groupName: '8. อายุ 1 ปี 6 เดือน',
    items: [
      { name: 'คอตีบ-บาดทะยัก-ไอกรน 4 (DTP4)', code: 'DTP4', defaultDose: 4, disease: 'คอตีบ-บาดทะยัก-ไอกรน' },
      { name: 'โปลิโอแบบกิน 4 (OPV4)', code: 'OPV4', defaultDose: 4, disease: 'โปลิโอ' },
      { name: 'หัด-คางทูม-หัดเยอรมัน 2 (MMR2)', code: 'MMR2', defaultDose: 2, disease: 'หัด-คางทูม-หัดเยอรมัน' }
    ]
  },
  {
    groupName: '9. อายุ 2 ปี 6 เดือน',
    items: [
      { name: 'ไข้สมองอักเสบเจอี 3 (JE3)', code: 'JE3', defaultDose: 3, disease: 'ไข้สมองอักเสบเจอี' }
    ]
  },
  {
    groupName: '10. อายุ 4 ปี',
    items: [
      { name: 'คอตีบ-บาดทะยัก-ไอกรน 5 (DTP5)', code: 'DTP5', defaultDose: 5, disease: 'คอตีบ-บาดทะยัก-ไอกรน' },
      { name: 'โปลิโอแบบกิน 5 (OPV5)', code: 'OPV5', defaultDose: 5, disease: 'โปลิโอ' }
    ]
  },
  {
    groupName: '11. ระดับชั้น ป.1',
    items: [
      { name: 'หัด-คางทูม-หัดเยอรมัน 2 (MMR2)*', code: 'MMR2-Sch', defaultDose: 2, disease: 'หัด-คางทูม-หัดเยอรมัน (เก็บตก)' },
      { name: 'บีซีจี (BCG)*', code: 'BCG-Sch', defaultDose: 1, disease: 'วัณโรค (สำหรับผู้ไม่มีแผลเป็น)' },
      { name: 'คอตีบ-บาดทะยัก (dT)*', code: 'dT-P1', defaultDose: 1, disease: 'คอตีบ-บาดทะยัก' },
      { name: 'โปลิโอ (OPV)*', code: 'OPV-Sch', defaultDose: 1, disease: 'โปลิโอ' }
    ]
  },
  {
    groupName: '12. ระดับชั้น ป.5',
    items: [
      { name: 'เอชพีวี 1-2 (HPV1-HPV2)', code: 'HPV', defaultDose: 1, disease: 'มะเร็งปากมดลูก / เชื้อ HPV' }
    ]
  },
  {
    groupName: '13. ระดับชั้น ม.6',
    items: [
      { name: 'คอตีบ-บาดทะยัก (dT)', code: 'dT-M6', defaultDose: 1, disease: 'คอตีบ-บาดทะยัก (กระตุ้นทุก 10 ปี)' }
    ]
  },
  {
    groupName: 'วัคซีนเสริมและวัคซีนตามฤดูกาล',
    items: [
      { name: 'วัคซีนไข้หวัดใหญ่ประจำปี (Influenza)', code: 'Flu', defaultDose: 1, disease: 'ไข้หวัดใหญ่' },
      { name: 'วัคซีนโควิด-19 (COVID-19)', code: 'COVID-19', defaultDose: 1, disease: 'โควิด-19' },
      { name: 'วัคซีนนิวโมคอคคัส (PCV/PPSV)', code: 'PCV', defaultDose: 1, disease: 'ปอดอักเสบ/เยื่อหุ้มสมองอักเสบ' },
      { name: 'วัคซีนสุกใส (Varicella)', code: 'Varicella', defaultDose: 1, disease: 'โรคอีสุกอีใส' },
      { name: 'วัคซีนตับอักเสบเอ (HAV)', code: 'HAV', defaultDose: 1, disease: 'ไวรัสตับอักเสบเอ' }
    ]
  }
];

// Flat list of all vaccine item names for quick checking
export const ALL_VACCINE_NAMES: string[] = VACCINE_GROUPED_OPTIONS.flatMap(g => g.items.map(i => i.name));
