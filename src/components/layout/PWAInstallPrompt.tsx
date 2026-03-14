'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Déjà installée → ne pas afficher
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Bandeau déjà fermé (persisté en localStorage) → ne pas afficher
    if (localStorage.getItem(DISMISSED_KEY) === '1') {
      setDismissed(true);
      return;
    }

    // iOS Safari : détection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    setIsIOS(ios);

    // Chrome/Android : événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1');
      setInstallPrompt(null);
    }
  }

  // Déjà installée ou bandeau fermé → rien
  if (isStandalone || dismissed) return null;

  // iOS : instructions manuelles
  if (isIOS) {
    return (
      <div className="fixed bottom-14 inset-x-0 z-50 px-3 pb-2 pointer-events-none">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-start gap-3 pointer-events-auto shadow-xl">
          <span className="text-lg shrink-0">⬆️</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium">Installer PêcheBoard</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Appuyez sur <strong>Partager</strong> puis <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white shrink-0"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Chrome/Android : bouton d'installation natif
  if (!installPrompt) return null;

  return (
    <div className="fixed bottom-14 inset-x-0 z-50 px-3 pb-2 pointer-events-none">
      <div className="bg-slate-800 border border-cyan-400/30 rounded-xl p-3 flex items-center gap-3 pointer-events-auto shadow-xl">
        <span className="text-lg shrink-0">🎣</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium">Installer PêcheBoard</p>
          <p className="text-slate-400 text-xs mt-0.5">Accès rapide depuis votre écran d&apos;accueil</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 bg-cyan-400 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-full"
        >
          Installer
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white shrink-0"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
