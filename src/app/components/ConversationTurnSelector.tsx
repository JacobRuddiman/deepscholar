'use client';

import React from 'react';
import { ConversationTurn } from '@/functions/types';

interface ConversationTurnSelectorProps {
  turns: ConversationTurn[];
  onSelect: (turnIndex: number) => void;
  onCancel?: () => void;
}

export default function ConversationTurnSelector({
  turns,
  onSelect,
  onCancel
}: ConversationTurnSelectorProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(0);

  const handleConfirm = () => {
    onSelect(selectedIndex);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Select Conversation Turn
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            This conversation has {turns.length} prompt-response {turns.length === 1 ? 'pair' : 'pairs'}.
            Select which one you want to save as a brief.
          </p>
        </div>

        {/* Turn List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {turns.map((turn, index) => (
              <div
                key={turn.index}
                onClick={() => setSelectedIndex(index)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedIndex === index
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Radio Button */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${selectedIndex === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}
                    >
                      {selectedIndex === index && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Turn {turn.index + 1}
                      </span>
                      {turn.timestamp && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(turn.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* User Message */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        PROMPT
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded p-2">
                        {truncateText(turn.userMessage)}
                      </div>
                    </div>

                    {/* Assistant Message Preview */}
                    <div>
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                        RESPONSE
                      </div>
                      <div className="text-sm text-gray-900 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded p-2">
                        {truncateText(turn.assistantMessage, 200)}
                      </div>
                    </div>

                    {/* Character counts */}
                    <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>Prompt: {turn.userMessage.length} chars</span>
                      <span>Response: {turn.assistantMessage.length} chars</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Use Turn {selectedIndex + 1}
          </button>
        </div>
      </div>
    </div>
  );
}
