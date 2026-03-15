/**
 * Storage Manager - Handles localStorage for the PWA
 */
class StorageManager {
    constructor() {
        this.keys = {
            MANIFEST_VERSION: 'manifest_version',
            CACHED_MANIFEST: 'cached_manifest',
            INTERVALS_API_KEY: 'intervals_api_key',
            INTERVALS_ATHLETE_ID: 'intervals_athlete_id',
            SETTINGS: 'app_settings',
            FIRST_LAUNCH: 'first_launch'
        };
    }

    /**
     * Check if this is the first launch
     */
    isFirstLaunch() {
        return localStorage.getItem(this.keys.FIRST_LAUNCH) === null;
    }

    /**
     * Mark that user has launched the app
     */
    setLaunched() {
        localStorage.setItem(this.keys.FIRST_LAUNCH, 'false');
    }

    /**
     * Get the stored manifest version
     */
    getManifestVersion() {
        return localStorage.getItem(this.keys.MANIFEST_VERSION) || '0';
    }

    /**
     * Set the manifest version
     */
    setManifestVersion(version) {
        localStorage.setItem(this.keys.MANIFEST_VERSION, version);
    }

    /**
     * Get cached manifest
     */
    getCachedManifest() {
        const data = localStorage.getItem(this.keys.CACHED_MANIFEST);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Cache manifest data
     */
    cacheManifest(manifest) {
        localStorage.setItem(this.keys.CACHED_MANIFEST, JSON.stringify(manifest));
        if (manifest.version) {
            this.setManifestVersion(manifest.version);
        }
    }

    /**
     * Get Intervals.icu API key
     */
    getApiKey() {
        return localStorage.getItem(this.keys.INTERVALS_API_KEY) || '';
    }

    /**
     * Set Intervals.icu API key
     */
    setApiKey(key) {
        localStorage.setItem(this.keys.INTERVALS_API_KEY, key);
    }

    /**
     * Get Athlete ID
     */
    getAthleteId() {
        return localStorage.getItem(this.keys.INTERVALS_ATHLETE_ID) || '';
    }

    /**
     * Set Athlete ID
     */
    setAthleteId(id) {
        localStorage.setItem(this.keys.INTERVALS_ATHLETE_ID, id);
    }

    /**
     * Check if user has configured Intervals.icu
     */
    hasIntervalsConfig() {
        const apiKey = this.getApiKey();
        const athleteId = this.getAthleteId();
        return apiKey.length > 0 && athleteId.length > 0;
    }

    /**
     * Get settings
     */
    getSettings() {
        const data = localStorage.getItem(this.keys.SETTINGS);
        return data ? JSON.parse(data) : {};
    }

    /**
     * Save settings
     */
    saveSettings(settings) {
        localStorage.setItem(this.keys.SETTINGS, JSON.stringify(settings));
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        localStorage.removeItem(this.keys.MANIFEST_VERSION);
        localStorage.removeItem(this.keys.CACHED_MANIFEST);
    }

    /**
     * Clear all data
     */
    clearAll() {
        localStorage.removeItem(this.keys.MANIFEST_VERSION);
        localStorage.removeItem(this.keys.CACHED_MANIFEST);
        localStorage.removeItem(this.keys.INTERVALS_API_KEY);
        localStorage.removeItem(this.keys.INTERVALS_ATHLETE_ID);
        localStorage.removeItem(this.keys.SETTINGS);
    }
}

// Export for use in other files
window.StorageManager = StorageManager;
