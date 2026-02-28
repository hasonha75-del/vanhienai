import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PenTool,
  FileText,
  Search,
  Settings as SettingsIcon,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Sparkles,
  GraduationCap,
  BookOpen,
  History,
  Menu,
  X,
  Eye,
  Download,
  Upload,
  KeyRound,
  AlertTriangle,
  ExternalLink,
  Zap,
  Brain,
  Shield,
  Paperclip,
  ImageIcon,
  FileType,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import dayjs from 'dayjs';
import Markdown from 'react-markdown';
import Swal from 'sweetalert2';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GeminiService, FilePart } from './services/geminiService';
import { EssayRecord, OutlineRecord, AnalysisRecord } from './types';
import mammoth from 'mammoth';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const AI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Nhanh & Hiệu quả', icon: Zap, badge: 'Default', color: 'blue' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Thông minh & Chuyên sâu', icon: Brain, badge: null, color: 'purple' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Ổn định', icon: Shield, badge: null, color: 'emerald' },
];

// --- Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: any,
  label: string,
  active: boolean,
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active
        ? "bg-primary text-white shadow-lg shadow-primary/30"
        : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden", className)}>
    {children}
  </div>
);

// --- API Key Modal (mandatory when no key) ---
function ApiKeyModal({ onSave }: { onSave: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = () => {
    if (!key.trim()) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập API Key để tiếp tục.', 'warning');
      return;
    }
    onSave(key.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="gradient-bg p-6 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h2 className="text-xl font-bold">Chào mừng đến với Văn Hiến AI</h2>
          <p className="text-white/80 text-sm mt-1">Vui lòng nhập API Key để bắt đầu sử dụng</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Dán API Key của bạn vào đây..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pr-12"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <X size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>Hướng dẫn:</strong> Truy cập{' '}
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                Google AI Studio <ExternalLink size={12} />
              </a>
              {' '}để lấy API Key miễn phí.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3 gradient-bg text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <KeyRound size={20} />
            Xác nhận & Bắt đầu
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'grader' | 'outline' | 'analysis' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data State
  const [essays, setEssays] = useState<EssayRecord[]>([]);
  const [outlines, setOutlines] = useState<OutlineRecord[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('vanhien_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('vanhien_model') || 'gemini-3-flash-preview');

  // Load data
  useEffect(() => {
    const savedEssays = localStorage.getItem('vanhien_essays');
    const savedOutlines = localStorage.getItem('vanhien_outlines');
    const savedAnalyses = localStorage.getItem('vanhien_analyses');

    if (savedEssays) setEssays(JSON.parse(savedEssays));
    if (savedOutlines) setOutlines(JSON.parse(savedOutlines));
    if (savedAnalyses) setAnalyses(JSON.parse(savedAnalyses));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('vanhien_essays', JSON.stringify(essays));
  }, [essays]);

  useEffect(() => {
    localStorage.setItem('vanhien_outlines', JSON.stringify(outlines));
  }, [outlines]);

  useEffect(() => {
    localStorage.setItem('vanhien_analyses', JSON.stringify(analyses));
  }, [analyses]);

  const handleSaveSettings = (key: string, model: string) => {
    localStorage.setItem('vanhien_api_key', key);
    localStorage.setItem('vanhien_model', model);
    setApiKey(key);
    setSelectedModel(model);
    Swal.fire({
      title: 'Thành công',
      text: 'Cài đặt đã được lưu!',
      icon: 'success',
      confirmButtonColor: '#4A90E2'
    });
  };

  const exportData = () => {
    const data = { essays, outlines, analyses };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanhien_data_${dayjs().format('YYYYMMDD')}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.essays) setEssays(data.essays);
        if (data.outlines) setOutlines(data.outlines);
        if (data.analyses) setAnalyses(data.analyses);
        Swal.fire('Thành công', 'Dữ liệu đã được nhập!', 'success');
      } catch (err) {
        Swal.fire('Lỗi', 'File không hợp lệ!', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mandatory API Key Modal */}
      {!apiKey && (
        <ApiKeyModal onSave={(key) => {
          localStorage.setItem('vanhien_api_key', key);
          setApiKey(key);
          Swal.fire({
            title: 'Thành công!',
            text: 'API Key đã được lưu. Chúc bạn sử dụng hiệu quả!',
            icon: 'success',
            confirmButtonColor: '#4A90E2'
          });
        }} />
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-lg">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Văn Hiến AI</h1>
              <p className="text-xs text-slate-500">Trợ lý Ngữ văn Thông minh</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            <SidebarItem
              icon={LayoutDashboard}
              label="Bảng điều khiển"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <SidebarItem
              icon={PenTool}
              label="Chấm bài luận"
              active={activeTab === 'grader'}
              onClick={() => setActiveTab('grader')}
            />
            <SidebarItem
              icon={FileText}
              label="Lập dàn ý"
              active={activeTab === 'outline'}
              onClick={() => setActiveTab('outline')}
            />
            <SidebarItem
              icon={Search}
              label="Phân tích tác phẩm"
              active={activeTab === 'analysis'}
              onClick={() => setActiveTab('analysis')}
            />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <SidebarItem
              icon={SettingsIcon}
              label="Cài đặt"
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {/* Settings button with red text - always visible */}
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full transition-colors group"
            >
              <SettingsIcon size={16} className="text-red-500 group-hover:animate-spin" />
              <span className="text-xs font-semibold text-red-600 hidden sm:inline">Lấy API key để sử dụng app</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <BookOpen size={16} />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Giáo viên Ngữ văn</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <PenTool size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Bài đã chấm</p>
                        <p className="text-2xl font-bold">{essays.length}</p>
                      </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Dàn ý đã lập</p>
                        <p className="text-2xl font-bold">{outlines.length}</p>
                      </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Search size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Tác phẩm phân tích</p>
                        <p className="text-2xl font-bold">{analyses.length}</p>
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="flex flex-col">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                          <History size={18} className="text-slate-400" />
                          Hoạt động gần đây
                        </h3>
                      </div>
                      <div className="p-4 space-y-4 flex-1">
                        {[...essays, ...outlines, ...analyses]
                          .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
                          .slice(0, 5)
                          .map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                'score' in item ? "bg-blue-50 text-blue-600" :
                                  'topic' in item ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {'score' in item ? <PenTool size={18} /> :
                                  'topic' in item ? <FileText size={18} /> : <Search size={18} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {'title' in item ? item.title :
                                    'topic' in item ? item.topic : item.workTitle}
                                </p>
                                <p className="text-xs text-slate-400">{dayjs(item.date).format('DD/MM/YYYY HH:mm')}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-300" />
                            </div>
                          ))}
                        {essays.length === 0 && outlines.length === 0 && analyses.length === 0 && (
                          <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                            <Sparkles size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">Chưa có hoạt động nào</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    <Card className="p-6 gradient-bg text-white flex flex-col justify-center relative overflow-hidden">
                      <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">Chào mừng bạn trở lại!</h2>
                        <p className="text-white/80 mb-6">Hôm nay bạn muốn AI hỗ trợ công việc gì?</p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => setActiveTab('grader')}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
                          >
                            Chấm bài ngay
                          </button>
                          <button
                            onClick={() => setActiveTab('outline')}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
                          >
                            Lập dàn ý mới
                          </button>
                        </div>
                      </div>
                      <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeTab === 'grader' && (
                <EssayGrader
                  onSave={(essay) => setEssays([essay, ...essays])}
                  history={essays}
                  onDelete={(id) => setEssays(essays.filter(e => e.id !== id))}
                />
              )}

              {activeTab === 'outline' && (
                <OutlineGenerator
                  onSave={(outline) => setOutlines([outline, ...outlines])}
                  history={outlines}
                  onDelete={(id) => setOutlines(outlines.filter(o => o.id !== id))}
                />
              )}

              {activeTab === 'analysis' && (
                <LiteraryAnalysis
                  onSave={(analysis) => setAnalyses([analysis, ...analyses])}
                  history={analyses}
                  onDelete={(id) => setAnalyses(analyses.filter(a => a.id !== id))}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  initialKey={apiKey}
                  initialModel={selectedModel}
                  onSave={handleSaveSettings}
                  onExport={exportData}
                  onImport={importData}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- File Upload Helpers ---

interface UploadedFile {
  name: string;
  type: string; // 'image' | 'pdf' | 'docx'
  mimeType: string;
  base64?: string; // for images and PDFs
  extractedText?: string; // for Word documents
  previewUrl?: string; // for image previews
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileTypeInfo(file: File): { type: string; icon: any; color: string } {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
    return { type: 'image', icon: ImageIcon, color: 'emerald' };
  }
  if (ext === 'pdf') {
    return { type: 'pdf', icon: FileType, color: 'red' };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { type: 'docx', icon: FileText, color: 'blue' };
  }
  return { type: 'unknown', icon: Paperclip, color: 'slate' };
}

async function processFile(file: File): Promise<UploadedFile> {
  const { type } = getFileTypeInfo(file);

  if (type === 'image') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({
          name: file.name,
          type: 'image',
          mimeType: file.type || 'image/jpeg',
          base64,
          previewUrl: result,
          size: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (type === 'pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({
          name: file.name,
          type: 'pdf',
          mimeType: 'application/pdf',
          base64,
          size: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (type === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      name: file.name,
      type: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extractedText: result.value,
      size: file.size,
    };
  }

  throw new Error(`Định dạng file "${file.name}" không được hỗ trợ.`);
}

// --- Feature Components ---

function EssayGrader({ onSave, history, onDelete }: {
  onSave: (e: EssayRecord) => void,
  history: EssayRecord[],
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [answerKey, setAnswerKey] = useState('');
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EssayRecord | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.webp,.gif,.bmp,.pdf,.doc,.docx';
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFileProcessing(true);
    try {
      const newFiles: UploadedFile[] = [];
      for (const file of Array.from(fileList)) {
        if (file.size > MAX_FILE_SIZE) {
          Swal.fire('File quá lớn', `"${file.name}" vượt quá 20MB.`, 'warning');
          continue;
        }
        try {
          const processed = await processFile(file);
          newFiles.push(processed);
        } catch (err: any) {
          Swal.fire('Lỗi', err.message, 'error');
        }
      }
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } finally {
      setFileProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleGrade = async () => {
    const hasContent = content.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;

    if (!title || (!hasContent && !hasFiles)) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập tiêu đề và nội dung bài văn hoặc tải file bài làm.', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Build text content from typed text + extracted Word text
      let fullContent = content;
      const docxFiles = uploadedFiles.filter(f => f.type === 'docx' && f.extractedText);
      if (docxFiles.length > 0) {
        const docTexts = docxFiles.map(f => `[Nội dung từ file "${f.name}"]:\n${f.extractedText}`).join('\n\n');
        fullContent = fullContent ? `${fullContent}\n\n${docTexts}` : docTexts;
      }

      // Build file parts for Gemini (images + PDFs)
      const fileParts: FilePart[] = uploadedFiles
        .filter(f => (f.type === 'image' || f.type === 'pdf') && f.base64)
        .map(f => ({ mimeType: f.mimeType, base64Data: f.base64! }));

      const hasInlineFiles = fileParts.length > 0;

      const prompt = `
Hãy đóng vai một giáo viên Ngữ văn giàu kinh nghiệm tại Việt Nam.
Hãy chấm điểm và nhận xét chi tiết bài văn sau:

Tiêu đề: ${title}
${fullContent ? `Nội dung bài viết:\n${fullContent}` : ''}
${hasInlineFiles ? '\n(Bài làm của học sinh được đính kèm dưới dạng file ảnh/PDF. Hãy đọc và phân tích nội dung trong file.)' : ''}
${answerKey.trim() ? `\n--- ĐÁP ÁN / BÀI MẪU CỦA GIÁO VIÊN ---\n${answerKey.trim()}\n--- HẾT ĐÁP ÁN ---\n\nHãy đối chiếu bài làm của học sinh với đáp án/bài mẫu ở trên. Đánh giá mức độ đầy đủ về ý, lập luận, dẫn chứng so với đáp án. Chỉ ra những ý học sinh đã đạt được và những ý còn thiếu.` : ''}

Yêu cầu phản hồi theo định dạng Markdown với các mục:
1. Điểm số (thang điểm 10)
2. Nhận xét chung
${answerKey.trim() ? '3. Đối chiếu với đáp án (những ý đã đạt, những ý còn thiếu, mức độ hoàn thành)\n4. Ưu điểm (về bố cục, diễn đạt, sáng tạo)\n5. Hạn chế cần khắc phục\n6. Gợi ý sửa đổi chi tiết (đưa ra các câu văn mẫu hay hơn nếu cần)' : '3. Ưu điểm (về bố cục, diễn đạt, sáng tạo)\n4. Hạn chế cần khắc phục\n5. Gợi ý sửa đổi chi tiết (đưa ra các câu văn mẫu hay hơn nếu cần)'}

Hãy phản hồi một cách khích lệ nhưng vẫn đảm bảo tính chuyên môn cao.
      `.trim();

      const feedback = await GeminiService.generateContent(
        prompt,
        "Bạn là một trợ lý giáo dục chuyên về Ngữ văn Việt Nam.",
        hasInlineFiles ? fileParts : undefined
      );
      if (feedback) {
        const scoreMatch = feedback.match(/Điểm số:?\s*(\d+(\.\d+)?)/i);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 7.5;

        const newEssay: EssayRecord = {
          id: Date.now().toString(),
          title,
          content: fullContent || `[Bài làm từ file: ${uploadedFiles.map(f => f.name).join(', ')}]`,
          feedback,
          score,
          date: new Date().toISOString()
        };
        setResult(newEssay);
        onSave(newEssay);
      }
    } catch (error: any) {
      Swal.fire('Lỗi', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chấm bài luận</h2>
        <button
          onClick={() => { setResult(null); setTitle(''); setContent(''); setAnswerKey(''); setUploadedFiles([]); }}
          className="flex items-center gap-2 text-primary font-medium hover:underline"
        >
          <Plus size={18} />
          Bài mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đề bài / Tiêu đề</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Phân tích nhân vật Vũ Nương..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung bài viết của học sinh</label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dán nội dung bài văn của học sinh vào đây..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              {/* Teacher's Answer Key */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1 hover:text-primary transition-colors"
                >
                  <BookOpen size={14} />
                  Đáp án / Bài mẫu của giáo viên
                  <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
                  <ChevronRight size={14} className={cn("transition-transform", showAnswerKey && "rotate-90")} />
                  {answerKey.trim() && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
                <AnimatePresence>
                  {showAnswerKey && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <textarea
                        rows={6}
                        value={answerKey}
                        onChange={(e) => setAnswerKey(e.target.value)}
                        placeholder="Dán đáp án hoặc bài mẫu vào đây để AI đối chiếu với bài làm của học sinh..."
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none bg-amber-50/50 border-amber-200/50"
                      />
                      <p className="text-xs text-slate-400 mt-1">AI sẽ đối chiếu bài làm với đáp án để đánh giá mức độ đầy đủ về ý và cho điểm chính xác hơn.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* File Upload Zone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  <Paperclip size={14} />
                  Tải file bài làm <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    {fileProcessing ? (
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Upload size={20} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        {fileProcessing ? 'Đang xử lý...' : 'Kéo thả hoặc nhấn để tải file'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Hỗ trợ: Ảnh (JPG, PNG, WebP), Word (DOC, DOCX), PDF — Tối đa 20MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, idx) => {
                      const colorMap: Record<string, string> = {
                        image: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                        pdf: 'bg-red-50 text-red-600 border-red-100',
                        docx: 'bg-blue-50 text-blue-600 border-blue-100',
                      };
                      const badgeColor = colorMap[file.type] || 'bg-slate-50 text-slate-600 border-slate-100';
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                          {/* Image preview */}
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt={file.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", badgeColor)}>
                              {file.type === 'pdf' ? <FileType size={18} /> : <FileText size={18} />}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-slate-700">{file.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border", badgeColor)}>
                                {file.type === 'image' ? 'Ảnh' : file.type === 'pdf' ? 'PDF' : 'Word'}
                              </span>
                              <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                              {file.type === 'docx' && file.extractedText && (
                                <span className="text-xs text-emerald-500">✓ Đã trích xuất văn bản</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleGrade}
                disabled={loading}
                className="w-full py-3 gradient-bg text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {loading ? 'Đang chấm bài...' : 'Bắt đầu chấm bài'}
              </button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Lịch sử chấm bài
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {history.map(essay => (
                <div key={essay.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <button
                    onClick={() => { setResult(essay); setTitle(essay.title); setContent(essay.content); }}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-medium truncate">{essay.title}</p>
                    <p className="text-xs text-slate-400">{dayjs(essay.date).format('DD/MM/YYYY')}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{essay.score}/10</span>
                    <button
                      onClick={() => onDelete(essay.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {result ? (
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-primary flex items-center gap-2">
                  <Eye size={18} />
                  Kết quả chấm bài
                </h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto prose prose-slate max-w-none">
                <div className="markdown-body">
                  <Markdown>{result.feedback}</Markdown>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <PenTool size={32} className="opacity-20" />
              </div>
              <h3 className="font-medium text-slate-600 mb-1">Chưa có kết quả</h3>
              <p className="text-sm max-w-xs">Nhập nội dung bài văn hoặc tải file bài làm, sau đó nhấn "Bắt đầu chấm bài" để xem nhận xét từ AI.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function OutlineGenerator({ onSave, history, onDelete }: {
  onSave: (o: OutlineRecord) => void,
  history: OutlineRecord[],
  onDelete: (id: string) => void
}) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutlineRecord | null>(null);

  const handleGenerate = async () => {
    if (!topic) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập chủ đề bài viết.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const prompt = `
        Hãy lập một dàn ý chi tiết cho đề bài Ngữ văn sau:
        Đề bài: ${topic}
        
        Yêu cầu dàn ý bao gồm:
        1. Mở bài (Dẫn dắt, nêu vấn đề)
        2. Thân bài (Các luận điểm chính, luận cứ, dẫn chứng cụ thể)
        3. Kết bài (Tổng kết, mở rộng vấn đề)
        
        Định dạng phản hồi bằng Markdown rõ ràng, dễ theo dõi.
      `;

      const content = await GeminiService.generateContent(prompt, "Bạn là một chuyên gia lập dàn ý văn học.");
      if (content) {
        const newOutline: OutlineRecord = {
          id: Date.now().toString(),
          topic,
          content,
          date: new Date().toISOString()
        };
        setResult(newOutline);
        onSave(newOutline);
      }
    } catch (error: any) {
      Swal.fire('Lỗi', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lập dàn ý chi tiết</h2>
        <button
          onClick={() => { setResult(null); setTopic(''); }}
          className="flex items-center gap-2 text-primary font-medium hover:underline"
        >
          <Plus size={18} />
          Dàn ý mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chủ đề / Đề bài</label>
                <textarea
                  rows={4}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Nghị luận về lòng dũng cảm trong cuộc sống..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {loading ? 'Đang lập dàn ý...' : 'Tạo dàn ý ngay'}
              </button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Dàn ý đã tạo
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {history.map(outline => (
                <div key={outline.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <button
                    onClick={() => { setResult(outline); setTopic(outline.topic); }}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-medium truncate">{outline.topic}</p>
                    <p className="text-xs text-slate-400">{dayjs(outline.date).format('DD/MM/YYYY')}</p>
                  </button>
                  <button
                    onClick={() => onDelete(outline.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {result ? (
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-orange-600 flex items-center gap-2">
                  <Eye size={18} />
                  Dàn ý chi tiết
                </h3>
              </div>
              <div className="p-6 flex-1 overflow-y-auto prose prose-slate max-w-none">
                <div className="markdown-body">
                  <Markdown>{result.content}</Markdown>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <FileText size={32} className="opacity-20" />
              </div>
              <h3 className="font-medium text-slate-600 mb-1">Chưa có dàn ý</h3>
              <p className="text-sm max-w-xs">Nhập đề bài và nhấn "Tạo dàn ý ngay" để AI xây dựng khung bài viết cho bạn.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LiteraryAnalysis({ onSave, history, onDelete }: {
  onSave: (a: AnalysisRecord) => void,
  history: AnalysisRecord[],
  onDelete: (id: string) => void
}) {
  const [workTitle, setWorkTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisRecord | null>(null);

  const handleAnalyze = async () => {
    if (!workTitle) {
      Swal.fire('Thiếu thông tin', 'Vui lòng nhập tên tác phẩm.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const prompt = `
        Hãy phân tích đa chiều tác phẩm văn học sau: "${workTitle}"
        
        Yêu cầu phân tích bao gồm:
        1. Hoàn cảnh sáng tác & Đề tài
        2. Phân tích nội dung (Các giá trị hiện thực, nhân đạo...)
        3. Phân tích nghệ thuật (Ngôn ngữ, hình ảnh, bút pháp...)
        4. Ý nghĩa tư tưởng của tác phẩm
        5. Liên hệ thực tế hoặc so sánh với các tác phẩm cùng đề tài
        
        Định dạng phản hồi bằng Markdown chuyên sâu, phù hợp cho giáo viên tham khảo soạn bài.
      `;

      const content = await GeminiService.generateContent(prompt, "Bạn là một nhà phê bình văn học chuyên sâu.");
      if (content) {
        const newAnalysis: AnalysisRecord = {
          id: Date.now().toString(),
          workTitle,
          content,
          date: new Date().toISOString()
        };
        setResult(newAnalysis);
        onSave(newAnalysis);
      }
    } catch (error: any) {
      Swal.fire('Lỗi', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Phân tích tác phẩm</h2>
        <button
          onClick={() => { setResult(null); setWorkTitle(''); }}
          className="flex items-center gap-2 text-primary font-medium hover:underline"
        >
          <Plus size={18} />
          Phân tích mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên tác phẩm / Tác giả</label>
                <input
                  type="text"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  placeholder="Ví dụ: Truyện Kiều - Nguyễn Du..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles size={20} />
                )}
                {loading ? 'Đang phân tích...' : 'Phân tích đa chiều'}
              </button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Tác phẩm đã phân tích
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {history.map(analysis => (
                <div key={analysis.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                  <button
                    onClick={() => { setResult(analysis); setWorkTitle(analysis.workTitle); }}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-medium truncate">{analysis.workTitle}</p>
                    <p className="text-xs text-slate-400">{dayjs(analysis.date).format('DD/MM/YYYY')}</p>
                  </button>
                  <button
                    onClick={() => onDelete(analysis.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {result ? (
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-emerald-600 flex items-center gap-2">
                  <Eye size={18} />
                  Nội dung phân tích
                </h3>
              </div>
              <div className="p-6 flex-1 overflow-y-auto prose prose-slate max-w-none">
                <div className="markdown-body">
                  <Markdown>{result.content}</Markdown>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Search size={32} className="opacity-20" />
              </div>
              <h3 className="font-medium text-slate-600 mb-1">Chưa có phân tích</h3>
              <p className="text-sm max-w-xs">Nhập tên tác phẩm và nhấn "Phân tích đa chiều" để AI cung cấp tư liệu chuyên sâu.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Settings({ initialKey, initialModel, onSave, onExport, onImport }: {
  initialKey: string,
  initialModel: string,
  onSave: (key: string, model: string) => void,
  onExport: () => void,
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const [key, setKey] = useState(initialKey);
  const [model, setModel] = useState(initialModel);
  const [showKey, setShowKey] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <h2 className="text-2xl font-bold">Cài đặt hệ thống</h2>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700">Cấu hình Gemini AI</h3>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Nhập API Key của bạn..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all pr-12"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <X size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Lấy API Key miễn phí tại{' '}
              <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                Google AI Studio <ExternalLink size={10} />
              </a>
            </p>
          </div>

          {/* Model Cards */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-3">Mô hình AI (Model)</label>
            <div className="space-y-3">
              {AI_MODELS.map((m) => {
                const Icon = m.icon;
                const isSelected = model === m.id;
                const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
                  blue: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', icon: 'text-blue-500' },
                  purple: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700', icon: 'text-purple-500' },
                  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', icon: 'text-emerald-500' },
                };
                const colors = colorMap[m.color];
                return (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      isSelected
                        ? `${colors.bg} ${colors.border} shadow-sm`
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isSelected ? colors.bg : "bg-slate-100"
                    )}>
                      <Icon size={20} className={isSelected ? colors.icon : "text-slate-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-sm", isSelected ? colors.text : "text-slate-700")}>
                          {m.name}
                        </span>
                        {m.badge && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      isSelected ? colors.border : "border-slate-300"
                    )}>
                      {isSelected && <div className={cn("w-2.5 h-2.5 rounded-full",
                        m.color === 'blue' ? 'bg-blue-500' :
                          m.color === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'
                      )} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onSave(key, model)}
            className="w-full py-3 gradient-bg text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Lưu cấu hình
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-700">Quản lý dữ liệu</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
            >
              <Download size={18} />
              Xuất dữ liệu
            </button>
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer transition-colors">
              <Upload size={18} />
              Nhập dữ liệu
              <input type="file" accept=".json" onChange={onImport} className="hidden" />
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-800 mb-1">Hướng dẫn sử dụng</h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Văn Hiến AI sử dụng trí tuệ nhân tạo để hỗ trợ giáo viên. Kết quả chấm bài và phân tích chỉ mang tính chất tham khảo chuyên môn. Hãy luôn kiểm tra lại nội dung trước khi phản hồi cho học sinh.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
