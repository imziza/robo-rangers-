'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { HISTORICAL_EVENTS, getEventsForYear, CIVILIZATIONS } from '@/lib/historical_data';
import {
    Grid3X3,
    MapPin,
    Search,
    Globe,
    Share2,
    BookOpen,
    Cpu,
    Sword,
    Anchor,
    Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

interface AtlasEntity {
    id: string;
    title?: string;
    name?: string;
    era?: string;
    year?: number;
    startYear?: number;
    endYear?: number;
    coordinates: [number, number];
    type: 'personal' | 'museum' | 'site' | 'event' | 'civilization';
    verified?: boolean;
    description?: string;
    tag?: string;
    analysis?: string;
}

const ERAS = [
    { name: 'Bronze Age', start: -3300, end: -1200, color: '#CD7F32' },
    { name: 'Iron Age', start: -1200, end: -500, color: '#A19D94' },
    { name: 'Antiquity', start: -500, end: 476, color: '#C9A227' },
    { name: 'Middle Ages', start: 476, end: 1453, color: '#8B0000' },
    { name: 'Renaissance', start: 1453, end: 1600, color: '#4169E1' }
];

export default function AtlasPage() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    const [artifacts, setArtifacts] = useState<AtlasEntity[]>([]);
    const [viewYear, setViewYear] = useState(-1250);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEntity, setSelectedEntity] = useState<AtlasEntity | null>(null);
    const [isTemporalShifting, setIsTemporalShifting] = useState(false);

    const [layersVisible, setLayersVisible] = useState({
        coordinateGrid: false,
        historicalEvents: true,
        discoveries: true,
        ruins: false
    });

    const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

    // Derive era from viewYear
    const currentEra = useMemo(() => {
        return ERAS.find(e => viewYear >= e.start && viewYear <= e.end) || { name: 'Chronos Overflow', color: '#fff' };
    }, [viewYear]);

    // Active events and civilizations
    const activeEvents = useMemo(() => getEventsForYear(viewYear, 100), [viewYear]);
    const activeCivilizations = useMemo(() => {
        return CIVILIZATIONS.filter(c => viewYear >= c.startYear && viewYear <= c.endYear);
    }, [viewYear]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.from('artifacts').select('*');
        if (data) {
            const formatted: AtlasEntity[] = data.map(a => ({
                id: a.id,
                title: a.title,
                era: a.era || 'Unknown',
                year: a.metadata?.year || -1000,
                coordinates: [a.longitude || 0, a.latitude || 0],
                type: 'personal',
                verified: a.status === 'stable',
            }));
            setArtifacts(formatted);
        }
    };

    // Temporal Shift Logic
    useEffect(() => {
        setIsTemporalShifting(true);
        const timer = setTimeout(() => setIsTemporalShifting(false), 800);
        return () => clearTimeout(timer);
    }, [viewYear]);

    useEffect(() => {
        const mapInstance = map.current;
        if (!mapInstance) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        // Update Civilization Polygons
        const civSourceId = 'civilizations-source';
        if (mapInstance.getSource(civSourceId)) {
            const civData: any = {
                type: 'FeatureCollection',
                features: activeCivilizations.map(c => ({
                    type: 'Feature',
                    geometry: c.geometry,
                    properties: { id: c.id, name: c.name, color: c.color }
                }))
            };
            (mapInstance.getSource(civSourceId) as maplibregl.GeoJSONSource).setData(civData);
        }

        // Add Beacons for Events
        if (layersVisible.historicalEvents) {
            activeEvents.forEach(event => {
                const el = document.createElement('div');
                el.className = styles.markerBeacon;
                el.innerHTML = `<div class="${styles.beaconCore}"></div><div class="${styles.beaconPulse}"></div>`;
                el.addEventListener('click', () => {
                    setSelectedEntity(event as any);
                    mapInstance.flyTo({ center: event.coordinates as any, zoom: 8 });
                });
                markersRef.current[event.id] = new maplibregl.Marker({ element: el })
                    .setLngLat(event.coordinates as any)
                    .addTo(mapInstance);
            });
        }

        // Add Beacons for Discoveries
        if (layersVisible.discoveries) {
            artifacts.filter(a => Math.abs((a.year || -1000) - viewYear) < 500).forEach(a => {
                const el = document.createElement('div');
                el.className = styles.discoveryBeacon;
                el.innerHTML = `<div class="${styles.beaconCore}"></div>`;
                el.addEventListener('click', () => {
                    setSelectedEntity(a);
                    mapInstance.flyTo({ center: a.coordinates as any, zoom: 12 });
                });
                markersRef.current[a.id] = new maplibregl.Marker({ element: el })
                    .setLngLat(a.coordinates as any)
                    .addTo(mapInstance);
            });
        }
    }, [viewYear, artifacts, layersVisible, activeCivilizations, activeEvents]);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    esri: {
                        type: 'raster',
                        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                        tileSize: 256,
                        attribution: 'Tiles &copy; Esri',
                    },
                },
                layers: [{
                    id: 'background',
                    type: 'raster',
                    source: 'esri',
                    paint: { 'raster-saturation': -0.7, 'raster-contrast': 0.1 }
                }],
            },
            center: [26.2393, 39.9575],
            zoom: 5,
        });

        map.current.on('load', () => {
            if (!map.current) return;
            map.current.addSource('civilizations-source', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
            map.current.addLayer({
                id: 'civilizations-layer',
                type: 'fill',
                source: 'civilizations-source',
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.3,
                    'fill-outline-color': ['get', 'color']
                }
            });
        });

        return () => map.current?.remove();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                map.current?.flyTo({ center: [lon, lat], zoom: 10 });
            }
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    return (
        <div className={styles.container}>
            <AnimatePresence>
                {isTemporalShifting && (
                    <motion.div
                        className={styles.temporalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className={styles.glitch} />
                        <span className={styles.shiftLabel}>TEMPORAL SHIFT DETECTED</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={styles.hudTopLeft}>
                <div className={styles.statusWidget}>
                    <div className={styles.statusIndicator}>
                        <div className={styles.blinkingDot} />
                        CHRONO-LINK STABLE
                    </div>
                </div>
            </div>

            <motion.div className={styles.hudTopCenter} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <form onSubmit={handleSearch} className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="ENTER COORDINATES OR KEYWORD..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className={styles.searchIcon} size={16} />
                </form>
            </motion.div>

            <div className={styles.hudTopRight}>
                <div className={styles.toolStack}>
                    <button
                        className={`${styles.toolButton} ${layersVisible.historicalEvents ? styles.active : ''}`}
                        onClick={() => setLayersVisible({ ...layersVisible, historicalEvents: !layersVisible.historicalEvents })}
                    >
                        <Sword size={16} />
                    </button>
                    <button
                        className={`${styles.toolButton} ${layersVisible.discoveries ? styles.active : ''}`}
                        onClick={() => setLayersVisible({ ...layersVisible, discoveries: !layersVisible.discoveries })}
                    >
                        <MapPin size={16} />
                    </button>
                    <button
                        className={`${styles.toolButton} ${layersVisible.coordinateGrid ? styles.active : ''}`}
                        onClick={() => setLayersVisible({ ...layersVisible, coordinateGrid: !layersVisible.coordinateGrid })}
                    >
                        <Grid3X3 size={16} />
                    </button>
                </div>
            </div>

            <main className={styles.mapWrapper}>
                <div ref={mapContainer} className={styles.map} />
            </main>

            <AnimatePresence>
                {selectedEntity && (
                    <motion.aside
                        className={styles.codexPanel}
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                    >
                        <div className={styles.codexHeader}>
                            <h2 className={styles.codexTitle}>{selectedEntity.name || selectedEntity.title}</h2>
                            <span className={styles.codexSubtitle}>RECORD ID: {selectedEntity.id.split('-')[0].toUpperCase()}</span>
                        </div>
                        <div className={styles.codexContent}>
                            <div className={styles.dataBlock}>
                                <span className={styles.dataLabel}>TEMPORAL LOCK</span>
                                <span className={styles.dataValue}>
                                    {selectedEntity.year ? Math.abs(selectedEntity.year) : `${Math.abs(selectedEntity.startYear || 0)} - ${Math.abs(selectedEntity.endYear || 0)}`}
                                    <span style={{ color: 'var(--gold-primary)', marginLeft: 8 }}>{viewYear < 0 ? 'BCE' : 'CE'}</span>
                                </span>
                            </div>
                            <div className={styles.aiTerminal}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--gold-primary)' }}>
                                    <Cpu size={14} />
                                    <span style={{ fontWeight: 800, fontSize: 10, letterSpacing: '0.1em' }}>AI ANALYSIS...</span>
                                </div>
                                {selectedEntity.analysis || "Processing vector data... Pattern recognition suggests significant cultural exchange in this sector."}
                            </div>
                        </div>
                        <div className={styles.codexActions}>
                            <Button variant="primary" fullWidth leftIcon={<BookOpen size={16} />}>OPEN DOSSIER</Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            <motion.div className={styles.chronometer} initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <div className={styles.chronoContainer}>
                    <div className={styles.chronoHeader}>
                        <div className={styles.currentEraDisplay}>
                            <span className={styles.eraLabel}>TEMPORAL ZONE</span>
                            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{currentEra.name}</span>
                        </div>
                        <div className={styles.yearDisplay}>
                            {Math.abs(viewYear)} <span className={styles.yearSuffix}>{viewYear < 0 ? 'BC' : 'AD'}</span>
                        </div>
                    </div>
                    <div className={styles.timelineTrack}>
                        <div className={styles.rail} />
                        <motion.div className={styles.playhead} style={{ left: `${((viewYear - (-3300)) / (1600 - (-3300))) * 100}%` }} />
                        <input
                            type="range"
                            min="-3300"
                            max="1600"
                            value={viewYear}
                            onChange={(e) => setViewYear(Number(e.target.value))}
                            className={styles.timelineInput}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
