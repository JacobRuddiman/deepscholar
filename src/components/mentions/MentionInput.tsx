'use client';

import { useState, useRef, useEffect } from 'react';
import { searchUsersForMention } from '@/server/actions/mentions/mentions';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MentionInput({ value, onChange, placeholder, className }: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1 && lastAtSymbol === cursorPos - 1) {
      // Just typed @
      setMentionStart(lastAtSymbol);
      setShowSuggestions(true);
      setSuggestions([]);
    } else if (lastAtSymbol !== -1 && mentionStart !== -1) {
      // Typing after @
      const query = textBeforeCursor.substring(lastAtSymbol + 1);

      if (query.length > 0 && !query.includes(' ')) {
        const result = await searchUsersForMention(query);
        if (result.success && result.data) {
          setSuggestions(result.data);
          setShowSuggestions(result.data.length > 0);
          setSelectedIndex(0);
        }
      }
    } else {
      setShowSuggestions(false);
      setMentionStart(-1);
    }
  };

  const insertMention = (user: { name: string }) => {
    if (mentionStart === -1) return;

    const before = value.substring(0, mentionStart);
    const after = value.substring(textareaRef.current!.selectionStart);
    const newValue = `${before}@${user.name} ${after}`;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    setSuggestions([]);

    // Focus and set cursor position
    setTimeout(() => {
      textareaRef.current?.focus();
      const cursorPos = before.length + user.name.length + 2;
      textareaRef.current?.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {/* Mention suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={() => insertMention(user)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{user.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
