'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { HISTORICAL_EVENTS, getEventsForYear, HistoricalEvent, CIVILIZATIONS } from '@/lib/historical_data';
import {
    Layers,
    Grid3X3,
    FileText,
    MapPin,
    Radio,
    Search,
    Navigation,
    LocateFixed,
    History,
    Anchor,
    Sword,
    ScrollText,
    Flame,
    BookOpen,
    Quote,
    Cpu,
    Globe,
    Share2,
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
    color?: string;
    region?: string;
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    const [artifacts, setArtifacts] = useState<AtlasEntity[]>([]);
    const [viewYear, setViewYear] = useState(-1250); // Default to Trojan War era
    const [searchQuery, setSearchQuery] = useState('');
    const [showSources, setShowSources] = useState(false);
    const [gpsGranted, setGpsGranted] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<AtlasEntity | null>(null);

    const [layersVisible, setLayersVisible] = useState({
        coordinateGrid: false,
        fieldNotes: false,
        historicalEvents: true,
        discoveries: true,
        ruins: false
    });

    const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

    useEffect(() => {
        const mapInstance = map.current;
        if (!mapInstance) return;

        ['giza-overlay', 'rome-overlay'].forEach(id => {
            if (mapInstance.getLayer(id)) {
                mapInstance.setLayoutProperty(id, 'visibility', layersVisible.ruins ? 'visible' : 'none');
            }
        });
    }, [layersVisible.ruins]);

    // Derive era from viewYear
    const currentEra = useMemo(() => {
        return ERAS.find(e => viewYear >= e.start && viewYear <= e.end) || { name: 'Chronos Overflow', color: '#fff' };
    }, [viewYear]);

    // Derive active events for current year
    const activeEvents = useMemo(() => getEventsForYear(viewYear, 100), [viewYear]);
    const activeCivilizations = useMemo(() => {
        return CIVILIZATIONS.filter(c => viewYear >= c.startYear && viewYear <= c.endYear);
    }, [viewYear]);

    const closestEvent = activeEvents[0];

    useEffect(() => {
        loadData();
    }, []);

    // Handle deep-link navigation from Vault
    useEffect(() => {
        if (!map.current) return;
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        if (lat && lng) {
            map.current.flyTo({
                center: [parseFloat(lng), parseFloat(lat)],
                zoom: 14,
                essential: true,
                duration: 3000
            });
        }
    }, [searchParams, artifacts]); // Wait for artifacts to load too just in case

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

    // Update markers and polygons based on temporal filters
    useEffect(() => {
        const mapInstance = map.current;
        if (!mapInstance) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        // 1. Handle Civilization Polygons
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

        // 2. Handle map saturation/tint based on era
        if (mapInstance.getLayer('background')) {
            let saturation = -0.8;
            let contrast = 0.2;

            if (viewYear <= -2000) { // Bronze Age / Ancient
                saturation = -0.9;
                contrast = 0.4;
            } else if (viewYear >= 1500) { // Renaissance / Modernish
                saturation = -0.3;
                contrast = 0.1;
            }

            mapInstance.setPaintProperty('background', 'raster-saturation', saturation);
            mapInstance.setPaintProperty('background', 'raster-contrast', contrast);
        }

        // 3. Add Historical Events (Using New Beacon Design)
        if (layersVisible.historicalEvents) {
            activeEvents.forEach(event => {
                const el = document.createElement('div');
                el.className = styles.markerBeacon;
                el.innerHTML = `
                    <div class="${styles.beaconCore}"></div>
                    <div class="${styles.beaconPulse}"></div>
                `;

                el.addEventListener('click', () => {
                    setSelectedEntity(event as any);
                    mapInstance.flyTo({ center: event.coordinates, zoom: 8 });
                });

                markersRef.current[event.id] = new maplibregl.Marker({ element: el })
                    .setLngLat(event.coordinates as maplibregl.LngLatLike)
                    .addTo(mapInstance);
            });
        }

        // Add Discoveries filtered by time (rough era matching)
        if (layersVisible.discoveries) {
            artifacts.filter(a => {
                const aYear = a.year || -1000;
                return Math.abs(aYear - viewYear) < 500;
            }).forEach(a => {
                const el = document.createElement('div');
                el.className = styles.markerBeacon;
                el.innerHTML = `
                    <div class="${styles.beaconCore}" style="background-color: #fff; box-shadow: 0 0 10px #fff;"></div>
                `;

                el.addEventListener('click', () => {
                    setSelectedEntity(a);
                    mapInstance.flyTo({ center: a.coordinates, zoom: 12 });
                });

                markersRef.current[a.id] = new maplibregl.Marker({ element: el })
                    .setLngLat(a.coordinates as maplibregl.LngLatLike)
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
            // Initialize overlays and layers (kept mostly same, just ensuring IDs match)
            // Giza
            map.current.addSource('giza-plan', {
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Giza_pyramid_complex_%28map%29.svg',
                coordinates: [[31.125, 29.985], [31.145, 29.985], [31.145, 29.970], [31.125, 29.970]]
            });
            map.current.addLayer({
                id: 'giza-overlay',
                source: 'giza-plan',
                type: 'raster',
                paint: { 'raster-opacity': 0.7, 'raster-fade-duration': 0 },
                layout: { visibility: 'none' }
            });

            // Rome
            map.current.addSource('rome-plan', {
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Plan_of_Roman_Forum_mostly_English.jpg/1024px-Plan_of_Roman_Forum_mostly_English.jpg',
                coordinates: [[12.480, 41.895], [12.490, 41.895], [12.490, 41.890], [12.480, 41.890]]
            });
            map.current.addLayer({
                id: 'rome-overlay',
                source: 'rome-plan',
                type: 'raster',
                paint: { 'raster-opacity': 0.6 },
                layout: { visibility: 'none' }
            });

            // Civilizations
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

            // Interactions
            map.current.on('click', 'civilizations-layer', (e) => {
                const feature = e.features?.[0];
                if (feature) {
                    const civ = CIVILIZATIONS.find(c => c.id === feature.properties.id);
                    if (civ) setSelectedEntity(civ as any);
                }
            });

            map.current.on('mouseenter', 'civilizations-layer', () => map.current!.getCanvas().style.cursor = 'pointer');
            map.current.on('mouseleave', 'civilizations-layer', () => map.current!.getCanvas().style.cursor = '');
        });

        return () => map.current?.remove();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. Try local search first (Civilizations/Events)
            const localMatch = [...activeCivilizations, ...activeEvents].find((e: any) =>
                (e.name || e.title || '').toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (localMatch) {
                setSelectedEntity(localMatch as any);
                map.current?.flyTo({ center: (localMatch as any).coordinates, zoom: 6 });
                return;
            }

            // 2. Fallback to Nominatim for Universal Search
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                // ... (Create entity and fly)
                const searchEntity: AtlasEntity = {
                    id: `search-${Date.now()}`,
                    title: result.display_name.split(',')[0],
                    name: result.display_name.split(',')[0],
                    description: `Automated geolocated result for "${searchQuery}". Archival analysis pending.`,
                    type: 'site',
                    coordinates: [lon, lat],
                    year: viewYear,
                    verified: false,
                    tag: 'Geolocated'
                };
                setSelectedEntity(searchEntity);
                map.current?.flyTo({ center: [lon, lat], zoom: 10 });
            }
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    const jumpToEra = (era: any) => {
        const midPoint = Math.floor((era.start + era.end) / 2);
        setViewYear(midPoint);
    };

    return (
        <div className={styles.container}>
            <div className={styles.vignette} />
            <div className={styles.scanlines} />

            {/* --- GPS Status Widget --- */}
            <div className={styles.hudTopLeft}>
                <div className={styles.statusWidget}>
                    <div className={styles.statusIndicator}>
                        <div className={styles.blinkingDot} />
                        CONNECTION SECURE
                    </div>
                </div>
                <div className={styles.statusWidget} style={{ opacity: 0.7 }}>
                    <div className={styles.statusIndicator}>
                        <Globe size={12} style={{ marginRight: 4 }} />
                        {viewYear < 0 ? `${Math.abs(viewYear)} BC` : `${viewYear} AD`}
                    </div>
                </div>
            </div>

            {/* --- Omnibox Search --- */}
            <motion.div
                className={styles.hudTopCenter}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
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

            {/* --- Tool Stack --- */}
            <motion.div
                className={styles.hudTopRight}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className={styles.toolStack}>
                    <button
                        className={`${styles.toolButton} ${layersVisible.historicalEvents ? styles.active : ''}`}
                        onClick={() => setLayersVisible({ ...layersVisible, historicalEvents: !layersVisible.historicalEvents })}
                        title="Toggle Historical Events"
                    >
                        <Sword size={16} />
                    </button>
                    <button
                        className={`${styles.toolButton} ${layersVisible.discoveries ? styles.active : ''}`}
                        onClick={() => setLayersVisible({ ...layersVisible, discoveries: !layersVisible.discoveries })}
                        title="Toggle Findings"
                    >
                        <MapPin size={16} />
                    </button>
                    <button
                        className={`${styles.toolButton} ${layersVisible.ruins ? styles.active : ''}`}
                        onClick={() => setLayersVisible({ ...layersVisible, ruins: !layersVisible.ruins })}
                        title="Toggle Ancient Site Plans"
                    >
                        <Anchor size={16} />
                    </button>
                    <button
                        className={`${styles.toolButton} ${layersVisible.coordinateGrid ? styles.active : ''}`}
                        onClick={() => setLayersVisible({ ...layersVisible, coordinateGrid: !layersVisible.coordinateGrid })}
                        title="Toggle Grid"
                    >
                        <Grid3X3 size={16} />
                    </button>
                </div>
            </motion.div>

            {/* --- Map Layer --- */}
            <main className={styles.mapWrapper}>
                <div ref={mapContainer} className={styles.map} />
            </main>

            {/* --- Codex Side Panel --- */}
            <AnimatePresence>
                {selectedEntity && (
                    <motion.aside
                        className={styles.codexPanel}
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className={styles.codexHeader}>
                            <h2 className={styles.codexTitle}>{selectedEntity.name || selectedEntity.title}</h2>
                            <span className={styles.codexSubtitle}>
                                RECORD ID: {(selectedEntity.id).split('-')[0].toUpperCase()}
                            </span>
                        </div>

                        <div className={styles.codexContent}>
                            <div className={styles.dataBlock}>
                                <span className={styles.dataLabel}>TEMPORAL LOCK</span>
                                <span className={styles.dataValue}>
                                    {(selectedEntity as any).startYear ?
                                        `${Math.abs((selectedEntity as any).startYear)} - ${Math.abs((selectedEntity as any).endYear)}` :
                                        `${Math.abs(selectedEntity.year || 0)}`
                                    }
                                    <span style={{ color: 'var(--gold-primary)', marginLeft: 8 }}>
                                        {(selectedEntity.year || -1000) < 0 ? 'BCE' : 'CE'}
                                    </span>
                                </span>
                            </div>

                            <div className={styles.dataBlock}>
                                <span className={styles.dataLabel}>ARCHIVAL DESCRIPTION</span>
                                <p className={styles.dataValue}>
                                    {selectedEntity.description || 'No descriptive data available for this archival entry.'}
                                </p>
                            </div>

                            <div className={styles.aiTerminal}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--gold-primary)' }}>
                                    <Cpu size={14} />
                                    <span style={{ fontWeight: 800, fontSize: 10, letterSpacing: '0.1em' }}>AI ANALYSIS RUNNING...</span>
                                </div>
                                {selectedEntity.analysis ||
                                    "Processing vector data... Pattern recognition suggests high probability of significant cultural exchange events in this sector. Recommend further excavation."}
                            </div>
                        </div>

                        <div className={styles.codexActions}>
                            <Button variant="primary" fullWidth leftIcon={<BookOpen size={16} />} size="sm">
                                OPEN FULL DOSSIER
                            </Button>
                            <Button variant="ghost" size="sm" leftIcon={<Share2 size={16} />}>
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* --- Chronometer --- */}
            <motion.div
                className={styles.chronometer}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <div className={styles.chronoContainer}>
                    <div className={styles.chronoHeader}>
                        <div className={styles.currentEraDisplay}>
                            <span className={styles.eraLabel}>CURRENT TEMPORAL ZONE</span>
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={currentEra.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4 }}
                                    style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'block' }}
                                >
                                    {currentEra.name}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                        <div className={styles.yearDisplay}>
                            {Math.abs(viewYear)}
                            <span className={styles.yearSuffix}>{viewYear < 0 ? 'BC' : 'AD'}</span>
                        </div>
                    </div>

                    <div className={styles.timelineTrack}>
                        <div className={styles.rail} />
                        <div className={styles.tickMarks}>
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.tick} ${i % 5 === 0 ? styles.major : ''}`}
                                    style={{ left: `${(i / 19) * 100}%` }}
                                />
                            ))}
                        </div>
                        <motion.div
                            className={styles.playhead}
                            style={{ left: `${((viewYear - (-3300)) / (1600 - (-3300))) * 100}%` }}
                        />

                        {/* Interactive Slider Input */}
                        <input
                            type="range"
                            min="-3300"
                            max="1600"
                            value={viewYear}
                            onChange={(e) => setViewYear(Number(e.target.value))}
                            className={styles.timelineInput}
                        />
                    </div>

                    <div className={styles.eraControls}>
                        {ERAS.map(era => (
                            <button
                                key={era.name}
                                className={`${styles.eraBtn} ${currentEra.name === era.name ? styles.active : ''}`}
                                onClick={() => jumpToEra(era)}
                            >
                                {era.name}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
