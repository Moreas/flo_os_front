import React, { useState } from 'react';
import BookList from '../components/BookList';
import CourseList from '../components/CourseList';
import BookForm from '../components/forms/BookForm';
import CourseForm from '../components/forms/CourseForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const LearningPage: React.FC = () => {
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = ['Books', 'Courses'];

  const handleItemCreated = () => {
    setRefreshKey(prev => prev + 1);
    setIsBookFormOpen(false);
    setIsCourseFormOpen(false);
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Learning
          </h2>
        </div>
      </div>

      <div className="w-full">
        <Tab.Group>
          <div className="flex items-center justify-between mb-4">
            <Tab.List className="flex space-x-1 rounded-xl bg-primary-100 p-1">
              {categories.map((category) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 px-6 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-primary-700 shadow'
                        : 'text-primary-600 hover:bg-white/[0.12] hover:text-primary-800'
                    )
                  }
                >
                  {category}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {({ selectedIndex }) => (
                <button
                  onClick={() => selectedIndex === 0 ? setIsBookFormOpen(true) : setIsCourseFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  New {selectedIndex === 0 ? 'Book' : 'Course'}
                </button>
              )}
            </Tab.Panels>
          </div>

          <Tab.Panels>
            <Tab.Panel>
              <BookList key={refreshKey} />
            </Tab.Panel>
            <Tab.Panel>
              <CourseList key={refreshKey} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      <BookForm
        isOpen={isBookFormOpen}
        onClose={() => setIsBookFormOpen(false)}
        onBookCreated={handleItemCreated}
      />

      <CourseForm
        isOpen={isCourseFormOpen}
        onClose={() => setIsCourseFormOpen(false)}
        onCourseCreated={handleItemCreated}
      />
    </div>
  );
};

export default LearningPage; 