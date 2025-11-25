
import React, { useState, useEffect } from 'react';
import { CogIcon } from './icons/CogIcon';
import { UsersIcon } from './icons/UsersIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { UserProfile } from '../types';
import { dataService } from '../services/dataService';
import { useToast } from './Toast';

interface SettingsProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<UserProfile>(user);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
      setFormData(user);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          await dataService.updateUser(formData);
          onUpdateUser(formData);
          showToast('Profile updated successfully', 'success');
      } catch (error) {
          showToast('Failed to update profile', 'error');
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-1">Manage your account preferences and team settings.</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
            <UserCircleIcon className="w-5 h-5 mr-2 text-primary-500" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Profile Information</h3>
        </div>
        <div className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex items-center space-x-6">
                <img className="h-24 w-24 rounded-full object-cover ring-4 ring-gray-50" src={formData.avatar || "https://via.placeholder.com/150"} alt="User" />
                <div>
                <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Change photo</button>
                <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title / Plan</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                </div>
                <div>
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">Avatar URL</label>
                    <input type="text" id="avatar" name="avatar" value={formData.avatar} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                </div>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm disabled:bg-primary-400">
                {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            </form>
        </div>
      </div>
      
      {/* Team Settings */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
             <UsersIcon className="w-5 h-5 mr-2 text-primary-500" />
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Team Members</h3>
        </div>
        <div className="p-6">
             <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <UsersIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">Manage your team</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">Invite colleagues to collaborate on deals and tasks.</p>
                <button className="text-primary-600 font-medium hover:text-primary-700 text-sm">Invite team member &rarr;</button>
             </div>
        </div>
      </div>

       {/* General Settings */}
      <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center">
            <CogIcon className="w-5 h-5 mr-2 text-primary-500" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">General Preferences</h3>
        </div>
        <div className="p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive daily digests of your tasks.</p>
                    </div>
                    <button className="bg-primary-600 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" role="switch" aria-checked="true">
                        <span aria-hidden="true" className="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
