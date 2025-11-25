
import React, { useState, useEffect, useRef } from 'react';
import { View, UserProfile } from '../types';
import { LogoIcon } from './icons/LogoIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CogIcon } from './icons/CogIcon';


interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    onLogout: () => void;
    onInviteClick: () => void;
    onMenuClick?: () => void;
    user: UserProfile;
}

const dummyNotifications = [
    { id: 1, message: 'New lead assigned: Innovate Inc.', time: '5m ago', read: false },
    { id: 2, message: 'Task "Prepare proposal" is due today.', time: '1h ago', read: false },
    { id: 3, message: 'Deal "Website Redesign" moved to Won.', time: 'Yesterday', read: true },
];


const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onLogout, onInviteClick, onMenuClick, user }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getViewTitle = (view: View) => {
        switch(view) {
            case 'Dashboard': return 'Overview';
            case 'Pipeline': return 'Sales Pipeline';
            default: return view;
        }
    }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                {/* Left Section: Menu & Title */}
                <div className="flex items-center gap-4">
                     <button 
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                     >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                     </button>
                    <h1 className="text-xl font-bold text-gray-900 hidden sm:block">
                        {getViewTitle(currentView)}
                    </h1>
                </div>

                {/* Right Section: Search, Actions, Profile */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="relative hidden md:block w-64 lg:w-80">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                        <input
                            className="w-full py-2 pl-10 pr-4 text-sm text-gray-900 bg-gray-100 border-transparent rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                            type="text"
                            placeholder="Search contacts, deals..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                             <kbd className="hidden lg:inline-flex items-center border border-gray-200 rounded px-2 text-xs font-sans font-medium text-gray-400">⌘K</kbd>
                        </div>
                    </div>

                     {/* Notification Bell */}
                     <div className="relative" ref={notificationsRef}>
                        <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none">
                            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-primary-500 ring-2 ring-white"></span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M12 21C13.1046 21 14 20.1046 14 19H10C10 20.1046 10.8954 21 12 21Z" />
                            </svg>
                        </button>
                        {isNotificationsOpen && (
                             <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-card border border-gray-100 z-20 overflow-hidden animate-fade-in-down">
                                <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
                                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                                    <span className="text-xs text-primary-600 font-medium cursor-pointer hover:text-primary-700">Mark all read</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {dummyNotifications.map(notification => (
                                        <a href="#" key={notification.id} className={`block px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notification.read ? 'bg-primary-50/30' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <p className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>{notification.message}</p>
                                                {!notification.read && <span className="h-2 w-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0 ml-2"></span>}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                        </a>
                                    ))}
                                </div>
                                <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-100">
                                    <a href="#" className="text-xs font-medium text-gray-500 hover:text-gray-900">View all history</a>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none group">
                            <img className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-primary-100 transition-all object-cover" src={user.avatar || "https://via.placeholder.com/150"} alt="User" />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.title}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 hidden md:block group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card border border-gray-100 z-20 py-1 animate-fade-in-down">
                                <div className="px-4 py-3 border-b border-gray-50">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="py-1">
                                    <button
                                        onClick={() => { setCurrentView('Settings'); setIsProfileOpen(false); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        <CogIcon className="w-4 h-4 mr-2 text-gray-400" />
                                        Account Settings
                                    </button>
                                    <button 
                                        onClick={() => { onInviteClick(); setIsProfileOpen(false); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        <PlusIcon className="w-4 h-4 mr-2 text-gray-400" />
                                        Invite Members
                                    </button>
                                </div>
                                <div className="border-t border-gray-50 py-1">
                                    <button
                                        onClick={onLogout}
                                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </header>
  );
};

export default Header;
