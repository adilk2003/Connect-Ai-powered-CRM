import React from 'react';
import { XIcon } from './icons/XIcon';

interface InviteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteTeamModal: React.FC<InviteTeamModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <span className="sr-only">Close</span>
          <XIcon className="w-6 h-6" />
        </button>
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Invite a new team member</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              Enter the email address of the person you want to invite. They'll receive an email with instructions to join.
            </p>
          </div>
          <form className="mt-4 px-4" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="teammate@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white text-black"
            />
            <div className="items-center px-4 py-3 mt-4 space-x-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-lg w-auto shadow-sm hover:bg-gray-300 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={onClose} // For demo, just close the modal
                className="px-4 py-2 bg-primary-500 text-white text-base font-medium rounded-lg w-auto shadow-sm hover:bg-primary-600 focus:outline-none"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteTeamModal;