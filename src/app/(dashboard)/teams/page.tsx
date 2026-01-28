'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

interface Team {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    activeProjects: number;
    lastActivity: string;
    role: 'Admin' | 'Member';
}

const MOCK_TEAMS: Team[] = [
    {
        id: '1',
        name: 'Giza Plateau Excavation',
        description: 'Digital documentation of Sector 4 findings and stratigraphic analysis of the Old Kingdom layers.',
        memberCount: 12,
        activeProjects: 3,
        lastActivity: '2 hours ago',
        role: 'Admin',
    },
    {
        id: '2',
        name: 'Hellenistic Sourcing Group',
        description: 'Specialized task force identifying Mediterranean trade routes through chemical isotope analysis.',
        memberCount: 8,
        activeProjects: 1,
        lastActivity: '1 day ago',
        role: 'Member',
    },
    {
        id: '3',
        name: 'Troy Site Verification',
        description: 'Collaborative effort to verify Layer VII artifact provenance using satellite-linked coordinates.',
        memberCount: 24,
        activeProjects: 5,
        lastActivity: '15 mins ago',
        role: 'Member',
    },
];

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>Research Collaboration</h1>
                    <p className={styles.subtitle}>Manage your archaeological task forces and joined institutions.</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    leftIcon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    }
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
                    <span className={styles.statLabel}>COLLABORATORS</span>
                    <span className={styles.statValue}>44</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>PENDING INVITES</span>
                    <span className={styles.statValue}>2</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>SYSTEM STATUS</span>
                    <span className={styles.statStatus}>SECURE</span>
                </div>
            </div>

            <div className={styles.teamGrid}>
                {teams.map((team) => (
                    <Card key={team.id} className={styles.teamCard} variant="bordered">
                        <div className={styles.teamHeader}>
                            <div className={styles.teamIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 00-3-3.87" />
                                    <path d="M9 21v-2a4 4 0 00-3-3.87" />
                                    <circle cx="9" cy="7" r="4" />
                                    <circle cx="17" cy="7" r="4" />
                                </svg>
                            </div>
                            <span className={styles.roleBadge}>{team.role}</span>
                        </div>

                        <h3 className={styles.teamName}>{team.name}</h3>
                        <p className={styles.teamDesc}>{team.description}</p>

                        <div className={styles.teamMeta}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>MEMBERS</span>
                                <span className={styles.metaValue}>{team.memberCount}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>PROJECTS</span>
                                <span className={styles.metaValue}>{team.activeProjects}</span>
                            </div>
                        </div>

                        <div className={styles.teamFooter}>
                            <span className={styles.activityLabel}>Active {team.lastActivity}</span>
                            <Button variant="outline" size="sm">Enter Repository</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2 className={styles.modalTitle}>Initialize Group</h2>
                        <p className={styles.modalSubtitle}>Create a secure workspace for research collaboration.</p>

                        <div className={styles.modalForm}>
                            <Input label="Group Name" placeholder="e.g. Mesoamerican Ceramics Study" variant="dark" />
                            <div className={styles.textareaWrapper}>
                                <label className={styles.label}>Description</label>
                                <textarea className={styles.textarea} placeholder="Define research goals and scope..." />
                            </div>

                            <div className={styles.modalActions}>
                                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button variant="primary">Confirm Initialization</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
