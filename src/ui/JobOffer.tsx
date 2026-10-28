import { bridge } from '../game/bridge';
import { isTouchDevice } from '../game/touch';
import { useUi } from '../store/uiStore';

/** Pops up when you walk up to someone with a job (or a borrowable auto): what it is, and one tap to start. */
export function JobOffer() {
  const offer = useUi((s) => s.jobOffer);
  if (!offer) return null;
  return (
    <div className="job-offer panel" role="dialog" aria-label={`Job: ${offer.title}`}>
      <div className="job-offer-head">
        <span className="job-badge" aria-hidden>
          !
        </span>
        <div>
          <div className="job-offer-title">Job: {offer.title}</div>
          <div className="muted">{offer.kind === 'fares' ? offer.who : `${offer.who} has work for you`}</div>
        </div>
      </div>
      <p>{offer.body}</p>
      <div className="job-offer-actions">
        <button className="btn btn-primary" onClick={() => bridge.api?.acceptJob(offer.id)}>
          {offer.cta}
        </button>
        <button className="btn" onClick={() => bridge.api?.snoozeJob(offer.id)}>
          Not now
        </button>
      </div>
      {!isTouchDevice() && (
        <div className="muted job-offer-keys">
          or press <kbd>E</kbd> to {offer.kind === 'fares' ? 'get in' : 'talk'}
        </div>
      )}
    </div>
  );
}
