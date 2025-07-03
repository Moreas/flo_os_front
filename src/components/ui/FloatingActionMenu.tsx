import React, { Fragment, useState, useCallback } from 'react';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { PlusIcon, XMarkIcon, ArrowPathIcon, ExclamationCircleIcon, CheckCircleIcon, PencilSquareIcon, BookOpenIcon, FaceSmileIcon, BoltIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/apiConfig';
import MentionInput from './MentionInput';
import { useTaskRefresh } from '../../contexts/TaskRefreshContext';


// Define emotions and their corresponding emojis
const emotionsMap: { [key: string]: string } = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprised: '😮',
  calm: '😌',
  anxious: '😟',
  excited: '🤩',
  tired: '😴',
  confused: '😕',
};

// Define moods and their corresponding representations
const moodMap: { [key: number]: { emoji: string, colorClass: string, label: string } } = {
  1: { emoji: '😞', colorClass: 'text-red-500', label: 'Bad' },
  2: { emoji: '😐', colorClass: 'text-yellow-500', label: 'Okay' },
  3: { emoji: '😊', colorClass: 'text-green-500', label: 'Good' },
};

// Define energy levels and their corresponding representations
const energyMap: { [key: number]: { emoji: string, colorClass: string, label: string } } = {
  0: { emoji: '😴', colorClass: 'text-gray-500', label: 'Exhausted' },
  1: { emoji: '😩', colorClass: 'text-red-500', label: 'Very Low' },
  2: { emoji: '😕', colorClass: 'text-orange-500', label: 'Low' },
  3: { emoji: '😐', colorClass: 'text-yellow-500', label: 'Moderate' },
  4: { emoji: '😊', colorClass: 'text-green-500', label: 'High' },
  5: { emoji: '⚡', colorClass: 'text-blue-500', label: 'Very High' },
};

const FloatingActionMenu: React.FC = () => {
  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false); // New Mood Modal State
  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  
  // Task Modal State
  const [quickTaskInput, setQuickTaskInput] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [submitTaskError, setSubmitTaskError] = useState<string | null>(null);
  const [submitTaskSuccess, setSubmitTaskSuccess] = useState(false);
  const { refreshTasks } = useTaskRefresh(); 

  // Journal Modal State
  const [quickJournalInput, setQuickJournalInput] = useState('');
  const [quickJournalEmotion, setQuickJournalEmotion] = useState(''); // State for selected emotion
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [submitJournalError, setSubmitJournalError] = useState<string | null>(null);
  const [submitJournalSuccess, setSubmitJournalSuccess] = useState(false);
  // Add refreshJournal context later if needed

  // Mood Modal State
  const [selectedMoodLevel, setSelectedMoodLevel] = useState<number | null>(null);
  const [moodComment, setMoodComment] = useState('');
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);
  const [submitMoodError, setSubmitMoodError] = useState<string | null>(null);
  const [submitMoodSuccess, setSubmitMoodSuccess] = useState(false);

  // Energy Modal State
  const [selectedEnergyLevel, setSelectedEnergyLevel] = useState<number | null>(null);
  const [energyComment, setEnergyComment] = useState('');
  const [isSubmittingEnergy, setIsSubmittingEnergy] = useState(false);
  const [submitEnergyError, setSubmitEnergyError] = useState<string | null>(null);
  const [submitEnergySuccess, setSubmitEnergySuccess] = useState(false);

  // New state for selected person IDs
  const [selectedTaskPersonIds, setSelectedTaskPersonIds] = useState<number[]>([]);
  const [selectedJournalPersonIds, setSelectedJournalPersonIds] = useState<number[]>([]);

  // --- Task Modal Logic ---
  const openTaskModal = () => setIsTaskModalOpen(true);
  const closeTaskModal = useCallback(() => {
    if (isSubmittingTask) return;
    setIsTaskModalOpen(false);
    setTimeout(() => {
        setQuickTaskInput('');
        setSubmitTaskError(null);
        setSubmitTaskSuccess(false);
    }, 300);
  }, [isSubmittingTask]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskInput.trim()) return; 
    setIsSubmittingTask(true);
    setSubmitTaskError(null);
    setSubmitTaskSuccess(false);
    try {
      const response = await apiClient.post('/api/quick_task/', { 
        text: quickTaskInput,
        responsible_ids: selectedTaskPersonIds,
        impacted_ids: selectedTaskPersonIds
      });
      
      if (response.status >= 200 && response.status < 300) {
        setSubmitTaskSuccess(true);
        setQuickTaskInput('');
        setSelectedTaskPersonIds([]);
        refreshTasks();
        setTimeout(() => { closeTaskModal(); }, 1000);
      } else {
        throw new Error(`Failed to create task (${response.status})`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create task.';
      setSubmitTaskError(errorMsg);
    } finally {
      setIsSubmittingTask(false);
    }
  };
  // --- End Task Modal Logic ---

  // --- Journal Modal Logic ---
  const openJournalModal = () => setIsJournalModalOpen(true);
  const closeJournalModal = useCallback(() => {
      if (isSubmittingJournal) return;
      setIsJournalModalOpen(false);
      setTimeout(() => {
          setQuickJournalInput('');
          setQuickJournalEmotion(''); // Reset emotion on close
          setSubmitJournalError(null);
          setSubmitJournalSuccess(false);
      }, 300);
  }, [isSubmittingJournal]);

  // --- Handler for selecting an emotion emoji in journal modal ---
  const handleJournalEmotionSelect = (emotionName: string) => {
      setQuickJournalEmotion(prev => prev === emotionName ? '' : emotionName);
      setSubmitJournalError(null); // Clear error on interaction
      setSubmitJournalSuccess(false);
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!quickJournalInput.trim()) return;
      setIsSubmittingJournal(true);
      setSubmitJournalError(null);
      setSubmitJournalSuccess(false);

      try {
          const response = await apiClient.post('/api/quick_journal/', { 
              content: quickJournalInput, 
              emotion: quickJournalEmotion || null,
              related_people_ids: selectedJournalPersonIds
          });
          
          if (response.status >= 200 && response.status < 300) {
              setSubmitJournalSuccess(true);
              setQuickJournalInput('');
              setQuickJournalEmotion('');
              setSelectedJournalPersonIds([]);
              setTimeout(() => { closeJournalModal(); }, 1000);
          } else {
              throw new Error(`Failed to create journal entry (${response.status})`);
          }
      } catch (err: any) {
          const errorMsg = err.message || 'Failed to create journal entry.';
          setSubmitJournalError(errorMsg);
      } finally {
          setIsSubmittingJournal(false);
      }
  };
  // --- End Journal Modal Logic ---

  // --- Mood Modal Logic ---
  const openMoodModal = () => setIsMoodModalOpen(true);
  const closeMoodModal = useCallback(() => {
    if (isSubmittingMood) return;
    setIsMoodModalOpen(false);
    setTimeout(() => {
      setSelectedMoodLevel(null);
      setMoodComment('');
      setSubmitMoodError(null);
      setSubmitMoodSuccess(false);
    }, 300);
  }, [isSubmittingMood]);

  const handleMoodSelect = (level: number) => {
    setSelectedMoodLevel(prev => prev === level ? null : level);
    setSubmitMoodError(null); // Clear error on new selection
    setSubmitMoodSuccess(false); // Clear success message
  };

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMoodLevel === null) {
        setSubmitMoodError("Please select a mood level.");
        return;
    }
    setIsSubmittingMood(true);
    setSubmitMoodError(null);
    setSubmitMoodSuccess(false);
    
    try {
      const response = await apiClient.post('/api/moods/', { 
        level: selectedMoodLevel,
        comment: moodComment.trim() || null 
      });
      
      if (response.status >= 200 && response.status < 300) {
        setSubmitMoodSuccess(true);
        setMoodComment('');
        setSelectedMoodLevel(null); 
        setTimeout(() => { closeMoodModal(); }, 1000);
      } else {
        throw new Error(`Failed to track mood (${response.status})`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to track mood.';
      setSubmitMoodError(errorMsg);
    } finally {
      setIsSubmittingMood(false);
    }
  };
  // --- End Mood Modal Logic ---

  // --- Energy Modal Logic ---
  const openEnergyModal = () => setIsEnergyModalOpen(true);
  const closeEnergyModal = useCallback(() => {
    if (isSubmittingEnergy) return;
    setIsEnergyModalOpen(false);
    setTimeout(() => {
      setSelectedEnergyLevel(null);
      setEnergyComment('');
      setSubmitEnergyError(null);
      setSubmitEnergySuccess(false);
    }, 300);
  }, [isSubmittingEnergy]);

  const handleEnergySelect = (level: number) => {
    setSelectedEnergyLevel(prev => prev === level ? null : level);
    setSubmitEnergyError(null);
    setSubmitEnergySuccess(false);
  };

  const handleEnergySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEnergyLevel === null) {
      setSubmitEnergyError("Please select an energy level.");
      return;
    }
    setIsSubmittingEnergy(true);
    setSubmitEnergyError(null);
    setSubmitEnergySuccess(false);
    
    try {
      const response = await apiClient.post('/api/energy/', { 
        level: selectedEnergyLevel,
        comment: energyComment.trim() || null 
      });
      
      if (response.status >= 200 && response.status < 300) {
        setSubmitEnergySuccess(true);
        setEnergyComment('');
        setSelectedEnergyLevel(null); 
        setTimeout(() => { closeEnergyModal(); }, 1000);
      } else {
        throw new Error(`Failed to track energy (${response.status})`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to track energy.';
      setSubmitEnergyError(errorMsg);
    } finally {
      setIsSubmittingEnergy(false);
    }
  };
  // --- End Energy Modal Logic ---

  return (
    <>
      {/* Main FAB using Popover */}
      <Popover className="fixed bottom-6 right-6 z-40">
        {({ open, close }) => (
          <>
            <Popover.Button 
              className={`inline-flex items-center justify-center w-14 h-14 p-3 border border-transparent rounded-full shadow-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform duration-150 ${open ? 'rotate-45' : 'hover:scale-110'}`}
              aria-label="Quick Add Menu"
            >
              <PlusIcon className="h-7 w-7" aria-hidden="true" />
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95 -translate-y-2"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100 translate-y-0"
              leaveTo="transform opacity-0 scale-95 -translate-y-2"
            >
              <Popover.Panel className="absolute bottom-full right-0 mb-2 w-48 origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <button
                    onClick={() => { openTaskModal(); close(); }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <PencilSquareIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Quick Task
                  </button>
                  <button
                    onClick={() => { openJournalModal(); close(); }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <BookOpenIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Quick Journal
                  </button>
                  {/* New Mood Tracker Button */}
                  <button
                    onClick={() => { openMoodModal(); close(); }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <FaceSmileIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Track Mood
                  </button>
                  <button
                    onClick={() => { openEnergyModal(); close(); }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <BoltIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Track Energy
                  </button>
                  <Link
                    to="/habits"
                    onClick={() => close()}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <ClockIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Daily Habits
                  </Link>
                  {/* Add more quick actions here later */}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>

      {/* Quick Task Modal */}
      <Transition appear show={isTaskModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeTaskModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 sm:translate-y-full"
                enterTo="opacity-100 scale-100 sm:translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 sm:translate-y-0"
                leaveTo="opacity-0 scale-95 sm:translate-y-full"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">Quick Add Task</Dialog.Title>
                    <button type="button" className="text-gray-400 hover:text-gray-500 disabled:opacity-50" onClick={closeTaskModal} disabled={isSubmittingTask}><XMarkIcon className="h-6 w-6" /></button>
                  </div>
                  <form onSubmit={handleTaskSubmit}>
                    <MentionInput
                      value={quickTaskInput}
                      onChange={(value, personIds) => {
                        setQuickTaskInput(value);
                        setSelectedTaskPersonIds(personIds);
                      }}
                      placeholder="Type @ to mention someone..."
                      rows={3}
                    />
                    <div className="mt-4 space-y-2">
                      {submitTaskSuccess && <div className="p-2 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center"><CheckCircleIcon className="h-4 w-4 mr-2" />Task submitted!</div>}
                      {submitTaskError && <div className="p-2 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center"><ExclamationCircleIcon className="h-4 w-4 mr-2" />{submitTaskError}</div>}
                      <button type="submit" className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmittingTask || !quickTaskInput.trim()}> 
                        {isSubmittingTask ? <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/>Adding...</> : 'Add Task'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Quick Journal Modal */}
      <Transition appear show={isJournalModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeJournalModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 sm:translate-y-full"
                enterTo="opacity-100 scale-100 sm:translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 sm:translate-y-0"
                leaveTo="opacity-0 scale-95 sm:translate-y-full"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">Quick Journal Entry</Dialog.Title>
                    <button type="button" className="text-gray-400 hover:text-gray-500 disabled:opacity-50" onClick={closeJournalModal} disabled={isSubmittingJournal}><XMarkIcon className="h-6 w-6" /></button>
                  </div>
                  <form onSubmit={handleJournalSubmit} className="space-y-4">
                    <MentionInput
                      value={quickJournalInput}
                      onChange={(value, personIds) => {
                        setQuickJournalInput(value);
                        setSelectedJournalPersonIds(personIds);
                      }}
                      placeholder="Type @ to mention someone..."
                      rows={4}
                    />
                    
                    {/* Emotion Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emotion (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(emotionsMap).map(([name, emoji]) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleJournalEmotionSelect(name)}
                            className={`p-2 rounded-full text-2xl transition-transform duration-100 ease-in-out ${
                              quickJournalEmotion === name
                                ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                                : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                            }`}
                            title={name.charAt(0).toUpperCase() + name.slice(1)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {submitJournalSuccess && <div className="p-2 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center"><CheckCircleIcon className="h-4 w-4 mr-2" />Journal entry submitted!</div>}
                      {submitJournalError && <div className="p-2 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center"><ExclamationCircleIcon className="h-4 w-4 mr-2" />{submitJournalError}</div>}
                      <button type="submit" className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmittingJournal || !quickJournalInput.trim()}>
                        {isSubmittingJournal ? <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : 'Save Entry'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Quick Mood Tracker Modal */}
      <Transition appear show={isMoodModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeMoodModal}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          {/* Panel Container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-4 text-center">
              {/* Panel Animation */}
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95 sm:translate-y-full" enterTo="opacity-100 scale-100 sm:translate-y-0"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 sm:translate-y-0" leaveTo="opacity-0 scale-95 sm:translate-y-full"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">Track Your Mood</Dialog.Title>
                    <button 
                        type="button" 
                        className="text-gray-400 hover:text-gray-500 disabled:opacity-50" 
                        onClick={closeMoodModal} 
                        disabled={isSubmittingMood}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  {/* Form */}
                  <form onSubmit={handleMoodSubmit} className="space-y-6">
                    {/* Mood Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                      <div className="flex justify-around items-center">
                        {Object.entries(moodMap).map(([levelStr, { emoji, colorClass, label }]) => {
                          const level = parseInt(levelStr);
                          return (
                            <button
                                key={level}
                                type="button"
                                onClick={() => handleMoodSelect(level)}
                                className={`flex flex-col items-center p-3 rounded-lg transition-all duration-150 ease-in-out focus:outline-none
                                            ${selectedMoodLevel === level
                                                ? 'ring-2 ring-primary-500 scale-110 shadow-lg'
                                                : 'hover:scale-105 hover:shadow-md'
                                            }
                                            ${isSubmittingMood ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                title={label}
                                disabled={isSubmittingMood}
                            >
                                <span className={`text-4xl ${colorClass}`}>{emoji}</span>
                                <span className={`mt-1 text-xs font-medium ${selectedMoodLevel === level ? 'text-primary-600' : 'text-gray-600'}`}>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div>
                      <label htmlFor="moodComment" className="block text-sm font-medium text-gray-700">
                        Add a comment (Optional)
                      </label>
                      <textarea
                        id="moodComment"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                        placeholder="Any thoughts to add?"
                        value={moodComment}
                        onChange={(e) => setMoodComment(e.target.value)}
                        disabled={isSubmittingMood}
                      />
                    </div>

                    {/* Submit/Status Area */}
                    <div className="space-y-3 pt-2">
                      {submitMoodSuccess && (
                        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center">
                          <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                          Mood tracked successfully!
                        </div>
                      )}
                      {submitMoodError && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center">
                          <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                          {submitMoodError}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmittingMood || selectedMoodLevel === null}
                      >
                        {isSubmittingMood ? (
                          <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                        ) : (
                          'Track Mood'
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Energy Level Modal */}
      <Transition appear show={isEnergyModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeEnergyModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end sm:items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95 sm:translate-y-full" enterTo="opacity-100 scale-100 sm:translate-y-0"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 sm:translate-y-0" leaveTo="opacity-0 scale-95 sm:translate-y-full"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">Track Your Energy Level</Dialog.Title>
                    <button 
                      type="button" 
                      className="text-gray-400 hover:text-gray-500 disabled:opacity-50" 
                      onClick={closeEnergyModal} 
                      disabled={isSubmittingEnergy}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <form onSubmit={handleEnergySubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">How's your energy level?</label>
                      <div className="grid grid-cols-6 gap-2">
                        {Object.entries(energyMap).map(([levelStr, { emoji, colorClass, label }]) => {
                          const level = parseInt(levelStr);
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => handleEnergySelect(level)}
                              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-150 ease-in-out focus:outline-none
                                        ${selectedEnergyLevel === level
                                          ? 'ring-2 ring-primary-500 scale-110 shadow-lg'
                                          : 'hover:scale-105 hover:shadow-md'
                                        }
                                        ${isSubmittingEnergy ? 'opacity-50 cursor-not-allowed' : ''}
                                      `}
                              title={label}
                              disabled={isSubmittingEnergy}
                            >
                              <span className={`text-2xl ${colorClass}`}>{emoji}</span>
                              <span className={`mt-1 text-xs font-medium ${selectedEnergyLevel === level ? 'text-primary-600' : 'text-gray-600'}`}>{level}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="energyComment" className="block text-sm font-medium text-gray-700">
                        Add a comment (Optional)
                      </label>
                      <textarea
                        id="energyComment"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:opacity-50"
                        placeholder="Any thoughts to add?"
                        value={energyComment}
                        onChange={(e) => setEnergyComment(e.target.value)}
                        disabled={isSubmittingEnergy}
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      {submitEnergySuccess && (
                        <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center">
                          <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                          Energy level tracked successfully!
                        </div>
                      )}
                      {submitEnergyError && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center">
                          <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                          {submitEnergyError}
                        </div>
                      )}
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmittingEnergy || selectedEnergyLevel === null}
                      >
                        {isSubmittingEnergy ? (
                          <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />Submitting...</>
                        ) : (
                          'Track Energy'
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default FloatingActionMenu; 