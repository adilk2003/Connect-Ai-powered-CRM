
import React from 'react';
import { View } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { CogIcon } from './icons/CogIcon';
import { LogoIcon } from './icons/LogoIcon';
import { MailIcon } from './icons/MailIcon';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onInviteClick: () => void;
}

const NavItem: React.FC<{
  viewName: View;
  currentView: View;
  setCurrentView: (view: View) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ viewName, currentView, setCurrentView, icon, label }) => {
    const isActive = currentView === viewName;
    return (
        <li>
            <button
            onClick={() => setCurrentView(viewName)}
            className={`flex items-center w-full p-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive
                ? 'bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            >
            <span className={`${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                {icon}
            </span>
            <span className="ml-3">{label}</span>
            {isActive && <span className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full"></span>}
            </button>
        </li>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onInviteClick }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center h-16 px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <div className="bg-primary-50 p-1.5 rounded-lg">
                <LogoIcon className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Connect CRM</span>
        </div>
      </div>
      
      <div className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Overview</p>
            <ul className="space-y-1">
            <NavItem
                viewName="Dashboard"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<ChartBarIcon className="w-5 h-5" />}
                label="Dashboard"
            />
            <NavItem
                viewName="Reports"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<ChartBarIcon className="w-5 h-5 rotate-180" />} // Differentiating icon slightly
                label="Analytics"
            />
            </ul>
        </div>

        <div className="mt-8 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Management</p>
            <ul className="space-y-1">
             <NavItem
                viewName="Email"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<MailIcon className="w-5 h-5" />}
                label="Email"
            />
            <NavItem
                viewName="Contacts"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<UsersIcon className="w-5 h-5" />}
                label="Contacts"
            />
            <NavItem
                viewName="Pipeline"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<ClipboardListIcon className="w-5 h-5" />}
                label="Pipeline"
            />
            <NavItem
                viewName="Tasks"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<ClipboardListIcon className="w-5 h-5" />} // Reuse icon but separate section
                label="Tasks"
            />
             <NavItem
                viewName="Calendar"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<CalendarIcon className="w-5 h-5" />}
                label="Calendar"
            />
             <NavItem
                viewName="Documents"
                currentView={currentView}
                setCurrentView={setCurrentView}
                icon={<DocumentTextIcon className="w-5 h-5" />}
                label="Documents"
            />
            </ul>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
         <ul className="space-y-1 mb-4">
             <NavItem
              viewName="Settings"
              currentView={currentView}
              setCurrentView={setCurrentView}
              icon={<CogIcon className="w-5 h-5" />}
              label="Settings"
            />
         </ul>
        
        <button 
            onClick={onInviteClick}
            className="flex items-center justify-center w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
        >
            <PlusIcon className="w-4 h-4 mr-2 text-gray-500" />
            Invite Member
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
