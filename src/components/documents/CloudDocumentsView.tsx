import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentDocumentType } from '../../types';
import { formatThaiDatePattern } from '../../utils/dateUtils';
import {
  FileText,
  Upload,
  Eye,
  Download,
  Trash2,
  Plus,
  X,
  CreditCard,
  FileCheck,
  Home,
  BookOpen,
  Baby,
  FileSpreadsheet,
  Search,
  Filter,
  Cloud,
  CloudCheck,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  User,
  Sparkles,
  LogIn,
  RefreshCw
} from 'lucide-react';

interface CloudDocumentsViewProps {
  onSelectStudent?: (student: any) => void;
}

const DOCUMENT_CATEGORIES: { type: StudentDocumentType; label: string; icon: any; color: string; desc: string }[] = [
  {
    type: 'national_id',
    label: 'บัตรประจำตัวประชาชน',
    icon: CreditCard,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    desc: 'สำเนาบัตรประชาชนของนักเรียน หรือสูติบัตร'
  },
  {
    type: 'disability_card',
    label: 'บัตรประจำตัวคนพิการ',
    icon: FileCheck,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    desc: 'บัตรประจำตัวคนพิการตาม พ.ร.บ. ส่งเสริมและพัฒนาคุณภาพชีวิต'
  },
  {
    type: 'house_registration',
    label: 'สำเนาทะเบียนบ้าน',
    icon: Home,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    desc: 'สำเนาทะเบียนบ้านที่มีชื่อนักเรียนและผู้ปกครอง'
  },
  {
    type: 'vaccine_book',
    label: 'สมุดบันทึกสุขภาพ / สมุดวัคซีน',
    icon: BookOpen,
    color: 'text-pink-600 bg-pink-50 border-pink-200',
    desc: 'หน้าบันทึกประวัติการรับวัคซีนและการเจริญเติบโต'
  },
  {
    type: 'birth_certificate',
    label: 'สูติบัตร (ใบเกิด)',
    icon: Baby,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    desc: 'หนังสือรับรองการเกิดจากนายทะเบียน'
  },
  {
    type: 'other',
    label: 'ใบรับรองแพทย์ / ผลตรวจ / อื่นๆ',
    icon: FileSpreadsheet,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    desc: 'ใบรับรองแพทย์, ผลตรวจทางห้องปฏิบัติการ, เอกสารส่งตัว'
  }
];

export const CloudDocumentsView: React.FC<CloudDocumentsViewProps> = ({
  onSelectStudent
}) => {
  const {
    students,
    uploadedDocuments,
    uploadDocument,
    deleteUploadedDocument,
    firebaseUser,
    isFirebaseConnected,
    isSyncing,
    loginWithGoogle,
    currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<'all' | 'pdf' | 'image'>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Upload Form States
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [categoryType, setCategoryType] = useState<StudentDocumentType>('national_id');
  const [docCustomTitle, setDocCustomTitle] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewData, setFilePreviewData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Available classrooms
  const classrooms = useMemo(() => {
    const set = new Set(students.map(s => s.classroom).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  // Statistics
  const totalDocs = uploadedDocuments.length;
  const pdfCount = uploadedDocuments.filter(d => d.fileType.includes('pdf') || d.fileName.toLowerCase().endsWith('.pdf')).length;
  const imageCount = uploadedDocuments.filter(d => d.fileType.startsWith('image/') || (!d.fileType.includes('pdf') && !d.fileName.toLowerCase().endsWith('.pdf'))).length;
  const uniqueStudentsWithDocs = new Set(uploadedDocuments.map(d => d.studentId).filter(Boolean)).size;

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return uploadedDocuments.filter(doc => {
      const isPdf = doc.fileType.includes('pdf') || doc.fileName.toLowerCase().endsWith('.pdf');
      const isImg = !isPdf;

      // File type filter
      if (selectedFileType === 'pdf' && !isPdf) return false;
      if (selectedFileType === 'image' && !isImg) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        const cat = DOCUMENT_CATEGORIES.find(c => c.type === selectedCategory);
        if (cat && doc.category !== cat.label && doc.category !== selectedCategory) {
          return false;
        }
      }

      // Classroom filter
      if (selectedClassroom !== 'all' && doc.studentId) {
        const stu = students.find(s => s.id === doc.studentId);
        if (!stu || stu.classroom !== selectedClassroom) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (doc.title || '').toLowerCase().includes(q);
        const fileNameMatch = (doc.fileName || '').toLowerCase().includes(q);
        const studentMatch = (doc.studentName || '').toLowerCase().includes(q);
        const notesMatch = (doc.notes || '').toLowerCase().includes(q);
        const categoryMatch = (doc.category || '').toLowerCase().includes(q);

        if (!titleMatch && !fileNameMatch && !studentMatch && !notesMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [uploadedDocuments, selectedFileType, selectedCategory, selectedClassroom, searchQuery, students]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setFormError(null);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setFormError('กรุณาเลือกไฟล์เอกสาร PDF หรือรูปภาพ (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFormError('ไฟล์มีขนาดใหญ่เกิน 8 MB กรุณาเลือกไฟล์ที่มีขนาดเล็กลง');
      return;
    }

    setSelectedFile(file);

    // If image, create temporary local preview
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFilePreviewData(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviewData('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const resetUploadForm = () => {
    setSelectedStudentId('');
    setCategoryType('national_id');
    setDocCustomTitle('');
    setDocNotes('');
    setSelectedFile(null);
    setFilePreviewData('');
    setFormError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFormError('กรุณาเลือกไฟล์ PDF หรือรูปภาพเพื่ออัปโหลด');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const cat = DOCUMENT_CATEGORIES.find(c => c.type === categoryType);
    const categoryLabel = cat ? cat.label : 'เอกสารทั่วไป';
    const finalTitle = docCustomTitle.trim() || categoryLabel;

    try {
      await uploadDocument(
        selectedFile,
        categoryLabel,
        finalTitle,
        selectedStudentId || undefined,
        docNotes.trim() || undefined
      );

      setIsUploadModalOpen(false);
      resetUploadForm();
    } catch (err: any) {
      console.error('Failed to upload document to Firebase:', err);
      setFormError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดเอกสารขึ้น Firebase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${title}" ออกจากระบบ Cloud?`)) {
      try {
        await deleteUploadedDocument(docId);
      } catch (err) {
        console.error('Failed to delete cloud document:', err);
        alert('เกิดข้อผิดพลาดในการลบเอกสาร กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const getCategoryMeta = (catName: string) => {
    const found = DOCUMENT_CATEGORIES.find(c => c.label === catName || c.type === catName);
    return found || {
      type: 'other' as StudentDocumentType,
      label: catName || 'เอกสารอื่นๆ',
      icon: FileText,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      desc: ''
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Firebase Status */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5" />
                <span>Firebase Cloud Real-time</span>
              </span>
              <span className="text-xs text-slate-500">
                เอกสารทั้งหมด {totalDocs} ไฟล์ (ซิงค์อัตโนมัติ)
              </span>
            </div>
            <h1 className="font-heading font-bold text-2xl text-slate-800 mt-1">
              คลังเอกสาร & รูปภาพเวชระเบียนนักเรียน
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ศูนย์กลางจัดเก็บและแสดงผลสำเนาบัตรประชาชน บัตรคนพิการ ทะเบียนบ้าน สูติบัตร ใบรับรองแพทย์ และรูปภาพ ซิงค์ฐานข้อมูล Firebase แบบ Real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {firebaseUser ? (
              <div 
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-2xs"
                title={`เชื่อมต่อ Firebase สำเร็จ: ${firebaseUser.email}`}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <CloudCheck className="w-4 h-4 text-emerald-600" />
                )}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[180px]">{firebaseUser.email}</span>
                  <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded font-bold">Realtime</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="เข้าสู่ระบบด้วย Google เพื่อเปิดการซิงค์ข้อมูล Real-time"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ Google เพื่อซิงค์ Real-time</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ อัปโหลดเอกสาร / รูปภาพใหม่</span>
            </button>
          </div>
        </div>

        {/* Real-time sync notice if not connected */}
        {!firebaseUser && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>แจ้งเตือน:</strong> ขณะนี้กำลังแสดงข้อมูลจากเบราว์เซอร์ กรุณาคลิก <strong>"เชื่อมต่อ Google Firebase"</strong> เพื่อเปิดใช้งานการอัปโหลดและแชร์เอกสาร/รูปภาพแบบ Real-time ร่วมกันหลายอุปกรณ์
              </span>
            </div>
            <button
              type="button"
              onClick={loginWithGoogle}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
            >
              เชื่อมต่อทันที
            </button>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">เอกสารทั้งหมด</p>
            <p className="text-xl font-heading font-bold text-slate-800">{totalDocs} <span className="text-xs font-normal text-slate-400">ไฟล์</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">ไฟล์เอกสาร PDF</p>
            <p className="text-xl font-heading font-bold text-slate-800">{pdfCount} <span className="text-xs font-normal text-slate-400">ไฟล์</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">ไฟล์รูปภาพ / สแกน</p>
            <p className="text-xl font-heading font-bold text-slate-800">{imageCount} <span className="text-xs font-normal text-slate-400">ภาพ</span></p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">นักเรียนที่มีเอกสาร</p>
            <p className="text-xl font-heading font-bold text-slate-800">{uniqueStudentsWithDocs} <span className="text-xs font-normal text-slate-400">คน</span></p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเอกสาร, ชื่อนักเรียน, รหัสนักเรียน, เลขบัตร หรือคำสำคัญ..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* File Type Filter */}
          <div className="flex items-center space-x-1.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => setSelectedFileType('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedFileType === 'all'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกประเภท ({totalDocs})
            </button>
            <button
              onClick={() => setSelectedFileType('pdf')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
                selectedFileType === 'pdf'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>เฉพาะ PDF ({pdfCount})</span>
            </button>
            <button
              onClick={() => setSelectedFileType('image')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 ${
                selectedFileType === 'image'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>เฉพาะรูปภาพ ({imageCount})</span>
            </button>
          </div>

          {/* Classroom Selector */}
          <select
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:ring-teal-500 w-full md:w-auto shrink-0"
          >
            <option value="all">ทุกชั้นเรียน ({students.length} คน)</option>
            {classrooms.map(c => (
              <option key={c} value={c}>ห้อง {c}</option>
            ))}
          </select>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-teal-100 text-teal-800 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            หมวดหมู่ทั้งหมด
          </button>
          {DOCUMENT_CATEGORIES.map(cat => {
            const count = uploadedDocuments.filter(d => d.category === cat.label || d.category === cat.type).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.type}
                onClick={() => setSelectedCategory(cat.type)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  selectedCategory === cat.type
                    ? 'bg-teal-100 text-teal-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-800">ไม่พบเอกสารหรือรูปภาพตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {uploadedDocuments.length === 0 
              ? 'ยังไม่มีเอกสารในคลัง Cloud ท่านสามารถคลิก "+ อัปโหลดเอกสาร / รูปภาพใหม่" เพื่อเพิ่มสำเนาบัตรประชาชน บัตรคนพิการ หรือผลตรวจของนักเรียน'
              : 'ลองปรับเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาเอกสาร'}
          </p>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-5 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors inline-flex items-center space-x-2 shadow-2xs cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลดเอกสารแรกขึ้น Cloud</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => {
            const isPdf = doc.fileType.includes('pdf') || doc.fileName.toLowerCase().endsWith('.pdf');
            const catMeta = getCategoryMeta(doc.category);
            const Icon = catMeta.icon;
            const matchedStudent = doc.studentId ? students.find(s => s.id === doc.studentId) : null;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 transition-all p-4 flex flex-col justify-between shadow-2xs hover:shadow-md group relative overflow-hidden"
              >
                {/* Real-time Indicator Top Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400" />

                <div>
                  {/* Category & File Type Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${catMeta.color}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[130px]">{catMeta.label}</span>
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isPdf 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {isPdf ? 'PDF' : 'IMAGE'}
                    </span>
                  </div>

                  {/* Visual Preview / Thumbnail Box */}
                  <div 
                    className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer mb-3 group/thumb"
                    onClick={() => setPreviewDoc(doc)}
                    title="คลิกเพื่อดูตัวอย่างแบบเต็มจอ"
                  >
                    {isPdf ? (
                      <div className="text-center p-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2 group-hover/thumb:scale-110 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{doc.fileName}</p>
                        <span className="text-[10px] text-slate-400">คลิกเพื่อเปิดอ่าน PDF</span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={doc.fileData}
                          alt={doc.title}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>ดูภาพขยาย</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Document Title & File Name */}
                  <h4 className="font-heading font-bold text-sm text-slate-800 leading-snug line-clamp-1" title={doc.title}>
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5" title={doc.fileName}>
                    {doc.fileName} • {doc.fileSize}
                  </p>

                  {/* Associated Student Info */}
                  {matchedStudent ? (
                    <div 
                      className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2 cursor-pointer hover:bg-teal-50/70 transition-colors"
                      onClick={() => onSelectStudent && onSelectStudent(matchedStudent)}
                      title="คลิกเพื่อดูเวชระเบียนนักเรียนคนนี้"
                    >
                      <img
                        src={matchedStudent.photoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100'}
                        alt={matchedStudent.firstName}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      <div className="truncate text-xs">
                        <p className="font-semibold text-slate-800 truncate">
                          {matchedStudent.prefix}{matchedStudent.firstName} {matchedStudent.lastName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {matchedStudent.studentCode} • ชั้น {matchedStudent.classroom}
                        </p>
                      </div>
                    </div>
                  ) : doc.studentName ? (
                    <div className="mt-3 p-2 rounded-xl bg-slate-50 text-xs text-slate-600 truncate">
                      👤 {doc.studentName}
                    </div>
                  ) : (
                    <div className="mt-3 p-2 rounded-xl bg-slate-50 text-[11px] text-slate-400">
                      🏥 เอกสารทั่วไปของห้องพยาบาล
                    </div>
                  )}

                  {/* Notes snippet */}
                  {doc.notes && (
                    <p className="mt-2 text-[11px] text-slate-600 bg-amber-50/70 border border-amber-100 p-2 rounded-lg line-clamp-2" title={doc.notes}>
                      📝 {doc.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 truncate">
                    {doc.uploadedAt ? formatThaiDatePattern(new Date(doc.uploadedAt)) : 'เมื่อเร็วๆ นี้'}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      title="เปิดดูตัวอย่างเอกสาร"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <a
                      href={doc.fileData}
                      download={doc.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      title="ดาวน์โหลดไฟล์"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {(currentUser.role === 'admin' || currentUser.role === 'nurse') && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบเอกสารออกจาก Cloud"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-teal-100" />
                <h3 className="font-heading font-bold text-base">อัปโหลดเอกสาร / รูปภาพขึ้น Firebase Cloud</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  resetUploadForm();
                }}
                className="p-1.5 rounded-lg text-teal-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Student Selector */}
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">
                  เลือกนักเรียนที่เกี่ยวข้อง (หรือเลือกเอกสารทั่วไป)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-teal-500 bg-white"
                >
                  <option value="">-- เอกสารทั่วไปของห้องพยาบาล / ไม่ระบุตัวบุคคล --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.studentCode}] {s.prefix}{s.firstName} {s.lastName} (ห้อง {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">
                  ประเภทเอกสาร *
                </label>
                <select
                  value={categoryType}
                  onChange={e => setCategoryType(e.target.value as StudentDocumentType)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-teal-500 bg-white"
                >
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <option key={cat.type} value={cat.type}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Title */}
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">
                  ชื่อเอกสาร / รายละเอียดหัวเรื่อง
                </label>
                <input
                  type="text"
                  value={docCustomTitle}
                  onChange={e => setDocCustomTitle(e.target.value)}
                  placeholder="เช่น สำเนาบัตรคนพิการฉบับต่ออายุ 2569, ใบรับรองแพทย์ รพ.ชัยนาท"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-teal-500"
                />
              </div>

              {/* File Drag & Drop Box */}
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">
                  ไฟล์เอกสาร (PDF หรือรูปภาพ JPG / PNG) *
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver 
                      ? 'border-teal-500 bg-teal-50' 
                      : selectedFile 
                        ? 'border-emerald-400 bg-emerald-50/40' 
                        : 'border-slate-300 hover:border-teal-400 bg-slate-50'
                  }`}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        {selectedFile.type.includes('pdf') ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      </div>
                      <div className="font-semibold text-xs text-slate-800 truncate max-w-sm mx-auto">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ขนาด: {(selectedFile.size / 1024).toFixed(0)} KB • คลิกเพื่อเปลี่ยนไฟล์
                      </div>

                      {filePreviewData && (
                        <div className="mt-2 inline-block max-h-24 rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                          <img src={filePreviewData} alt="preview" className="h-24 object-contain" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-8 h-8 text-teal-600 mx-auto" />
                      <p className="font-semibold text-xs text-slate-700">
                        คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                      </p>
                      <p className="text-[10px] text-slate-400">
                        รองรับไฟล์ PDF, JPG, PNG, WebP (ระบบจะบีบอัดรูปภาพและปรับแต่งสำหรับ Firebase Real-time ให้โดยอัตโนมัติ)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="เช่น เลขบัตรประจำตัวคนพิการ, วันหมดอายุบัตร, โรงพยาบาลผู้ออกใบรับรอง..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-teal-500"
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังอัปโหลดขึ้น Firebase Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>บันทึกและซิงค์ขึ้น Cloud</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Document Viewer / Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden border border-slate-300">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3 truncate pr-4">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-teal-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="font-heading font-bold text-sm sm:text-base text-white truncate">
                    {previewDoc.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {previewDoc.studentName ? `${previewDoc.studentName} • ` : ''}
                    {previewDoc.fileName} • {previewDoc.fileSize}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={previewDoc.fileData}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ดาวน์โหลด</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Render either PDF iframe or image */}
            <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-auto flex items-center justify-center">
              {previewDoc.fileType.includes('pdf') || previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileData}
                  title={previewDoc.title}
                  className="w-full h-full rounded-2xl border border-slate-800 bg-white"
                />
              ) : (
                <div className="max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={previewDoc.fileData}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Notes */}
            {previewDoc.notes && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 flex items-center space-x-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>บันทึกเพิ่มเติม:</strong> {previewDoc.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
