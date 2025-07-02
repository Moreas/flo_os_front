import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/apiConfig';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface Person {
  id: number;
  name: string;
  relationship?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, selectedPersonIds: number[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [selectedPersonIds, setSelectedPersonIds] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await apiClient.get('/api/people/');
        setPeople(response.data);
      } catch (error) {
        console.error('Error fetching people:', error);
      }
    };

    fetchPeople();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue, selectedPersonIds);
    
    // Get cursor position
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);

    // Check if we're in a mention context
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const insertMention = (person: Person) => {
    const textBeforeMention = value.slice(0, cursorPosition - mentionSearch.length - 1);
    const textAfterMention = value.slice(cursorPosition);
    const newValue = `${textBeforeMention}@${person.name} ${textAfterMention}`;
    const newSelectedPersonIds = [...selectedPersonIds, person.id];
    setSelectedPersonIds(newSelectedPersonIds);
    onChange(newValue, newSelectedPersonIds);
    setShowMentions(false);
    
    // Set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = textBeforeMention.length + person.name.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredPeople.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredPeople[selectedMentionIndex]) {
          insertMention(filteredPeople[selectedMentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${className}`}
      />
      
      {showMentions && filteredPeople.length > 0 && (
        <div
          ref={mentionsListRef}
          className="absolute z-10 mt-1 w-64 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto"
        >
          {filteredPeople.map((person, index) => (
            <button
              key={person.id}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                index === selectedMentionIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => insertMention(person)}
            >
              <UserCircleIcon className="w-5 h-5 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{person.name}</div>
                {person.relationship && (
                  <div className="text-xs text-gray-500">{person.relationship}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput; 