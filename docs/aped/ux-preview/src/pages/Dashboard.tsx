import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, HardDrive, Clock, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Toast } from '../components/ui/toast';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { AnimatedBadge } from '../components/ui/animated-badge';
import { SessionExpiredDialog } from '../components/ui/session-expired-dialog';
import { storageStats, storageStatsHigh, recentFiles, formatFileSize, formatDateRelative } from '../data/mock';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
type DemoMode = 'normal' | 'empty' | 'quota-warning';

export function Dashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string; variant: 'success' | 'error' | 'info' }>({ open: false, title: '', variant: 'success' });
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [demoMode, setDemoMode] = useState<DemoMode>('normal');

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const isEmpty = demoMode === 'empty';
  const stats = demoMode === 'quota-warning' ? storageStatsHigh : storageStats;
  const quotaPercent = Math.round((stats.totalSize / stats.maxSize) * 100);
  const isQuotaWarning = quotaPercent >= 80;
  const isQuotaCritical = quotaPercent >= 95;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not supported. Use JPG, PNG, WEBP, or PDF.`;
    }
    if (file.size > MAX_SIZE) {
      return `"${file.name}" exceeds the 10 MB limit (${formatFileSize(file.size)}).`;
    }
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError('');

    const error = validateFile(files[0]);
    if (error) {
      setUploadError(error);
      setToast({ open: true, title: 'Upload failed', description: error, variant: 'error' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setToast({ open: true, title: 'File uploaded', description: 'Generating thumbnail...', variant: 'success' });
          return 0;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const statCards = [
    { label: 'Total Files', value: isEmpty ? '0' : stats.totalFiles.toString(), icon: FileText },
    { label: 'Storage Used', value: isEmpty ? '0 B' : formatFileSize(stats.totalSize), icon: HardDrive },
    { label: 'Last Upload', value: isEmpty ? 'Never' : formatDateRelative(stats.lastUploadAt), icon: Clock },
    { label: 'Quota', value: isEmpty ? '0%' : `${quotaPercent}%`, icon: HardDrive },
  ];

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[var(--muted-foreground)] text-xs mt-1 text-emerald-500/80">Manage your files and monitor storage</p>
        </div>
        <AnimatedBadge text="CloudVault Beta v2.0" color="#10b981" href="/profile" />
      </div>

      {/* Demo mode switcher */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-[var(--muted-foreground)] mr-1 w-full sm:w-auto">Demo state:</span>
        {(['normal', 'empty', 'quota-warning'] as DemoMode[]).map((mode) => (
          <Button
            key={mode}
            variant={demoMode === mode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDemoMode(mode)}
            className="h-7 px-2.5 text-[10px]"
          >
            {mode}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setSessionExpired(true)} className="h-7 px-2.5 text-[10px] sm:ml-2">
          Trigger session expired
        </Button>
      </div>

      {/* Quota warning banner */}
      {!loading && !isEmpty && isQuotaWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-[8px] border flex items-start gap-3 ${
            isQuotaCritical
              ? 'bg-[var(--destructive)]/10 border-[var(--destructive)]/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}
          role="alert"
        >
          <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isQuotaCritical ? 'text-[var(--destructive)]' : 'text-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">
              {isQuotaCritical ? 'Storage almost full' : 'Storage running low'}
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
              You've used {quotaPercent}% of your {formatFileSize(stats.maxSize)} quota. Consider deleting files or upgrading your plan.
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-6 text-[10px] flex-shrink-0">Upgrade</Button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-2 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="hover-glow-effect overflow-hidden">
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-shadow">
                      <Icon className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-medium tracking-wider text-[var(--muted-foreground)]">{label}</p>
                      <p className="text-lg font-bold truncate mt-0.5">{value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Storage bar */}
      {loading ? (
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-5">
            <Skeleton className="h-2 w-24 mb-2" />
            <Skeleton className="h-1.5 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 hover-glow-effect overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1.5 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Storage</span>
                {isQuotaWarning && !isEmpty && (
                  <Badge variant={isQuotaCritical ? 'destructive' : 'warning'}>
                    {quotaPercent}% used
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {isEmpty ? '0 B' : formatFileSize(stats.totalSize)} / {formatFileSize(stats.maxSize)}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden relative z-10">
              <motion.div
                className={`h-full rounded-full ${
                  isQuotaCritical ? 'bg-[var(--destructive)]' : isQuotaWarning ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: isEmpty ? '0%' : `${quotaPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload */}
        <Card className="hover-glow-effect overflow-hidden">
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold flex items-center gap-1.5 mb-3 relative z-10">
              <Upload className="h-3.5 w-3.5 text-emerald-500" /> Upload Files
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              aria-hidden="true"
            />

            <div
              className={`
                border border-dashed rounded-[8px] p-6 text-center transition-colors duration-200 cursor-pointer relative z-10
                ${uploadError
                  ? 'border-[var(--destructive)] bg-[var(--destructive)]/5'
                  : dragOver
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                }
              `}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload files — drag and drop or click to browse"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-medium">{uploadProgress}%</p>
                  <div className="w-full max-w-[200px] h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
                    <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : uploadError ? (
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-[var(--destructive)]" />
                  <p className="text-[10px] text-[var(--destructive)] font-medium max-w-[220px]">{uploadError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setUploadError(''); }}
                    className="mt-1"
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-[var(--muted-foreground)] mx-auto mb-2 transition-colors" />
                  <p className="text-xs font-medium mb-0.5">Drag and drop, or click to browse</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">JPG, PNG, PDF, WEBP — Max 10 MB</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Files */}
        <Card className="hover-glow-effect overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h2 className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-500" /> Recent Files
              </h2>
              {!isEmpty && !loading && (
                <Link to="/files">
                  <Button variant="ghost" size="sm" className="gap-1 text-[10px] h-6">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>

            {loading ? (
              <ul className="space-y-2 relative z-10">
                {Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-2.5 py-1">
                    <Skeleton className="h-7 w-7 rounded-[6px] flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-2.5 w-3/4" />
                      <Skeleton className="h-2 w-1/3" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : isEmpty ? (
              <div className="flex flex-col items-center py-6 text-center relative z-10">
                <div className="h-10 w-10 rounded-[8px] bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center mb-3">
                  <Upload className="h-5 w-5 text-[var(--muted-foreground)]" />
                </div>
                <h3 className="text-xs font-semibold mb-1">No files yet</h3>
                <p className="text-[10px] text-[var(--muted-foreground)] mb-3 max-w-[200px]">
                  Upload your first file to get started with CloudVault
                </p>
                <Button size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3 w-3" /> Upload a file
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)] relative z-10" aria-label="Recent files">
                {recentFiles.slice(0, 5).map((file) => (
                  <li key={file.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0 group">
                    <div className="h-7 w-7 rounded-[6px] bg-[var(--secondary)] group-hover:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden transition-colors">
                      {file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt="" className="h-full w-full object-cover rounded-[6px]" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-[var(--muted-foreground)] group-hover:text-emerald-500 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-emerald-400 transition-colors">{file.originalName}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">
                        {formatFileSize(file.size)} · {formatDateRelative(file.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toast */}
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />

      {/* Session expired */}
      <SessionExpiredDialog open={sessionExpired} onClose={() => setSessionExpired(false)} />
    </div>
  );
}
