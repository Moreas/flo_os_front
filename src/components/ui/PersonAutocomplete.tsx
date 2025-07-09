import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../api/apiConfig';
import { UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Person {
  id: number;
  name: string;
  relationship?: string;
}

interface PersonAutocompleteProps {
  selectedPersonIds: number[];
  onChange: (selectedPersonIds: number[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const PersonAutocomplete: React.FC<PersonAutocompleteProps> = ({
  selectedPersonIds,
  onChange,
  placeholder = "Type to search people...",
  label,
  className = '',
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected people objects
  const selectedPeople = people.filter(person => selectedPersonIds.includes(person.id));

  useEffect(() => {
    const fetchPeople = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/people/');
        setPeople(response.data);
      } catch (error) {
        console.error('Error fetching people:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeople();
  }, []);

  // Filter people based on search and exclude already selected
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchValue.toLowerCase()) &&
    !selectedPersonIds.includes(person.id)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowDropdown(value.length > 0);
    setSelectedIndex(0);
  };

  const handleInputFocus = () => {
    if (searchValue.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for click selection
    setTimeout(() => setShowDropdown(false), 150);
  };

  const selectPerson = (person: Person) => {
    const newSelectedIds = [...selectedPersonIds, person.id];
    onChange(newSelectedIds);
    setSearchValue('');
    setShowDropdown(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const removePerson = (personId: number) => {
    const newSelectedIds = selectedPersonIds.filter(id => id !== personId);
    onChange(newSelectedIds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showDropdown && filteredPeople.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPeople.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredPeople[selectedIndex]) {
          selectPerson(filteredPeople[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        setSearchValue('');
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Selected people tags */}
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedPeople.map(person => (
            <span
              key={person.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              <UserCircleIcon className="w-3 h-3 mr-1" />
              {person.name}
              <button
                type="button"
                onClick={() => removePerson(person.id)}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 text-blue-400 hover:text-blue-600"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto"
          >
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading people...</div>
            ) : filteredPeople.length > 0 ? (
              filteredPeople.map((person, index) => (
                <button
                  key={person.id}
                  type="button"
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                    index === selectedIndex ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => selectPerson(person)}
                >
                  <UserCircleIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{person.name}</div>
                    {person.relationship && (
                      <div className="text-xs text-gray-500">{person.relationship}</div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                No people found matching "{searchValue}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonAutocomplete; 