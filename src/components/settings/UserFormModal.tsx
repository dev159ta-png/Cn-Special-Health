import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { X, UserPlus, Save, Shield, User as UserIcon, Mail, Phone, Lock, School } from 'lucide-react';

interface UserFormModalProps {
  user: User | null; // If null, mode is "Create", else "Edit"
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
}

const GRADES = ['อ.1', 'อ.2', 'อ.3', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('teacher');
  const [position, setPosition] = useState('');
  const [assignedGrade, setAssignedGrade] = useState('');
  const [assignedClassroom, setAssignedClassroom] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || 'teacher');
      setPosition(user.position || user.roleTitle || '');
      setAssignedGrade(user.assignedGrade || '');
      setAssignedClassroom(user.assignedClassroom || '');
      setIsActive(user.isActive !== false);
      setPassword('');
    } else {
      setUsername('');
      setName('');
      setEmail('');
      setPhone('');
      setRole('teacher');
      setPosition('');
      setAssignedGrade('');
      setAssignedClassroom('');
      setIsActive(true);
      setPassword('123456'); // default initial temp password
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let roleTitle = 'ครูประจำชั้น';
    if (role === 'admin') roleTitle = 'ผู้ดูแลระบบ';
    else if (role === 'nurse') roleTitle = 'ครูอนามัย / พยาบาลวิชาชีพ';

    const userData = {
      username: username.trim(),
      name: name.trim(),
      email: email.trim() || `${username.trim()}@school.ac.th`,
      phone: phone.trim() || undefined,
      role,
      roleTitle: position.trim() || roleTitle,
      position: position.trim() || roleTitle,
      assignedGrade: role === 'teacher' ? (assignedGrade || undefined) : undefined,
      assignedClassroom: role === 'teacher' ? (assignedClassroom || undefined) : undefined,
      isActive
    };

    onSave(userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              {user ? <Shield className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg">
                {user ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ'}
              </h3>
              <p className="text-xs text-purple-200">
                กำหนดสิทธิ์การเข้าถึงข้อมูลและบทบาทในระบบห้องพยาบาล
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน (Username) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น somchai.s"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น นายสมชาย ใจดี"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                อีเมล (Email)
              </label>
              <input
                type="email"
                placeholder="somchai@school.ac.th"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                type="tel"
                placeholder="08x-xxx-xxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Role selection card */}
          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100 space-y-2">
            <label className="block font-bold text-slate-800">
              บทบาทและสิทธิ์การใช้งาน (Role & Permissions) *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  if (!position) setPosition('ผู้ดูแลระบบ');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  role === 'admin'
                    ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Admin</div>
                <div className="text-[10px] opacity-80">ผู้ดูแลระบบ</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('nurse');
                  if (!position) setPosition('พยาบาลวิชาชีพ / ครูอนามัย');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  role === 'nurse'
                    ? 'border-teal-600 bg-teal-600 text-white font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Nurse</div>
                <div className="text-[10px] opacity-80">ครูอนามัย</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('teacher');
                  if (!position) setPosition('ครูประจำชั้น');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  role === 'teacher'
                    ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">Teacher</div>
                <div className="text-[10px] opacity-80">ครูประจำชั้น</div>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              {role === 'admin' && '• สิทธิ์สูงสุด: จัดการผู้ใช้งาน, จัดการยา, ตัดสต็อก, สำรองข้อมูล และดูประวัติทั้งหมด'}
              {role === 'nurse' && '• ครูอนามัย: บันทึกการรับบริการห้องพยาบาล, จ่ายยา, ตรวจสอบสต็อก และจัดการประวัติสุขภาพ'}
              {role === 'teacher' && '• ครูประจำชั้น: ดูข้อมูลสุขภาพนักเรียนในห้องที่รับผิดชอบ, ดูประวัติการรักษา, สแกน QR'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ตำแหน่ง / หน้าที่รับผิดชอบ
            </label>
            <input
              type="text"
              placeholder="เช่น พยาบาลวิชาชีพชำนาญการ, ครูประจำชั้น ป.2/1"
              value={position}
              onChange={e => setPosition(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          {/* If Teacher, select Grade & Classroom */}
          {role === 'teacher' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ระดับชั้นที่รับผิดชอบ
                </label>
                <select
                  value={assignedGrade}
                  onChange={e => setAssignedGrade(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                >
                  <option value="">-- เลือกระดับชั้น --</option>
                  {GRADES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ห้องเรียนที่รับผิดชอบ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ป.2/1 หรือ ม.1/2"
                  value={assignedClassroom}
                  onChange={e => setAssignedClassroom(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                />
              </div>
            </div>
          )}

          {/* Password (if creating new user) */}
          {!user && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                รหัสผ่านเริ่มต้น (Default Password)
              </label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white font-mono"
              />
              <span className="text-[10px] text-slate-400">ผู้ใช้สามารถเปลี่ยนรหัสผ่านได้หลังเข้าสู่ระบบ</span>
            </div>
          )}

          {/* Active status */}
          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="font-semibold text-slate-800">
                เปิดใช้งานบัญชีนี้ (Active Account)
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{user ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
