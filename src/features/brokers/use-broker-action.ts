'use client';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/i18n';
import { ApiError } from '@/lib/api/errors';
export function useBrokerAction() {
  const { tx } = useLocale();
  const client = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function run(
    action: () => Promise<unknown>,
    message?: string,
  ): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(
        message ??
          tx(
            'Operación confirmada por el servidor.',
            'Operation confirmed by the server.',
          ),
      );
      await client.invalidateQueries({ queryKey: ['brokers'] });
      return true;
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `${e.message}${e.metadata.status === 409 ? tx(' Actualiza la vista antes de reintentar.', ' Refresh before retrying.') : ''}`
          : tx(
              'No se pudo completar la operación. Comprueba los datos y reintenta.',
              'Could not complete the operation. Check the data and retry.',
            ),
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, notice, run };
}
