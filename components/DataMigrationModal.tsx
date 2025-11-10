import React, { useState } from 'react';
import { useData } from '../hooks/useDataContext';
import Button from './Button';
import Modal from './Modal';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataMigrationModal: React.FC<DataMigrationModalProps> = ({ isOpen, onClose }) => {
  const { migrateFromLocalStorage, users, isLoading } = useData();
  const [migrating, setMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there's local data to migrate
  const hasLocalData = () => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('scc_users') || '[]');
      const localProjects = JSON.parse(localStorage.getItem('scc_projects') || '[]');
      const localTasks = JSON.parse(localStorage.getItem('scc_tasks') || '[]');
      const localInventory = JSON.parse(localStorage.getItem('scc_inventory') || '[]');
      
      return localUsers.length > 0 || localProjects.length > 0 || localTasks.length > 0 || localInventory.length > 0;
    } catch {
      return false;
    }
  };

  const getLocalDataSummary = () => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('scc_users') || '[]');
      const localProjects = JSON.parse(localStorage.getItem('scc_projects') || '[]');
      const localTasks = JSON.parse(localStorage.getItem('scc_tasks') || '[]');
      const localInventory = JSON.parse(localStorage.getItem('scc_inventory') || '[]');
      
      return {
        users: localUsers.length,
        projects: localProjects.length,
        tasks: localTasks.length,
        inventory: localInventory.length,
      };
    } catch {
      return { users: 0, projects: 0, tasks: 0, inventory: 0 };
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setError(null);
    
    try {
      await migrateFromLocalStorage();
      setMigrationComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) return null;

  const localData = getLocalDataSummary();
  const hasData = hasLocalData();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Migration">
      <div className="space-y-4">
        {!hasData ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Local Data Found</h3>
            <p className="text-gray-500">
              {users.length > 0 
                ? "Your data is already stored in the cloud database."
                : "No local data to migrate. You can start adding data directly to the cloud database."
              }
            </p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : migrationComplete ? (
          <div className="text-center py-8">
            <div className="text-green-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Migration Complete!</h3>
            <p className="text-gray-500 mb-4">
              Your local data has been successfully migrated to the cloud database.
              Local storage has been cleared.
            </p>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Migrate Local Data to Cloud
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Local Data Found:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>Users: {localData.users}</div>
                <div>Projects: {localData.projects}</div>
                <div>Tasks: {localData.tasks}</div>
                <div>Inventory Items: {localData.inventory}</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> This will migrate your local data to the cloud database and clear local storage. 
                    Make sure you have a stable internet connection.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={onClose}
                disabled={migrating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMigrate}
                disabled={migrating || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {migrating ? 'Migrating...' : 'Migrate to Cloud'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DataMigrationModal;