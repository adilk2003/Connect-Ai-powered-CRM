
import React, { useState, useEffect } from 'react';
import { Email as EmailType } from '../types';
import { dataService } from '../services/dataService';
import { PlusIcon } from './icons/PlusIcon';
import Modal from './Modal';

const Email: React.FC = () => {
    const [emails, setEmails] = useState<EmailType[]>([]);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<EmailType | null>(null);
    
    // Compose State
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });

    useEffect(() => {
        loadEmails();
    }, []);

    const loadEmails = async () => {
        const data = await dataService.getEmails();
        setEmails(data);
    };

    const filteredEmails = emails.filter(e => e.folder === activeFolder);

    const handleSelectEmail = async (email: EmailType) => {
        setSelectedEmail(email);
        if (!email.read) {
            await dataService.markEmailRead(email.id);
            loadEmails(); // Refresh to show read status
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        await dataService.deleteEmail(id);
        loadEmails();
        if (selectedEmail?.id === id) {
            setSelectedEmail(null);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const newEmail: Omit<EmailType, 'id'> = {
            from: 'You',
            to: composeData.to,
            subject: composeData.subject,
            body: composeData.body,
            timestamp: new Date().toISOString(),
            folder: 'sent',
            read: true,
            avatar: 'https://i.pravatar.cc/150?u=me'
        };
        await dataService.addEmail(newEmail);
        loadEmails();
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '' });
        setActiveFolder('sent'); // Switch view to sent
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-card overflow-hidden border border-gray-200">
            {/* Sidebar - Folders */}
            <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col py-4">
                <div className="px-4 mb-4">
                    <button 
                        onClick={() => setIsComposeOpen(true)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg shadow-sm hover:bg-gray-800 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Compose
                    </button>
                </div>
                <nav className="space-y-1 px-2">
                    {['inbox', 'sent', 'drafts', 'trash'].map((folder) => (
                        <button
                            key={folder}
                            onClick={() => { setActiveFolder(folder as any); setSelectedEmail(null); }}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg capitalize ${
                                activeFolder === folder 
                                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            {folder}
                            {folder === 'inbox' && (
                                <span className="ml-auto bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full text-xs">
                                    {emails.filter(e => e.folder === 'inbox' && !e.read).length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Email List */}
            <div className={`${selectedEmail ? 'hidden md:block md:w-1/3' : 'w-full'} flex flex-col border-r border-gray-200`}>
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-bold text-gray-900 capitalize">{activeFolder}</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredEmails.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Folder is empty</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {filteredEmails.map(email => (
                                <li 
                                    key={email.id} 
                                    onClick={() => handleSelectEmail(email)}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-50/50' : ''} ${!email.read ? 'bg-white' : 'bg-gray-50/30'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center">
                                            {email.avatar ? (
                                                <img src={email.avatar} alt="" className="w-6 h-6 rounded-full mr-2" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {email.from.charAt(0)}
                                                </div>
                                            )}
                                            <span className={`text-sm ${!email.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {email.from}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatDate(email.timestamp)}</span>
                                    </div>
                                    <h4 className={`text-sm mb-1 ${!email.read ? 'font-bold text-gray-900' : 'text-gray-800'}`}>
                                        {email.subject}
                                    </h4>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {email.body}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Reading Pane */}
            {selectedEmail ? (
                <div className="flex-1 flex flex-col bg-white w-full md:w-auto">
                     {/* Mobile Back Button */}
                     <div className="md:hidden p-4 border-b border-gray-200">
                        <button onClick={() => setSelectedEmail(null)} className="text-sm text-primary-600 font-medium flex items-center">
                            ← Back to list
                        </button>
                     </div>

                    <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            {selectedEmail.avatar ? (
                                <img src={selectedEmail.avatar} alt="" className="w-12 h-12 rounded-full" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                                    {selectedEmail.from.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedEmail.subject}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <span className="font-medium text-gray-900 mr-2">{selectedEmail.from}</span>
                                    <span>to {selectedEmail.to}</span>
                                    <span className="mx-2">•</span>
                                    <span>{formatDate(selectedEmail.timestamp)} {formatTime(selectedEmail.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                             <button 
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                onClick={() => handleDelete(selectedEmail.id)}
                                title="Delete"
                             >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto">
                        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                            {selectedEmail.body}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                         <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                            Reply
                         </button>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50/50 text-gray-400">
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>Select an email to read</p>
                </div>
            )}

            {/* Compose Modal */}
            <Modal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} title="New Message">
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700">To</label>
                         <input 
                            type="text" 
                            required
                            value={composeData.to}
                            onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Subject</label>
                         <input 
                            type="text" 
                            required
                            value={composeData.subject}
                            onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Message</label>
                         <textarea 
                            rows={6}
                            required
                            value={composeData.body}
                            onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black resize-none"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setIsComposeOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Discard
                        </button>
                        <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center">
                             Send Message
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Email;