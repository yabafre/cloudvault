import { useState, useRef, useEffect } from 'react';
import { Grid, List, Trash2, ChevronLeft, ChevronRight, FileText, Search, FolderOpen, Upload, Download, Calendar, HardDrive, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { allFiles, formatFileSize, formatDate, type FileItem } from '../data/mock';

const PAGE_SIZE = 20;

export function Files() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<FileItem | null>(null);
  const [files, setFiles] = useState(allFiles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const filtered = files.filter((f) => f.originalName.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageFiles = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setFiles((f) => f.filter((file) => file.id !== deleteTarget.id));
    setDeleteTarget(null);
    if (detailTarget?.id === deleteTarget.id) setDetailTarget(null);
  };

  const getMimeLabel = (mime: string) => {
    const map: Record<string, string> = { 'image/png': 'PNG', 'image/jpeg': 'JPEG', 'image/webp': 'WEBP', 'application/pdf': 'PDF' };
    return map[mime] || mime.split('/')[1]?.toUpperCase() || 'FILE';
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" aria-hidden="true" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-sm font-semibold">Files</h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">{filtered.length} files · Page {page}/{totalPages || 1}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder="Search files..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 pl-7 pr-2.5 rounded-[8px] border border-[var(--border)] bg-transparent text-xs w-full sm:w-44 focus:outline-1 focus:outline-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
              aria-label="Search files"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3 w-3" /> Upload
          </Button>
          <div className="flex border border-[var(--border)] rounded-[8px] overflow-hidden">
            <Button variant={view === 'grid' ? 'primary' : 'ghost'} size="icon" onClick={() => setView('grid')} aria-label="Grid view" className="rounded-none h-8 w-8">
              <Grid className="h-3.5 w-3.5" />
            </Button>
            <Button variant={view === 'list' ? 'primary' : 'ghost'} size="icon" onClick={() => setView('list')} aria-label="List view" className="rounded-none h-8 w-8">
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square rounded-none" />
                <div className="p-2 space-y-1">
                  <Skeleton className="h-2 w-3/4" />
                  <Skeleton className="h-1.5 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-5 overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5">
                  <Skeleton className="h-6 w-6 rounded-[4px] flex-shrink-0" />
                  <Skeleton className="h-2.5 flex-1 max-w-[180px]" />
                  <Skeleton className="h-2 w-10" />
                  <Skeleton className="h-2 w-12" />
                  <Skeleton className="h-2 w-16" />
                </div>
              ))}
            </div>
          </Card>
        )
      ) : pageFiles.length === 0 ? (
        <Card>
          <CardContent className="p-10 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-[8px] bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center mb-3 relative z-10">
              <FolderOpen className="h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
            <h2 className="text-xs font-semibold mb-1 relative z-10">No files found</h2>
            <p className="text-[10px] text-[var(--muted-foreground)] mb-3 relative z-10">
              {search ? `No files match "${search}"` : 'Upload your first file to get started'}
            </p>
            <Button
              size="sm"
              className="relative z-10 gap-1.5"
              onClick={() => { if (search) setSearch(''); else fileInputRef.current?.click(); }}
            >
              {search ? 'Clear search' : <><Upload className="h-3 w-3" /> Upload a file</>}
            </Button>
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-5">
          {pageFiles.map((file) => (
            <motion.div key={file.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="group">
              <Card className="hover-glow-effect overflow-hidden hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={() => setDetailTarget(file)}>
                <div className="aspect-square bg-[var(--secondary)] flex items-center justify-center relative overflow-hidden group-hover:bg-emerald-500/5 transition-colors z-10">
                  {file.thumbnailUrl ? (
                    <img src={file.thumbnailUrl} alt={file.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-6 w-6 text-[var(--muted-foreground)] group-hover:text-emerald-500 transition-colors" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(file); }}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-[6px] bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-red-500"
                    aria-label={`Delete ${file.originalName}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-2 relative z-10">
                  <p className="text-[10px] font-medium truncate group-hover:text-emerald-400 transition-colors">{file.originalName}</p>
                  <p className="text-[9px] text-[var(--muted-foreground)]">{formatFileSize(file.size)} · {formatDate(file.createdAt)}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="mb-5 overflow-x-auto">
          <table className="w-full relative z-10" role="table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left text-[10px] font-medium text-[var(--muted-foreground)] p-2.5">Name</th>
                <th className="text-left text-[10px] font-medium text-[var(--muted-foreground)] p-2.5 hidden sm:table-cell">Type</th>
                <th className="text-left text-[10px] font-medium text-[var(--muted-foreground)] p-2.5">Size</th>
                <th className="text-left text-[10px] font-medium text-[var(--muted-foreground)] p-2.5 hidden sm:table-cell">Date</th>
                <th className="text-right text-[10px] font-medium text-[var(--muted-foreground)] p-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {pageFiles.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors group cursor-pointer"
                  onClick={() => setDetailTarget(file)}
                >
                  <td className="p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-[4px] bg-[var(--card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-emerald-500/30 transition-colors">
                        {file.thumbnailUrl ? (
                          <img src={file.thumbnailUrl} alt="" className="h-full w-full object-cover rounded-[4px]" />
                        ) : (
                          <FileText className="h-3 w-3 text-[var(--muted-foreground)] group-hover:text-emerald-500 transition-colors" />
                        )}
                      </div>
                      <span className="text-xs font-medium truncate max-w-[180px] group-hover:text-emerald-400 transition-colors">{file.originalName}</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-[10px] text-[var(--muted-foreground)] hidden sm:table-cell">{getMimeLabel(file.mimeType)}</td>
                  <td className="p-2.5 text-[10px] text-[var(--muted-foreground)]">{formatFileSize(file.size)}</td>
                  <td className="p-2.5 text-[10px] text-[var(--muted-foreground)] hidden sm:table-cell">{formatDate(file.createdAt)}</td>
                  <td className="p-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(file); }}
                      aria-label={`Delete ${file.originalName}`}
                      className="h-6 w-6 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3 text-[var(--destructive)]" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button key={i + 1} variant={page === i + 1 ? 'primary' : 'outline'} size="icon" onClick={() => setPage(i + 1)} aria-label={`Page ${i + 1}`} className="h-8 w-8 text-xs">
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File Detail Dialog */}
      <Dialog open={!!detailTarget} onClose={() => setDetailTarget(null)}>
        {detailTarget && (
          <>
            <DialogHeader>
              <DialogTitle>{detailTarget.originalName}</DialogTitle>
              <DialogDescription>File details and metadata</DialogDescription>
            </DialogHeader>

            {/* Preview */}
            <div className="rounded-[8px] bg-[var(--secondary)] border border-[var(--border)] overflow-hidden mb-4 aspect-video flex items-center justify-center">
              {detailTarget.thumbnailUrl ? (
                <img src={detailTarget.thumbnailUrl} alt={detailTarget.originalName} className="h-full w-full object-contain" />
              ) : (
                <FileText className="h-10 w-10 text-[var(--muted-foreground)]" />
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <Tag className="h-3 w-3 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">Type</span>
                <Badge variant="secondary" className="ml-auto">{getMimeLabel(detailTarget.mimeType)}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <HardDrive className="h-3 w-3 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">Size</span>
                <span className="ml-auto font-medium">{formatFileSize(detailTarget.size)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">Uploaded</span>
                <span className="ml-auto font-medium">{formatDate(detailTarget.createdAt)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3 w-3" /> Download
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => { setDeleteTarget(detailTarget); setDetailTarget(null); }}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="max-w-xs">
        {deleteTarget && (
          <>
            <DialogHeader>
              <DialogTitle>Delete file?</DialogTitle>
              <DialogDescription>
                <strong>{deleteTarget.originalName}</strong> will be permanently deleted from CloudVault.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
