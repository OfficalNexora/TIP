const { supabase } = require('./supabaseClient');

// Institutional Storage Abstraction - Switched to Supabase Storage
const BUCKET_NAME = 'audit-uploads';

class StorageService {
    /**
     * Uploads a file to Supabase Storage.
     * @param {string} filename 
     * @param {Buffer} buffer 
     * @param {string} mimeType 
     * @returns {Promise<{path: string, error: Error}>}
     */
    async uploadFile(filename, buffer, mimeType) {
        // Sanitize filename to prevent URL issues (Supabase can return HTML 400s on bad paths)
        const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_');
        const uniquePath = `${Date.now()}-${cleanName}`;

        console.log(`[Storage] Uploading ${buffer.length} bytes to ${uniquePath} (${mimeType})`);

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(uniquePath, buffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            console.error('[Storage] Upload failed:', error);
            return { error };
        }

        return { path: data.path };
    }

    /**
     * Delete a file from storage.
     * @param {string} filePath 
     */
    async deleteFile(filePath) {
        try {
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([filePath]);

            if (error) throw error;
        } catch (error) {
            console.error(`[Storage] Failed to delete ${filePath}:`, error.message);
        }
    }

    /**
     * Downloads a file from Supabase Storage.
     * @param {string} storagePath 
     * @returns {Promise<Buffer>}
     */
    async downloadFile(storagePath) {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(storagePath);

        if (error) {
            throw new Error(`Failed to download file: ${error.message}`);
        }

        // Convert Blob to Buffer
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}

module.exports = new StorageService();
