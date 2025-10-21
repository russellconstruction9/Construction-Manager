import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import { Project, Task } from '../types';
// FIX: Corrected date-fns imports to use subpaths for tree-shaking and to resolve module errors.
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isSameDay } from 'date-fns/isSameDay';
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import { isWithinInterval } from 'date-fns/isWithinInterval';
import ProjectFilter from './ProjectFilter';
import DayViewModal from './DayViewModal';
import { ChevronLeftIcon } from './icons/Icons'; // Using ChevronLeft for prev month
import { PlusIcon } from './icons/Icons'; // Using PlusIcon as a placeholder for next month

const projectColors = [
  'bg-blue-200 text-blue-800 border-blue-300',
  'bg-green-200 text-green-800 border-green-300',
  'bg-purple-200 text-purple-800 border-purple-300',
  'bg-amber-200 text-amber-800 border-amber-300',
  'bg-pink-200 text-pink-800 border-pink-300',
  'bg-teal-200 text-teal-800 border-teal-300',
];

const getProjectColor = (projectId: number) => projectColors[projectId % projectColors.length];

const Schedule: React.FC = () => {
  const { projects, tasks } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>(() =>
    projects.map((p) => p.id)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const filteredProjects = useMemo(
    () => projects.filter((p) => selectedProjectIds.includes(p.id)),
    [projects, selectedProjectIds]
  );

  const eventsByDate = useMemo(() => {
    const events: { [key: string]: { tasks: Task[]; projects: Project[] } } = {};
    days.forEach((day) => {
      const isoDate = day.toISOString().split('T')[0];
      events[isoDate] = { tasks: [], projects: [] };
    });

    tasks.forEach((task) => {
      if (selectedProjectIds.includes(task.projectId)) {
        const taskDate = task.dueDate.toISOString().split('T')[0];
        if (events[taskDate]) {
          events[taskDate].tasks.push(task);
        }
      }
    });

    filteredProjects.forEach((project) => {
      const projectInterval = { start: project.startDate, end: project.endDate };
      days.forEach((day) => {
        if (isWithinInterval(day, projectInterval)) {
          const dayDate = day.toISOString().split('T')[0];
          events[dayDate].projects.push(project);
        }
      });
    });

    return events;
  }, [days, tasks, filteredProjects, selectedProjectIds]);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
      <div className="lg:w-1/4 xl:w-1/5">
        <ProjectFilter
          projects={projects}
          selectedProjectIds={selectedProjectIds}
          setSelectedProjectIds={setSelectedProjectIds}
        />
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 w-40 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeftIcon className="w-6 h-6 rotate-180" />
            </button>
          </div>
          <button onClick={today} className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50">
            Today
          </button>
        </header>

        <div className="grid grid-cols-7 flex-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-bold text-sm text-gray-500 py-2 border-b border-r">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = eventsByDate[day.toISOString().split('T')[0]];
            return (
              <div
                key={day.toString()}
                className={`border-b border-r p-2 flex flex-col cursor-pointer hover:bg-blue-50 transition-colors relative ${
                  !isSameMonth(day, currentDate) ? 'bg-gray-50' : ''
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={`text-sm font-semibold ${
                    isSameDay(day, new Date())
                      ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                      : ''
                  }`}
                >
                  {format(day, 'd')}
                </time>
                <div className="mt-1 space-y-1 overflow-y-auto flex-1">
                    {dayEvents?.projects.slice(0, 2).map((project) => (
                        <div key={`proj-${project.id}`} className={`px-2 py-0.5 text-xs font-semibold rounded truncate ${getProjectColor(project.id)}`}>
                            {project.name}
                        </div>
                    ))}
                    {dayEvents?.tasks.slice(0, 2).map((task) => (
                        <div key={`task-${task.id}`} className="px-2 py-0.5 text-xs bg-gray-200 rounded truncate">
                            {task.title}
                        </div>
                    ))}
                    {((dayEvents?.projects.length || 0) + (dayEvents?.tasks.length || 0)) > 4 && (
                        <div className="text-xs text-gray-500 font-semibold mt-1">
                            + {((dayEvents?.projects.length || 0) + (dayEvents?.tasks.length || 0)) - 4} more
                        </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedDate && (
        <DayViewModal
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
            events={eventsByDate[selectedDate.toISOString().split('T')[0]]}
        />
      )}
    </div>
  );
};

export default Schedule;