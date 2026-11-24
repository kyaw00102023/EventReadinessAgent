export type TaskStatus = 'Confirmed' | 'Pending' | 'Untested';

export const TASK_STATUSES: readonly TaskStatus[] = [
  'Confirmed',
  'Pending',
  'Untested',
] as const;

export const TASK_DEPARTMENTS = [
  'Venue',
  'Logistics',
  'Catering',
  'AV & Tech',
  'Marketing',
  'Operations',
  'General',
] as const;

export type TaskDepartment = (typeof TASK_DEPARTMENTS)[number];

export interface EventTask {
  id: string;
  name: string;
  owner: string;
  department: TaskDepartment;
  status: TaskStatus;
  critical: boolean;
}

export interface EventDetails {
  name: string;
  date: string;
}

export type ReadinessStatus =
  | 'Needs Human Review'
  | 'Ready for Coordinator Review'
  | 'Critical Tasks Required';

export interface BlockerDetail {
  taskId: string;
  taskLabel: string;
  ownerLabel: string;
  hasOwner: boolean;
  hasName: boolean;
  status: TaskStatus;
  reason: string;
  nextAction: string;
}

export interface OpenNonCriticalTask {
  taskId: string;
  taskLabel: string;
  ownerLabel: string;
  hasOwner: boolean;
  status: TaskStatus;
  detail: string;
  nextAction: string;
}

export interface ReadinessAssessment {
  status: ReadinessStatus;
  headline: string;
  summary: string;
  reasons: string[];
  blockers: BlockerDetail[];
  openNonCriticalTasks: OpenNonCriticalTask[];
  missingInformation: string[];
  nextActions: string[];
  assessedAt: string;
  eventSnapshot: EventDetails;
  counts: {
    total: number;
    criticalTotal: number;
    criticalConfirmedWithOwner: number;
    criticalBlockers: number;
    nonCriticalTotal: number;
    openNonCritical: number;
  };
}

export type CoordinatorDecision = 'undecided' | 'go' | 'no-go';
