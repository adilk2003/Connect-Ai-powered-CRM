
import React, { useState, useEffect } from 'react';
import KanbanColumn from './KanbanColumn';
import { Lead, LeadStatus } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { dataService } from '../services/dataService';
import Modal from './Modal';
import { useToast } from './Toast';

const columns: LeadStatus[] = ['New', 'Qualified', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'];

const Pipeline: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [activeTab, setActiveTab] = useState('Kanban');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLead, setCurrentLead] = useState<Partial<Lead>>({});
    const [isEditing, setIsEditing] = useState(false);

    const { showToast } = useToast();

    const loadLeads = async () => {
        const data = await dataService.getLeads();
        setLeads(data);
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
        e.dataTransfer.setData('leadId', leadId);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: LeadStatus) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.status !== newStatus) {
            const updatedLead = { ...lead, status: newStatus };
            // Optimistic update
            setLeads(leads.map(l => l.id === leadId ? updatedLead : l));
            try {
                await dataService.updateLead(updatedLead);
                showToast(`Deal moved to ${newStatus}`, 'info');
            } catch (error) {
                showToast('Failed to update deal status', 'error');
                loadLeads(); // Revert on error
            }
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleAddNew = () => {
        setCurrentLead({ status: 'New', value: 0 });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleEdit = (lead: Lead) => {
        setCurrentLead({ ...lead });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (currentLead.id && window.confirm('Are you sure you want to delete this deal?')) {
            try {
                await dataService.deleteLead(currentLead.id);
                showToast('Deal deleted successfully', 'success');
                loadLeads();
                setIsModalOpen(false);
            } catch (error) {
                showToast('Failed to delete deal', 'error');
            }
        }
    };

    const handleSaveLead = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentLead.id) {
                await dataService.updateLead(currentLead as Lead);
                showToast('Deal updated successfully', 'success');
            } else {
                await dataService.addLead(currentLead as Omit<Lead, 'id'>);
                showToast('Deal created successfully', 'success');
            }
            loadLeads();
            setIsModalOpen(false);
        } catch (error) {
            showToast('Failed to save deal', 'error');
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-none justify-between items-center">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                     {['Kanban', 'List'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            } px-4 py-1.5 rounded-md text-sm font-medium transition-all`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <button onClick={handleAddNew} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Deal
                </button>
            </div>

            {activeTab === 'Kanban' && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                     <div className="flex h-full gap-6 pb-4 min-w-max">
                        {columns.map(status => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                leads={leads.filter(lead => lead.status === status)}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragStart={handleDragStart}
                                onEdit={handleEdit}
                            />
                        ))}
                    </div>
                </div>
            )}
             {activeTab === 'List' && (
                <div className="bg-white shadow-card rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leads.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleEdit(lead)}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{lead.dealName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{lead.companyName}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${lead.value.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-primary-500">Edit</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Deal' : 'New Deal'}>
                <form onSubmit={handleSaveLead} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Deal Name</label>
                        <input required type="text" value={currentLead.dealName || ''} onChange={e => setCurrentLead({...currentLead, dealName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input required type="text" value={currentLead.companyName || ''} onChange={e => setCurrentLead({...currentLead, companyName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                        <input type="text" value={currentLead.contactName || ''} onChange={e => setCurrentLead({...currentLead, contactName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Value ($)</label>
                        <input required type="number" value={currentLead.value || 0} onChange={e => setCurrentLead({...currentLead, value: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={currentLead.status || 'New'} onChange={e => setCurrentLead({...currentLead, status: e.target.value as LeadStatus})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black">
                            {columns.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Source</label>
                         <select value={currentLead.source || 'Website'} onChange={e => setCurrentLead({...currentLead, source: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-black">
                             <option value="Website">Website</option>
                             <option value="Referral">Referral</option>
                             <option value="LinkedIn">LinkedIn</option>
                             <option value="Cold Email">Cold Email</option>
                             <option value="Other">Other</option>
                         </select>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                        {isEditing && (
                            <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition">
                                Delete Deal
                            </button>
                        )}
                        <div className="flex space-x-3 ml-auto">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Save</button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Pipeline;
