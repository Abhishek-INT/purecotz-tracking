import React, { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Activity, AlertTriangle, Check, Clock } from 'lucide-react';
import type { Batch, OrderStage, Stage } from '../types';
import { lineManagers } from '../data/masterData';

interface StageTimelineProps {
  batch: Batch;
  orderStages: OrderStage[];
  masterStages: Stage[];
}

interface TimelineStageData {
  key: string;
  name: string;
  managerName: string;
  status: 'completed' | 'current' | 'upcoming';
  isDelayed: boolean;
  quantityCompleted: number;
  targetQuantity: number;
  defectCount: number;
  expectedStartDate?: string;
  expectedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  onTimeText?: string;
  daysInfo?: string;
  durationText?: string;
  estimatedDurationText?: string;
  progressPercent: number;
}

const formatDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
};

const sumDefects = (entries: Batch['progress'][string]): number => {
  if (!entries) return 0;
  return entries.reduce((total, entry) => total + (entry.defectsFound || 0), 0);
};

const getLatestCompletedQty = (entries: Batch['progress'][string]): number => {
  if (!entries || !entries.length) return 0;
  const latest = entries[entries.length - 1];
  return latest?.completedQty ?? 0;
};

const StageTimeline: React.FC<StageTimelineProps> = ({ batch, orderStages, masterStages }) => {
  const stageSequence = useMemo(() => {
    const source = batch.stages && batch.stages.length > 0 ? batch.stages : orderStages;
    return [...source].sort((a, b) => a.sequence - b.sequence);
  }, [batch.stages, orderStages]);

  const timelineData = useMemo<TimelineStageData[]>(() => {
    if (!stageSequence.length) return [];

    const totalStages = stageSequence.length;
    const isBatchComplete = batch.currentStageIndex >= totalStages;
    const currentIdx = isBatchComplete ? totalStages - 1 : Math.max(0, Math.min(batch.currentStageIndex, totalStages - 1));

    return stageSequence.map((stage, index) => {
      const masterStage = masterStages.find((s) => s.id === stage.stageId);
      const stageName = stage.customName || masterStage?.name || stage.stageId;
      const managerName = lineManagers.find((manager) => manager.id === stage.lineManagerId)?.name || 'Unassigned';
      const progressEntries = batch.progress?.[stage.stageId] ?? [];

      let status: TimelineStageData['status'];
      if (isBatchComplete) {
        status = 'completed';
      } else if (index < currentIdx) {
        status = 'completed';
      } else if (index === currentIdx) {
        status = 'current';
      } else {
        status = 'upcoming';
      }

      const defectCount = sumDefects(progressEntries);
      let quantityCompleted = getLatestCompletedQty(progressEntries);
      if (status === 'completed' && quantityCompleted === 0) {
        quantityCompleted = batch.quantity;
      }
      if (status === 'upcoming') {
        quantityCompleted = 0;
      }
      const targetQuantity = batch.quantity;
      const progressPercent = Math.round(targetQuantity ? (quantityCompleted / targetQuantity) * 100 : 0);

      const expectedStartDate = stage.expectedStartDate;
      const expectedEndDate = stage.expectedEndDate;
      const actualStartDate = stage.actualStartDate;
      const actualEndDate = stage.actualEndDate;

      let onTimeText: string | undefined;
      let isDelayed = false;
      if (status === 'completed' && actualEndDate && expectedEndDate) {
        try {
          const actualEnd = parseISO(actualEndDate);
          const expectedEnd = parseISO(expectedEndDate);
          const diff = differenceInCalendarDays(actualEnd, expectedEnd);
          if (diff === 0) {
            onTimeText = 'Completed on time';
          } else if (diff < 0) {
            onTimeText = `Completed ${Math.abs(diff)} day(s) early`;
          } else {
            onTimeText = `Delayed by ${diff} day(s)`;
            isDelayed = true;
          }
        } catch {
          // ignore parse errors
        }
      }

      let durationText: string | undefined;
      if (status === 'completed' && actualStartDate && actualEndDate) {
        try {
          const duration = differenceInCalendarDays(parseISO(actualEndDate), parseISO(actualStartDate)) + 1;
          if (Number.isFinite(duration) && duration > 0) {
            durationText = `Took ${duration} day(s)`;
          }
        } catch {
          // ignore parse errors
        }
      }

      let daysInfo: string | undefined;
      if (status === 'current' && expectedEndDate) {
        try {
          const expected = parseISO(expectedEndDate);
          const today = new Date();
          const normalize = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const expectedDay = normalize(expected);
          const todayDay = normalize(today);
          const msPerDay = 1000 * 60 * 60 * 24;
          const diffMs = expectedDay.getTime() - todayDay.getTime();
          if (diffMs < 0) {
            const daysOverdue = Math.abs(Math.floor(diffMs / msPerDay));
            daysInfo = `Overdue by ${daysOverdue} day(s)`;
          } else if (diffMs === 0) {
            daysInfo = 'Due today';
          } else {
            const daysRemaining = Math.floor(diffMs / msPerDay);
            daysInfo = `${daysRemaining} day(s) remaining`;
          }
        } catch {
          // ignore parse errors
        }
      }

      let estimatedDurationText: string | undefined;
      if (stage.expectedStartDate && stage.expectedEndDate) {
        try {
          const estimatedDuration =
            differenceInCalendarDays(parseISO(stage.expectedEndDate), parseISO(stage.expectedStartDate)) + 1;
          if (Number.isFinite(estimatedDuration) && estimatedDuration > 0) {
            estimatedDurationText = `${estimatedDuration} day(s)`;
          }
        } catch {
          // ignore parse errors
        }
      }

      return {
        key: `${stage.stageId}-${index}`,
        name: stageName,
        managerName,
        status,
        isDelayed,
        quantityCompleted,
        targetQuantity,
        defectCount,
        expectedStartDate,
        expectedEndDate,
        actualStartDate,
        actualEndDate,
        onTimeText,
        daysInfo,
        durationText,
        estimatedDurationText,
        progressPercent,
      };
    });
  }, [batch.currentStageIndex, batch.progress, batch.quantity, masterStages, stageSequence]);

  if (!timelineData.length) {
    return null;
  }

  const formatQuantity = (value: number): string => value.toLocaleString();

  const renderTooltipContent = (stage: TimelineStageData) => {
    const expectedStart = formatDate(stage.expectedStartDate);
    const expectedEnd = formatDate(stage.expectedEndDate);
    const actualStart = formatDate(stage.actualStartDate);
    const actualEnd = formatDate(stage.actualEndDate);

    return (
      <div className="w-80 max-w-sm text-xs text-slate-700">
        <p className="text-sm font-semibold text-slate-900">{stage.name}</p>
        <div className="mt-2 space-y-1">
          <p>
            <span className="font-semibold text-slate-600">Manager:</span> {stage.managerName}
          </p>
          {expectedStart && (
            <p>
              <span className="font-semibold text-slate-600">Expected start:</span> {expectedStart}
            </p>
          )}
          {expectedEnd && (
            <p>
              <span className="font-semibold text-slate-600">Expected end:</span> {expectedEnd}
            </p>
          )}
          {stage.status === 'completed' && actualStart && (
            <p>
              <span className="font-semibold text-slate-600">Actual start:</span> {actualStart}
            </p>
          )}
          {stage.status === 'completed' && actualEnd && (
            <p>
              <span className="font-semibold text-slate-600">Actual end:</span> {actualEnd}
            </p>
          )}
          {stage.status === 'completed' && stage.onTimeText && (
            <p>
              <span className="font-semibold text-slate-600">Status:</span> {stage.onTimeText}
            </p>
          )}
          {stage.status === 'completed' && stage.durationText && (
            <p>
              <span className="font-semibold text-slate-600">Duration:</span> {stage.durationText}
            </p>
          )}
          {stage.status === 'current' && (
            <>
              <p>
                <span className="font-semibold text-slate-600">Progress:</span> {stage.progressPercent}%
              </p>
              {stage.daysInfo && (
                <p>
                  <span className="font-semibold text-slate-600">Timing:</span> {stage.daysInfo}
                </p>
              )}
            </>
          )}
          {stage.status === 'upcoming' && stage.expectedStartDate && stage.expectedEndDate && (
            <p>
              <span className="font-semibold text-slate-600">Planned:</span> {expectedStart} → {expectedEnd}
            </p>
          )}
          {stage.status === 'upcoming' && stage.estimatedDurationText && (
            <p>
              <span className="font-semibold text-slate-600">Estimated duration:</span> {stage.estimatedDurationText}
            </p>
          )}
          <p>
            <span className="font-semibold text-slate-600">Quantity:</span> {formatQuantity(stage.quantityCompleted)} / {formatQuantity(stage.targetQuantity)}
          </p>
          <p>
            <span className="font-semibold text-slate-600">Defects:</span> {stage.defectCount.toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  const renderChip = (stage: TimelineStageData) => {
    const baseClasses = 'min-w-[12rem] rounded-lg border p-3 shadow-sm transition hover:shadow-md';
    let chipClasses = baseClasses;
    let iconBg = 'bg-slate-100 text-slate-500';
    let Icon = Clock;

    if (stage.status === 'completed') {
      if (stage.isDelayed) {
        chipClasses += ' border-red-200 bg-red-50 text-red-700';
      } else {
        chipClasses += ' border-green-200 bg-green-50 text-green-700';
      }
      iconBg = stage.isDelayed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
      Icon = Check;
    } else if (stage.status === 'current') {
      chipClasses += ' border-blue-300 bg-blue-50 text-blue-700 shadow-blue-100 ring-2 ring-blue-200 ring-offset-2';
      iconBg = 'bg-blue-100 text-blue-600';
      Icon = Activity;
    } else {
      chipClasses += ' border-slate-200 bg-slate-50 text-slate-500';
      iconBg = 'bg-slate-100 text-slate-500';
      Icon = Clock;
    }

    return (
      <Tooltip.Root key={stage.key} delayDuration={200}>
        <Tooltip.Trigger asChild>
          <div className={chipClasses}>
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${iconBg}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="truncate text-sm font-semibold" title={stage.name}>
                  {stage.name}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {formatQuantity(stage.quantityCompleted)} / {formatQuantity(stage.targetQuantity)}
                </p>
                {stage.defectCount > 0 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    {stage.defectCount.toLocaleString()} defects
                  </p>
                )}
                {stage.status === 'current' && (
                  <>
                    <p className="mt-1 text-xs font-medium text-blue-700">{stage.progressPercent}% complete</p>
                    {stage.daysInfo && <p className="mt-1 text-xs text-slate-600">{stage.daysInfo}</p>}
                  </>
                )}
                {stage.status === 'completed' && stage.onTimeText && (
                  <p className="mt-1 text-xs font-medium text-slate-600">{stage.onTimeText}</p>
                )}
                {stage.status === 'upcoming' && (
                  <>
                    {stage.expectedEndDate && (
                      <p className="mt-1 text-xs text-slate-500">
                        Due: {formatDate(stage.expectedEndDate) ?? stage.expectedEndDate}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-600">Manager: {stage.managerName}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 rounded-lg border border-slate-200 bg-white p-4 shadow-xl"
            side="top"
            align="start"
            sideOffset={8}
          >
            {renderTooltipContent(stage)}
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  };

  return (
    <Tooltip.Provider>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Stage timeline</p>
        <div className="mt-2 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {timelineData.map((stage) => renderChip(stage))}
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
};

export default StageTimeline;

