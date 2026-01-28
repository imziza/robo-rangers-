// Supabase client configuration for Aletheon platform
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client-side operations
export function createSupabaseBrowserClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Standard client for server components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    institution: string | null;
                    specialization: string | null;
                    role: 'archaeologist' | 'researcher' | 'admin';
                    avatar_url: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    institution?: string | null;
                    specialization?: string | null;
                    role?: 'archaeologist' | 'researcher' | 'admin';
                    avatar_url?: string | null;
                };
                Update: {
                    full_name?: string | null;
                    institution?: string | null;
                    specialization?: string | null;
                    role?: 'archaeologist' | 'researcher' | 'admin';
                    avatar_url?: string | null;
                };
            };
            artifacts: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    classification: string | null;
                    description: string | null;
                    material: string | null;
                    era: string | null;
                    region: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    excavation_notes: string | null;
                    ai_report: Record<string, unknown> | null;
                    confidence_score: number | null;
                    status: 'stable' | 'critical' | 'pending';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    classification?: string | null;
                    description?: string | null;
                    material?: string | null;
                    era?: string | null;
                    region?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    excavation_notes?: string | null;
                    ai_report?: Record<string, unknown> | null;
                    confidence_score?: number | null;
                    status?: 'stable' | 'critical' | 'pending';
                };
                Update: {
                    title?: string;
                    classification?: string | null;
                    description?: string | null;
                    material?: string | null;
                    era?: string | null;
                    region?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    excavation_notes?: string | null;
                    ai_report?: Record<string, unknown> | null;
                    confidence_score?: number | null;
                    status?: 'stable' | 'critical' | 'pending';
                };
            };
            artifact_images: {
                Row: {
                    id: string;
                    artifact_id: string;
                    image_url: string;
                    is_primary: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    artifact_id: string;
                    image_url: string;
                    is_primary?: boolean;
                };
                Update: {
                    image_url?: string;
                    is_primary?: boolean;
                };
            };
            similar_artifacts_cache: {
                Row: {
                    id: string;
                    artifact_id: string;
                    results: Record<string, unknown>;
                    cached_at: string;
                };
                Insert: {
                    id?: string;
                    artifact_id: string;
                    results: Record<string, unknown>;
                };
                Update: {
                    results?: Record<string, unknown>;
                };
            };
            groups: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    created_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    created_by: string;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                };
            };
            group_members: {
                Row: {
                    group_id: string;
                    user_id: string;
                    role: 'admin' | 'member';
                    joined_at: string;
                };
                Insert: {
                    group_id: string;
                    user_id: string;
                    role?: 'admin' | 'member';
                };
                Update: {
                    role?: 'admin' | 'member';
                };
            };
            messages: {
                Row: {
                    id: string;
                    sender_id: string;
                    recipient_id: string | null;
                    group_id: string | null;
                    content: string;
                    artifact_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    sender_id: string;
                    recipient_id?: string | null;
                    group_id?: string | null;
                    content: string;
                    artifact_id?: string | null;
                };
                Update: {
                    content?: string;
                };
            };
        };
    };
};
