/**
 * Main Application Logic
 */
class WorkoutApp {
    constructor() {
        this.storage = new StorageManager();
        this.api = new ApiManager();
        this.ui = new UIManager();
        this.workouts = [];
        this.filteredWorkouts = [];
        this.GITHUB_USERNAME = 'JC-Concepts';
        this.GITHUB_REPO = 'WorkoutGenerator';
        
        this.api.setGitHubRepo(this.GITHUB_USERNAME, this.GITHUB_REPO);
    }

    /**
     * Initialize the app
     */
    async init() {
        console.log('Initializing Cycling Workout Generator PWA...');
        
        this.ui.showLoading('Loading workouts...');
        
        try {
            await this.loadWorkouts();
        } catch (error) {
            console.error('Failed to load workouts:', error);
            this.ui.showToast('Failed to load workouts. Please try again.', 'error');
        }
        
        this.ui.hideLoading();
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.getElementById('tssMin')?.addEventListener('input', () => this.ui.updateTSSLabel());
        document.getElementById('tssMax')?.addEventListener('input', () => this.ui.updateTSSLabel());
        
        document.getElementById('workoutModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'workoutModal') this.closeModal();
        });
        
        document.getElementById('settingsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });
    }

    /**
     * Load workouts from cache or GitHub
     */
    async loadWorkouts() {
        const cachedManifest = this.storage.getCachedManifest();
        const cachedVersion = this.storage.getManifestVersion();
        
        try {
            this.ui.showLoading('Checking for updates...');
            console.log('Fetching manifest from:', this.api.GITHUB_BASE + '/workouts.json');
            const remoteManifest = await this.api.fetchManifest();
            console.log('Manifest received, workouts count:', remoteManifest.workouts?.length || 0);
            console.log('First workout segments:', remoteManifest.workouts?.[0]?.segments?.length || 0);
            
            if (remoteManifest.version !== cachedVersion) {
                console.log(`New version available: ${remoteManifest.version} (cached: ${cachedVersion})`);
                this.workouts = remoteManifest.workouts || [];
                this.storage.cacheManifest(remoteManifest);
                this.ui.showUpdateBanner(this.workouts.length);
            } else if (cachedManifest) {
                console.log('Using cached manifest');
                this.workouts = cachedManifest.workouts || [];
            } else {
                this.workouts = remoteManifest.workouts || [];
                this.storage.cacheManifest(remoteManifest);
            }
            
            this.filteredWorkouts = [];
            this.ui.populateZoneFilter(this.workouts);
            this.ui.showInitialState();
            
        } catch (error) {
            console.error('Error loading workouts:', error);
            
            if (cachedManifest) {
                console.log('Falling back to cached data');
                this.workouts = cachedManifest.workouts || [];
                this.filteredWorkouts = [];
                this.ui.populateZoneFilter(this.workouts);
                this.ui.showInitialState();
                this.ui.showToast('Using cached data. Could not check for updates.', 'info');
            } else {
                this.ui.showToast('No workout data available. Please check your connection.', 'error');
            }
        } finally {
            this.ui.hideLoading();
        }
        
        window.currentWorkouts = this.workouts;
    }

    /**
     * Filter workouts based on search criteria
     */
    filterWorkouts() {
        console.log('filterWorkouts called, workouts count:', this.workouts.length);
        
        const duration = document.getElementById('duration')?.value || '';
        const zone = document.getElementById('zone')?.value || '';
        const tssMin = parseInt(document.getElementById('tssMin')?.value || '0');
        const tssMax = parseInt(document.getElementById('tssMax')?.value || '500');

        // No filters = show all workouts
        if (!duration && !zone && tssMin === 0 && tssMax >= 500) {
            console.log('No filters, showing all workouts');
            this.filteredWorkouts = [...this.workouts];
            this.ui.renderWorkouts(this.filteredWorkouts);
            return;
        }

        this.filteredWorkouts = this.workouts.filter(workout => {
            if (duration) {
                const dur = workout.duration_seconds / 60;
                switch(duration) {
                    case 'less_30': if (dur >= 30) return false; break;
                    case '30_45': if (dur < 30 || dur > 45) return false; break;
                    case '45_60': if (dur < 45 || dur > 60) return false; break;
                    case '60_90': if (dur < 60 || dur > 90) return false; break;
                    case 'greater_90': if (dur <= 90) return false; break;
                }
            }

            if (zone && workout.primary_zone !== parseInt(zone)) {
                return false;
            }

            const tss = workout.tss || 0;
            if (tss < tssMin || tss > tssMax) {
                return false;
            }

            return true;
        });

        console.log('Filtered workouts:', this.filteredWorkouts.length);
        this.ui.renderWorkouts(this.filteredWorkouts);
    }

    /**
     * Reset filters
     */
    resetFilters() {
        document.getElementById('duration').value = '';
        document.getElementById('zone').value = '';
        document.getElementById('tssMin').value = 0;
        document.getElementById('tssMax').value = 500;
        this.ui.updateTSSLabel();
        
        this.filteredWorkouts = [];
        this.ui.showInitialState();
    }

    /**
     * Surprise me - random workout
     */
    surpriseMe() {
        console.log('surpriseMe called, workouts count:', this.workouts.length);
        
        if (this.workouts.length === 0) {
            this.ui.showToast('No workouts available', 'info');
            return;
        }
        
        // Use all workouts for surprise me
        this.filteredWorkouts = [...this.workouts];
        
        const randomIndex = Math.floor(Math.random() * this.filteredWorkouts.length);
        const randomWorkout = this.filteredWorkouts[randomIndex];
        
        console.log('Random workout:', randomWorkout.name);
        this.ui.showWorkoutDetail(randomWorkout.id);
    }

    /**
     * Show workout detail modal
     */
    showWorkoutDetail(workoutId) {
        this.ui.showWorkoutDetail(workoutId);
    }

    /**
     * Close modal
     */
    closeModal() {
        this.ui.closeModal('workoutModal');
    }

    /**
     * Close settings modal
     */
    closeSettings() {
        this.ui.closeModal('settingsModal');
    }

    /**
     * Show settings
     */
    showSettings() {
        this.ui.showSettingsModal();
    }

    /**
     * Save settings
     */
    saveSettings() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const athleteId = document.getElementById('athleteId').value.trim();
        
        if (!apiKey || !athleteId) {
            this.ui.showToast('Please enter both API Key and Athlete ID', 'error');
            return;
        }
        
        this.storage.setApiKey(apiKey);
        this.storage.setAthleteId(athleteId);
        
        this.ui.showToast('Settings saved successfully!', 'success');
        this.closeSettings();
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.storage.clearCache();
        this.ui.showToast('Cache cleared successfully!', 'success');
    }

    /**
     * Refresh data from GitHub
     */
    async refreshData() {
        this.ui.hideUpdateBanner();
        this.storage.clearCache();
        await this.loadWorkouts();
        this.ui.showToast('Workouts refreshed!', 'success');
    }

    /**
     * Download workout
     */
    async downloadWorkout() {
        if (!window.selectedWorkout) {
            this.ui.showToast('No workout selected', 'error');
            return;
        }

        try {
            this.ui.showLoading('Downloading workout...');
            await this.api.downloadWorkout(
                window.selectedWorkout.file,
                window.selectedWorkout.name + '.zwo'
            );
            this.ui.showToast('Workout downloaded!', 'success');
        } catch (error) {
            this.ui.showToast('Failed to download workout', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Upload to Intervals.icu
     */
    async uploadToIntervals() {
        if (!window.selectedWorkout) {
            this.ui.showToast('No workout selected', 'error');
            return;
        }

        const apiKey = this.storage.getApiKey();
        const athleteId = this.storage.getAthleteId();

        if (!apiKey || !athleteId) {
            this.ui.showToast('Please configure Intervals.icu settings first', 'error');
            this.closeModal();
            this.showSettings();
            return;
        }

        try {
            this.ui.showLoading('Uploading to Intervals.icu...');
            await this.api.uploadToIntervals(
                window.selectedWorkout.file,
                apiKey,
                athleteId
            );
            this.ui.showToast('Workout uploaded to Intervals.icu!', 'success');
            this.closeModal();
        } catch (error) {
            this.ui.showToast(error.message || 'Failed to upload workout', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }
}

// Export for use
window.WorkoutApp = WorkoutApp;
