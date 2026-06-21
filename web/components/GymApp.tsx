'use client';

import { useEffect } from 'react';
import { MARKUP } from './markup';
import { initGymApp } from '../lib/gym-ui';

// Renderiza el markup portado del diseño original y arranca la lógica de UI
// (la lógica opera por getElementById, igual que en la versión Apps Script).
export default function GymApp() {
  useEffect(() => {
    initGymApp();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: MARKUP }} suppressHydrationWarning />;
}
