
import React, { useState, useEffect } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { Document } from '../types';
import { dataService } from '../services/dataService';
import Modal from './Modal';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<'All' | 'PDF' | 'DOCX' | 'Sheets'>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const loadDocs = async () => {
      const data = await dataService.getDocuments();
      setDocuments(data);
  };

  useEffect(() => {
      loadDocs();
  }, []);

  const filteredDocs = documents.filter(doc => {
      if (filter === 'All') return true;
      if (filter === 'Sheets') return doc.type === 'XLSX';
      return doc.type === filter;
  });

  const getIconColor = (type: Document['type']) => {
    switch (type) {
      case 'PDF': return 'text-red-500';
      case 'DOCX': return 'text-blue-500';
      case 'XLSX': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Are you sure you want to delete this document?')) {
          await dataService.deleteDocument(id);
          loadDocs();
      }
  };

  const handleUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      if (uploadFile) {
          // Mock upload logic
          const extension = uploadFile.name.split('.').pop()?.toUpperCase();
          let type: Document['type'] = 'IMG'; // Default
          if (extension === 'PDF') type = 'PDF';
          if (extension === 'DOCX' || extension === 'DOC') type = 'DOCX';
          if (extension === 'XLSX' || extension === 'XLS') type = 'XLSX';

          const newDoc: Omit<Document, 'id'> = {
              name: uploadFile.name,
              type: type,
              size: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
              dateModified: new Date().toISOString().split('T')[0],
              owner: 'You'
          };

          await dataService.addDocument(newDoc);
          loadDocs();
          setIsUploadModalOpen(false);
          setUploadFile(null);
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Documents</h2>
        <div className="flex space-x-3">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search documents..." 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-black"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition shadow-sm">
                <PlusIcon className="w-5 h-5 mr-2" />
                Upload
            </button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 pb-4">
          {(['All', 'PDF', 'DOCX', 'Sheets'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                  {f}
              </button>
          ))}
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Modified</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                  <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 ${getIconColor(doc.type)}`}>
                                      <DocumentTextIcon className="w-6 h-6" />
                                  </div>
                                  <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                      <div className="text-xs text-gray-500">{doc.type} File</div>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.dateModified}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.size}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.owner}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-primary-500 hover:text-primary-700 mr-4">Download</button>
                              <button onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-600">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {filteredDocs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                  No documents found matching your filter.
              </div>
          )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document">
          <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition">
                  <input 
                      type="file" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
                  />
                  <p className="mt-2 text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={!uploadFile} className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:bg-gray-300">Upload</button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Documents;