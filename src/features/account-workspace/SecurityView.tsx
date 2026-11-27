'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/lib/i18n';
import type { CommandHandler, SessionSummary, WorkspaceCommand } from './types';
import {
  Badge,
  EmptyState,
  Panel,
  Timestamp,
  WorkspaceDialog,
} from './WorkspaceUi';
import styles from './workspace.module.css';

export function SecurityView({
  sessions,
  onCommand,
}: {
  sessions: readonly SessionSummary[];
  onCommand: CommandHandler;
}) {
  const { tx } = useLocale();
  const [confirm, setConfirm] = useState<WorkspaceCommand | null>(null);
  const [consent, setConsent] = useState(false);
  const open = (value: WorkspaceCommand) => {
    setConsent(false);
    setConfirm(value);
  };
  const recovery = confirm?.type === 'recovery.regenerate';
  return (
    <div className={styles.columns}>
      <Panel
        title={tx('Dispositivos y sesiones', 'Devices and sessions')}
        hint={tx(
          'Comprueba dónde has iniciado sesión. Si no reconoces un acceso, puedes cerrarlo.',
          'Review where you are signed in. Close any session you do not recognize.',
        )}
        action={
          <button
            type="button"
            className={styles.button}
            disabled={!sessions.some((s) => !s.current)}
            onClick={() => open({ type: 'session.revokeOthers' })}
          >
            {tx('Cerrar las otras sesiones', 'Close other sessions')}
          </button>
        }
      >
        {sessions.length ? (
          sessions.map((session) => (
            <article key={session.id} className={styles.row}>
              <div className={styles.identity}>
                <span className={styles.iconTile}>
                  <Icon name="devices" />
                </span>
                <div>
                  <strong>{session.agent}</strong>
                  <small>IP: {session.ip}</small>
                  <small>
                    {tx('Inicio', 'Started')}:{' '}
                    <Timestamp value={session.createdAt} />
                  </small>
                  <small>
                    {tx('Último uso', 'Last used')}:{' '}
                    <Timestamp value={session.lastUsedAt} />
                  </small>
                </div>
              </div>
              {session.current ? (
                <Badge tone="success">
                  {tx('Esta sesión', 'This session')}
                </Badge>
              ) : (
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() =>
                    open({ type: 'session.revoke', id: session.id })
                  }
                >
                  {tx('Cerrar sesión', 'Close session')}
                </button>
              )}
            </article>
          ))
        ) : (
          <EmptyState
            title={tx('Sin sesiones disponibles', 'No sessions available')}
            detail={tx(
              'Actualiza la consulta para revisar tus accesos.',
              'Refresh the request to review your sessions.',
            )}
            icon="devices"
          />
        )}
      </Panel>
      <Panel
        title={tx(
          'Recupera el acceso a tu cuenta',
          'Recover access to your account',
        )}
        hint={tx(
          'Los códigos de recuperación permiten entrar si pierdes el acceso a tu autenticador.',
          'Recovery codes let you sign in if you lose access to your authenticator.',
        )}
      >
        <div className={styles.stack}>
          <span className={styles.iconTile}>
            <Icon name="shield" size={26} />
          </span>
          <p className={styles.muted}>
            {tx(
              'Generar nuevos códigos invalida los anteriores. Guarda el nuevo conjunto en un lugar seguro antes de salir.',
              'Generating new codes invalidates the old ones. Save the new set somewhere safe before leaving.',
            )}
          </p>
          <button
            type="button"
            className={styles.button}
            onClick={() => open({ type: 'recovery.regenerate' })}
          >
            {tx('Generar nuevos códigos', 'Generate new codes')}
          </button>
        </div>
      </Panel>
      {confirm && (
        <WorkspaceDialog
          title={
            recovery
              ? tx('Renovar códigos de recuperación', 'Replace recovery codes')
              : tx('Confirmar cierre de sesión', 'Confirm session closure')
          }
          hint={
            recovery
              ? tx(
                  'Los códigos que guardaste antes dejarán de funcionar.',
                  'Previously saved codes will stop working.',
                )
              : tx(
                  'El dispositivo afectado tendrá que iniciar sesión de nuevo.',
                  'The affected device will need to sign in again.',
                )
          }
          onClose={() => setConfirm(null)}
        >
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (consent) {
                onCommand(confirm);
                setConfirm(null);
              }
            }}
          >
            <label className={styles.channel}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              {tx(
                'He leído y entiendo este cambio.',
                'I have read and understand this change.',
              )}
            </label>
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.dangerButton}
                disabled={!consent}
              >
                {recovery
                  ? tx('Generar códigos', 'Generate codes')
                  : tx('Confirmar cierre', 'Confirm closure')}
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => setConfirm(null)}
              >
                {tx('Cancelar', 'Cancel')}
              </button>
            </div>
          </form>
        </WorkspaceDialog>
      )}
    </div>
  );
}
