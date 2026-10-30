import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button, Card, ErrorNote, Input, Label, PageHeader } from '@/components/ui';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error);
    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Set a new password" />
      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <Label label="New password">
            <Input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Label>
          <ErrorNote error={error} />
          <Button type="submit" className="w-full" loading={busy}>
            Save password
          </Button>
        </form>
      </Card>
    </div>
  );
}
