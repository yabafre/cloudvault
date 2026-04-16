export type FileStatus = 'PENDING' | 'READY' | 'FAILED';

export interface FileMetadata {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  thumbnailKey: string | null;
  status: FileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UploadIntent {
  fileId: string;
  url: string;
  fields: Record<string, string>;
}

export interface PresignedPost {
  url: string;
  fields: Record<string, string>;
}

export interface ThumbnailInfo {
  thumbnailKey: string;
  thumbnailUrl: string;
}
