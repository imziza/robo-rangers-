'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Shield, Search, ExternalLink, Loader2, UserPlus, LogOut } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

interface Team {
    id: string;
    name: string;
    description: string;
    member_count: number;
    project_count: number;
    role: 'admin' | 'member';
    joined_at: string;
}

export default function TeamsPage() {
    const supabase = createSupabaseBrowserClient();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create state
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    role,
                    joined_at,
                    groups (
                        id,
                        name,
                        description
                    )
                `)
                .eq('user_id', user.id);

            if (data) {
                const formattedTeams = await Promise.all(data.map(async (item: any) => {
                    // Get counts (in real app we might use view or RPC)
                    const { count: memberCount } = await supabase
                        .from('group_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('group_id', item.groups.id);

                    return {
                        id: item.groups.id,
                        name: item.groups.name,
                        description: item.groups.description,
                        member_count: memberCount || 0,
                        project_count: 0, // Placeholder for actual artifact count in team
                        role: item.role,
                        joined_at: item.joined_at
                    };
                }));
                setTeams(formattedTeams);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!newName.trim()) return;
        setIsCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Create Group
            const { data: group, error: groupErr } = await supabase
                .from('groups')
                .insert({ name: newName, description: newDesc, created_by: user.id })
                .select()
                .single();

            if (groupErr) throw groupErr;

            // 2. Add as Admin Member
            const { error: memErr } = await supabase
                .from('group_members')
                .insert({ group_id: group.id, user_id: user.id, role: 'admin' });

            if (memErr) throw memErr;

            setShowCreateModal(false);
            setNewName('');
            setNewDesc('');
            loadTeams();
        } catch (error: any) {
            console.error('Error creating team:', error.message || error);
            alert(`Initialization protocol failed: ${error.message || 'Check console for clearance.'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const [showInviteModal, setShowInviteModal] = useState<string | null>(null);
    const [inviteSearch, setInviteSearch] = useState('');
    const [inviteResults, setInviteResults] = useState<any[]>([]);
    const [isInviting, setIsInviting] = useState(false);

    const handleSearchMembers = async (query: string) => {
        setInviteSearch(query);
        if (query.length < 2) {
            setInviteResults([]);
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${query}%`)
            .limit(5);

        setInviteResults(data || []);
    };

    const sendInvite = async (userId: string) => {
        if (!showInviteModal) return;
        setIsInviting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('team_invites')
                .insert({
                    team_id: showInviteModal,
                    inviter_id: user.id,
                    invitee_id: userId
                });

            if (error) {
                if (error.code === '23505') alert('Researcher already invited or member.');
                else throw error;
            } else {
                alert('Invitation transmitted successfully.');
                setShowInviteModal(null);
                setInviteSearch('');
                setInviteResults([]);
            }
        } catch (error) {
            console.error('Invite error:', error);
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>Research Collaboration</h1>
                    <p className={styles.subtitle}>SECURE COALITION MANAGEMENT SYSTEMS</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    leftIcon={<Plus size={20} strokeWidth={2} />}
                >
                    Initialize New Group
                </Button>
            </header>

            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>ACTIVE GROUPS</span>
                    <span className={styles.statValue}>{teams.length}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>IDENTITY STATUS</span>
                    <span className={styles.statStatus}>AUTHENTICATED</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>SYSTEM UPLINK</span>
                    <span className={styles.statValue}>ACTIVE</span>
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loaderWrapper}>
                    <Loader2 className={styles.spinner} size={40} />
                    <p>FETCHING COALITION DATA...</p>
                </div>
            ) : (
                <div className={styles.teamGrid}>
                    <AnimatePresence>
                        {teams.map((team) => (
                            <motion.div
                                key={team.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card className={styles.teamCard} variant="bordered">
                                    <div className={styles.teamHeader}>
                                        <div className={styles.teamIcon}>
                                            <Users size={24} strokeWidth={1.5} />
                                        </div>
                                        <span className={styles.roleBadge}>{team.role}</span>
                                    </div>

                                    <h3 className={styles.teamName}>{team.name}</h3>
                                    <p className={styles.teamDesc}>{team.description || 'No operational description available.'}</p>

                                    <div className={styles.teamMeta}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaLabel}>MEMBERS</span>
                                            <span className={styles.metaValue}>{team.member_count}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaLabel}>ESTABLISHED</span>
                                            <span className={styles.metaValue}>{new Date(team.joined_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className={styles.teamFooter}>
                                        <div className={styles.footerActions}>
                                            {team.role === 'admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    leftIcon={<UserPlus size={14} />}
                                                    onClick={() => setShowInviteModal(team.id)}
                                                >
                                                    Invite
                                                </Button>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            rightIcon={<ExternalLink size={14} />}
                                        >
                                            Repository
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {teams.length === 0 && (
                        <div className={styles.emptyTeams}>
                            <Users size={64} strokeWidth={1} />
                            <h3>No Active Coalitions</h3>
                            <p>You have not yet established or joined any research groups in current cycle.</p>
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>Establish First Group</Button>
                        </div>
                    )}
                </div>
            )}

            {showInviteModal && (
                <div className={styles.modalOverlay}>
                    <motion.div className={styles.modal} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className={styles.modalTitle}>Search Researchers</h2>
                        <Input
                            placeholder="Type a scholar's name..."
                            value={inviteSearch}
                            onChange={e => handleSearchMembers(e.target.value)}
                            variant="dark"
                        />
                        <div className={styles.inviteResults}>
                            {inviteResults.map(p => (
                                <div key={p.id} className={styles.inviteItem}>
                                    <div>
                                        <div className={styles.inviteName}>{p.full_name}</div>
                                        <div className={styles.inviteInst}>{p.institution}</div>
                                    </div>
                                    <Button size="sm" onClick={() => sendInvite(p.id)} isLoading={isInviting}>Invite</Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" onClick={() => setShowInviteModal(null)} className={styles.modalClose}>Close</Button>
                    </motion.div>
                </div>
            )}

            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2 className={styles.modalTitle}>Initialize Group</h2>
                        <p className={styles.modalSubtitle}>Create a secure workspace for research collaboration.</p>

                        <div className={styles.modalForm}>
                            <Input
                                label="Group Name"
                                placeholder="e.g. Mesoamerican Ceramics Study"
                                variant="dark"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                            <div className={styles.textareaWrapper}>
                                <label className={styles.label}>Description</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Define research goals and scope..."
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    onClick={handleCreateTeam}
                                    isLoading={isCreating}
                                    disabled={!newName.trim()}
                                >
                                    Confirm Initialization
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

