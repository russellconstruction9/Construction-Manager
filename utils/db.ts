const DB_NAME = 'ConstructTrackProDB';
const PROJECT_PHOTOS_STORE = 'photos';
const PUNCHLIST_PHOTOS_STORE = 'punchlist_photos';
let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // If db is already initialized, resolve it
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, 2); // Version 2 for new store

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(PROJECT_PHOTOS_STORE)) {
        dbInstance.createObjectStore(PROJECT_PHOTOS_STORE);
      }
      if (!dbInstance.objectStoreNames.contains(PUNCHLIST_PHOTOS_STORE)) {
        dbInstance.createObjectStore(PUNCHLIST_PHOTOS_STORE);
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
    if (db) return db;
    return await initDB();
}

// --- Project Photos ---

export const setPhoto = (projectId: number, photoId: number, imageDataUrl: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([PROJECT_PHOTOS_STORE], 'readwrite');
            const store = transaction.objectStore(PROJECT_PHOTOS_STORE);
            const request = store.put(imageDataUrl, `${projectId}-${photoId}`);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Error saving photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getPhoto = (projectId: number, photoId: number): Promise<string | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([PROJECT_PHOTOS_STORE], 'readonly');
            const store = transaction.objectStore(PROJECT_PHOTOS_STORE);
            const request = store.get(`${projectId}-${photoId}`);

            request.onsuccess = () => {
                resolve(request.result ? request.result : null);
            };
            request.onerror = () => {
                console.error('Error getting photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getPhotosForProject = (
    projectId: number, 
    photoMetas: { id: number; description: string; dateAdded: Date }[]
): Promise<{ id: number; url: string; description: string; dateAdded: Date; }[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([PROJECT_PHOTOS_STORE], 'readonly');
            const store = transaction.objectStore(PROJECT_PHOTOS_STORE);
            const photoPromises = photoMetas.map(meta => {
                return new Promise((resolvePhoto, rejectPhoto) => {
                    const request = store.get(`${projectId}-${meta.id}`);
                    request.onsuccess = () => {
                        if (request.result) {
                            resolvePhoto({ ...meta, url: request.result });
                        } else {
                            resolvePhoto(null); 
                        }
                    };
                    request.onerror = () => {
                         console.error(`Error getting photo ${meta.id}:`, request.error);
                         rejectPhoto(request.error);
                    };
                });
            });
            
            const photos = await Promise.all(photoPromises);
            resolve(photos.filter(p => p !== null) as { id: number; url: string; description: string; dateAdded: Date; }[]);

        } catch (error) {
            reject(error);
        }
    });
};

// --- Punch List Photos ---

export const setPunchListPhoto = (photoId: string, imageDataUrl: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([PUNCHLIST_PHOTOS_STORE], 'readwrite');
            const store = transaction.objectStore(PUNCHLIST_PHOTOS_STORE);
            const request = store.put(imageDataUrl, photoId);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Error saving punch list photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getPunchListPhoto = (photoId: string): Promise<string | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([PUNCHLIST_PHOTOS_STORE], 'readonly');
            const store = transaction.objectStore(PUNCHLIST_PHOTOS_STORE);
            const request = store.get(photoId);

            request.onsuccess = () => {
                resolve(request.result ? request.result : null);
            };
            request.onerror = () => {
                console.error('Error getting punch list photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const deletePunchListPhoto = (photoId: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([PUNCHLIST_PHOTOS_STORE], 'readwrite');
            const store = transaction.objectStore(PUNCHLIST_PHOTOS_STORE);
            const request = store.delete(photoId);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Error deleting punch list photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};