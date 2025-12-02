export interface Country {
    id: string;
    name: string;
    continent: string;
    adjacencies: string[];
}

export interface MapState {
    country_id: string;
    owner_id: string | null;
    minds_count: number;
}

export interface CombinedCountryData extends Country, MapState { }