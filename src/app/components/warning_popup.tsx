'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface WarningPopupProps {
  isVisible: boolean;
  title: string;
  message: string;
  actions: {
    label: string;
    onClick: () => void;
    isPrimary?: boolean;
    isDangerous?: boolean;
  }[];
  onClose?: () => void;
}

const WarningPopup: React.FC<WarningPopupProps> = ({
  isVisible,
  title,
  message,
  actions,
  onClose,
}) => {
  const isDangerous = actions.some(action => action.isDangerous);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-lg shadow-lg border border-orange-200 p-6 mx-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start space-x-3 mb-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${isDangerous ? 'bg-red-100' : 'bg-orange-100'} rounded-full flex items-center justify-center`}>
                    <AlertTriangle className={`w-5 h-5 ${isDangerous ? 'text-red-600' : 'text-orange-600'}`} />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {message}
                  </p>
                </div>
                
                {/* Close button */}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-3 flex-wrap">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      action.isDangerous
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : action.isPrimary
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WarningPopup;
