//admin/seeding/page.tsx
'use client';

import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Copy,
  Download
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { seed, type SeedConfig } from '@/server/actions/seed';
import { CollapsibleSection } from './components/CollapsibleSection';
import { Tooltip } from './components/Tooltip';
import { PRESETS } from './config/presets';
import { getDefaultConfig } from './config/defaultConfig';
import { DeleteOptionsSection } from './sections/DeleteOptionsSection';
import { DemoUserSection } from './sections/DemoUserSection';
import { UsersSection } from './sections/UsersSection';
import { BriefsSection } from './sections/BriefsSection';
import { ReviewsSection } from './sections/ReviewsSection';
import { EngagementSection } from './sections/EngagementSection';
import { SystemFeaturesSection } from './sections/SystemFeaturesSection';
import { DataSkewingSection } from './sections/DataSkewingSection';
import { generateConsoleCommand } from './utils/commandGenerator';

import { DatabaseSafetyModal } from './components/DatabaseSafetyModal';
import { verifyDatabaseSafety } from '@/server/actions/seed/safety';
import { DatabaseSafetyCheck } from '@/server/actions/seed/index';


export default function DataSynthPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [config, setConfig] = useState<SeedConfig>(getDefaultConfig());

  const [showSafetyModal, setShowSafetyModal] = useState(false);
const [safetyCheck, setSafetyCheck] = useState<DatabaseSafetyCheck | null>(null);
const [pendingSeed, setPendingSeed] = useState(false);

  const handlePresetSelect = (preset: any) => {
    setActivePreset(preset.name);
    setConfig(prev => ({
      ...prev,
      ...preset.config
    }));
  };

const handleSeed = async (forceOverride: boolean = false) => {
  // Check if we need to perform safety verification
  if ((config.deleteAll || config.deleteTables?.length) && !forceOverride) {
    setConsoleOutput(['Checking database safety...']);
    
    try {
      const safety = await verifyDatabaseSafety();
      setSafetyCheck(safety);
      
      if (!safety.isSafe) {
        setShowSafetyModal(true);
        setConsoleOutput(prev => [...prev, '⚠️ Database safety check failed - review required']);
        return;
      }
      
      setConsoleOutput(prev => [...prev, '✅ Database safety check passed']);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Safety check failed';
      setError(errorMsg);
      setConsoleOutput(prev => [...prev, `❌ Safety check error: ${errorMsg}`]);
      return;
    }
  }

  // Proceed with seeding
  setIsSeeding(true);
  setError(null);
  setSeedResult(null);
  setPendingSeed(false);
  
  if (forceOverride) {
    setConsoleOutput(prev => [...prev, '⚠️ Proceeding with forced seeding (safety check bypassed)']);
  }
  
  if (!consoleOutput.some(line => line.includes('Starting seed operation'))) {
    setConsoleOutput(prev => [...prev, 'Starting seed operation...']);
  }

  try {
    // Add force flag to config when bypassing safety
    const seedConfig = forceOverride ? { ...config, force: true } : config;
    const result = await seed(seedConfig);
    
    if (result.success) {
      setSeedResult(result);
      setConsoleOutput(prev => [...prev, '✅ Seed completed successfully!']);
    } else {
      setError(result.error || 'Seeding failed');
      setConsoleOutput(prev => [...prev, `❌ Error: ${result.error}`]);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    setError(errorMsg);
    setConsoleOutput(prev => [...prev, `❌ Error: ${errorMsg}`]);
  } finally {
    setIsSeeding(false);
  }
};

const handleSafetyContinue = () => {
  setShowSafetyModal(false);
  setConsoleOutput(prev => [...prev, '⚠️ User chose to continue despite safety warnings']);
  // Call handleSeed with force override
  handleSeed(true);
};

const handleSafetyCancel = () => {
  setShowSafetyModal(false);
  setSafetyCheck(null);
  setPendingSeed(false);
  setConsoleOutput(prev => [...prev, '❌ Seeding cancelled by user']);
};

  const copyCommand = () => {
    navigator.clipboard.writeText(generateConsoleCommand(config));
  };

  const exportConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seed-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Synthesis</h1>
        <p className="text-gray-600 mt-2">Generate synthetic data for development and testing</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Seeding Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {seedResult?.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">Seeding Completed Successfully</p>
            <p className="text-green-600 text-sm mt-1">Duration: {seedResult.duration}</p>
            {seedResult.summary && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(seedResult.summary).map(([key, value]) => (
                  <div key={key} className="bg-white rounded px-3 py-2">
                    <p className="text-xs text-gray-500 capitalize">{key}</p>
                    <p className="text-sm font-semibold text-gray-900">{value as number}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Presets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activePreset === preset.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {preset.icon}
                <span className="font-medium text-gray-900">{preset.name}</span>
              </div>
              <p className="text-xs text-gray-600 text-left">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-4">
        <DeleteOptionsSection config={config} setConfig={setConfig} />
        <DemoUserSection config={config} setConfig={setConfig} />
        <UsersSection config={config} setConfig={setConfig} showAdvanced={showAdvanced} />
        <BriefsSection config={config} setConfig={setConfig} showAdvanced={showAdvanced} />
        <ReviewsSection config={config} setConfig={setConfig} showAdvanced={showAdvanced} />
        <EngagementSection config={config} setConfig={setConfig} showAdvanced={showAdvanced} />
        <SystemFeaturesSection config={config} setConfig={setConfig} showAdvanced={showAdvanced} />
        <DataSkewingSection config={config} setConfig={setConfig} />
      </div>

      {/* Advanced Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {/* Console Output */}
      {consoleOutput.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-300">Console Output</h3>
            <button
              onClick={() => setConsoleOutput([])}
              className="text-xs text-gray-500 hover:text-gray-400"
            >
              Clear
            </button>
          </div>
          <div className="font-mono text-xs text-gray-300 space-y-1">
            {consoleOutput.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Console Command</span>
              <button
                onClick={copyCommand}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <code className="text-xs font-mono text-gray-600 break-all">
              {generateConsoleCommand(config)}
            </code>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSeed}
                disabled={isSeeding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Seeding
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={exportConfig}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Config
              </Button>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>This will modify your database</span>
            </div>
          </div>
        </div>
      </div>
      {showSafetyModal && safetyCheck && (
  <DatabaseSafetyModal
    isOpen={showSafetyModal}
    onClose={handleSafetyCancel}
    onContinue={handleSafetyContinue}
    safetyCheck={safetyCheck}
  />
)}
    </div>
  );
}