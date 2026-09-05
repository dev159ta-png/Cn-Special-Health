import React, { useState, useEffect } from 'react';
import { ClassroomOption } from '../../types';
import { X, Save, GraduationCap, School, User, Building } from 'lucide-react';

interface ClassroomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classroom: ClassroomOption) => void;
  initialData?: ClassroomOption | null;
  existingClassrooms: ClassroomOption[];
  currentIndex?: number;
}

const COMMON_GRADES = [
  'เตรียมความพร้อม',
  'อนุบาล 1',
  'อนุบาล 2',
  'อนุบาล 3',
  'อนุบาล 1-3',
  'ป.1',
  'ป.2',
  'ป.3',
  'ป.4',
  'ป.5',
  'ป.6',
  'ม.1',
  'ม.2',
  'ม.3',
  'ม.4',
  'ม.5',
  'ม.6',
  'ม.ปลาย',
  'ฝึกทักษะอาชีพ',
  'การศึกษาตามอัธยาศัย'
];

export const ClassroomFormModal: React.FC<ClassroomFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingClassrooms,
  currentIndex
}) => {
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || initialData.grade || '');
      setRoomNumber(initialData.roomNumber || '');
      setHomeroomTeacher(initialData.homeroomTeacher || '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setRoomNumber('');
      setHomeroomTeacher('');
      setDescription('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();

    if (!finalName) {
      setError('กรุณากรอกระดับชั้น/ห้อง (เช่น ป.1/1, ป.1/2, ห้องเตรียมความพร้อม)');
      return;
    }

    // Check duplicate classroom name
    const isDuplicate = existingClassrooms.some((c, idx) => {
      if (currentIndex !== undefined && idx === currentIndex) return false;
      return c.name.trim().toLowerCase() === finalName.toLowerCase();
    });

    if (isDuplicate) {
      setError(`มีระดับชั้น/ห้อง "${finalName}" อยู่แล้วในระบบ`);
      return;
    }

    // Determine derived grade from name if applicable, or use name itself
    let derivedGrade = finalName;
    const matchGrade = finalName.match(/^(เตรียมความพร้อม|อนุบาล\s*\d+|อ\.\d+|ป\.\d+|ม\.\d+|ม\.ปลาย)/);
    if (matchGrade) {
      derivedGrade = matchGrade[1];
    }

    onSave({
      grade: derivedGrade,
      name: finalName,
      roomNumber: roomNumber.trim() || undefined,
      homeroomTeacher: homeroomTeacher.trim() || undefined,
      description: description.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-800">
                {initialData ? 'แก้ไขระดับชั้น/ห้อง' : 'เพิ่มตัวเลือกระดับชั้น/ห้องใหม่'}
              </h3>
              <p className="text-xs text-slate-500">
                กำหนดระดับชั้น/ห้องเรียนตัวเดียวเพื่อใช้งานในระบบอย่างสะดวก
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Unified Grade/Classroom Name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center space-x-1">
              <School className="w-3.5 h-3.5 text-purple-600" />
              <span>ระดับชั้น/ห้อง (Grade/Room) *</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ป.1/1, ป.1/2, อ.1/1, ม.1/1, เตรียมความพร้อม A"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              ระบุเป็นตัวเลือกเดียว เช่น "ป.1/1" เพื่อใช้เลือกในข้อมูลนักเรียนและตัวกรองค้นหา
            </p>
          </div>

          {/* Homeroom Teacher */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>ครูประจำชั้น (Homeroom Teacher)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น ครูมานะ มีสุข, ครูกรรณิการ์ จิตงาม"
              value={homeroomTeacher}
              onChange={e => setHomeroomTeacher(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Building / Room Number */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center space-x-1">
              <Building className="w-3.5 h-3.5 text-purple-600" />
              <span>อาคาร / เลขที่ห้องเรียน (Location)</span>
            </label>
            <input
              type="text"
              placeholder="เช่น อาคาร 1 ชั้น 2 ห้อง 121"
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              คำอธิบาย / หมายเหตุเพิ่มเติม
            </label>
            <textarea
              rows={2}
              placeholder="เช่น ห้องสำหรับนักเรียนบกพร่องทางร่างกายและสติปัญญา"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'บันทึกการแก้ไข' : 'เพิ่มระดับชั้น/ห้อง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
