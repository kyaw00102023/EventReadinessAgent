import { useMemo, useState } from 'react';
import { Calendar, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { AddTaskForm } from './components/AddTaskForm';
import { AssessmentPanel } from './components/AssessmentPanel';
import { TaskRow } from './components/TaskRow';
import { assessEventReadiness, SAMPLE_EVENT } from './lib/readinessEngine';
import {
  CoordinatorDecision,
  EventDetails,
  EventTask,
  ReadinessAssessment,
  TASK_DEPARTMENTS,
  TaskDepartment,
} from './types/readiness';

type TaskFilter = 'all' | 'critical' | 'open';
type DepartmentFilter = 'all' | TaskDepartment;

function createTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    name: '',
    date: '',
  });
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilter>('all');
  const [groupByDepartment, setGroupByDepartment] = useState(false);
  const [assessment, setAssessment] = useState<ReadinessAssessment | null>(
    null
  );
  const [isStale, setIsStale] = useState(false);
  const [decision, setDecision] = useState<CoordinatorDecision>('undecided');
  const [decisionNote, setDecisionNote] = useState('');

  const markAssessmentStaleIfPresent = () => {
    if (assessment !== null) {
      setIsStale(true);
    }
  };

  const handleEventNameChange = (value: string) => {
    setEventDetails((prev) => ({ ...prev, name: value }));
    markAssessmentStaleIfPresent();
  };

  const handleEventDateChange = (value: string) => {
    setEventDetails((prev) => ({ ...prev, date: value }));
    markAssessmentStaleIfPresent();
  };

  const handleAddTask = (newTask: Omit<EventTask, 'id'>) => {
    setTasks((prev) => [...prev, { ...newTask, id: createTaskId() }]);
    markAssessmentStaleIfPresent();
  };

  const handleUpdateTask = (
    id: string,
    updates: Partial<Omit<EventTask, 'id'>>
  ) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
    markAssessmentStaleIfPresent();
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    markAssessmentStaleIfPresent();
  };

  const handleLoadSampleEvent = () => {
    setEventDetails({ ...SAMPLE_EVENT.details });
    setTasks(
      SAMPLE_EVENT.tasks.map((task) => ({
        ...task,
        id: createTaskId(),
      }))
    );
    setFilter('all');
    setDepartmentFilter('all');
    setAssessment(null);
    setIsStale(false);
    setDecision('undecided');
    setDecisionNote('');
  };

  const handleResetAll = () => {
    setEventDetails({ name: '', date: '' });
    setTasks([]);
    setFilter('all');
    setDepartmentFilter('all');
    setGroupByDepartment(false);
    setAssessment(null);
    setIsStale(false);
    setDecision('undecided');
    setDecisionNote('');
  };

  const handleAssessReadiness = () => {
    const result = assessEventReadiness(eventDetails, tasks);
    setAssessment(result);
    setIsStale(false);
  };

  const handleExportJson = () => {
    const payload = {
      appName: 'Event Readiness Agent',
      exportedAt: new Date().toISOString(),
      event: {
        name: eventDetails.name,
        date: eventDetails.date,
      },
      tasks: tasks.map(({ name, owner, department, status, critical }) => ({
        name,
        owner,
        department,
        status,
        critical,
      })),
    };

    const slug = eventDetails.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const filename = slug
      ? `${slug}-readiness.json`
      : 'event-readiness-checklist.json';

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const metrics = useMemo(() => {
    const total = tasks.length;
    const criticalTasks = tasks.filter((t) => t.critical);
    const criticalConfirmed = criticalTasks.filter(
      (t) => t.status === 'Confirmed' && t.owner.trim().length > 0
    ).length;
    const openTasks = tasks.filter(
      (t) => t.status !== 'Confirmed' || !t.owner.trim()
    ).length;

    const departmentCounts: Partial<Record<TaskDepartment, number>> = {};
    for (const task of tasks) {
      departmentCounts[task.department] =
        (departmentCounts[task.department] ?? 0) + 1;
    }

    const criticalCount = criticalTasks.length;
    const criticalConfirmedPercent =
      criticalCount > 0
        ? Math.round((criticalConfirmed / criticalCount) * 100)
        : 0;

    return {
      total,
      criticalCount,
      criticalConfirmed,
      criticalConfirmedPercent,
      openTasks,
      departmentCounts,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === 'critical' && !task.critical) {
        return false;
      }
      if (
        filter === 'open' &&
        task.status === 'Confirmed' &&
        task.owner.trim().length > 0
      ) {
        return false;
      }
      if (departmentFilter !== 'all' && task.department !== departmentFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, filter, departmentFilter]);

  const groupedTasks = useMemo(() => {
    const groups: { department: TaskDepartment; items: EventTask[] }[] = [];
    for (const dept of TASK_DEPARTMENTS) {
      const items = filteredTasks.filter((task) => task.department === dept);
      if (items.length > 0) {
        groups.push({ department: dept, items });
      }
    }
    return groups;
  }, [filteredTasks]);

  const hasAnyData =
    eventDetails.name.trim().length > 0 ||
    eventDetails.date.trim().length > 0 ||
    tasks.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
          <a
            href="#top"
            className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Event Readiness Agent
          </a>

          <nav
            aria-label="Primary sections"
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"
          >
            <a
              href="#event-details"
              className="transition-colors hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              Event Details
            </a>
            <a
              href="#task-checklist"
              className="transition-colors hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              Task Checklist
            </a>
            <a
              href="#readiness-review"
              className="transition-colors hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              Readiness Review
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleAssessReadiness}
              className="inline-flex min-h-[38px] items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
            >
              Assess Readiness
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl px-6 py-8">
        {/* Workspace Intro & Demo Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl">
              Coordinator Pre-Event Readiness Check
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Track critical tasks, confirm owners, and evaluate event readiness
              locally using only the details entered below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleLoadSampleEvent}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-600" aria-hidden="true" />
              Load Sample Event
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              disabled={!hasAnyData}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4 text-slate-600" aria-hidden="true" />
              Export JSON
            </button>

            {hasAnyData && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-transparent px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Factual Task Summary Strip */}
        <div className="mt-6 grid grid-cols-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">Total Tasks</p>
            <p className="mt-1 font-mono text-2xl font-medium text-slate-900 tabular-nums">
              {metrics.total}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">Critical Tasks</p>
            <p className="mt-1 font-mono text-2xl font-medium text-slate-900 tabular-nums">
              {metrics.criticalCount}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                Critical Confirmed
              </p>
              <p
                className={`mt-1 font-mono text-2xl font-medium tabular-nums ${
                  metrics.criticalCount > 0 &&
                  metrics.criticalConfirmed === metrics.criticalCount
                    ? 'text-emerald-700'
                    : metrics.criticalCount > 0
                      ? 'text-amber-700'
                      : 'text-slate-900'
                }`}
              >
                {metrics.criticalConfirmed}
                <span className="text-sm font-normal text-slate-400">
                  /{metrics.criticalCount}
                </span>
              </p>
            </div>

            {(() => {
              const radius = 20;
              const circumference = 2 * Math.PI * radius;
              const dashOffset =
                circumference -
                (metrics.criticalConfirmedPercent / 100) * circumference;
              const strokeClass =
                metrics.criticalCount === 0
                  ? 'stroke-slate-300'
                  : metrics.criticalConfirmedPercent === 100
                    ? 'stroke-emerald-600'
                    : metrics.criticalConfirmedPercent > 0
                      ? 'stroke-amber-500'
                      : 'stroke-rose-500';

              return (
                <div
                  role="progressbar"
                  aria-label="Critical tasks confirmed percentage"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={metrics.criticalConfirmedPercent}
                  aria-valuetext={
                    metrics.criticalCount === 0
                      ? 'No critical tasks entered'
                      : `${metrics.criticalConfirmedPercent}% of critical tasks confirmed with owners`
                  }
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center"
                >
                  <svg
                    viewBox="0 0 48 48"
                    className="h-12 w-12 -rotate-90"
                    aria-hidden="true"
                  >
                    <circle
                      cx="24"
                      cy="24"
                      r={radius}
                      fill="none"
                      strokeWidth="4"
                      className="stroke-slate-200"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r={radius}
                      fill="none"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      className={`${strokeClass} transition-all duration-200`}
                    />
                  </svg>
                  <span className="absolute font-mono text-[11px] font-medium text-slate-700 tabular-nums">
                    {metrics.criticalCount > 0
                      ? `${metrics.criticalConfirmedPercent}%`
                      : '—'}
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-slate-500">
              Open or Unassigned
            </p>
            <p className="mt-1 font-mono text-2xl font-medium text-slate-900 tabular-nums">
              {metrics.openTasks}
            </p>
          </div>
        </div>

        {/* Main 2-Column Operational Workspace */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Event Details & Task Checklist */}
          <div className="space-y-6 lg:col-span-7">
            {/* Event Details Card */}
            <section
              id="event-details"
              aria-labelledby="event-details-heading"
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="event-details-heading"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Event Details
                </h2>
                {(!eventDetails.name.trim() || !eventDetails.date.trim()) && (
                  <span className="text-xs text-slate-500">
                    Enter event name and date
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
                <div className="sm:col-span-7">
                  <label
                    htmlFor="event-name"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Event name
                  </label>
                  <input
                    id="event-name"
                    type="text"
                    value={eventDetails.name}
                    onChange={(e) => handleEventNameChange(e.target.value)}
                    placeholder="e.g. Annual Partner Summit"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label
                    htmlFor="event-date"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Event date
                  </label>
                  <div className="relative">
                    <input
                      id="event-date"
                      type="date"
                      value={eventDetails.date}
                      onChange={(e) => handleEventDateChange(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Task Checklist Card */}
            <section
              id="task-checklist"
              aria-labelledby="task-checklist-heading"
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="space-y-3 border-b border-slate-200 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2
                      id="task-checklist-heading"
                      className="font-display text-base font-semibold text-slate-900"
                    >
                      Task Checklist
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Edit any task inline. Any change prompts reassessment
                      before relying on prior results.
                    </p>
                  </div>

                  {/* Interactive Status Filter Tabs */}
                  <div
                    role="tablist"
                    aria-label="Filter tasks by readiness status"
                    className="inline-flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 sm:self-auto"
                  >
                    {(
                      [
                        { id: 'all', label: `All (${metrics.total})` },
                        {
                          id: 'critical',
                          label: `Critical (${metrics.criticalCount})`,
                        },
                        { id: 'open', label: `Open (${metrics.openTasks})` },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={filter === tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 whitespace-nowrap shrink-0 ${
                          filter === tab.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department Filter & Grouping Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="department-filter"
                      className="text-xs font-medium text-slate-600 whitespace-nowrap"
                    >
                      Department
                    </label>
                    <select
                      id="department-filter"
                      value={departmentFilter}
                      onChange={(e) =>
                        setDepartmentFilter(e.target.value as DepartmentFilter)
                      }
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                    >
                      <option value="all">
                        All Departments ({metrics.total})
                      </option>
                      {TASK_DEPARTMENTS.map((dept) => {
                        const count = metrics.departmentCounts[dept] ?? 0;
                        return (
                          <option key={dept} value={dept}>
                            {dept} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div
                    role="group"
                    aria-label="Task list layout"
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                  >
                    <button
                      type="button"
                      onClick={() => setGroupByDepartment(false)}
                      aria-pressed={!groupByDepartment}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 whitespace-nowrap shrink-0 ${
                        !groupByDepartment
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Flat List
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupByDepartment(true)}
                      aria-pressed={groupByDepartment}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 whitespace-nowrap shrink-0 ${
                        groupByDepartment
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Group by Department
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Task Form */}
              <AddTaskForm onAddTask={handleAddTask} />

              {/* Column Headers (Desktop) */}
              {filteredTasks.length > 0 && (
                <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-medium text-slate-500 md:grid">
                  <div className="col-span-4">Task &amp; Department</div>
                  <div className="col-span-3">Owner</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3 text-right">Priority &amp; Action</div>
                </div>
              )}

              {/* Task Rows or Empty States */}
              {tasks.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar
                    className="mx-auto h-8 w-8 text-slate-300"
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
                    No event tasks entered yet
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
                    Add your first task above, or load the fictional sample
                    event to test the readiness rules immediately.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadSampleEvent}
                      className="inline-flex min-h-[38px] items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
                    >
                      Load Sample Event
                    </button>
                  </div>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-slate-600">
                    No tasks match the current filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter('all');
                      setDepartmentFilter('all');
                    }}
                    className="mt-3 text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700"
                  >
                    Clear filters
                  </button>
                </div>
              ) : groupByDepartment ? (
                <div className="divide-y divide-slate-200">
                  {groupedTasks.map((group) => {
                    const criticalInGroup = group.items.filter(
                      (t) => t.critical
                    ).length;
                    return (
                      <div key={group.department}>
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-2">
                          <h3 className="font-display text-xs font-semibold text-slate-800">
                            {group.department}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                            <span>
                              {group.items.length}{' '}
                              {group.items.length === 1 ? 'task' : 'tasks'}
                            </span>
                            {criticalInGroup > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{criticalInGroup} critical</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          {group.items.map((task) => {
                            const originalIndex = tasks.findIndex(
                              (t) => t.id === task.id
                            );
                            return (
                              <TaskRow
                                key={task.id}
                                task={task}
                                index={originalIndex}
                                onUpdateTask={handleUpdateTask}
                                onDeleteTask={handleDeleteTask}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {filteredTasks.map((task) => {
                    const originalIndex = tasks.findIndex(
                      (t) => t.id === task.id
                    );
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        index={originalIndex}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                      />
                    );
                  })}
                </div>
              )}

              {/* Checklist Action Footer */}
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-600">
                  Local rules only — no external services or API keys required.
                </p>
                <button
                  type="button"
                  onClick={handleAssessReadiness}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
                >
                  Assess Readiness
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Readiness Assessment Panel */}
          <div className="lg:sticky lg:top-20 lg:col-span-5">
            <AssessmentPanel
              assessment={assessment}
              isStale={isStale}
              decision={decision}
              decisionNote={decisionNote}
              onAssess={handleAssessReadiness}
              onLoadSample={handleLoadSampleEvent}
              onDecisionChange={setDecision}
              onDecisionNoteChange={setDecisionNote}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
