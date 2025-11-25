
import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { draftEmail } from '../services/geminiService';
import { dataService } from '../services/dataService';
import Modal from './Modal';
import { useToast } from './Toast';

const Contacts: React.FC = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDrafting, setIsDrafting] = useState(false);
    const [draftedEmail, setDraftedEmail] = useState('');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentContact, setCurrentContact] = useState<Partial<Contact>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { showToast } = useToast();

    // Function to load data from the server
    const loadContacts = async () => {
        setIsLoading(true);
        try {
            const data = await dataService.getContacts();
            // Ensure data is an array before setting
            setContacts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load contacts", error);
            setContacts([]);
            showToast('Failed to load contacts from server', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    // Safe filtering function to prevent crashes if fields are missing
    const filteredContacts = contacts.filter(c => {
        const term = searchTerm.toLowerCase();
        const name = c.name?.toLowerCase() || '';
        const company = c.company?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        
        return name.includes(term) || company.includes(term) || email.includes(term);
    });

    const handleDraftEmail = async (contact: Contact) => {
        setSelectedContact(contact);
        setIsDrafting(true);
        setDraftedEmail('');
        try {
            const draft = await draftEmail(contact.name, 'a friendly follow-up');
            setDraftedEmail(draft);
        } catch (error) {
            console.error(error);
            setDraftedEmail('Error generating email draft.');
            showToast('Failed to generate email draft', 'error');
        }
    };

    const closeDraftModal = () => {
        setIsDrafting(false);
        setDraftedEmail('');
        setSelectedContact(null);
    }

    const handleAddNew = () => {
        setCurrentContact({ status: 'Active' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (contact: Contact) => {
        setCurrentContact({ ...contact });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await dataService.deleteContact(id);
                showToast('Contact deleted successfully', 'success');
                loadContacts(); // Reload from server
            } catch (error) {
                showToast('Failed to delete contact', 'error');
            }
        }
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        // Create a safe contact object ensuring string fields are not undefined
        const contactToSave = {
            ...currentContact,
            company: currentContact.company || '',
            role: currentContact.role || '',
            phone: currentContact.phone || ''
        };

        try {
            if (isEditing && currentContact.id) {
                await dataService.updateContact(contactToSave as Contact);
                showToast('Contact updated successfully', 'success');
            } else {
                await dataService.addContact(contactToSave as Omit<Contact, 'id'>);
                showToast('Contact created successfully', 'success');
            }
            await loadContacts(); // Reload from server
            setIsModalOpen(false);
        } catch (error) {
            showToast('Failed to save contact', 'error');
        }
    };

    const StatusBadge: React.FC<{ status: 'Active' | 'Inactive' }> = ({ status }) => (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            status === 'Active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20'
        }`}>
            {status}
        </span>
    );

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Filter contacts..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={handleAddNew} className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Contact
                </button>
            </div>

            <div className="bg-white shadow-card rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Loading contacts from server...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredContacts.length > 0 ? filteredContacts.map((contact) => (
                                <tr key={contact.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm" src={`https://i.pravatar.cc/150?u=${contact.email}`} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                                                <div className="text-sm text-gray-500">{contact.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">{contact.company || '-'}</div>
                                        <div className="text-sm text-gray-500">{contact.role || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{contact.phone || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={contact.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDraftEmail(contact)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-lg" title="AI Email Draft">
                                                <SparklesIcon className="w-4 h-4"/>
                                            </button>
                                            <button onClick={() => handleEdit(contact)} className="text-gray-500 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(contact.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No contacts found. Add one!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Contact' : 'Add New Contact'}>
                <form onSubmit={handleSaveContact} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input required type="text" value={currentContact.name || ''} onChange={e => setCurrentContact({...currentContact, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email *</label>
                        <input required type="email" value={currentContact.email || ''} onChange={e => setCurrentContact({...currentContact, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input type="text" value={currentContact.phone || ''} onChange={e => setCurrentContact({...currentContact, phone: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Company</label>
                        <input type="text" value={currentContact.company || ''} onChange={e => setCurrentContact({...currentContact, company: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <input type="text" value={currentContact.role || ''} onChange={e => setCurrentContact({...currentContact, role: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={currentContact.status || 'Active'} onChange={e => setCurrentContact({...currentContact, status: e.target.value as any})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">{isLoading ? 'Saving...' : 'Save Contact'}</button>
                    </div>
                </form>
            </Modal>

            {/* Email Draft Modal */}
            {isDrafting && selectedContact && (
                 <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative p-6 w-full max-w-2xl shadow-2xl rounded-2xl bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" />
                                AI Draft for {selectedContact.name}
                            </h3>
                            <button onClick={closeDraftModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            {draftedEmail ? (
                                <textarea className="w-full h-64 p-3 border-0 bg-transparent focus:ring-0 resize-none font-mono text-sm text-gray-800" defaultValue={draftedEmail} />
                            ) : (
                                <div className="flex flex-col justify-center items-center h-64 space-y-3">
                                    <SparklesIcon className="w-8 h-8 text-primary-400 animate-pulse" />
                                    <p className="text-gray-500 font-medium">Generating draft...</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={closeDraftModal}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => { 
                                    navigator.clipboard.writeText(draftedEmail);
                                    showToast('Copied to clipboard', 'success');
                                    closeDraftModal();
                                }}
                                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow-sm"
                            >
                                Copy to Clipboard
                            </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default Contacts;