import { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Toast } from '../components/ui/toast';
import { Badge } from '../components/ui/badge';
import { currentUser, storageStats, formatFileSize } from '../data/mock';

export function Profile() {
  const [name, setName] = useState(currentUser.name);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast(true);
    }, 1000);
  };

  const storagePercent = Math.round((storageStats.totalSize / storageStats.maxSize) * 100);

  return (
    <div className="p-6 w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-sm font-semibold">Profile</h1>
        <p className="text-[var(--muted-foreground)] text-xs mt-0.5">Manage your account</p>
      </div>

      {/* Avatar + Info */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold">{currentUser.name}</h2>
                <Badge variant="success">Free tier</Badge>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">{currentUser.email}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Member since {new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-xs font-semibold mb-3 relative z-10">Personal Information</h2>
          <form onSubmit={handleSave} className="flex flex-col gap-3 relative z-10">
            <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" value={currentUser.email} disabled hint="Email cannot be changed" />
            <div className="flex items-center gap-2">
              <Button type="submit" loading={saving} size="sm">
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-xs font-semibold mb-3 relative z-10">Storage</h2>
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between text-[10px]">
              <span className="text-[var(--muted-foreground)]">Used</span>
              <span className="font-medium">{formatFileSize(storageStats.totalSize)} ({storagePercent}%)</span>
            </div>
            <div className="h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[var(--muted-foreground)]">Available</span>
              <span className="font-medium">{formatFileSize(storageStats.maxSize - storageStats.totalSize)}</span>
            </div>
            <div className="pt-2 border-t border-[var(--border)] flex justify-between text-[10px]">
              <span className="text-[var(--muted-foreground)]">Total files</span>
              <span className="font-medium">{storageStats.totalFiles}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[var(--muted-foreground)]">Plan</span>
              <Badge variant="success">Free — 5 GB</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xs font-semibold mb-1 relative z-10">Danger Zone</h2>
          <p className="text-[10px] text-[var(--muted-foreground)] mb-3 relative z-10">Permanently delete your account and all files</p>
          <Button variant="destructive" size="sm" className="relative z-10">Delete account</Button>
        </CardContent>
      </Card>

      {/* Toast */}
      <Toast
        open={toast}
        onClose={() => setToast(false)}
        title="Profile updated"
        description="Your display name has been saved."
        variant="success"
      />
    </div>
  );
}
