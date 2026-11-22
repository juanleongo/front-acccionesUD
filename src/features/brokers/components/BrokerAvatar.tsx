'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useLocale } from '@/lib/i18n';
import { getInitials, resolveBrokerAvatar } from '../broker-labels';
import styles from '../brokers.module.css';

export function BrokerAvatar({
  brokerId,
  name,
  avatarUrl,
  size = 52,
  verified = false,
}: {
  brokerId: string;
  name: string;
  avatarUrl?: string | undefined;
  size?: number;
  verified?: boolean;
}) {
  const { tx } = useLocale();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = resolveBrokerAvatar(brokerId, avatarUrl);
  const showImage = Boolean(resolvedSrc) && failedSrc !== resolvedSrc;
  const fontSize = Math.max(12, Math.round(size * 0.34));

  return (
    <div
      className={styles.brokerAvatarWrap}
      style={{ width: size, height: size }}
    >
      <div
        className={styles.brokerAvatar}
        style={{ width: size, height: size, fontSize }}
      >
        {showImage && resolvedSrc ? (
          <Image
            src={resolvedSrc}
            alt={tx(`Foto ${name}`, `${name} photo`)}
            width={size}
            height={size}
            className={styles.brokerAvatarImg}
            onError={() => setFailedSrc(resolvedSrc)}
          />
        ) : (
          <span className={styles.brokerAvatarInitials} aria-hidden="true">
            {getInitials(name)}
          </span>
        )}
      </div>
      {verified && (
        <span className={styles.brokerVerifiedDot} aria-hidden="true" />
      )}
    </div>
  );
}
