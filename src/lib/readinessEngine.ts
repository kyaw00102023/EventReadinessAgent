import {
  BlockerDetail,
  EventDetails,
  EventTask,
  OpenNonCriticalTask,
  ReadinessAssessment,
} from '../types/readiness';

export const SAMPLE_EVENT: {
  details: EventDetails;
  tasks: Omit<EventTask, 'id'>[];
} = {
  details: {
    name: 'Quarterly Operations Briefing',
    date: '2026-12-10',
  },
  tasks: [
    {
      name: 'Venue booking',
      owner: 'Admin',
      department: 'Venue',
      status: 'Confirmed',
      critical: true,
    },
    {
      name: 'Catering order',
      owner: 'Events Team',
      department: 'Catering',
      status: 'Confirmed',
      critical: true,
    },
    {
      name: 'AV setup',
      owner: 'IT Support',
      department: 'AV & Tech',
      status: 'Untested',
      critical: true,
    },
  ],
};

function getDisplayTaskName(task: EventTask, index: number): {
  label: string;
  hasName: boolean;
} {
  const trimmed = task.name.trim();
  if (trimmed.length > 0) {
    return { label: trimmed, hasName: true };
  }
  return { label: `Unnamed task #${index + 1}`, hasName: false };
}

function getDisplayOwner(task: EventTask): {
  label: string;
  hasOwner: boolean;
} {
  const trimmed = task.owner.trim();
  if (trimmed.length > 0) {
    return { label: trimmed, hasOwner: true };
  }
  return { label: 'Missing owner', hasOwner: false };
}

/**
 * Evaluates event readiness strictly from locally entered information.
 * Rule evaluation order:
 * 1. No critical tasks entered -> ask coordinator to identify critical tasks first.
 * 2. Any critical task is Pending, Untested, or missing an owner -> "Needs Human Review".
 * 3. All critical tasks are Confirmed and have owners -> "Ready for Coordinator Review".
 */
export function assessEventReadiness(
  eventDetails: EventDetails,
  tasks: EventTask[]
): ReadinessAssessment {
  const assessedAt = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const missingInformation: string[] = [];

  if (!eventDetails.name.trim()) {
    missingInformation.push('Event name has not been entered.');
  }
  if (!eventDetails.date.trim()) {
    missingInformation.push('Event date has not been entered.');
  }

  tasks.forEach((task, index) => {
    const { label, hasName } = getDisplayTaskName(task, index);
    const { hasOwner } = getDisplayOwner(task);

    if (!hasName) {
      missingInformation.push(
        `${label} (${task.critical ? 'Critical' : 'Non-critical'}) is missing a task name.`
      );
    }
    if (!hasOwner) {
      missingInformation.push(
        `"${label}" (${task.critical ? 'Critical' : 'Non-critical'}) is missing an owner.`
      );
    }
  });

  const indexedTasks = tasks.map((task, index) => ({ task, index }));
  const criticalEntries = indexedTasks.filter(({ task }) => task.critical);
  const nonCriticalEntries = indexedTasks.filter(({ task }) => !task.critical);

  const openNonCriticalTasks: OpenNonCriticalTask[] = nonCriticalEntries
    .filter(({ task }) => task.status !== 'Confirmed' || !task.owner.trim())
    .map(({ task, index }) => {
      const { label: taskLabel } = getDisplayTaskName(task, index);
      const { label: ownerLabel, hasOwner } = getDisplayOwner(task);

      const issues: string[] = [];
      if (task.status !== 'Confirmed') {
        issues.push(`status is ${task.status}`);
      }
      if (!hasOwner) {
        issues.push('owner is missing');
      }

      let nextAction: string;
      if (!hasOwner && task.status === 'Untested') {
        nextAction = `Assign an owner to "${taskLabel}" and test it before the event if time permits.`;
      } else if (!hasOwner && task.status === 'Pending') {
        nextAction = `Assign an owner to "${taskLabel}" and follow up on its Pending status.`;
      } else if (!hasOwner) {
        nextAction = `Record an owner for "${taskLabel}" so accountability is clear.`;
      } else if (task.status === 'Untested') {
        nextAction = `Check in with ${ownerLabel} to test "${taskLabel}" and update its status.`;
      } else {
        nextAction = `Check in with ${ownerLabel} to confirm completion of "${taskLabel}".`;
      }

      return {
        taskId: task.id,
        taskLabel,
        ownerLabel,
        hasOwner,
        status: task.status,
        detail: `${taskLabel} (Owner: ${ownerLabel}) — ${issues.join(' and ')}.`,
        nextAction,
      };
    });

  // Rule 1: No critical tasks have been entered
  if (criticalEntries.length === 0) {
    const reasons: string[] = [];
    if (tasks.length === 0) {
      reasons.push('No tasks have been entered yet.');
    } else {
      reasons.push(
        `${tasks.length} task${tasks.length === 1 ? ' is' : 's are'} listed, but none are marked Critical.`
      );
    }
    reasons.push(
      'Critical tasks must be identified before a readiness recommendation can be made.'
    );

    const nextActions: string[] = [];
    if (tasks.length === 0) {
      nextActions.push(
        'Add your event tasks, check Critical on tasks required for the event to proceed, and click Assess Readiness.'
      );
    } else {
      nextActions.push(
        'Review the entered tasks, check the Critical box for each must-have task, and click Assess Readiness again.'
      );
    }
    if (!eventDetails.name.trim() || !eventDetails.date.trim()) {
      nextActions.push('Enter the missing event name or event date for a complete record.');
    }

    return {
      status: 'Critical Tasks Required',
      headline: 'Identify Critical Tasks Before Recommending',
      summary:
        'No critical tasks have been entered yet. Identify which tasks are critical before relying on a readiness recommendation.',
      reasons,
      blockers: [],
      openNonCriticalTasks,
      missingInformation,
      nextActions,
      assessedAt,
      eventSnapshot: { ...eventDetails },
      counts: {
        total: tasks.length,
        criticalTotal: 0,
        criticalConfirmedWithOwner: 0,
        criticalBlockers: 0,
        nonCriticalTotal: nonCriticalEntries.length,
        openNonCritical: openNonCriticalTasks.length,
      },
    };
  }

  // Evaluate critical task blockers for Rule 2
  const blockers: BlockerDetail[] = [];
  let criticalConfirmedWithOwner = 0;

  for (const { task, index } of criticalEntries) {
    const { label: taskLabel, hasName } = getDisplayTaskName(task, index);
    const { label: ownerLabel, hasOwner } = getDisplayOwner(task);
    const isBlocked = task.status !== 'Confirmed' || !hasOwner;

    if (!isBlocked) {
      criticalConfirmedWithOwner += 1;
      continue;
    }

    const issueParts: string[] = [];
    if (task.status === 'Pending' || task.status === 'Untested') {
      issueParts.push(`status is ${task.status}`);
    }
    if (!hasOwner) {
      issueParts.push('missing an owner');
    }

    let nextAction: string;
    if (!hasOwner && task.status === 'Untested') {
      nextAction = `Assign an owner to "${taskLabel}", run testing, and update status to Confirmed.`;
    } else if (!hasOwner && task.status === 'Pending') {
      nextAction = `Assign an owner to "${taskLabel}" and confirm completion.`;
    } else if (!hasOwner) {
      nextAction = `Assign an accountable owner to "${taskLabel}" even though status is Confirmed.`;
    } else if (task.status === 'Untested') {
      nextAction = `Contact ${ownerLabel} to test "${taskLabel}" and update its status to Confirmed.`;
    } else {
      nextAction = `Contact ${ownerLabel} to resolve "${taskLabel}" (Pending) and update its status to Confirmed.`;
    }

    blockers.push({
      taskId: task.id,
      taskLabel,
      ownerLabel,
      hasOwner,
      hasName,
      status: task.status,
      reason: `"${taskLabel}" (Owner: ${ownerLabel}) is a critical task and is ${issueParts.join(' and ')}.`,
      nextAction,
    });
  }

  // Rule 2: At least one critical task is Pending, Untested, or missing an owner
  if (blockers.length > 0) {
    const reasons = blockers.map((blocker) => blocker.reason);
    const nextActions = blockers.map((blocker) => blocker.nextAction);

    if (!eventDetails.name.trim() || !eventDetails.date.trim()) {
      nextActions.push(
        'Complete the missing event name or event date before final coordinator sign-off.'
      );
    }
    nextActions.push(
      'After updating task details or statuses, click Assess Readiness to refresh this recommendation.'
    );

    return {
      status: 'Needs Human Review',
      headline: 'Needs Human Review',
      summary: `${blockers.length} of ${criticalEntries.length} critical task${
        criticalEntries.length === 1 ? '' : 's'
      } ${blockers.length === 1 ? 'has' : 'have'} an unresolved blocker requiring coordinator follow-up.`,
      reasons,
      blockers,
      openNonCriticalTasks,
      missingInformation,
      nextActions,
      assessedAt,
      eventSnapshot: { ...eventDetails },
      counts: {
        total: tasks.length,
        criticalTotal: criticalEntries.length,
        criticalConfirmedWithOwner,
        criticalBlockers: blockers.length,
        nonCriticalTotal: nonCriticalEntries.length,
        openNonCritical: openNonCriticalTasks.length,
      },
    };
  }

  // Rule 3: All critical tasks are Confirmed and have owners
  const confirmedSummaryNames = criticalEntries
    .map(({ task, index }) => {
      const { label } = getDisplayTaskName(task, index);
      const { label: ownerLabel } = getDisplayOwner(task);
      return `"${label}" (${ownerLabel})`;
    })
    .join(', ');

  const reasons: string[] = [
    `All ${criticalEntries.length} critical task${
      criticalEntries.length === 1 ? ' is' : 's are'
    } Confirmed and assigned to an owner: ${confirmedSummaryNames}.`,
  ];

  if (openNonCriticalTasks.length > 0) {
    reasons.push(
      `${openNonCriticalTasks.length} non-critical task${
        openNonCriticalTasks.length === 1 ? ' remains' : 's remain'
      } open for optional follow-up.`
    );
  } else if (nonCriticalEntries.length > 0) {
    reasons.push(
      `All ${nonCriticalEntries.length} non-critical task${
        nonCriticalEntries.length === 1 ? ' is' : 's are'
      } also Confirmed with assigned owners.`
    );
  }

  const nextActions: string[] = [
    ...openNonCriticalTasks.map((item) => item.nextAction),
  ];

  if (!eventDetails.name.trim() || !eventDetails.date.trim()) {
    nextActions.push(
      'Fill in the missing event name or event date so the review record is complete.'
    );
  }

  nextActions.push(
    'Review the confirmed critical tasks and record the final Go / No-Go decision as the event coordinator.'
  );

  return {
    status: 'Ready for Coordinator Review',
    headline: 'Ready for Coordinator Review',
    summary: `All ${criticalEntries.length} critical task${
      criticalEntries.length === 1 ? ' is' : 's are'
    } Confirmed with assigned owners. Final go/no-go approval remains with the event coordinator.`,
    reasons,
    blockers: [],
    openNonCriticalTasks,
    missingInformation,
    nextActions,
    assessedAt,
    eventSnapshot: { ...eventDetails },
    counts: {
      total: tasks.length,
      criticalTotal: criticalEntries.length,
      criticalConfirmedWithOwner,
      criticalBlockers: 0,
      nonCriticalTotal: nonCriticalEntries.length,
      openNonCritical: openNonCriticalTasks.length,
    },
  };
}
