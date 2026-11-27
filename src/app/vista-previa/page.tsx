import type { Metadata } from 'next';
import { DesignPreview } from '@/features/account-workspace/client';

export const metadata: Metadata = {
  title: 'Vista previa | Acciones UD',
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  return <DesignPreview />;
}
