import { useState } from 'react';
import { Upload, FileText, HardDrive, Clock, Image, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { AnimatedBadge } from '../components/ui/animated-badge';
import { storageStats, recentFiles, formatFileSize, formatDateRelative } from '../data/mock';

export function Dashboard() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
          return 0;
        }
        return p + 10;
      });
    }, 200);
  };

  const stats = [
    { label: 'Total Files', value: storageStats.totalFiles.toString(), icon: FileText },
    { label: 'Storage Used', value: formatFileSize(storageStats.totalSize), icon: HardDrive },
    { label: 'Last Upload', value: formatDateRelative(storageStats.lastUploadAt), icon: Clock },
    { label: 'Quota', value: `${Math.round((storageStats.totalSize / storageStats.maxSize) * 100)}%`, icon: HardDrive },
  ];

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[var(--muted-foreground)] text-xs mt-1 text-emerald-500/80">Manage your files and monitor storage</p>
        </div>
        <AnimatedBadge text="CloudVault Beta v2.0" color="#10b981" href="/profile" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="hover-glow-effect overflow-hidden">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-shadow">
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
      <Card className="mb-8 hover-glow-effect overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-1.5 relative z-10">
            <span className="text-xs font-medium">Storage</span>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {formatFileSize(storageStats.totalSize)} / {formatFileSize(storageStats.maxSize)}
            </span>
          </div>
          <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden relative z-10">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(storageStats.totalSize / storageStats.maxSize) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload */}
        <Card className="hover-glow-effect overflow-hidden">
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold flex items-center gap-1.5 mb-3 relative z-10">
              <Upload className="h-3.5 w-3.5 text-emerald-500" /> Upload Files
            </h2>
            <div
              className={`
                border border-dashed rounded-[8px] p-6 text-center transition-colors duration-200 cursor-pointer relative z-10
                ${dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'}
              `}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(); }}
              onClick={handleUpload}
              role="button"
              tabIndex={0}
              aria-label="Upload files"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-medium">{uploadProgress}%</p>
                  <div className="w-full max-w-[200px] h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
                    <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-[var(--muted-foreground)] mx-auto mb-2 group-hover:text-emerald-500 transition-colors" />
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
            <h2 className="text-xs font-semibold flex items-center gap-1.5 mb-3 relative z-10">
              <Clock className="h-3.5 w-3.5 text-emerald-500" /> Recent Files
            </h2>
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
          </CardContent>
        </Card>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-[var(--card)] border border-[var(--border)] rounded-[8px] shadow-lg p-3 flex items-center gap-2.5 z-50"
            role="status"
            aria-live="polite"
          >
            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Image className="h-3 w-3 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-medium">File uploaded</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">Generating thumbnail...</p>
            </div>
            <button onClick={() => setShowToast(false)} className="ml-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer" aria-label="Dismiss">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
