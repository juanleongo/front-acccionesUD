'use client';

import type { FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { countries } from '@/features/registration';
import { formatPersonName } from '@/lib/format-person-name';
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
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Crear administrador</h1>
        <p>
          Registra una cuenta con acceso a las herramientas de administración.
        </p>
      </div>

      <div className={`${styles.tableCard} ${styles.cardNarrow}`}>
        <form onSubmit={onSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="admin-first_names">Nombres Completos</label>
              <input
                type="text"
                id="admin-first_names"
                value={newAdmin.first_names}
                placeholder="Ej. Juan Andrés"
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
              <label htmlFor="admin-last_names">Apellidos Completos</label>
              <input
                type="text"
                id="admin-last_names"
                value={newAdmin.last_names}
                placeholder="Ej. Gómez Silva"
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
                Correo Electrónico Institucional
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
              <label htmlFor="admin-phone">Teléfono con Indicativo</label>
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
              <label htmlFor="admin-country">País</label>
              <select
                id="admin-country"
                value={newAdmin.country}
                onChange={(e) =>
                  onChangeNewAdmin({ ...newAdmin, country: e.target.value })
                }
                required
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              <small>Selecciona el país de residencia.</small>
            </div>

            <div className={styles.formField}>
              <label htmlFor="admin-password">
                Contraseña (Mínimo 8 caracteres)
              </label>
              <input
                type="password"
                id="admin-password"
                value={newAdmin.password}
                placeholder="Contraseña segura"
                onChange={(e) =>
                  onChangeNewAdmin({ ...newAdmin, password: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary}>
              <Icon name="lock" size={14} /> Registrar Administrador Delegado
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onResetForm}
            >
              Limpiar Formulario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
