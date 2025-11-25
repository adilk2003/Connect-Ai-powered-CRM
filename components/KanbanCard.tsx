
import React from 'react';
import { Lead } from '../types';

interface KanbanCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void;
  onEdit: (lead: Lead) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ lead, onDragStart, onEdit }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-white p-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing group relative"
    >
      <button 
        onClick={() => onEdit(lead)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <h4 className="font-semibold text-sm text-gray-800 pr-6">{lead.companyName}</h4>
      <p className="text-xs text-gray-500 mt-1">{lead.dealName}</p>
      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-gray-600">{lead.contactName}</p>
        <p className="text-sm font-medium text-green-600">${lead.value.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default KanbanCard;
