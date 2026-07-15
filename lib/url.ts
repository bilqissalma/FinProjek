const STORAGE_URL = (
    process.env.NEXT_PUBLIC_STORAGE_URL ||
    'http://127.0.0.1:8000/storage'
  ).replace(/\/+$/, '');
  
  export const getStorageUrl = (
    path?: string | null
  ): string => {
    if (!path) {
      return '/images/default-avatar.png';
    }
  
    if (
      path.startsWith('http://') ||
      path.startsWith('https://')
    ) {
      return path;
    }
  
    const cleanPath = path.replace(/^\/+/, '');
  
    return `${STORAGE_URL}/${cleanPath}`;
  };