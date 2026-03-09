import React, { useState } from 'react';
import {
  useSettings,
  useUpdateSettingsMutation,
  useResetAllDataMutation,
  useImportBackupMutation,
} from '../../hooks/useApi';
import { api } from '../../services/api';
import { AppSettings } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Settings,
  Save,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Download,
  Upload,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { data: settings, isLoading } = useSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>({
    id: 1, dailyGoal: 20, theme: 'dark', soundEnabled: true,
  });

  // Sync server settings into local state when loaded
  React.useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const updateMutation    = useUpdateSettingsMutation();
  const resetMutation     = useResetAllDataMutation();
  const importMutation    = useImportBackupMutation();

  const [savedOk, setSavedOk]                           = useState(false);
  const [showResetConfirm, setShowResetConfirm]         = useState(false);
  const [pendingImportData, setPendingImportData]       = useState<Record<string, unknown> | null>(null);

  const handleSave = async () => {
    setSavedOk(false);
    try {
      await updateMutation.mutateAsync(localSettings);
      document.documentElement.classList.toggle('dark', localSettings.theme === 'dark');
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const toggleTheme = async () => {
    if (!localSettings) return;
    const newTheme = (localSettings.theme === 'dark' ? 'light' : 'dark') as 'light' | 'dark';
    const updated = { ...localSettings, theme: newTheme };
    setLocalSettings(updated);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    try {
      await updateMutation.mutateAsync(updated);
    } catch (err) {
      console.error('Theme update failed:', err);
    }
  };

  const toggleSound = async () => {
    if (!localSettings) return;
    const updated = { ...localSettings, soundEnabled: !localSettings.soundEnabled };
    setLocalSettings(updated);
    try {
      await updateMutation.mutateAsync(updated);
    } catch (err) {
      console.error('Sound update failed:', err);
    }
  };

  const handleExport = async () => {
    const data = await api.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.settings || !data.stats) { alert('Invalid backup file — missing required fields.'); return; }
        setPendingImportData(data);
      } catch { alert('Failed to parse backup file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!pendingImportData) return;
    try {
      await importMutation.mutateAsync(pendingImportData);
      window.location.reload();
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to restore backup.');
    } finally {
      setPendingImportData(null);
    }
  };

  const handleResetAll = async () => {
    try {
      await resetMutation.mutateAsync();
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
      setShowResetConfirm(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8">
        <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto" />
      </div>
    );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-500" /> Settings
      </h1>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-6">Preferences</h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">Theme</div>
              <div className="text-sm text-gray-500">Toggle dark mode</div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {localSettings.theme === 'dark' ? (
                <Moon className="w-6 h-6" />
              ) : (
                <Sun className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">Sound Effects</div>
              <div className="text-sm text-gray-500">Play sounds for correct/incorrect answers</div>
            </div>
            <button
              onClick={toggleSound}
              className={`p-3 rounded-xl ${localSettings.soundEnabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              {localSettings.soundEnabled ? (
                <Volume2 className="w-6 h-6" />
              ) : (
                <VolumeX className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 max-w-[200px]">
              <div className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                Daily Goal (Words)
              </div>
              <input
                type="number"
                min={1}
                max={200}
                value={localSettings.dailyGoal}
                onChange={(e) =>
                  setLocalSettings((s) => ({ ...s, dailyGoal: Math.max(1, parseInt(e.target.value) || 1) }))
                }
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors font-bold"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending || settings?.dailyGoal === localSettings.dailyGoal}
              >
                {updateMutation.isPending ? 'Saving...' : <><Save className="w-5 h-5 mr-2" /> Save Goal</>}
              </Button>
              {savedOk && (
                <span className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">✓ Saved!</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-6 text-orange-600 dark:text-orange-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Data Management
        </h2>

        <div className="space-y-6">
          <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-blue-900 dark:text-blue-100 mb-1">Backup Data</div>
              <div className="text-sm text-blue-700/70 dark:text-blue-300">
                Export your progress, streaks, and settings to a JSON file.
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-blue-200 text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-400 shrink-0"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>

          <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-red-900 dark:text-red-100 mb-1">Restore Data</div>
              <div className="text-sm text-red-700/70 dark:text-red-300">
                Warning: Overwrites all current progress.
              </div>
            </div>
            <div className="relative shrink-0">
              <Button variant="danger" className="relative z-0 pointer-events-none">
                <Upload className="w-4 h-4 mr-2" /> Restore
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                title="Upload JSON backup"
              />
            </div>
          </div>

          {/* Reset All */}
          <div className="p-5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-red-900 dark:text-red-100 mb-1">Reset User Data</div>
              <div className="text-sm text-red-700/70 dark:text-red-300">
                Warning: Permanently delete all your learning progress and logs.
              </div>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowResetConfirm(true)}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Reset Everything
            </Button>
          </div>
        </div>
      </Card>

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border-4 border-red-600 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)] p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Reset User Data?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              All <strong>word progress</strong>, <strong>lesson progress</strong>,{' '}
              <strong>study streaks</strong>, and <strong>session data</strong> will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button
                id="reset-cancel-btn"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetMutation.isPending}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="reset-confirm-btn"
                onClick={handleResetAll}
                disabled={resetMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 border-2 border-red-500 font-black text-white uppercase tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetMutation.isPending ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Resetting...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Yes, Reset</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import confirm modal */}
      {pendingImportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border-4 border-orange-500 shadow-[8px_8px_0px_0px_rgba(234,88,12,1)] p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Restore Backup?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
              All current <strong>progress, streaks, and settings</strong> will be replaced by the backup file.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPendingImportData(null)} disabled={importMutation.isPending}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmImport} disabled={importMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 border-2 border-orange-400 font-black text-white uppercase tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {importMutation.isPending ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Restoring...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Yes, Restore</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
