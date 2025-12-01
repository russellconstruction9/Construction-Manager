
const DB_NAME = 'ConstructTrackProDB';
const STORE_NAME = 'photos';
let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    if (!window.indexedDB) {
        return reject(new Error("IndexedDB is not supported in this browser."));
    }

    const request = indexedDB.open(DB_NAME, 1);

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
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
    if (db) return db;
    return await initDB();
}

export const setPhoto = (projectId: number, photoId: number, imageDataUrl: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            if (!imageDataUrl || imageDataUrl.length < 10) {
                return reject(new Error("Invalid image data"));
            }

            const request = store.put(imageDataUrl, `${projectId}-${photoId}`);

            request.onsuccess = () => resolve();
            
            request.onerror = (event) => {
                const error = (event.target as IDBRequest).error;
                if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
                    console.error('Storage quota exceeded');
                    reject(new Error('Storage quota exceeded'));
                } else {
                    console.error('Error saving photo:', error);
                    reject(error || new Error('Unknown DB Error'));
                }
            };
            
            transaction.onabort = (event) => {
                 const error = (event.target as IDBTransaction).error;
                 if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
                     reject(new Error('Storage quota exceeded'));
                 } else {
                     reject(error || new Error('Transaction aborted'));
                 }
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
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(`${projectId}-${photoId}`);

            request.onsuccess = () => {
                resolve(request.result ? request.result : null);
            };
            request.onerror = () => {
                console.error('Error getting photo:', request.error);
                resolve(null);
            };
        } catch (error) {
            console.error('Failed to open DB for reading photo', error);
            resolve(null);
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
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const photoPromises = photoMetas.map(meta => {
                return new Promise((resolvePhoto) => {
                    const request = store.get(`${projectId}-${meta.id}`);
                    request.onsuccess = () => {
                        if (request.result) {
                            resolvePhoto({ ...meta, url: request.result });
                        } else {
                            // Missing binary data for existing metadata
                            resolvePhoto(null); 
                        }
                    };
                    request.onerror = () => {
                         console.error(`Error getting photo ${meta.id}:`, request.error);
                         resolvePhoto(null);
                    };
                });
            });
            
            const photos = await Promise.all(photoPromises);
            resolve(photos.filter(p => p !== null) as { id: number; url: string; description: string; dateAdded: Date; }[]);

        } catch (error) {
            console.error("Failed to load photos from DB:", error);
            resolve([]); 
        }
    });
};
