import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';

interface SessionExpiredDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SessionExpiredDialog({ open, onClose }: SessionExpiredDialogProps) {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onClose();
    navigate('/auth/login');
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <DialogHeader>
        <div className="h-10 w-10 rounded-[8px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
          <Clock className="h-5 w-5 text-amber-500" />
        </div>
        <DialogTitle>Your session has expired</DialogTitle>
        <DialogDescription>
          For your security, we've signed you out after a period of inactivity. Please sign in again to continue.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button size="sm" onClick={handleSignIn}>
          Sign in again
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
