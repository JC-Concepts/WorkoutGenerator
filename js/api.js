/**
 * API Manager - Handles GitHub and Intervals.icu API calls
 */
class ApiManager {
    constructor() {
        this.GITHUB_BASE = 'https://raw.githubusercontent.com/JC-Concepts/WorkoutGenerator/main';
        this.INTERVALS_BASE = 'https://intervals.icu/api/v1';
    }

    /**
     * Set GitHub repository URL
     */
    setGitHubRepo(username, repo) {
        this.GITHUB_BASE = `https://raw.githubusercontent.com/${username}/${repo}/main`;
    }

    /**
     * Fetch manifest from GitHub
     */
    async fetchManifest() {
        try {
            const response = await fetch(`${this.GITHUB_BASE}/manifest.json`);
            if (!response.ok) {
                throw new Error('Failed to fetch manifest');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching manifest:', error);
            throw error;
        }
    }

    /**
     * Fetch a workout file from GitHub
     */
    async fetchWorkoutFile(filePath) {
        try {
            const response = await fetch(`${this.GITHUB_BASE}/workouts/${filePath}`);
            if (!response.ok) {
                throw new Error('Failed to fetch workout file');
            }
            return await response.text();
        } catch (error) {
            console.error('Error fetching workout file:', error);
            throw error;
        }
    }

    /**
     * Download workout as file
     */
    async downloadWorkout(filePath, fileName) {
        try {
            const content = await this.fetchWorkoutFile(filePath);
            
            const blob = new Blob([content], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || filePath.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error downloading workout:', error);
            throw error;
        }
    }

    /**
     * Upload workout to Intervals.icu
     */
    async uploadToIntervals(filePath, apiKey, athleteId, startDate = null) {
        try {
            if (!apiKey || !athleteId) {
                throw new Error('API Key and Athlete ID are required');
            }

            const content = await this.fetchWorkoutFile(filePath);
            const base64 = btoa(unescape(encodeURIComponent(content)));
            
            const fileName = filePath.split('/').pop();
            
            const date = startDate || this.getNextAvailableDate();
            
            const eventData = [{
                category: 'WORKOUT',
                start_date_local: date,
                filename: fileName,
                file_contents_base64: base64
            }];

            const response = await fetch(`${this.INTERVALS_BASE}/athlete/${athleteId}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `ApiKey ${apiKey}:`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error uploading to Intervals.icu:', error);
            throw error;
        }
    }

    /**
     * Get next available date for workout (tomorrow at 9am)
     */
    getNextAvailableDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow.toISOString().slice(0, 16).replace('T', ' ');
    }

    /**
     * Check if API key is valid
     */
    async validateApiKey(apiKey, athleteId) {
        try {
            const response = await fetch(`${this.INTERVALS_BASE}/athlete/${athleteId}`, {
                headers: {
                    'Authorization': `ApiKey ${apiKey}:`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export for use in other files
window.ApiManager = ApiManager;
