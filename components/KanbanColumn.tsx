
import React from 'react';
import KanbanCard from './KanbanCard';
import { Lead, LeadStatus } from '../types';

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: LeadStatus) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void;
  onEdit: (lead: Lead) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, leads, onDrop, onDragOver, onDragStart, onEdit }) => {
    const columnTotal = leads.reduce((sum, lead) => sum + lead.value, 0);

    return (
        <div
            className="bg-gray-100 rounded-lg p-3 flex flex-col min-w-[280px]"
            onDrop={(e) => onDrop(e, status)}
            onDragOver={onDragOver}
        >
            <div className="p-2">
                <h3 className="font-bold text-gray-800">{status} ({leads.length})</h3>
                <p className="text-sm text-gray-600">${columnTotal.toLocaleString()}</p>
            </div>
            <div className="flex-1 space-y-3 mt-3 overflow-y-auto">
                {leads.map(lead => (
                    <KanbanCard key={lead.id} lead={lead} onDragStart={onDragStart} onEdit={onEdit} />
                ))}
            </div>
        </div>
    );
};

export default KanbanColumn;
