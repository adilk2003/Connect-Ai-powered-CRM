
import React, { useState, useEffect } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { CalendarEvent } from '../types';
import { dataService } from '../services/dataService';
import Modal from './Modal';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent>>({});
  const [isEditing, setIsEditing] = useState(false);

  const loadEvents = async () => {
      const data = await dataService.getEvents();
      setEvents(data);
  };

  useEffect(() => {
      loadEvents();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return events.filter(e => e.date === dateStr);
  };

  const getEventTypeStyles = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'task': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddNew = (dateStr?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCurrentEvent({ date: dateStr || todayStr, type: 'meeting' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (event: CalendarEvent, e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentEvent({ ...event });
      setIsEditing(true);
      setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (currentEvent.id && window.confirm('Delete this event?')) {
        await dataService.deleteEvent(currentEvent.id);
        loadEvents();
        setIsModalOpen(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentEvent.id) {
        await dataService.updateEvent(currentEvent as CalendarEvent);
    } else {
        await dataService.addEvent(currentEvent as Omit<CalendarEvent, 'id'>);
    }
    loadEvents();
    setIsModalOpen(false);
  };

  const renderCalendarGrid = () => {
    const grid = [];
    const totalSlots = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - firstDayOfMonth + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

      if (!isCurrentMonth) {
        grid.push(
          <div key={`empty-${i}`} className="bg-gray-50 min-h-[120px] border-b border-r border-gray-200"></div>
        );
      } else {
        const dayEvents = getEventsForDay(dayNumber);
        const isToday = 
            dayNumber === new Date().getDate() && 
            currentDate.getMonth() === new Date().getMonth() && 
            currentDate.getFullYear() === new Date().getFullYear();

        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(dayNumber).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;

        grid.push(
          <div 
            key={`day-${dayNumber}`} 
            className={`bg-white min-h-[120px] border-b border-r border-gray-200 p-2 transition hover:bg-gray-50 group relative`}
            onClick={() => handleAddNew(dateStr)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-500 text-white' : 'text-gray-700'}`}>
                {dayNumber}
              </span>
              <button onClick={(e) => { e.stopPropagation(); handleAddNew(dateStr); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary-500">
                 <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {dayEvents.map(event => (
                <div 
                    key={event.id} 
                    onClick={(e) => handleEdit(event, e)}
                    className={`text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80 ${getEventTypeStyles(event.type)}`}
                    title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    return grid;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-50 border-r border-gray-200 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={goToToday} className="px-4 py-2 text-sm font-medium hover:bg-gray-50 text-gray-700">
                Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-50 border-l border-gray-200 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <button onClick={() => handleAddNew()} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition shadow-sm">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Event
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto auto-rows-fr">
             {renderCalendarGrid()}
        </div>
      </div>

       {/* Add/Edit Modal */}
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Event' : 'Add Event'}>
            <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input required type="text" value={currentEvent.title || ''} onChange={e => setCurrentEvent({...currentEvent, title: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-black" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input required type="date" value={currentEvent.date || ''} onChange={e => setCurrentEvent({...currentEvent, date: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-black" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select value={currentEvent.type || 'meeting'} onChange={e => setCurrentEvent({...currentEvent, type: e.target.value as any})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-black">
                        <option value="meeting">Meeting</option>
                        <option value="task">Task</option>
                        <option value="deadline">Deadline</option>
                    </select>
                </div>
                <div className="flex justify-between items-center pt-4">
                    {isEditing && (
                        <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium">
                            Delete Event
                        </button>
                    )}
                    <div className="flex space-x-3 ml-auto">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">Save</button>
                    </div>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default Calendar;