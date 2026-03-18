import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName } from "@/lib/file-utils";

const BUCKET_NAME = 'session-files';

export const storageService = {
  uploadSessionAudio: async (
    userId: string,
    patientId: string,
    sessionId: string,
    file: File
  ): Promise<{ path: string; name: string }> => {
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(file.name);
    const filePath = `${userId}/${patientId}/${sessionId}/${timestamp}-${sanitizedName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    return {
      path: filePath,
      name: file.name
    };
  },

  deleteFile: async (path: string): Promise<void> => {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
  },

  getSignedUrl: async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600); // 1 hora de validade

    if (error) throw error;
    return data.signedUrl;
  }
};