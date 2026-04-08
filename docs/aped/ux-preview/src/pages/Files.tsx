import { useState } from 'react';
import { Grid, List, Trash2, ChevronLeft, ChevronRight, FileText, Search, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { allFiles, formatFileSize, formatDate, type FileItem } from '../data/mock';

const PAGE_SIZE = 20;

export function Files() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [files, setFiles] = useState(allFiles);

  const filtered = files.filter((f) => f.originalName.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageFiles = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setFiles((f) => f.filter((file) => file.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-sm font-semibold">Files</h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">{filtered.length} files · Page {page}/{totalPages}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-7 pl-7 pr-2.5 rounded-[8px] border border-[var(--border)] bg-transparent text-xs w-40 focus:outline-1 focus:outline-[var(--ring)]"
              aria-label="Search files"
            />
          </div>
          <div className="flex border border-[var(--border)] rounded-[8px] overflow-hidden">
            <Button variant={view === 'grid' ? 'primary' : 'ghost'} size="icon" onClick={() => setView('grid')} aria-label="Grid view" className="rounded-none h-7 w-7">
              <Grid className="h-3 w-3" />
            </Button>
            <Button variant={view === 'list' ? 'primary' : 'ghost'} size="icon" onClick={() => setView('list')} aria-label="List view" className="rounded-none h-7 w-7">
              <List className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {pageFiles.length === 0 ? (
        <Card>
          <CardContent className="p-10 flex flex-col items-center text-center">
            <FolderOpen className="h-8 w-8 text-[var(--muted-foreground)] mb-3 relative z-10" />
            <h2 className="text-xs font-semibold mb-1 relative z-10">No files found</h2>
            <p className="text-[10px] text-[var(--muted-foreground)] mb-3 relative z-10">
              {search ? `No files match "${search}"` : 'Upload your first file to get started'}
            </p>
            <Button size="sm" className="relative z-10">{search ? 'Clear search' : 'Upload a file'}</Button>
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-5">
          {pageFiles.map((file) => (
            <motion.div key={file.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="group">
              <Card className="hover-glow-effect overflow-hidden hover:border-emerald-500/50 transition-colors">
                <div className="aspect-square bg-[var(--secondary)] flex items-center justify-center relative overflow-hidden group-hover:bg-emerald-500/5 transition-colors z-10">
                  {file.thumbnailUrl ? (
                    <img src={file.thumbnailUrl} alt={file.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-6 w-6 text-[var(--muted-foreground)] group-hover:text-emerald-500 transition-colors" />
                  )}
                  <button
                    onClick={() => setDeleteTarget(file)}
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
                <tr key={file.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)] transition-colors group">
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
                  <td className="p-2.5 text-[10px] text-[var(--muted-foreground)] hidden sm:table-cell">{file.mimeType.split('/')[1].toUpperCase()}</td>
                  <td className="p-2.5 text-[10px] text-[var(--muted-foreground)]">{formatFileSize(file.size)}</td>
                  <td className="p-2.5 text-[10px] text-[var(--muted-foreground)] hidden sm:table-cell">{formatDate(file.createdAt)}</td>
                  <td className="p-2.5 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(file)} aria-label={`Delete ${file.originalName}`} className="h-6 w-6 hover:bg-red-500/10 hover:text-red-500">
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
        <div className="flex items-center justify-center gap-1">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous" className="h-7 w-7 p-0">
            <ChevronLeft className="h-3 w-3" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button key={i + 1} variant={page === i + 1 ? 'primary' : 'outline'} size="sm" onClick={() => setPage(i + 1)} aria-label={`Page ${i + 1}`} className="h-7 w-7 p-0">
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next" className="h-7 w-7 p-0">
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative bg-[var(--card)] rounded-[8px] border border-[var(--border)] shadow-xl p-5 max-w-xs w-full"
              role="alertdialog"
            >
              <h2 className="text-xs font-semibold mb-1.5">Delete file?</h2>
              <p className="text-[10px] text-[var(--muted-foreground)] mb-4">
                <strong>{deleteTarget.originalName}</strong> will be permanently deleted.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
