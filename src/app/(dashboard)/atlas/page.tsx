'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
    Layers,
    Grid3X3,
    FileText,
    MapPin,
    Radio,
    Landmark,
    Circle,
    Navigation,
    LocateFixed
} from 'lucide-react';
import styles from './page.module.css';

interface ArtifactMarker {
    id: string;
    title: string;
    era: string;
    depth: string;
    coordinates: [number, number];
    type: 'personal' | 'museum' | 'site';
    verified: boolean;
    imageUrl?: string;
}

const MOCK_MARKERS: ArtifactMarker[] = [
    {
        id: 'AL-441-K',
        title: 'Bronze Aegis of the Anatolian Frontier',
        era: 'Late Bronze',
        depth: '1.42 Meters',
        coordinates: [32.8647, 39.9334], // Ankara, Turkey
        type: 'site',
        verified: true,
    },
    {
        id: 'museum-ankara',
        title: 'Museum: Ankara',
        era: '',
        depth: '',
        coordinates: [32.8597, 39.9208],
        type: 'museum',
        verified: true,
    },
];

const ERA_FILTERS = ['Bronze Age', 'Iron Age', 'Roman', 'Byzantine'];

export default function AtlasPage() {
    const router = useRouter();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    const [artifacts, setArtifacts] = useState<ArtifactMarker[]>([]);
    const [selectedEras, setSelectedEras] = useState<string[]>(['Bronze Age', 'Iron Age', 'Roman', 'Byzantine']);
    const [layersVisible, setLayersVisible] = useState({
        mapLayers: true,
        coordinateGrid: false,
        fieldNotes: false,
        topography: true,
        hydrology: false,
        cityBoundaries: true,
    });
    const [signalStrength, setSignalStrength] = useState('L-Band Satellite Linked');
    const [accuracy, setAccuracy] = useState(98.4);
    const [isPlanning, setIsPlanning] = useState(false);
    const [gpsGranted, setGpsGranted] = useState(false);
    const [selectedArtifact, setSelectedArtifact] = useState<ArtifactMarker | null>(null);
    const [liveSites, setLiveSites] = useState(0);
    const [viewYear, setViewYear] = useState(-1200); // 1200 BC
    const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
    const popupRef = useRef<maplibregl.Popup | null>(null);
    const planningMarkerRef = useRef<maplibregl.Marker | null>(null);

    useEffect(() => {
        loadArtifacts();
    }, []);

    useEffect(() => {
        if (!map.current) return;

        const updateGrid = () => {
            if (!map.current) return;
            const sourceId = 'coordinate-grid';

            if (layersVisible.coordinateGrid) {
                const bounds = map.current.getBounds();
                const gridData: any = { type: 'FeatureCollection', features: [] };

                // Add lat/long lines every degree
                for (let lng = Math.floor(bounds.getWest()); lng <= Math.ceil(bounds.getEast()); lng++) {
                    gridData.features.push({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: [[lng, bounds.getSouth()], [lng, bounds.getNorth()]] }
                    });
                }
                for (let lat = Math.floor(bounds.getSouth()); lat <= Math.ceil(bounds.getNorth()); lat++) {
                    gridData.features.push({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: [[bounds.getWest(), lat], [bounds.getEast(), lat]] }
                    });
                }

                if (!map.current.getSource(sourceId)) {
                    map.current.addSource(sourceId, { type: 'geojson', data: gridData });
                    map.current.addLayer({
                        id: sourceId,
                        type: 'line',
                        source: sourceId,
                        paint: { 'line-color': '#C9A227', 'line-opacity': 0.2, 'line-width': 1 }
                    });
                } else {
                    (map.current.getSource(sourceId) as any).setData(gridData);
                }
            } else if (map.current.getLayer(sourceId)) {
                map.current.removeLayer(sourceId);
                map.current.removeSource(sourceId);
            }
        };

        updateGrid();
        map.current.on('moveend', updateGrid);
        return () => { map.current?.off('moveend', updateGrid); };
    }, [layersVisible.coordinateGrid]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAccuracy(prev => +(prev + (Math.random() - 0.5) * 0.1).toFixed(2));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const getEraFromYear = (year: number) => {
        if (year <= -2000) return 'Early Bronze';
        if (year <= -1200) return 'Late Bronze';
        if (year <= -700) return 'Iron Age';
        if (year <= 476) return 'Roman';
        if (year <= 1453) return 'Byzantine';
        return 'Post-Classical';
    };

    const loadArtifacts = async () => {
        const supabase = createSupabaseBrowserClient();
        try {
            const { data, error } = await supabase
                .from('artifacts')
                .select('*, artifact_images(image_url, is_primary)');

            if (error) throw error;

            const formatted: ArtifactMarker[] = (data || []).map(a => ({
                id: a.id,
                title: a.title,
                era: a.era || 'Unknown',
                depth: 'Surface',
                coordinates: [a.longitude || 0, a.latitude || 0],
                type: 'personal',
                verified: a.status === 'stable',
                imageUrl: a.artifact_images?.find((img: any) => img.is_primary)?.image_url
            }));

            // Filter out artifacts with invalid coordinates (0,0) unless they are actually at 0,0
            const validFormatted = formatted.filter(a => a.coordinates[0] !== 0 || a.coordinates[1] !== 0);

            setArtifacts([...MOCK_MARKERS, ...validFormatted]);
            setLiveSites(validFormatted.length + MOCK_MARKERS.filter(m => m.type === 'site').length);
        } catch (error) {
            console.error('Error loading map artifacts:', error);
            setArtifacts(MOCK_MARKERS);
        }
    };

    useEffect(() => {
        if (!map.current) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        // Filter and add markers based on era and year
        artifacts.filter(a => {
            if (a.type === 'museum') return true;
            const currentYearEra = getEraFromYear(viewYear).toLowerCase();
            const artifactEra = a.era.toLowerCase();
            const matchesEra = selectedEras.length === 0 || selectedEras.some(era => artifactEra.includes(era.toLowerCase()));
            const matchesTimeline = artifactEra.includes(currentYearEra) || artifactEra.includes('unknown');
            return matchesEra && matchesTimeline;
        }).forEach((marker) => {
            const el = document.createElement('div');
            el.className = marker.type === 'museum' ? styles.museumMarker : styles.artifactMarker;
            el.innerHTML = marker.type === 'museum'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>';

            // Hover interactions
            el.addEventListener('mouseenter', () => {
                if (!map.current) return;

                // Remove existing popup
                if (popupRef.current) popupRef.current.remove();

                const popupContent = `
                    <div class="${styles.hoverPopup}">
                        <div class="${styles.hoverHeader}">${marker.type.toUpperCase()} DISCOVERY</div>
                        ${marker.imageUrl || (marker.id === 'AL-441-K' ? '/artifacts/mask.png' : (marker.id === 'AL-992-X' ? '/artifacts/sarcophagus.png' : '')) ? `
                            <div class="${styles.hoverImage}">
                                <img src="${marker.imageUrl || (marker.id === 'AL-441-K' ? '/artifacts/mask.png' : '/artifacts/sarcophagus.png')}" />
                            </div>
                        ` : ''}
                        <div class="${styles.hoverTitle}">${marker.title}</div>
                        <div class="${styles.hoverMeta}">${marker.era} | ${marker.coordinates[0].toFixed(2)}°E, ${marker.coordinates[1].toFixed(2)}°N</div>
                    </div>
                `;

                popupRef.current = new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: styles.mapPopup,
                    offset: 15
                })
                    .setLngLat(marker.coordinates as maplibregl.LngLatLike)
                    .setHTML(popupContent)
                    .addTo(map.current);
            });

            el.addEventListener('mouseleave', () => {
                if (popupRef.current) {
                    popupRef.current.remove();
                    popupRef.current = null;
                }
            });

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelectedArtifact(marker);
                map.current?.flyTo({ center: marker.coordinates, zoom: 12 });
            });

            const m = new maplibregl.Marker({ element: el })
                .setLngLat(marker.coordinates as maplibregl.LngLatLike)
                .addTo(map.current!);

            markersRef.current[marker.id] = m;
        });
    }, [artifacts, selectedEras, viewYear]);

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // Initialize MapLibre
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: [
                            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        ],
                        tileSize: 256,
                        attribution: '&copy; OpenStreetMap Contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm-tiles',
                        type: 'raster',
                        source: 'osm',
                        minzoom: 0,
                        maxzoom: 19,
                        paint: {
                            'raster-saturation': -0.7,
                            'raster-brightness-min': 0.2,
                            'raster-contrast': 0.1,
                        },
                    },
                ],
            },
            center: [32.8647, 39.9334],
            zoom: 6,
        });

        map.current.on('click', (e) => {
            setSelectedArtifact(null);

            if (isPlanning) {
                if (planningMarkerRef.current) planningMarkerRef.current.remove();

                const el = document.createElement('div');
                el.className = styles.planningMarker;
                el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

                planningMarkerRef.current = new maplibregl.Marker({ element: el })
                    .setLngLat(e.lngLat)
                    .addTo(map.current!);

                if (confirm(`Target confirmed at ${e.lngLat.lat.toFixed(4)}°N, ${e.lngLat.lng.toFixed(4)}°E. Initialize excavation protocols?`)) {
                    router.push(`/analysis?lat=${e.lngLat.lat}&lng=${e.lngLat.lng}`);
                }
            }
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.current.addControl(new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
        }), 'top-right');

        // Markers are managed by a separate effect

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    const toggleEra = (era: string) => {
        setSelectedEras(prev =>
            prev.includes(era)
                ? prev.filter(e => e !== era)
                : [...prev, era]
        );
    };

    const toggleLayer = (layer: keyof typeof layersVisible) => {
        setLayersVisible(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    const requestGpsPermission = async () => {
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            if (result.state === 'granted' || result.state === 'prompt') {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setGpsGranted(true);
                        setAccuracy(+(position.coords.accuracy / 10).toFixed(1));
                        map.current?.flyTo({
                            center: [position.coords.longitude, position.coords.latitude],
                            zoom: 12,
                        });
                    },
                    (error) => console.error('GPS error:', error)
                );
            }
        } catch (err) {
            console.error('Permission error:', err);
        }
    };

    return (
        <div className={styles.container}>
            {/* Left Sidebar - Controls */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><Navigation size={14} /></span>
                        ATLAS TOOLS
                    </h3>

                    <div className={styles.toolList}>
                        <label className={`${styles.toolItem} ${layersVisible.mapLayers ? styles.active : ''}`}>
                            <input
                                type="checkbox"
                                checked={layersVisible.mapLayers}
                                onChange={() => toggleLayer('mapLayers')}
                            />
                            <span className={styles.toolIcon}><Layers size={16} /></span>
                            Map Layers
                        </label>

                        <label className={`${styles.toolItem} ${layersVisible.coordinateGrid ? styles.active : ''}`}>
                            <input
                                type="checkbox"
                                checked={layersVisible.coordinateGrid}
                                onChange={() => toggleLayer('coordinateGrid')}
                            />
                            <span className={styles.toolIcon}><Grid3X3 size={16} /></span>
                            Coordinate Grid
                        </label>

                        <label className={`${styles.toolItem} ${layersVisible.fieldNotes ? styles.active : ''}`}>
                            <input
                                type="checkbox"
                                checked={layersVisible.fieldNotes}
                                onChange={() => toggleLayer('fieldNotes')}
                            />
                            <span className={styles.toolIcon}><FileText size={16} /></span>
                            Field Notes
                        </label>
                    </div>
                </div>

                <div className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle}>ERA FILTERS</h3>
                    <div className={styles.eraFilters}>
                        {ERA_FILTERS.map((era) => (
                            <button
                                key={era}
                                className={`${styles.eraTag} ${selectedEras.includes(era) ? styles.active : ''}`}
                                onClick={() => toggleEra(era)}
                            >
                                {era}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.sidebarSection}>
                    <h3 className={styles.sectionTitle}>VISUALIZATION</h3>
                    <div className={styles.vizOptions}>
                        <label className={styles.vizItem}>
                            <input
                                type="checkbox"
                                checked={layersVisible.topography}
                                onChange={() => toggleLayer('topography')}
                            />
                            Topography
                        </label>
                        <label className={styles.vizItem}>
                            <input
                                type="checkbox"
                                checked={layersVisible.hydrology}
                                onChange={() => toggleLayer('hydrology')}
                            />
                            Hydrology
                        </label>
                        <label className={styles.vizItem}>
                            <input
                                type="checkbox"
                                checked={layersVisible.cityBoundaries}
                                onChange={() => toggleLayer('cityBoundaries')}
                            />
                            City Boundaries
                        </label>
                    </div>
                </div>

                <div className={styles.gpsStatus}>
                    <div className={`${styles.gpsIndicator} ${gpsGranted ? styles.granted : ''}`}>
                        <LocateFixed size={16} strokeWidth={2} />
                        GPS: {gpsGranted ? 'PERMISSION GRANTED' : 'AWAITING PERMISSION'}
                    </div>
                </div>

                <Button
                    variant={isPlanning ? "secondary" : "primary"}
                    fullWidth
                    onClick={() => {
                        setIsPlanning(!isPlanning);
                        if (!isPlanning) {
                            alert('Click anywhere on the map to define a new excavation site coordinates.');
                        }
                    }}
                >
                    {isPlanning ? "Cancel Extraction" : "Start New Excavation"}
                </Button>
            </aside>

            {/* Map Container */}
            <main className={styles.mapWrapper}>
                <div ref={mapContainer} className={styles.map} />

                {/* Artifact Popup */}
                {selectedArtifact && (
                    <div className={styles.artifactPopup}>
                        <div className={styles.popupHeader}>
                            <span className={styles.popupBadge}>
                                {selectedArtifact.verified ? '✓ VERIFIED' : 'UNVERIFIED'}
                            </span>
                        </div>

                        <div className={styles.popupImage}>
                            <div className={styles.siteLabel}>SITE: TROY</div>
                        </div>

                        <h3 className={styles.popupTitle}>{selectedArtifact.title}</h3>
                        <p className={styles.popupCoords}>
                            Lat: 39.9334° N | Long: 32.8647° E
                        </p>

                        <div className={styles.popupMeta}>
                            <div className={styles.popupMetaItem}>
                                <span className={styles.popupMetaLabel}>ERA</span>
                                <span className={styles.popupMetaValue}>{selectedArtifact.era}</span>
                            </div>
                            <div className={styles.popupMetaItem}>
                                <span className={styles.popupMetaLabel}>DEPTH</span>
                                <span className={styles.popupMetaValue}>{selectedArtifact.depth}</span>
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            fullWidth
                            size="sm"
                            onClick={() => router.push(`/report/${selectedArtifact.id}`)}
                        >
                            View Full Report
                        </Button>

                        <div className={styles.popupTag}>PERSONAL FIND</div>
                    </div>
                )}

                {/* Museum Marker */}
                <div className={styles.museumLabel}>
                    <span className={styles.museumIcon}>🏛</span>
                    MUSEUM: ANKARA
                </div>
            </main>

            {/* Bottom Stats Bar */}
            <footer className={styles.statsBar}>
                <div className={styles.statGroup}>
                    <span className={styles.statIcon}><Radio size={18} /></span>
                    <div className={styles.statContent}>
                        <span className={styles.statLabel}>SIGNAL STRENGTH</span>
                        <span className={styles.statValue}>{signalStrength}</span>
                    </div>
                </div>

                <div className={styles.statGroup}>
                    <span className={styles.statValue}>{liveSites}</span>
                    <span className={styles.statLabel}>LIVE SITES</span>
                </div>

                <div className={styles.statGroup}>
                    <span className={styles.statValue}>{accuracy}%</span>
                    <span className={styles.statLabel}>ACCURACY</span>
                </div>

                <div className={styles.timeline}>
                    <span className={styles.timelineMarker} style={{ left: `${((viewYear + 2000) / 4000) * 100}%` }}>
                        {Math.abs(viewYear)} {viewYear < 0 ? 'BCE' : 'CE'} ({getEraFromYear(viewYear).toUpperCase()})
                    </span>
                    <div className={styles.timelineTrack}>
                        <input
                            type="range"
                            min="-2000"
                            max="2000"
                            value={viewYear}
                            onChange={(e) => setViewYear(Number(e.target.value))}
                            className={styles.timelineSlider}
                        />
                        <div className={styles.timelineFill} style={{ width: `${((viewYear + 2000) / 4000) * 100}%` }}></div>
                    </div>
                    <div className={styles.timelineLabels}>
                        <span>2000 BCE</span>
                        <span>0</span>
                        <span>2000 CE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
