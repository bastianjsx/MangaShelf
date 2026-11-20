import { useState, useEffect } from 'react';
import {
  getAniListClientId,
  initiateAniListLogin,
  setAniListToken,
} from '../../services/anilistAuth';

interface AniListLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectTokenSubmit?: (token: string) => void;
}

export function AniListLoginModal({
  isOpen,
  onClose,
  onDirectTokenSubmit,
}: AniListLoginModalProps) {
  const [clientId, setClientId] = useState(getAniListClientId);
  const [tokenInput, setTokenInput] = useState('');
  const [activeTab, setActiveTab] = useState<'oauth' | 'token'>('oauth');
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const redirectUri = window.location.origin;

  const handleCopyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 2000);
    } catch {
    }
  };

  const handleOAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = clientId.trim();
    if (!cleanId) {
      setError('Please enter your numeric AniList Client ID.');
      return;
    }
    initiateAniListLogin(cleanId);
  };

  const handleDirectToken = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenInput.trim();
    if (!clean) {
      setError('Please paste a valid AniList access token.');
      return;
    }
    setAniListToken(clean);
    onDirectTokenSubmit?.(clean);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-shell-bg border border-shell-border rounded-2xl shadow-[0_20px_45px_rgba(45,25,10,0.2)] p-5 sm:p-6 text-left flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-guide-line">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#02A9FF]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6.361 2.843 0 21.156h6.362l1.693-4.864h5.666l1.692 4.864h6.362L15.414 2.843H6.361zm2.71 8.878 1.83-5.26 1.832 5.26H9.071z" />
            </svg>
            <h2 className="text-lg font-medium text-text-primary">
              Connect AniList Account
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-pill-bg border border-pill-border text-text-secondary hover:text-text-primary flex items-center justify-center cursor-pointer transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-guide-line gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`pb-2 px-1 font-medium border-b-2 cursor-pointer transition-colors ${
              activeTab === 'oauth'
                ? 'border-plank-edge text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            OAuth Login (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('token')}
            className={`pb-2 px-1 font-medium border-b-2 cursor-pointer transition-colors ${
              activeTab === 'token'
                ? 'border-plank-edge text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Paste Access Token
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {activeTab === 'oauth' ? (
          <form onSubmit={handleOAuthSubmit} className="flex flex-col gap-3.5">
            <p className="text-xs text-text-secondary leading-relaxed">
              AniList requires a free Client ID for two-way synchronization:
            </p>

            <ol className="text-xs text-text-secondary space-y-1.5 list-decimal pl-4">
              <li>
                Open{' '}
                <a
                  href="https://anilist.co/settings/developer"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#02A9FF] underline font-medium hover:opacity-80"
                >
                  AniList Developer Settings
                </a>{' '}
                and click <strong>Create New Client</strong>.
              </li>
              <li>
                Set the <strong>Redirect URL</strong> to:
                <div className="mt-1 flex items-center gap-1.5">
                  <code className="bg-page-bg-end border border-pill-border px-2 py-0.5 rounded text-[11px] text-text-primary select-all">
                    {redirectUri}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRedirect}
                    className="text-[11px] px-2 py-0.5 rounded border border-pill-border bg-pill-bg hover:bg-pill-hover-bg text-text-primary cursor-pointer transition-colors"
                  >
                    {copiedRedirect ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </li>
              <li>Copy your numeric <strong>Client ID</strong> and paste below:</li>
            </ol>

            <div className="flex flex-col gap-1 mt-1">
              <label
                htmlFor="anilist-client-id-input"
                className="text-xs font-medium text-text-primary"
              >
                Client ID:
              </label>
              <input
                id="anilist-client-id-input"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 24890"
                className="h-9 px-3 rounded-lg border border-pill-border bg-white text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-2 focus:outline-plank-edge focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="mt-2 h-9 px-4 rounded-lg bg-[#02A9FF] hover:bg-[#0098e6] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              <span>Continue to AniList</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </form>
        ) : (
          <form onSubmit={handleDirectToken} className="flex flex-col gap-3">
            <p className="text-xs text-text-secondary leading-relaxed">
              If you already have an AniList OAuth Bearer token, paste it here to authenticate instantly without redirecting:
            </p>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="anilist-token-input"
                className="text-xs font-medium text-text-primary"
              >
                Access Token:
              </label>
              <textarea
                id="anilist-token-input"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOi..."
                rows={3}
                className="p-2.5 rounded-lg border border-pill-border bg-white text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-2 focus:outline-plank-edge focus:border-transparent transition-all font-mono"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="mt-1 h-9 px-4 rounded-lg bg-[#02A9FF] hover:bg-[#0098e6] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
            >
              Save & Authenticate
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
