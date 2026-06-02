import { useEffect, useState } from "react";
import { listFiles, uploadFile } from "../api/files";
import type { FileItem } from "../data/files";
import { listCollections } from "../api/collections";
import type { Collection } from "../data/files";

export const useCollections = () => {
  const { data, loading, error } = useFetch(listCollections);
  return { collections: data?.items ?? [], loading, error };
};

function useFetch<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export const useFileList = () => {
  const { data, loading, error } = useFetch(listFiles);
  return { files: data?.items ?? [], loading, error };
};

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (file: File): Promise<boolean> => {
    setUploading(true);
    setError(null);
    try {
      await uploadFile(file);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Upload failed"));
      return false;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
};