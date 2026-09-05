import React, { useState, useRef } from 'react';
import { StudentDocument, StudentDocumentType } from '../../types';
import { useApp } from '../../context/AppContext';
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
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  Cloud,
  CloudCheck,
  Loader2
} from 'lucide-react';

interface StudentDocumentsSectionProps {
  documents: StudentDocument[];
  onChange: (documents: StudentDocument[]) => void;
  canEdit: boolean;
  studentName: string;
  studentId?: string;
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
    label: 'สมุดบันทึกสุขภาพ / สมุดวัคซีน (เล่มสีชมพู)',
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
    label: 'เอกสารอื่นๆ / ใบรับรองแพทย์',
    icon: FileSpreadsheet,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    desc: 'ใบรับรองแพทย์, ผลตรวจทางห้องปฏิบัติการ, เอกสารส่งตัว'
  }
];

export const StudentDocumentsSection: React.FC<StudentDocumentsSectionProps> = ({
  documents = [],
  onChange,
  canEdit,
  studentName,
  studentId
}) => {
  const { uploadDocument, deleteUploadedDocument, isFirebaseConnected, isSyncing } = useApp();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<StudentDocument | null>(null);

  // Form states for new document upload
  const [docType, setDocType] = useState<StudentDocumentType>('national_id');
  const [customTitle, setCustomTitle] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [fileData, setFileData] = useState('');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileObj(file);
    setSelectedFileName(file.name);
    setSelectedFileType(file.type || 'application/octet-stream');
    const sizeInKb = (file.size / 1024).toFixed(0);
    setSelectedFileSize(`${sizeInKb} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileData(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setDocType('national_id');
    setCustomTitle('');
    setDocNotes('');
    setFileData('');
    setSelectedFileObj(null);
    setSelectedFileName('');
    setSelectedFileType('');
    setSelectedFileSize('');
    setFileUrlInput('');
    setUploadError(null);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    const category = DOCUMENT_CATEGORIES.find(c => c.type === docType);
    const title = docType === 'other' && customTitle.trim()
      ? customTitle.trim()
      : (category?.label || 'เอกสาร');

    if (inputMode === 'url') {
      if (!fileUrlInput.trim()) {
        alert('กรุณากรอกลิงก์เอกสาร');
        return;
      }
      const newDoc: StudentDocument = {
        id: `doc-${Date.now()}`,
        type: docType,
        title,
        customTitle: docType === 'other' ? customTitle.trim() : undefined,
        fileName: customTitle.trim() || 'เอกสารแนบจากลิงก์',
        fileType: fileUrlInput.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        fileSize: 'URL Link',
        fileData: fileUrlInput.trim(),
        uploadDate: new Date().toISOString().slice(0, 10),
        notes: docNotes.trim() || undefined
      };
      onChange([...documents, newDoc]);
      setIsUploadModalOpen(false);
      resetForm();
      return;
    }

    if (!selectedFileObj && !fileData) {
      alert('กรุณาเลือกไฟล์เอกสาร (PDF หรือรูปภาพ)');
      return;
    }

    setIsUploading(true);
    try {
      if (selectedFileObj) {
        // Upload to Firebase Cloud Realtime
        const uploaded = await uploadDocument(
          selectedFileObj,
          category?.label || 'เอกสารทั่วไป',
          title,
          studentId,
          docNotes.trim() || undefined
        );

        const newDoc: StudentDocument = {
          id: uploaded.id,
          type: docType,
          title,
          customTitle: docType === 'other' ? customTitle.trim() : undefined,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          fileSize: uploaded.fileSize,
          fileData: uploaded.fileData,
          uploadDate: uploaded.uploadedAt.slice(0, 10),
          notes: docNotes.trim() || undefined
        };
        onChange([...documents, newDoc]);
      } else {
        const newDoc: StudentDocument = {
          id: `doc-${Date.now()}`,
          type: docType,
          title,
          customTitle: docType === 'other' ? customTitle.trim() : undefined,
          fileName: selectedFileName || title,
          fileType: selectedFileType,
          fileSize: selectedFileSize || '100 KB',
          fileData: fileData,
          uploadDate: new Date().toISOString().slice(0, 10),
          notes: docNotes.trim() || undefined
        };
        onChange([...documents, newDoc]);
      }

      setIsUploadModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดเอกสาร');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('คุณต้องการลบเอกสารนี้ใช่หรือไม่?')) {
      onChange(documents.filter(d => d.id !== id));
      try {
        await deleteUploadedDocument(id);
      } catch (err) {
        console.error('Failed to delete cloud document:', err);
      }
    }
  };

  const getDocIcon = (type: StudentDocumentType) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.type === type);
    const IconComponent = cat ? cat.icon : FileText;
    return <IconComponent className="w-5 h-5" />;
  };

  const getDocBadgeColor = (type: StudentDocumentType) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.type === type);
    return cat ? cat.color : 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-base text-slate-800 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <span>เอกสารที่เกี่ยวข้อง (Relevant Health & Identity Documents)</span>
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isFirebaseConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <Cloud className="w-3 h-3" />
              <span>{isFirebaseConnected ? 'Firebase Real-time' : 'Local Storage'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดเก็บสำเนาเอกสารประจำตัว บัตรคนพิการ ทะเบียนบ้าน สูติบัตร และผลตรวจของนักเรียน ซิงค์ขึ้นฐานข้อมูล Firebase Cloud แบบ Real-time ทันที
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ แนบเอกสารใหม่</span>
          </button>
        )}
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {DOCUMENT_CATEGORIES.map(cat => {
          const count = documents.filter(d => d.type === cat.type).length;
          const Icon = cat.icon;
          return (
            <div
              key={cat.type}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                count > 0 ? 'bg-white border-teal-200 shadow-xs' : 'bg-slate-50/70 border-slate-200/80 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  count > 0 ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count} ไฟล์
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-800 truncate" title={cat.label}>
                {cat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Document List / Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">ยังไม่มีการแนบเอกสารสำหรับนักเรียนคนนี้</p>
          <p className="text-xs text-slate-400 mt-1">
            ท่านสามารถแนบสำเนาบัตรประชาชน บัตรผู้พิการ ทะเบียนบ้าน สูติบัตร หรือสมุดวัคซีนเพื่อความสะดวกรวดเร็วในการรักษา
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors inline-flex items-center space-x-1.5 shadow-2xs"
            >
              <Upload className="w-4 h-4" />
              <span>แนบเอกสารแรก</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {documents.map((doc) => {
            const isPdf = doc.fileType.includes('pdf') || doc.fileName.toLowerCase().endsWith('.pdf');
            const isImage = doc.fileType.includes('image') || doc.fileData.startsWith('data:image/');
            const category = DOCUMENT_CATEGORIES.find(c => c.type === doc.type);

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-teal-300 transition-all p-4 flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getDocBadgeColor(doc.type)}`}>
                      {getDocIcon(doc.type)}
                      <span className="truncate max-w-[140px]">{category?.label || doc.title}</span>
                    </span>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100"
                        title="ลบเอกสาร"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-semibold text-xs text-slate-900 line-clamp-1 mb-1" title={doc.title}>
                    {doc.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 font-mono truncate mb-2" title={doc.fileName}>
                    📄 {doc.fileName}
                  </div>

                  {doc.notes && (
                    <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 mb-2.5 border border-slate-100">
                      💡 {doc.notes}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>📅 {formatThaiDatePattern(doc.uploadDate)}</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium flex items-center space-x-1 transition-colors"
                      title="ดูตัวอย่างเอกสาร"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูเอกสาร</span>
                    </button>
                    {doc.fileData && (
                      <a
                        href={doc.fileData}
                        download={doc.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="ดาวน์โหลดไฟล์"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal-100" />
                <h3 className="font-heading font-bold text-base">
                  แนบเอกสารที่เกี่ยวข้อง: {studentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ประเภทเอกสาร *</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value as StudentDocumentType)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:ring-teal-500"
                >
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <option key={cat.type} value={cat.type}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {docType === 'other' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ระบุชื่อเอกสาร *</label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="เช่น ผลตรวจการได้ยิน (Audiogram), ใบรับรองแพทย์"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Mode Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold">รูปแบบการแนบไฟล์ *</label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInputMode('file')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        inputMode === 'file' ? 'bg-white text-teal-700 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      อัปโหลดไฟล์ (PDF/ภาพ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        inputMode === 'url' ? 'bg-white text-teal-700 shadow-2xs font-bold' : 'text-slate-500'
                      }`}
                    >
                      ใส่ลิงก์ URL
                    </button>
                  </div>
                </div>

                {inputMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="application/pdf,image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-teal-300 hover:border-teal-500 hover:bg-teal-50/40 rounded-xl p-4 text-center transition-colors"
                    >
                      <Upload className="w-6 h-6 mx-auto text-teal-600 mb-1" />
                      <div className="text-xs font-semibold text-teal-800">
                        {selectedFileName ? selectedFileName : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        รองรับไฟล์ PDF, JPG, PNG (รูปภาพจะถูกปรับขนาดให้เหมาะสมอัตโนมัติ สำหรับจัดเก็บบน Firebase Firestore Real-time)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={fileUrlInput}
                      onChange={e => setFileUrlInput(e.target.value)}
                      placeholder="https://example.com/documents/doc-sample.pdf"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">หมายเหตุ / ข้อมูลเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="เช่น เลขบัตรประจำตัวคนพิการ 1-xxxx-xxxxx-xx-x, วันหมดอายุบัตร, ออกให้โดย รพ. ชัยนาท"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:ring-teal-500"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังอัปโหลดขึ้น Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>บันทึกเอกสาร</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 truncate pr-4">
                <FileText className="w-5 h-5 text-teal-400 shrink-0" />
                <div className="truncate">
                  <h3 className="font-heading font-bold text-sm truncate">{previewDoc.title}</h3>
                  <p className="text-[11px] text-slate-400 truncate">{previewDoc.fileName} • {previewDoc.fileSize || ''}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={previewDoc.fileData}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1 text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Render either PDF iframe or image */}
            <div className="flex-1 bg-slate-100 p-2 overflow-auto flex items-center justify-center">
              {previewDoc.fileType.includes('pdf') || previewDoc.fileName.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileData}
                  title={previewDoc.title}
                  className="w-full h-full rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <div className="max-w-full max-h-full flex items-center justify-center p-2">
                  <img
                    src={previewDoc.fileData}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-lg border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Notes */}
            {previewDoc.notes && (
              <div className="p-3 bg-white border-t border-slate-200 text-xs text-slate-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span><strong>หมายเหตุ:</strong> {previewDoc.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
