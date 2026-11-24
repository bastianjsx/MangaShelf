import { useState, useRef } from 'react';
import {
  getAniListClientId,
  initiateAniListLogin,
  setAniListToken,
  fetchCurrentAniListUser,
} from '../../services/anilistAuth';
import { useModalDialog } from '../../hooks/useModalDialog';

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
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalDialog({ isOpen, onClose, dialogRef });

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

  const handleDirectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tokenInput.trim();
    if (!clean) {
      setError('Please paste a valid AniList access token.');
      return;
    }

    setIsValidatingToken(true);
    setError(null);
    try {
      await fetchCurrentAniListUser(clean);
      setAniListToken(clean);
      onDirectTokenSubmit?.(clean);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid AniList access token.');
    } finally {
      setIsValidatingToken(false);
    }
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
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-shell-bg border border-shell-border rounded-2xl shadow-[0_20px_45px_rgba(45,25,10,0.2)] p-5 sm:p-6 text-left flex flex-col gap-4 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-guide-line">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-5 h-5 text-[#3B6B88]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6.361 2.843 0 21.156h6.362l1.693-4.864h5.666l1.692 4.864h6.362L15.414 2.843H6.361zm2.71 8.878 1.83-5.26 1.832 5.26H9.071z" />
            </svg>
            <h2 className="text-base sm:text-lg font-semibold text-text-primary tracking-tight">
              Connect AniList Account
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full text-text-secondary hover:text-text-primary hover:bg-[#EAE0D0] flex items-center justify-center transition-colors cursor-pointer"
            title="Close dialog (Esc)"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex p-1 rounded-xl bg-pill-bg border border-pill-border/60 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('oauth');
              setError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'oauth'
                ? 'bg-white text-text-primary font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            OAuth Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('token');
              setError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'token'
                ? 'bg-white text-text-primary font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Paste Access Token
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {activeTab === 'oauth' ? (
          <form onSubmit={handleOAuthSubmit} className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              AniList requires a free Client ID to enable seamless two-way synchronization:
            </p>

            <div className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E8DDD0] text-text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="pt-0.5">
                  Open{' '}
                  <a
                    href="https://anilist.co/settings/developer"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#3B6B88] underline underline-offset-2 font-medium hover:text-[#2C526A]"
                  >
                    AniList Developer Settings
                  </a>{' '}
                  and click <strong className="text-text-primary">Create New Client</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E8DDD0] text-text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p>Set the <strong className="text-text-primary">Redirect URL</strong> to:</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <code className="flex-1 min-w-0 bg-white/80 border border-pill-border/80 px-2.5 py-1 rounded-lg text-[11.5px] font-mono text-text-primary truncate select-all">
                      {redirectUri}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyRedirect}
                      className="shrink-0 text-[11.5px] px-2.5 py-1 rounded-lg border border-pill-border bg-pill-bg hover:bg-pill-hover-bg text-text-primary font-medium cursor-pointer transition-colors"
                    >
                      {copiedRedirect ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#E8DDD0] text-text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="pt-0.5">
                  Copy your numeric <strong className="text-text-primary">Client ID</strong> and paste below:
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <label
                htmlFor="anilist-client-id-input"
                className="text-xs font-semibold text-text-primary"
              >
                Client ID
              </label>
              <input
                id="anilist-client-id-input"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 24890"
                className="h-10 px-3 rounded-xl border border-pill-border bg-white text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-[#3B6B88]/25 focus:border-[#3B6B88] transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="mt-1 h-10 px-4 rounded-xl bg-[#3B6B88] hover:bg-[#315B75] active:bg-[#284B62] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
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
          <form onSubmit={handleDirectToken} className="flex flex-col gap-3.5">
            <p className="text-xs text-text-secondary leading-relaxed">
              If you already have an AniList OAuth Bearer token, paste it here to authenticate instantly without redirecting:
            </p>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="anilist-token-input"
                className="text-xs font-semibold text-text-primary"
              >
                Access Token
              </label>
              <textarea
                id="anilist-token-input"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOi..."
                rows={3}
                className="p-3 rounded-xl border border-pill-border bg-white text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-[#3B6B88]/25 focus:border-[#3B6B88] transition-all font-mono"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isValidatingToken}
              className="mt-1 h-10 px-4 rounded-xl bg-[#3B6B88] hover:bg-[#315B75] active:bg-[#284B62] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              {isValidatingToken ? 'Validating Token...' : 'Save & Authenticate'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
