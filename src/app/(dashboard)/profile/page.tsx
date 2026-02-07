'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    MapPin,
    Globe,
    BookOpen,
    Shield,
    Settings,
    Edit3,
    Save,
    X,
    Camera,
    Trophy,
    Users,
    Clock
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, ArtifactCard } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';

interface ProfileData {
    id: string;
    full_name: string | null;
    institution: string | null;
    specialization: string | null;
    role: string;
    avatar_url: string | null;
    cover_url: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    created_at: string;
}

const AVATAR_PRESETS = [
    { id: 'male_scholar', url: '/presets/avatars/male_scholar_1.png', label: 'Senior Scholar' },
    { id: 'female_researcher', url: '/presets/avatars/female_researcher_1.png', label: 'Field Researcher' },
    { id: 'male_indy', url: '/presets/avatars/male_indy_1.png', label: 'Expedition Lead' },
    { id: 'female_scholar', url: '/presets/avatars/female_scholar_1.png', label: 'Archival Specialist' },
];

const BACKGROUND_PRESETS = [
    { id: 'dramatic_dig', url: '/presets/backgrounds/dramatic_dig_1.png', label: 'The Excavation' },
    { id: 'quote_cover', url: '/presets/backgrounds/quote_cover_1.png', label: 'Whispers of Old' },
];

export default function ProfilePage() {
    const supabase = createSupabaseBrowserClient();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Edit state
    const [editData, setEditData] = useState<Partial<ProfileData>>({});

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
                setEditData(data);

                // Load user's artifacts
                const { data: artData } = await supabase
                    .from('artifacts')
                    .select('*, artifact_images(image_url)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(6);

                setArtifacts(artData || []);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editData.full_name?.trim()) {
            showToast('Identity record requires a name for archival integrity.', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editData.full_name,
                    institution: editData.institution,
                    specialization: editData.specialization,
                    bio: editData.bio,
                    location: editData.location,
                    website: editData.website,
                    avatar_url: editData.avatar_url,
                    cover_url: editData.cover_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile?.id);

            if (error) throw error;

            setProfile(prev => ({ ...prev, ...editData } as ProfileData));
            setIsEditing(false);
            showToast('Archival identity updated successfully.', 'success');
        } catch (error: any) {
            console.error('Archival update failure:', error);
            showToast(`Protocol Error: ${error.message || 'Identity synchronization failed.'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.shimmer} />
                <p>SYNCHRONIZING SCHOLARLY IDENTITY...</p>
            </div>
        );
    }

    if (!profile) return <div>Failed to load profile.</div>;

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.coverImage}>
                    {profile.cover_url ? (
                        <img src={profile.cover_url} alt="Cover" />
                    ) : (
                        <img
                            src="/cover-main.png"
                            alt="Archival Cover"
                            className={styles.defaultCover}
                        />
                    )}
                    <div className={styles.coverOverlay} />
                    <div className={styles.quoteOverlay}>
                        <p className={styles.coverQuote}>"Every artifact is a whisper from a ghost, waiting for its story to be told."</p>
                    </div>
                </div>

                <div className={styles.profileHeader}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatar}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || 'User'} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <User size={48} strokeWidth={1} />
                                </div>
                            )}
                            {isEditing && (
                                <button className={styles.changeAvatarBtn}>
                                    <Camera size={20} />
                                </button>
                            )}
                        </div>
                        <div className={styles.statusIndicator} />
                    </div>

                    <div className={styles.headerInfo}>
                        <div className={styles.nameRow}>
                            <h1 className={styles.userName}>{profile.full_name || 'Anonymous Scholar'}</h1>
                            <span className={styles.roleTitle}>{profile.role.toUpperCase()}</span>
                        </div>
                        <p className={styles.userSubtitle}> {profile.specialization} at {profile.institution}</p>
                    </div>

                    <div className={styles.headerActions}>
                        {!isEditing ? (
                            <Button
                                variant="outline"
                                leftIcon={<Edit3 size={16} />}
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Portfolio
                            </Button>
                        ) : (
                            <div className={styles.editButtons}>
                                <Button
                                    variant="ghost"
                                    leftIcon={<X size={16} />}
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    leftIcon={<Save size={16} />}
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Sidebar Info */}
                <aside className={styles.sidebar}>
                    <Card variant="bordered" className={styles.infoCard}>
                        <h3 className={styles.sideTitle}>VITAL RECORDS</h3>

                        <div className={styles.infoList}>
                            <div className={styles.infoRow}>
                                <MapPin size={16} className={styles.infoIcon} />
                                {isEditing ? (
                                    <Input
                                        value={editData.location || ''}
                                        onChange={e => setEditData({ ...editData, location: e.target.value })}
                                        placeholder="Location"
                                        variant="dark"
                                    />
                                ) : (
                                    <span>{profile.location || 'Unknown Coordinates'}</span>
                                )}
                            </div>
                            <div className={styles.infoRow}>
                                <Globe size={16} className={styles.infoIcon} />
                                {isEditing ? (
                                    <Input
                                        value={editData.website || ''}
                                        onChange={e => setEditData({ ...editData, website: e.target.value })}
                                        placeholder="Digital Port"
                                        variant="dark"
                                    />
                                ) : (
                                    <a href={profile.website || '#'} className={styles.link}>{profile.website || 'No Portal Linked'}</a>
                                )}
                            </div>
                            <div className={styles.infoRow}>
                                <Clock size={16} className={styles.infoIcon} />
                                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {isEditing && (
                            <div className={styles.mediaEdits}>
                                <div className={styles.divider} />
                                <h3 className={styles.sideTitle}>VISUAL IDENTITY</h3>
                                <div className={styles.infoList}>
                                    <div className={styles.infoRow}>
                                        <Camera size={16} className={styles.infoIcon} />
                                        <Input
                                            value={editData.avatar_url || ''}
                                            onChange={e => setEditData({ ...editData, avatar_url: e.target.value })}
                                            placeholder="Avatar Image URL"
                                            variant="dark"
                                        />
                                    </div>
                                    <div className={styles.infoRow}>
                                        <Camera size={16} className={styles.infoIcon} />
                                        <Input
                                            value={editData.cover_url || ''}
                                            onChange={e => setEditData({ ...editData, cover_url: e.target.value })}
                                            placeholder="Cover Image URL"
                                            variant="dark"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.divider} />

                        <h3 className={styles.sideTitle}>SCHOLAR STATS</h3>
                        <div className={styles.statsGrid}>
                            <div className={styles.statBox}>
                                <span className={styles.statNum}>{artifacts.length}</span>
                                <span className={styles.statLab}>ARTIFACTS</span>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statNum}>12</span>
                                <span className={styles.statLab}>REPORTS</span>
                            </div>
                        </div>
                    </Card>

                    <Card variant="bordered" className={styles.trustCard}>
                        <div className={styles.trustHeader}>
                            <Shield size={20} className={styles.shieldIcon} />
                            <span>VERIFIED SCHOLAR</span>
                        </div>
                        <p className={styles.trustText}>This identity has been authenticated against international archival standards.</p>
                    </Card>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>SCHOLARLY BIOGRAPHY</h2>
                        {isEditing ? (
                            <Textarea
                                value={editData.bio || ''}
                                onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                placeholder="Narrate your archaeological journey..."
                                variant="dark"
                                className={styles.bioEdit}
                            />
                        ) : (
                            <p className={styles.bioText}>
                                {profile.bio || 'This scholar has yet to record their stratigraphic history into our digital archives.'}
                            </p>
                        )}
                    </section>

                    {isEditing && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>IDENTITY PRESETS</h2>
                            <div className={styles.presetGallery}>
                                <div className={styles.gallerySection}>
                                    <h4 className={styles.galleryTitle}>Scholarly Avatars</h4>
                                    <div className={styles.presetGrid}>
                                        {AVATAR_PRESETS.map(preset => (
                                            <div
                                                key={preset.id}
                                                className={`${styles.presetItem} ${editData.avatar_url === preset.url ? styles.active : ''}`}
                                                onClick={() => setEditData({ ...editData, avatar_url: preset.url })}
                                                title={preset.label}
                                            >
                                                <img src={preset.url} alt={preset.label} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.gallerySection}>
                                    <h4 className={styles.galleryTitle}>Aesthetic Backgrounds</h4>
                                    <div className={styles.backgroundGrid}>
                                        {BACKGROUND_PRESETS.map(preset => (
                                            <div
                                                key={preset.id}
                                                className={`${styles.backgroundItem} ${editData.cover_url === preset.url ? styles.active : ''}`}
                                                onClick={() => setEditData({ ...editData, cover_url: preset.url })}
                                                title={preset.label}
                                            >
                                                <img src={preset.url} alt={preset.label} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>LATEST DISCOVERIES</h2>
                            <Button variant="ghost" size="sm" rightIcon={<Globe size={14} />}>View All</Button>
                        </div>

                        <div className={styles.artifactGrid}>
                            {artifacts.length > 0 ? (
                                artifacts.map(art => (
                                    <motion.div
                                        key={art.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <ArtifactCard
                                            id={art.id}
                                            title={art.title}
                                            imageUrl={art.artifact_images?.[0]?.image_url}
                                            classification={art.classification}
                                            era={art.era}
                                            digitized={art.confidence_score ? Math.round(art.confidence_score * 100) : 0}
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <div className={styles.emptyArtifacts}>
                                    <BookOpen size={48} strokeWidth={0.5} />
                                    <p>No specimens analyzed in current cycle.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
