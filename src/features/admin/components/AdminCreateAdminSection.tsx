'use client';

import type { FormEvent } from 'react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Icon } from '@/components/ui/Icon';
import { countries } from '@/features/registration';
import { formatPersonName } from '@/lib/format-person-name';
import { useLocale } from '@/lib/i18n';
import type { AdminCreateAdminIn } from '../admin-api';
import styles from '../admin.module.css';

export interface AdminCreateAdminSectionProps {
  newAdmin: AdminCreateAdminIn;
  onChangeNewAdmin: (next: AdminCreateAdminIn) => void;
  onResetForm: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function AdminCreateAdminSection({
  newAdmin,
  onChangeNewAdmin,
  onResetForm,
  onSubmit,
}: AdminCreateAdminSectionProps) {
  const { tx } = useLocale();
  return (
    <div>
      <div className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          {tx('Gestión de Privilegios', 'Privilege Management')}
        </span>
        <h1>{tx('Crear administrador', 'Create Administrator')}</h1>
        <p>
          {tx(
            'Registra una cuenta con acceso a las herramientas de administración.',
            'Register an account with access to administration tools.',
          )}
        </p>
      </div>

      <div className={`${styles.tableCard} ${styles.cardNarrow}`}>
        <div className={styles.tableHeader}>
          <h2>
            {tx(
              'Datos de la Nueva Cuenta Administrativa',
              'New Administrative Account Details',
            )}
          </h2>
          <span className={styles.headerMeta}>
            {tx('Acceso inmediato RBAC', 'Immediate RBAC access')}
          </span>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="admin-first_names">
                {tx('Nombres Completos', 'First Name(s)')}
              </label>
              <input
                type="text"
                id="admin-first_names"
                value={newAdmin.first_names}
                placeholder={tx('Ej. Juan Andrés', 'E.g. John')}
                onBlur={() =>
                  onChangeNewAdmin({
                    ...newAdmin,
                    first_names: formatPersonName(newAdmin.first_names),
                  })
                }
                onChange={(e) =>
                  onChangeNewAdmin({
                    ...newAdmin,
                    first_names: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-last_names">
                {tx('Apellidos Completos', 'Last Name(s)')}
              </label>
              <input
                type="text"
                id="admin-last_names"
                value={newAdmin.last_names}
                placeholder={tx('Ej. Gómez Silva', 'E.g. Smith')}
                onBlur={() =>
                  onChangeNewAdmin({
                    ...newAdmin,
                    last_names: formatPersonName(newAdmin.last_names),
                  })
                }
                onChange={(e) =>
                  onChangeNewAdmin({
                    ...newAdmin,
                    last_names: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-email">
                {tx(
                  'Correo Electrónico Institucional',
                  'Institutional Email Address',
                )}
              </label>
              <input
                type="email"
                id="admin-email"
                value={newAdmin.email}
                placeholder="admin.nuevo@accionesud.edu.co"
                onChange={(e) =>
                  onChangeNewAdmin({ ...newAdmin, email: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-phone">
                {tx('Teléfono con Indicativo', 'Phone with Country Code')}
              </label>
              <input
                type="tel"
                id="admin-phone"
                value={newAdmin.phone}
                placeholder="+573001234567"
                onChange={(e) =>
                  onChangeNewAdmin({ ...newAdmin, phone: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-country">{tx('País', 'Country')}</label>
              <CustomSelect
                id="admin-country"
                required
                searchable
                searchPlaceholder={tx('Buscar país…', 'Search country…')}
                value={newAdmin.country}
                onChange={(val) =>
                  onChangeNewAdmin({ ...newAdmin, country: val })
                }
                options={countries.map((country) => ({
                  value: country.code,
                  label: country.name,
                }))}
              />
              <small>
                {tx(
                  'Selecciona el país de residencia.',
                  'Select the country of residence.',
                )}
              </small>
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-password">
                {tx(
                  'Contraseña (Mínimo 8 caracteres)',
                  'Password (Minimum 8 characters)',
                )}
              </label>
              <input
                type="password"
                id="admin-password"
                value={newAdmin.password}
                placeholder={tx('Contraseña segura', 'Strong password')}
                onChange={(e) =>
                  onChangeNewAdmin({ ...newAdmin, password: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>
              <Icon name="lock" size={14} />{' '}
              {tx(
                'Registrar Administrador Delegado',
                'Register Delegated Administrator',
              )}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onResetForm}
            >
              {tx('Limpiar Formulario', 'Reset Form')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
