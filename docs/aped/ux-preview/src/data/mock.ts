export const currentUser = {
  id: 'usr_1a2b3c4d',
  name: 'Alex Martin',
  email: 'alex.martin@example.com',
  avatar: null,
  createdAt: '2026-01-15T10:30:00Z',
};

export const storageStats = {
  totalFiles: 47,
  totalSize: 156_400_000, // ~149 MB
  maxSize: 5_368_709_120, // 5 GB (free tier)
  lastUploadAt: '2026-03-19T14:22:00Z',
};

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  thumbnailUrl: string | null;
  createdAt: string;
}

export const recentFiles: FileItem[] = [
  {
    id: 'file_001',
    name: 'project-mockup-v3.png',
    originalName: 'project-mockup-v3.png',
    mimeType: 'image/png',
    size: 2_450_000,
    thumbnailUrl: 'https://placehold.co/200x200/059669/ffffff?text=Mockup',
    createdAt: '2026-03-19T14:22:00Z',
  },
  {
    id: 'file_002',
    name: 'contract-freelance-2026.pdf',
    originalName: 'contract-freelance-2026.pdf',
    mimeType: 'application/pdf',
    size: 890_000,
    thumbnailUrl: null,
    createdAt: '2026-03-18T09:15:00Z',
  },
  {
    id: 'file_003',
    name: 'team-photo-offsite.jpg',
    originalName: 'team-photo-offsite.jpg',
    mimeType: 'image/jpeg',
    size: 4_200_000,
    thumbnailUrl: 'https://placehold.co/200x200/059669/ffffff?text=Photo',
    createdAt: '2026-03-17T16:45:00Z',
  },
  {
    id: 'file_004',
    name: 'logo-cloudvault-final.png',
    originalName: 'logo-cloudvault-final.png',
    mimeType: 'image/png',
    size: 340_000,
    thumbnailUrl: 'https://placehold.co/200x200/059669/ffffff?text=Logo',
    createdAt: '2026-03-16T11:30:00Z',
  },
  {
    id: 'file_005',
    name: 'invoice-march-2026.pdf',
    originalName: 'invoice-march-2026.pdf',
    mimeType: 'application/pdf',
    size: 156_000,
    thumbnailUrl: null,
    createdAt: '2026-03-15T08:00:00Z',
  },
  {
    id: 'file_006',
    name: 'product-screenshot-dashboard.webp',
    originalName: 'product-screenshot-dashboard.webp',
    mimeType: 'image/webp',
    size: 1_800_000,
    thumbnailUrl: 'https://placehold.co/200x200/059669/ffffff?text=Screenshot',
    createdAt: '2026-03-14T13:20:00Z',
  },
  {
    id: 'file_007',
    name: 'brand-guidelines.pdf',
    originalName: 'brand-guidelines.pdf',
    mimeType: 'application/pdf',
    size: 5_600_000,
    thumbnailUrl: null,
    createdAt: '2026-03-13T10:00:00Z',
  },
  {
    id: 'file_008',
    name: 'hero-banner-desktop.png',
    originalName: 'hero-banner-desktop.png',
    mimeType: 'image/png',
    size: 3_100_000,
    thumbnailUrl: 'https://placehold.co/200x200/059669/ffffff?text=Banner',
    createdAt: '2026-03-12T15:40:00Z',
  },
];

export const allFiles: FileItem[] = [
  ...recentFiles,
  ...Array.from({ length: 39 }, (_, i) => ({
    id: `file_${String(i + 9).padStart(3, '0')}`,
    name: `document-${i + 9}.${i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'png' : 'jpg'}`,
    originalName: `document-${i + 9}.${i % 3 === 0 ? 'pdf' : i % 3 === 1 ? 'png' : 'jpg'}`,
    mimeType: i % 3 === 0 ? 'application/pdf' : i % 3 === 1 ? 'image/png' : 'image/jpeg',
    size: Math.floor(Math.random() * 8_000_000) + 100_000,
    thumbnailUrl: i % 3 !== 0 ? `https://placehold.co/200x200/059669/ffffff?text=File+${i + 9}` : null,
    createdAt: new Date(2026, 2, 12 - Math.floor(i / 3), 10, 0).toISOString(),
  })),
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
