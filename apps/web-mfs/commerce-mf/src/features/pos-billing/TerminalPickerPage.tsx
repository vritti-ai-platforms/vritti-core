import { Alert } from '@vritti/quantum-ui/Alert';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Monitor } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosTerminalsTable } from '@/hooks/pos-terminals/usePosTerminalsTable';
import { getErrorMessage } from '@/utils/error';
import { TerminalCard } from './components/TerminalCard';

const GRID_STYLE = { gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' };

export const TerminalPickerPage = () => {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = usePosTerminalsTable();
  const terminals = response?.result ?? [];

  // Auto-skip the picker when a single terminal exists
  useEffect(() => {
    if (!isLoading && terminals.length === 1) {
      const t = terminals[0];
      navigate(buildSlug(t.name, t.id), { replace: true });
    }
  }, [isLoading, terminals, navigate]);

  if (isLoading) return <CenteredStatus message="Loading registers..." />;
  if (error) return <Alert variant="destructive" title="Failed to load" description={getErrorMessage(error)} />;
  if (terminals.length === 1) return <CenteredStatus message="Opening register..." />;

  if (terminals.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Billing" description="Choose a register to start a sale" />
        <Empty
          icon={<Monitor />}
          title="No registers configured"
          description="Create a POS terminal to start billing."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Billing" description="Choose a register to start a sale" />
      <div className="grid gap-4" style={GRID_STYLE}>
        {terminals.map((t) => (
          <TerminalCard key={t.id} terminal={t} onClick={() => navigate(buildSlug(t.name, t.id))} />
        ))}
      </div>
    </div>
  );
};

const CenteredStatus: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-20">
    <Spinner className="size-8 text-primary" />
    <Typography variant="body2" intent="muted">
      {message}
    </Typography>
  </div>
);
