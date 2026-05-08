'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

interface FileDropzoneProps {
  /** Callback when a valid file is selected */
  onFileSelect: (file: File) => void;
  /** Accepted MIME types (e.g. "image/*", ".html,.txt,.md") */
  accept?: string;
  /** Max file size in bytes (default: 5MB) */
  maxSize?: number;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Whether an upload is in progress */
  isUploading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for inline usage */
  compact?: boolean;
}

export function FileDropzone({
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024,
  label = 'Drag files here or click to browse',
  description,
  isUploading = false,
  className = '',
  compact = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `File too large (${formatSize(file.size)}). Max: ${formatSize(maxSize)}`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

      const isAccepted = acceptedTypes.some(acceptType => {
        if (acceptType.startsWith('.')) {
          return fileExt === acceptType.toLowerCase();
        }
        if (acceptType.endsWith('/*')) {
          return fileType.startsWith(acceptType.replace('/*', '/'));
        }
        return fileType === acceptType;
      });

      if (!isAccepted) {
        return `File type not accepted. Allowed: ${accept}`;
      }
    }

    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  }, [isUploading]);

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${compact ? 'p-3' : 'p-6'}
          ${isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className={`flex flex-col items-center text-center ${compact ? 'gap-1' : 'gap-2'}`}>
          {isDragOver ? (
            <FileText className={`${compact ? 'h-6 w-6' : 'h-10 w-10'} text-blue-500`} />
          ) : (
            <Upload className={`${compact ? 'h-6 w-6' : 'h-10 w-10'} text-gray-400`} />
          )}

          <div>
            <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'} ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
              {isUploading ? 'Uploading...' : isDragOver ? 'Drop file here' : label}
            </p>
            {description && !compact && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
