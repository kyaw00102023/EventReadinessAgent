import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  EventTask,
  TASK_DEPARTMENTS,
  TASK_STATUSES,
  TaskDepartment,
  TaskStatus,
} from '../types/readiness';

interface AddTaskFormProps {
  onAddTask: (task: Omit<EventTask, 'id'>) => void;
}

export function AddTaskForm({ onAddTask }: AddTaskFormProps) {
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [department, setDepartment] = useState<TaskDepartment>('Logistics');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [critical, setCritical] = useState(true);
  const [nameError, setNameError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }

    onAddTask({
      name: name.trim(),
      owner: owner.trim(),
      department,
      status,
      critical,
    });

    setName('');
    setOwner('');
    setStatus('Pending');
    setCritical(true);
    setNameError(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-b border-slate-200 bg-slate-50/70 px-5 py-4"
      aria-label="Add a new event task"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <label
            htmlFor="new-task-name"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Task name
          </label>
          <input
            id="new-task-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError && e.target.value.trim()) {
                setNameError(false);
              }
            }}
            placeholder="e.g. Speaker microphones check"
            className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
              nameError ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="new-task-owner"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Owner
          </label>
          <input
            id="new-task-owner"
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. IT Support"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          />
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="new-task-department"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Department
          </label>
          <select
            id="new-task-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value as TaskDepartment)}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            {TASK_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <label
            htmlFor="new-task-status"
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Status
          </label>
          <select
            id="new-task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            {TASK_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-4 md:col-span-8 md:justify-end">
          <label
            htmlFor="new-task-critical"
            className="flex min-h-[38px] cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 select-none whitespace-nowrap shrink-0"
          >
            <input
              id="new-task-critical"
              type="checkbox"
              checked={critical}
              onChange={(e) => setCritical(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            Critical
          </label>

          <button
            type="submit"
            className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Task
          </button>
        </div>
      </div>

      {nameError && (
        <p className="mt-2 text-xs font-medium text-rose-700" role="alert">
          Enter a task name before adding it to the checklist.
        </p>
      )}
    </form>
  );
}
