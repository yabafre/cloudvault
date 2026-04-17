export interface StorageStats {
  fileCount: number;
  bytesUsed: number;
  bytesTotal: number;
  lastUploadAt: string | null;
}

export interface RecentFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  thumbnailUrl: string | null;
}
