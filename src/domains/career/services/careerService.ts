import { supabaseBrowser } from '@/src/services/supabase';
import type { SavedResume, UserProfile } from '@/src/domains/career/types';
import { extractResumeText } from '@/src/domains/intelligence/actions';

/**
 * Career Domain Service
 * Handles persistence for User Profiles and Resumes via Supabase
 */

// --- Profile Operations ---

export const fetchProfile = async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabaseBrowser
        .from('profiles')
        .select('full_name, linkedin_url, portfolio_url, settings')
        .eq('id', user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            console.warn('Profile not found for user:', user.id);
            return {
                email: user.email || '',
                activeResumeId: null,
                fullName: '',
                linkedinUrl: '',
                portfolioUrl: ''
            };
        }
        console.error('Error fetching profile for user:', user.id);
        return null;
    }

    // Map DB columns to Type
    return {
        email: user.email || '',
        fullName: data.full_name || '',
        linkedinUrl: data.linkedin_url || '',
        portfolioUrl: data.portfolio_url || '',
        activeResumeId: data.settings?.active_resume_id || null,
    };
};

export const updateProfile = async (profile: Partial<UserProfile>) => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Prepare updates for columns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (profile.linkedinUrl !== undefined) updates.linkedin_url = profile.linkedinUrl;
    if (profile.portfolioUrl !== undefined) updates.portfolio_url = profile.portfolioUrl;

    // 2. Prepare updates for settings (activeResumeId)
    // We need to fetch existing settings first to merge, or use jsonb_set (simpler to merge in JS)
    if (profile.activeResumeId !== undefined) {
        // Optimistic merge assuming settings exists
        // In a real app we might want a stored procedure or careful merge
        const current = await fetchProfile() || {};
        updates.settings = {
            active_resume_id: profile.activeResumeId
        };
    }

    // UPSERT Trigger handles creation on signup, so this is just UPDATE usually
    const { error } = await supabaseBrowser
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) throw error;
};

// --- Resume Operations ---

export const getResumes = async (): Promise<SavedResume[]> => {
    const { data, error } = await supabaseBrowser
        .from('resumes')
        .select('*')
        .order('upload_date', { ascending: false });

    if (error) {
        console.error('Error fetching resumes:', JSON.stringify(error, null, 2));
        return [];
    }

    return data.map(row => ({
        id: row.id,
        fileName: row.file_name,
        textParams: row.text_content || '',
        uploadDate: new Date(row.upload_date),
        file: undefined // We don't download the binary file list-view
    }));
};

export const uploadResume = async (file: File): Promise<SavedResume> => {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Upload to Storage
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { data: storageData, error: storageError } = await supabaseBrowser.storage
        .from('resumes')
        .upload(path, file);

    if (storageError) throw storageError;

    // 2. Extract Text (Server Action)
    // Convert File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    let extractedText = '';

    try {
        extractedText = await extractResumeText(base64, file.type);
    } catch (err) {
        console.error('Failed to extract text during upload:', err);
        // Proceed with empty text? Or fail? 
        // Usually better to fail or mark as 'processing'
        // For now we allow it but log it
    }

    // 3. Insert into DB
    const { data, error } = await supabaseBrowser
        .from('resumes')
        .insert({
            user_id: user.id,
            file_path: path,
            file_name: file.name,
            text_content: extractedText,
            metadata: {} // TODO: Structured parsing if needed
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        fileName: data.file_name,
        textParams: data.text_content,
        uploadDate: new Date(data.upload_date),
        file: file // Return original file object for local state immediately
    };
};

export const deleteResume = async (id: string, filePath?: string) => {
    // Verify file_path if not provided
    let path = filePath;
    if (!path) {
        const { data } = await supabaseBrowser.from('resumes').select('file_path').eq('id', id).single();
        path = data?.file_path;
    }

    // 1. Delete from DB (Cascade should not handle storage, so manual delete)
    const { error: dbError } = await supabaseBrowser
        .from('resumes')
        .delete()
        .eq('id', id);

    if (dbError) throw dbError;

    // 2. Delete from Storage
    if (path) {
        await supabaseBrowser.storage.from('resumes').remove([path]);
    }
};
