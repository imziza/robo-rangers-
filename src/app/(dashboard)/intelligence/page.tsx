'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Shield,
    Database,
    Activity,
    Sparkles,
    Globe,
    Clock,
    Zap,
    Scale
} from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

const ERA_DISTRIBUTION = [
    { era: 'Bronze Age', count: 124, color: '#CD7F32' },
    { era: 'Iron Age', count: 86, color: '#A19D94' },
    { era: 'Antiquity', count: 215, color: '#C9A227' },
    { era: 'Middle Ages', count: 142, color: '#8B0000' },
    { era: 'Renaissance', count: 68, color: '#4169E1' },
];

const MATERIAL_ANALYSIS = [
    { material: 'Gold', percentage: 15, color: 'var(--gold-primary)' },
    { material: 'Stone', percentage: 35, color: '#71717A' },
    { material: 'Clay', percentage: 25, color: '#A8A29E' },
    { material: 'Bronze', percentage: 20, color: '#B45309' },
    { material: 'Other', percentage: 5, color: '#3F3F46' },
];

const METRICS = [
    { label: 'Total Specimens', value: '1,842', change: '+12%', icon: Database },
    { label: 'Analysis Fidelity', value: '94.2%', change: '+0.4%', icon: Sparkles },
    { label: 'Global Nodes', value: '14', change: 'Stable', icon: Globe },
    { label: 'Active Excavations', value: '8', change: '+2', icon: Activity },
];

export default function IntelligencePage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Intelligence Hub</h1>
                    <p className={styles.subtitle}>ARCHAEOLOGICAL ANALYTICS & GLOBAL DISCOVERY METRICS</p>
                </div>
                <div className={styles.systemStatus}>
                    <div className={styles.statusPulse} />
                    <span>AI ANALYTICS CORE: ONLINE</span>
                </div>
            </header>

            <div className={styles.metricsGrid}>
                {METRICS.map((metric, i) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={styles.metricCard}
                    >
                        <div className={styles.metricHeader}>
                            <metric.icon size={20} className={styles.metricIcon} />
                            <span className={styles.metricChange}>{metric.change}</span>
                        </div>
                        <div className={styles.metricValue}>{metric.value}</div>
                        <div className={styles.metricLabel}>{metric.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className={styles.chartsGrid}>
                {/* Era Distribution Bar Chart */}
                <Panel variant="glass" className={styles.chartPanel}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}><BarChart3 size={18} /> ERA DISTRIBUTION</h3>
                        <span className={styles.chartMeta}>QUANTITATIVE RECORDINGS</span>
                    </div>
                    <div className={styles.barChart}>
                        {ERA_DISTRIBUTION.map((item, i) => (
                            <div key={item.era} className={styles.barWrapper}>
                                <div className={styles.barLabel}>{item.era}</div>
                                <div className={styles.barContainer}>
                                    <motion.div
                                        className={styles.barFill}
                                        style={{ backgroundColor: item.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.count / 215) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                    />
                                    <span className={styles.barValue}>{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Material Composition Ring/Pie */}
                <Panel variant="glass" className={styles.chartPanel}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}><PieChart size={18} /> MATERIAL COMPOSITION</h3>
                        <span className={styles.chartMeta}>ELEMENTAL ANALYSIS</span>
                    </div>
                    <div className={styles.pieContainer}>
                        <div className={styles.pieVisual}>
                            <svg viewBox="0 0 100 100" className={styles.donut}>
                                {MATERIAL_ANALYSIS.map((item, i) => {
                                    let offset = 0;
                                    for (let j = 0; j < i; j++) offset += MATERIAL_ANALYSIS[j].percentage;
                                    return (
                                        <motion.circle
                                            key={item.material}
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="transparent"
                                            stroke={item.color}
                                            strokeWidth="10"
                                            strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                                            strokeDashoffset={-offset}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 1.5, delay: 1 }}
                                        />
                                    );
                                })}
                            </svg>
                            <div className={styles.pieCenter}>
                                <Scale size={24} />
                                <span>TOTAL</span>
                            </div>
                        </div>
                        <div className={styles.pieLegend}>
                            {MATERIAL_ANALYSIS.map((item) => (
                                <div key={item.material} className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ backgroundColor: item.color }} />
                                    <span className={styles.legendLabel}>{item.material}</span>
                                    <span className={styles.legendValue}>{item.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>

                {/* System Activity Timeline */}
                <Panel variant="glass" className={styles.chartPanel}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}><TrendingUp size={18} /> ACTIVITY STREAM</h3>
                        <span className={styles.chartMeta}>REAL-TIME EVENT LOG</span>
                    </div>
                    <div className={styles.activityStream}>
                        {[
                            { time: '02m ago', event: 'Specimen #842 digitized in Sector 7', type: 'success' },
                            { time: '14m ago', event: 'New excavation node authorized: Luxor', type: 'info' },
                            { time: '28m ago', event: 'L-Band sync established with Smithsonian', type: 'info' },
                            { time: '41m ago', event: 'Structural anomaly detected in Vault A', type: 'warning' },
                            { time: '1h ago', event: 'Peer review completed for Artifact #771', type: 'success' },
                        ].map((log, i) => (
                            <div key={i} className={styles.logItem}>
                                <div className={styles.logTime}>{log.time}</div>
                                <div className={`${styles.logDot} ${styles[log.type]}`} />
                                <div className={styles.logEvent}>{log.event}</div>
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Discovery Forecast */}
                <Panel variant="glass" className={styles.chartPanel}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}><Zap size={18} /> DISCOVERY FORECAST</h3>
                        <span className={styles.chartMeta}>AI PREDICTIVE MODELING</span>
                    </div>
                    <div className={styles.forecastContent}>
                        <div className={styles.forecastMetric}>
                            <span className={styles.forecastLabel}>PROBABILITY OF SITE DISCOVERY</span>
                            <span className={styles.forecastValue}>82%</span>
                        </div>
                        <p className={styles.forecastText}>
                            Based on current stratigraphic trends and L-Band anomalies, there is a high probability of significant discovery in the **Valley of the Kings** region within the next 48 hours.
                        </p>
                        <div className={styles.forecastAction}>
                            <Button variant="primary" fullWidth size="sm">
                                DEPLOY REMOTE SENSORS
                            </Button>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
