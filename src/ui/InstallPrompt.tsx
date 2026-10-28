import { useState } from 'react';
import { installApp, isIOS, markAsked, useInstallMode } from '../install';

/** Phone visitors are offered the home-screen app: full screen, no browser bars. Saying no just plays in the tab. */
export function InstallPrompt({ onClose }: { onClose: () => void }) {
  const mode = useInstallMode();
  const [step, setStep] = useState<'ask' | 'steps' | 'done'>(mode === 'installed' ? 'done' : 'ask');
  const close = () => {
    markAsked();
    onClose();
  };
  const install = async () => {
    markAsked();
    if (mode === 'installed') setStep('done');
    else if (mode === 'manual') setStep('steps');
    else if (await installApp()) setStep('done');
    else onClose();
  };
  return (
    <div className="modal-backdrop install-backdrop">
      <div className="install-card panel" role="dialog" aria-label="Install the app">
        {step === 'ask' && (
          <>
            <h3>Playing on a phone?</h3>
            <p>
              GTE-Bengaluru is made for bigger screens. On a phone, get the <b>app</b>: it opens full screen with no browser bars, starts faster
              and works offline. It's free and takes a second.
            </p>
            <div className="install-actions">
              <button className="btn btn-primary" autoFocus onClick={() => void install()}>
                Get the app
              </button>
              <button className="btn" onClick={close}>
                Play in browser
              </button>
            </div>
            <p className="muted install-note">Optional. You can get it later from the menu.</p>
          </>
        )}
        {step === 'steps' && (
          <>
            <h3>Add it to your home screen</h3>
            {isIOS() ? (
              <ol className="install-steps">
                <li>
                  Tap <b>Share</b> <span aria-hidden>⬆︎</span> in Safari's toolbar (on newer iPhones it's under <b>•••</b>).
                </li>
                <li>
                  Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.
                </li>
                <li>
                  Open <b>GTE-Bengaluru</b> from your home screen.
                </li>
              </ol>
            ) : (
              <ol className="install-steps">
                <li>
                  Open your browser's menu <b>⋮</b>.
                </li>
                <li>
                  Tap <b>Install app</b> or <b>Add to Home screen</b>.
                </li>
                <li>
                  Open <b>GTE-Bengaluru</b> from your home screen.
                </li>
              </ol>
            )}
            {isIOS() && <p className="muted install-note">The app keeps its own progress, separate from this browser tab.</p>}
            <div className="install-actions">
              {/* Chrome only makes its offer after the page has been used for a bit; take the shortcut once it arrives. */}
              {mode === 'prompt' && (
                <button className="btn btn-primary" onClick={() => void install()}>
                  Install now
                </button>
              )}
              <button className="btn" onClick={onClose}>
                Play in browser for now
              </button>
            </div>
          </>
        )}
        {step === 'done' && (
          <>
            <h3>Installed!</h3>
            <p>
              Open <b>GTE-Bengaluru</b> from your home screen for full-screen play.
            </p>
            <div className="install-actions">
              <button className="btn" autoFocus onClick={onClose}>
                Keep playing here
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
