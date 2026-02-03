'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    User,
    MapPin,
    Globe,
    Shield,
    MessageSquare,
    UserPlus,
    Clock
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, ArtifactCard } from '@/components/ui/Card';
import styles from '../page.module.css';

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

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadProfile(params.id as string);
        }
    }, [params.id]);

    const loadProfile = async (id: string) => {
        setIsLoading(true);
        try {
            // Check if this is the current user's own profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id === id) {
                router.push('/profile');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                setProfile(data);

                // Load user's artifacts
                const { data: artData } = await supabase
                    .from('artifacts')
                    .select('*, artifact_images(image_url)')
                    .eq('user_id', id)
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

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.shimmer} />
                <p>ACCESSING EXTERNAL SCHOLAR ARCHIVES...</p>
            </div>
        );
    }

    if (!profile) return (
        <div className={styles.container}>
            <div className={styles.emptyArtifacts}>
                <Shield size={48} strokeWidth={0.5} />
                <p>Identity unrecognized or restricted by security protocols.</p>
                <Button onClick={() => router.back()}>Return to Network</Button>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.hero}>
                <div className={styles.coverImage}>
                    {profile.cover_url ? (
                        <img src={profile.cover_url} alt="Cover" />
                    ) : (
                        <div className={styles.coverPlaceholder} />
                    )}
                    <div className={styles.coverOverlay} />
                </div>

                <div className={styles.profileHeader}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatar}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || 'User'} />
                            ) : (
                                <User size={64} strokeWidth={1} />
                            )}
                        </div>
                    </div>

                    <div className={styles.headerInfo}>
                        <div className={styles.nameRow}>
                            <h1 className={styles.userName}>{profile.full_name || 'Anonymous Scholar'}</h1>
                            <span className={styles.roleTitle}>{profile.role.toUpperCase()}</span>
                        </div>
                        <p className={styles.userSubtitle}>{profile.specialization} at {profile.institution}</p>
                    </div>

                    <div className={styles.headerActions}>
                        <Button
                            variant="primary"
                            leftIcon={<MessageSquare size={16} />}
                            onClick={() => router.push(`/messages?id=${profile.id}`)}
                        >
                            Establish Link
                        </Button>
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* Sidebar Info */}
                <aside className={styles.sidebar}>
                    <Card variant="bordered" className={styles.infoCard}>
                        <h3 className={styles.sideTitle}>ARCHIVAL DATA</h3>

                        <div className={styles.infoList}>
                            <div className={styles.infoRow}>
                                <MapPin size={16} className={styles.infoIcon} />
                                <span>{profile.location || 'Unknown Coordinates'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <Globe size={16} className={styles.infoIcon} />
                                <a href={profile.website || '#'} className={styles.link}>{profile.website || 'No Portal Linked'}</a>
                            </div>
                            <div className={styles.infoRow}>
                                <Clock size={16} className={styles.infoIcon} />
                                <span>Active since {new Date(profile.created_at).getFullYear()}</span>
                            </div>
                        </div>

                        <div className={styles.divider} />

                        <h3 className={styles.sideTitle}>NETWORK STATS</h3>
                        <div className={styles.statsGrid}>
                            <div className={styles.statBox}>
                                <span className={styles.statNum}>{artifacts.length}</span>
                                <span className={styles.statLab}>SPECIES</span>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statNum}>8</span>
                                <span className={styles.statLab}>PEER REV</span>
                            </div>
                        </div>
                    </Card>

                    <Card variant="bordered" className={styles.trustCard}>
                        <div className={styles.trustHeader}>
                            <Shield size={20} className={styles.shieldIcon} />
                            <span>OFFICIAL CREDENTIALS</span>
                        </div>
                        <p className={styles.trustText}>Verified archaeological clearance for digital stratigraphic analysis.</p>
                    </Card>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>SCHOLARLY BIOGRAPHY</h2>
                        <p className={styles.bioText}>
                            {profile.bio || 'This scholar has yet to record their stratigraphic history into our digital archives.'}
                        </p>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>LATEST DISCOVERIES</h2>
                        </div>

                        <div className={styles.artifactGrid}>
                            {artifacts.length > 0 ? (
                                artifacts.map(art => (
                                    <motion.div key={art.id}>
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
                                    <p>No specimens shared in public archives.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
