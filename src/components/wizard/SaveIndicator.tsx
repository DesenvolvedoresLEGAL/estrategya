import { Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaveIndicatorProps {
  lastSavedAt: Date | null;
  isSaving?: boolean;
}

export const SaveIndicator = ({ lastSavedAt, isSaving }: SaveIndicatorProps) => {
  if (!lastSavedAt) return null;

  const timeAgo = formatDistanceToNow(lastSavedAt, { 
    addSuffix: true,
    locale: ptBR 
  });

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary">
      <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-medium">
        {isSaving ? 'Salvando...' : `Salvo ${timeAgo}`}
      </span>
    </div>
  );
};
