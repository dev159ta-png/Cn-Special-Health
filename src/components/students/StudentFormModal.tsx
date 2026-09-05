import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import { X, Save, User, ShieldCheck, Upload, Image as ImageIcon, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface StudentFormModalProps {
  studentToEdit?: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  studentToEdit,
  isOpen,
  onClose
}) => {
  const { addStudent, updateStudent, systemConfig } = useApp();

  const isEditing = !!studentToEdit;

  const [studentCode, setStudentCode] = useState(studentToEdit?.studentCode || `STD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [nationalId, setNationalId] = useState(studentToEdit?.nationalId || '');
  const [prefix, setPrefix] = useState<Student['prefix']>(studentToEdit?.prefix || 'เด็กชาย');
  const [firstName, setFirstName] = useState(studentToEdit?.firstName || '');
  const [lastName, setLastName] = useState(studentToEdit?.lastName || '');
  const [nickname, setNickname] = useState(studentToEdit?.nickname || '');
  const [gender, setGender] = useState<'ชาย' | 'หญิง'>(studentToEdit?.gender || 'ชาย');
  const [birthDate, setBirthDate] = useState(studentToEdit?.birthDate || '2016-01-01');
  const [bloodType, setBloodType] = useState<Student['bloodType']>(studentToEdit?.bloodType || 'O');
  const [grade, setGrade] = useState(studentToEdit?.grade || 'ป.1');
  const [classroom, setClassroom] = useState(studentToEdit?.classroom || '1/1');
  const [homeroomTeacher, setHomeroomTeacher] = useState(studentToEdit?.homeroomTeacher || 'ครูสมใจ ห่วงใยศิษย์');
  const [guardianName, setGuardianName] = useState(studentToEdit?.guardianName || '');
  const [guardianRelationship, setGuardianRelationship] = useState(studentToEdit?.guardianRelationship || 'มารดา');
  const [guardianPhone, setGuardianPhone] = useState(studentToEdit?.guardianPhone || '');
  const [emergencyPhone, setEmergencyPhone] = useState(studentToEdit?.emergencyPhone || '');
  const [address, setAddress] = useState(studentToEdit?.address || 'อำเภอเมือง จังหวัดชัยนาท');
  const [photoUrl, setPhotoUrl] = useState(studentToEdit?.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoInputMode, setPhotoInputMode] = useState<'upload' | 'url'>('upload');

  // Compute available grades from configured classrooms
  const availableGrades = useMemo(() => {
    const fromConfig = Array.from(new Set((systemConfig.classrooms || []).map(c => c.grade).filter(Boolean)));
    if (grade && !fromConfig.includes(grade)) {
      fromConfig.unshift(grade);
    }
    return fromConfig.length > 0 ? fromConfig : ['เตรียมความพร้อม', 'อนุบาล 1-3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.ปลาย'];
  }, [systemConfig.classrooms, grade]);

  // Handle classroom change with auto-fill homeroom teacher and grade
  const handleClassroomChange = (val: string) => {
    setClassroom(val);
    const matched = (systemConfig.classrooms || []).find(c => c.name === val);
    if (matched) {
      if (matched.grade) {
        setGrade(matched.grade);
      }
      if (matched.homeroomTeacher && !homeroomTeacher) {
        setHomeroomTeacher(matched.homeroomTeacher);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressed);
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // calculate age
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = Math.max(1, currentYear - birthYear);

    if (isEditing && studentToEdit) {
      updateStudent(studentToEdit.id, {
        studentCode,
        nationalId,
        prefix,
        firstName,
        lastName,
        nickname,
        gender,
        birthDate,
        age: calculatedAge,
        bloodType,
        grade,
        classroom,
        homeroomTeacher,
        guardianName,
        guardianRelationship,
        guardianPhone,
        emergencyPhone,
        address,
        photoUrl
      });
    } else {
      addStudent({
        studentCode,
        nationalId,
        prefix,
        firstName,
        lastName,
        nickname,
        gender,
        birthDate,
        age: calculatedAge,
        bloodType,
        grade,
        classroom,
        homeroomTeacher,
        guardianName,
        guardianRelationship,
        guardianPhone,
        emergencyPhone,
        address,
        photoUrl,
        disabilities: [
          {
            typeId: systemConfig.disabilityCategories?.[3]?.id || 'physical',
            typeName: systemConfig.disabilityCategories?.[3]?.name || 'บุคคลที่มีความบกพร่องทางร่างกาย หรือการเคลื่อนไหว หรือสุขภาพ',
            details: 'ความต้องการความช่วยเหลือทั่วไป',
            assistanceLevel: 'ปานกลาง'
          }
        ],
        chronicDiseases: [],
        drugAllergies: [],
        foodAllergies: [],
        dailyMedications: [],
        medicalDevices: [],
        vaccines: [],
        nutritionHistory: [
          {
            id: `nut-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            weight: 20,
            height: 115,
            bmi: 15.1,
            bmiStatus: 'สมส่วน',
            dietType: 'อาหารปกติ'
          }
        ]
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-teal-100" />
            <h3 className="font-heading font-bold text-lg">
              {isEditing ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มข้อมูลนักเรียนใหม่'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Identity Codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">รหัสนักเรียน (Student ID) *</label>
              <input
                type="text"
                required
                value={studentCode}
                onChange={e => setStudentCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">เลขประจำตัวประชาชน 13 หลัก</label>
              <input
                type="text"
                maxLength={13}
                value={nationalId}
                onChange={e => setNationalId(e.target.value)}
                placeholder="x-xxxx-xxxxx-xx-x"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">คำนำหน้า *</label>
              <select
                value={prefix}
                onChange={e => setPrefix(e.target.value as Student['prefix'])}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
              >
                <option value="เด็กชาย">เด็กชาย</option>
                <option value="เด็กหญิง">เด็กหญิง</option>
                <option value="นาย">นาย</option>
                <option value="นางสาว">นางสาว</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ชื่อจริง *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">นามสกุล *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ชื่อเล่น *</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 text-teal-800 font-bold"
              />
            </div>
          </div>

          {/* Gender, Blood, Birthdate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">เพศ *</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as 'ชาย' | 'หญิง')}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">วัน/เดือน/ปีเกิด *</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
              />
              {birthDate && (
                <div className="text-[11px] text-teal-700 font-semibold mt-1">
                  🗓️ {formatThaiDatePattern(birthDate)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">หมู่เลือด (Blood Group) *</label>
              <select
                value={bloodType}
                onChange={e => setBloodType(e.target.value as Student['bloodType'])}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-bold text-rose-600"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="ไม่ทราบ">ไม่ทราบ</option>
              </select>
            </div>
          </div>

          {/* Education & Classroom */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ระดับชั้น *</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-medium"
              >
                {availableGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ห้องเรียน *</label>
              <select
                value={classroom}
                onChange={e => handleClassroomChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-semibold text-slate-800"
              >
                {(systemConfig.classrooms || []).map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ครูประจำชั้น *</label>
              <input
                type="text"
                required
                value={homeroomTeacher}
                onChange={e => setHomeroomTeacher(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Guardians */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">ชื่อผู้ปกครอง *</label>
              <input
                type="text"
                required
                value={guardianName}
                onChange={e => setGuardianName(e.target.value)}
                placeholder="เช่น นางวิภา ใจดี"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">ความสัมพันธ์</label>
              <input
                type="text"
                value={guardianRelationship}
                onChange={e => setGuardianRelationship(e.target.value)}
                placeholder="เช่น มารดา, บิดา, ย่า"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์ผู้ปกครอง *</label>
              <input
                type="tel"
                required
                value={guardianPhone}
                onChange={e => setGuardianPhone(e.target.value)}
                placeholder="08x-xxx-xxxx"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">ที่อยู่ตามทะเบียน</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-rose-700 font-bold mb-1">เบอร์โทรฉุกเฉินสำรอง</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                placeholder="056-xxx-xxx"
                className="w-full rounded-xl border border-rose-300 p-2 text-xs focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Student Photo Section: Upload file or URL */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-800 font-bold text-xs flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>รูปถ่ายนักเรียน (Student Profile Photo)</span>
              </label>

              {/* Toggle Mode */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPhotoInputMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1 ${
                    photoInputMode === 'upload' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>แนบไฟล์รูป</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoInputMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1 ${
                    photoInputMode === 'url' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>ใส่ลิงก์รูป (URL)</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {/* Photo Preview Thumbnail */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <div className="relative group">
                    <img
                      src={photoUrl}
                      alt="Student"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                      title="ลบรูปถ่าย"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                    <User className="w-6 h-6 text-slate-300 mb-1" />
                    <span>ไม่มีรูป</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="w-full flex-1">
                {photoInputMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-teal-300 hover:border-teal-500 hover:bg-teal-50/50 transition-colors rounded-xl p-3 text-center"
                    >
                      <Upload className="w-5 h-5 mx-auto text-teal-600 mb-1" />
                      <div className="text-xs font-semibold text-teal-800">
                        คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากรูปมาวางที่นี่
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        รองรับไฟล์ JPG, PNG, WebP (จะบันทึกรูปเข้าโปรไฟล์นักเรียนทันที)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      วางลิงก์รูปภาพ (Web Image URL)
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={e => setPhotoUrl(e.target.value)}
                        placeholder="https://example.com/student-photo.jpg"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มนักเรียน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
