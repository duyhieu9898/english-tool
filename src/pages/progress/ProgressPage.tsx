import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { HeatmapCalendar } from '@/components/common/HeatmapCalendar';
import { useProgressData } from './useProgressData';
import {
  ProgressSummaryCards,
  CompletedModulesCard,
  RetentionLevelsCard,
} from './components/ProgressWidgets';

export const ProgressPage: React.FC = () => {
  const {
    stats,
    logs,
    dailyGoal,
    masteredWords,
    totalWordsActive,
    byLevel,
    completedModules,
  } = useProgressData();

  return (
    <PageContainer className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500" /> My Progress
        </h1>
        <p className="text-gray-500 text-lg">
          Track your learning journey and view detailed statistics.
        </p>
      </div>

      <ProgressSummaryCards stats={stats} masteredWords={masteredWords} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RetentionLevelsCard totalWordsActive={totalWordsActive} byLevel={byLevel} />
        <CompletedModulesCard completedModules={completedModules} />
      </div>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-6">Activity History</h2>
        <HeatmapCalendar logs={logs} dailyGoal={dailyGoal} />
      </Card>
    </PageContainer>
  );
};
