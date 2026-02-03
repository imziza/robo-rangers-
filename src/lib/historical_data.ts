export interface HistoricalEvent {
    id: string;
    title: string;
    description: string;
    year: number; // Positive for CE, Negative for BCE
    coordinates: [number, number];
    radius: number; // Influential area in km
    tag: 'War' | 'Culture' | 'Discovery' | 'Natural';
}

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
    {
        id: 'troy-war',
        title: 'The Siege of Troy',
        description: 'The legendary decadelong Greek siege of the Anatolian city of Troy.',
        year: -1250,
        coordinates: [26.2393, 39.9575],
        radius: 50,
        tag: 'War'
    },
    {
        id: 'rome-founding',
        title: 'Kingdom of Rome Established',
        description: 'Legendary founding of Rome by Romulus.',
        year: -753,
        coordinates: [12.4964, 41.9028],
        radius: 30,
        tag: 'Culture'
    },
    {
        id: 'alexander-persia',
        title: 'Alexander Enters Babylon',
        description: 'Alexander the Great enters the capital of the Persian Empire.',
        year: -331,
        coordinates: [44.4208, 32.5401],
        radius: 100,
        tag: 'War'
    },
    {
        id: 'pompeii-eruption',
        title: 'Eruption of Mount Vesuvius',
        description: 'Volcanic eruption burying Pompeii and Herculaneum.',
        year: 79,
        coordinates: [14.4848, 40.7489],
        radius: 20,
        tag: 'Natural'
    },
    {
        id: 'byzantium-conquest',
        title: 'Fall of Constantinople',
        description: 'The Ottoman conquest of the Byzantine capital.',
        year: 1453,
        coordinates: [28.9784, 41.0082],
        radius: 80,
        tag: 'War'
    },
    {
        id: 'knossos-palace',
        title: 'Zenith of Minoan Knossos',
        description: 'The peak of the Minoan civilization on Crete.',
        year: -1700,
        coordinates: [25.1631, 35.2980],
        radius: 40,
        tag: 'Culture'
    }
];

export interface HistoricalCivilization {
    id: string;
    name: string;
    description: string;
    startYear: number;
    endYear: number;
    color: string;
    // Approximated bounding box or simple polygon for demo
    geometry: {
        type: 'Polygon';
        coordinates: number[][][];
    };
}

export const CIVILIZATIONS: HistoricalCivilization[] = [
    {
        id: 'ancient-egypt',
        name: 'Ancient Egypt',
        description: 'The Nile Valley civilization famous for its pharaohs, pyramids, and hieroglyphs.',
        startYear: -3100,
        endYear: -30,
        color: '#E5C158',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [30, 22], [35, 22], [33, 31], [29, 31], [30, 22]
            ]]
        }
    },
    {
        id: 'roman-empire',
        name: 'Roman Empire',
        description: 'The peak of Roman influence spanning the Mediterranean.',
        startYear: -27,
        endYear: 476,
        color: '#8B0000',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [-10, 35], [45, 35], [45, 55], [-10, 55], [-10, 35]
            ]]
        }
    },
    {
        id: 'sumer',
        name: 'Sumerian Civilization',
        description: 'The earliest known civilization in southern Mesopotamia.',
        startYear: -4500,
        endYear: -1900,
        color: '#CD7F32',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [42, 30], [48, 30], [48, 35], [42, 35], [42, 30]
            ]]
        }
    }
];

export function getEventsForYear(year: number, margin: number = 50): HistoricalEvent[] {
    return HISTORICAL_EVENTS.filter(e => Math.abs(e.year - year) <= margin);
}

export function getCivilizationsForYear(year: number): HistoricalCivilization[] {
    return CIVILIZATIONS.filter(c => year >= c.startYear && year <= c.endYear);
}
