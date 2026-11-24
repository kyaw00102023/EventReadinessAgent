import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Info,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  CoordinatorDecision,
  ReadinessAssessment,
} from '../types/readiness';

interface AssessmentPanelProps {
  assessment: ReadinessAssessment | null;
  isStale: boolean;
  decision: CoordinatorDecision;
  decisionNote: string;
  onAssess: () => void;
  onLoadSample: () => void;
  onDecisionChange: (decision: CoordinatorDecision) => void;
  onDecisionNoteChange: (note: string) => void;
}

export function AssessmentPanel({
  assessment,
  isStale,
  decision,
  decisionNote,
  onAssess,
  onLoadSample,
  onDecisionChange,
  onDecisionNoteChange,
}: AssessmentPanelProps) {
  if (!assessment) {
    return (
      <section
        id="readiness-review"
        aria-label="Readiness assessment output"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <div className="flex items-start gap-3">
          <ClipboardCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-700"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Readiness Review
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Enter your event details and tasks, then select{' '}
              <span className="font-medium text-slate-900">
                Assess Readiness
              </span>{' '}
              to run the local readiness check.
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <h3 className="text-xs font-semibold text-slate-500">
            Local evaluation rules
          </h3>
          <ol className="mt-2.5 space-y-2 text-sm text-slate-700">
            <li className="flex gap-2.5">
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                01.
              </span>
              <span>
                If no critical tasks are entered, you will be asked to identify
                them first.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                02.
              </span>
              <span>
                If any critical task is Pending, Untested, or missing an owner,
                status is <strong className="font-semibold">Needs Human Review</strong>.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                03.
              </span>
              <span>
                If all critical tasks are Confirmed with owners, status is{' '}
                <strong className="font-semibold">Ready for Coordinator Review</strong>.
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={onAssess}
            className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
          >
            Assess Readiness
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
          >
            Load Sample Event
          </button>
        </div>
      </section>
    );
  }

  const isNeedsReview = assessment.status === 'Needs Human Review';
  const isReady = assessment.status === 'Ready for Coordinator Review';

  const statusContainerStyle = isReady
    ? 'border-emerald-200 bg-emerald-50/70'
    : isNeedsReview
      ? 'border-rose-200 bg-rose-50/70'
      : 'border-amber-200 bg-amber-50/70';

  const statusTextStyle = isReady
    ? 'text-emerald-900'
    : isNeedsReview
      ? 'text-rose-900'
      : 'text-amber-900';

  const statusSubtextStyle = isReady
    ? 'text-emerald-800'
    : isNeedsReview
      ? 'text-rose-800'
      : 'text-amber-800';

  return (
    <section
      id="readiness-review"
      aria-label="Readiness assessment output"
      className="rounded-lg border border-slate-200 bg-white"
    >
      {/* Reassessment Banner when tasks or event details changed */}
      {isStale && (
        <div
          role="status"
          className="flex flex-col gap-3 border-b border-amber-200 bg-amber-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <RefreshCw
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-800"
              aria-hidden="true"
            />
            <div className="text-sm text-amber-950">
              <p className="font-semibold">Task list changed — reassess before relying on this result</p>
              <p className="mt-0.5 text-xs text-amber-900">
                The summary below reflects an earlier snapshot. Click Assess
                Readiness to evaluate your latest changes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAssess}
            className="inline-flex min-h-[38px] items-center justify-center rounded-md bg-amber-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
          >
            Assess Readiness
          </button>
        </div>
      )}

      <div className={`p-6 transition-opacity ${isStale ? 'opacity-65' : 'opacity-100'}`}>
        {/* Readiness Status Header */}
        <div className={`rounded-md border p-4 ${statusContainerStyle}`}>
          <div className="flex items-start gap-3">
            {isReady ? (
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
            ) : isNeedsReview ? (
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-700"
                aria-hidden="true"
              />
            ) : (
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-600">
                Readiness Status
              </p>
              <h2
                className={`mt-0.5 font-display text-xl font-bold tracking-tight ${statusTextStyle}`}
              >
                {assessment.headline}
              </h2>
              <p className={`mt-1.5 text-sm leading-relaxed ${statusSubtextStyle}`}>
                {assessment.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Snapshot Metadata Row (Zero-pill clean text with separators) */}
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="font-mono tabular-nums">
            Assessed {assessment.assessedAt}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {assessment.counts.criticalConfirmedWithOwner}/
            {assessment.counts.criticalTotal} critical confirmed with owners
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Event:{' '}
            <strong className="font-medium text-slate-700">
              {assessment.eventSnapshot.name.trim() || 'Missing name'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {assessment.eventSnapshot.date.trim() || 'Missing date'}
          </span>
        </div>

        {/* Blockers Section (Rule 2) */}
        {assessment.blockers.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Critical Blockers ({assessment.blockers.length})
            </h3>
            <ul className="mt-3 divide-y divide-slate-200 border-t border-b border-slate-200">
              {assessment.blockers.map((blocker) => (
                <li key={blocker.taskId} className="py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      {blocker.taskLabel}
                    </span>
                    <span className="text-xs font-medium text-rose-700">
                      {blocker.status}
                      {!blocker.hasOwner ? ' · Missing owner' : ''}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Owner:{' '}
                    <span
                      className={
                        blocker.hasOwner
                          ? 'font-medium text-slate-800'
                          : 'font-medium text-rose-700'
                      }
                    >
                      {blocker.ownerLabel}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm text-slate-700">
                    {blocker.reason}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reasons Section (Rule 1 & Rule 3, or supplemental summary) */}
        {assessment.blockers.length === 0 && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Reasons for Status
            </h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
              {assessment.reasons.map((reason, idx) => (
                <li key={idx} className="leading-relaxed">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Open Non-Critical Tasks (especially required when Ready for Coordinator Review, also helpful context if present) */}
        {(isReady || assessment.openNonCriticalTasks.length > 0) && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Open Non-Critical Tasks ({assessment.openNonCriticalTasks.length})
            </h3>
            {assessment.openNonCriticalTasks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No open non-critical tasks remain.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200 border-t border-b border-slate-200">
                {assessment.openNonCriticalTasks.map((item) => (
                  <li key={item.taskId} className="py-2.5 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {item.taskLabel}
                      </span>
                      <span className="text-xs font-medium text-amber-800">
                        {item.status}
                        {!item.hasOwner ? ' · Missing owner' : ''}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Owner:{' '}
                      <span
                        className={
                          item.hasOwner
                            ? 'font-medium text-slate-800'
                            : 'font-medium text-rose-700'
                        }
                      >
                        {item.ownerLabel}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Flagged Missing Information */}
        {assessment.missingInformation.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="font-display text-sm font-semibold text-rose-800">
              Missing Information Flagged ({assessment.missingInformation.length})
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-sm text-rose-900">
              {assessment.missingInformation.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" aria-hidden="true" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Actions */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Next Actions
          </h3>
          <ol className="mt-2.5 space-y-2.5 text-sm text-slate-700">
            {assessment.nextActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="mt-0.5 font-mono text-xs font-medium text-slate-400 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Coordinator Final Go/No-Go Decision */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-700"
              aria-hidden="true"
            />
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Coordinator Final Go / No-Go Decision
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                This readiness check is advisory only and relies strictly on the
                information entered above. The final go/no-go decision remains
                with the event coordinator.
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Coordinator final go or no-go decision"
            className="mt-3.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
          >
            {(
              [
                { value: 'undecided', label: 'Pending Decision' },
                { value: 'go', label: 'Go — Proceed' },
                { value: 'no-go', label: 'No-Go — Hold' },
              ] as const
            ).map((option) => {
              const active = decision === option.value;
              const activeClass =
                option.value === 'go'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : option.value === 'no-go'
                    ? 'bg-rose-700 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm';

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onDecisionChange(option.value)}
                  aria-pressed={active}
                  className={`min-h-[38px] rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 whitespace-nowrap ${
                    active
                      ? activeClass
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <label
              htmlFor="coordinator-decision-note"
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              Coordinator decision note (optional)
            </label>
            <input
              id="coordinator-decision-note"
              type="text"
              value={decisionNote}
              onChange={(e) => onDecisionNoteChange(e.target.value)}
              placeholder="Record sign-off rationale or follow-up conditions"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            />
          </div>

          {isStale && decision !== 'undecided' && (
            <p className="mt-2 text-xs font-medium text-amber-800">
              Note: Tasks changed after this decision was recorded. Reassess
              readiness before confirming your final call.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
