import { AlertCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import {
  EventTask,
  TASK_DEPARTMENTS,
  TASK_STATUSES,
  TaskDepartment,
  TaskStatus,
} from '../types/readiness';

interface TaskRowProps {
  task: EventTask;
  index: number;
  onUpdateTask: (id: string, updates: Partial<Omit<EventTask, 'id'>>) => void;
  onDeleteTask: (id: string) => void;
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'Confirmed') {
    return (
      <CheckCircle2
        className="h-4 w-4 shrink-0 text-emerald-700"
        aria-hidden="true"
      />
    );
  }
  if (status === 'Pending') {
    return (
      <Clock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
    );
  }
  return (
    <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
  );
}

export function TaskRow({
  task,
  index,
  onUpdateTask,
  onDeleteTask,
}: TaskRowProps) {
  const missingName = !task.name.trim();
  const missingOwner = !task.owner.trim();

  const statusTextColor =
    task.status === 'Confirmed'
      ? 'text-emerald-800'
      : task.status === 'Pending'
        ? 'text-amber-800'
        : 'text-rose-800';

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-slate-50/80 md:grid-cols-12 md:items-center">
      {/* Task Name & Department */}
      <div className="space-y-1 md:col-span-4">
        <label
          htmlFor={`task-name-${task.id}`}
          className="mb-1 block text-xs font-medium text-slate-500 md:sr-only"
        >
          Task #{index + 1} name
        </label>
        <input
          id={`task-name-${task.id}`}
          type="text"
          value={task.name}
          onChange={(e) => onUpdateTask(task.id, { name: e.target.value })}
          placeholder="Missing task name"
          aria-invalid={missingName}
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
            missingName
              ? 'border-rose-300 bg-rose-50/60 text-rose-900 placeholder:text-rose-600'
              : 'border-transparent bg-transparent text-slate-900 hover:border-slate-300 hover:bg-white'
          }`}
        />
        <div className="flex items-center gap-1.5 px-2.5">
          <label
            htmlFor={`task-department-${task.id}`}
            className="text-xs text-slate-400"
          >
            Dept:
          </label>
          <select
            id={`task-department-${task.id}`}
            value={task.department}
            onChange={(e) =>
              onUpdateTask(task.id, {
                department: e.target.value as TaskDepartment,
              })
            }
            className="rounded border border-transparent bg-transparent py-0.5 pr-1 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 focus:border-slate-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            {TASK_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Owner */}
      <div className="md:col-span-3">
        <label
          htmlFor={`task-owner-${task.id}`}
          className="mb-1 block text-xs font-medium text-slate-500 md:sr-only"
        >
          Task #{index + 1} owner
        </label>
        <input
          id={`task-owner-${task.id}`}
          type="text"
          value={task.owner}
          onChange={(e) => onUpdateTask(task.id, { owner: e.target.value })}
          placeholder="Missing owner"
          aria-invalid={missingOwner}
          className={`w-full rounded-md border px-2.5 py-1.5 text-sm transition-colors focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
            missingOwner
              ? 'border-rose-300 bg-rose-50/60 text-rose-900 placeholder:text-rose-600'
              : 'border-transparent bg-transparent text-slate-700 hover:border-slate-300 hover:bg-white'
          }`}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 md:col-span-2">
        <StatusIcon status={task.status} />
        <label
          htmlFor={`task-status-${task.id}`}
          className="sr-only"
        >
          Task #{index + 1} status
        </label>
        <select
          id={`task-status-${task.id}`}
          value={task.status}
          onChange={(e) =>
            onUpdateTask(task.id, { status: e.target.value as TaskStatus })
          }
          className={`w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${statusTextColor}`}
        >
          {TASK_STATUSES.map((option) => (
            <option key={option} value={option} className="text-slate-900">
              {option}
            </option>
          ))}
        </select>
      </div>

      {/* Critical checkbox + Delete */}
      <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
        <label
          htmlFor={`task-critical-${task.id}`}
          className="flex min-h-[36px] cursor-pointer items-center gap-2 text-sm select-none whitespace-nowrap shrink-0"
        >
          <input
            id={`task-critical-${task.id}`}
            type="checkbox"
            checked={task.critical}
            onChange={(e) =>
              onUpdateTask(task.id, { critical: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span
            className={
              task.critical
                ? 'font-semibold text-slate-900'
                : 'font-normal text-slate-500'
            }
          >
            Critical
          </span>
        </label>

        <button
          type="button"
          onClick={() => onDeleteTask(task.id)}
          aria-label={`Remove task ${task.name.trim() || `#${index + 1}`}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
