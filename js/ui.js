/**
 * UI Manager - Handles all UI rendering and interactions
 */
class UIManager {
    constructor() {
        this.zones = {
            1: 'Active Recovery',
            2: 'Endurance',
            3: 'Tempo',
            4: 'Threshold',
            5: 'VO2 Max'
        };
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast toast-${type}`;
            toast.style.display = 'block';
            
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Update result count
     */
    updateResultCount(count) {
        const countEl = document.getElementById('resultCount');
        if (countEl) {
            countEl.textContent = count === 1 
                ? '1 workout found' 
                : `${count} workouts found`;
        }
    }

    /**
     * Populate zone filter dropdown
     */
    populateZoneFilter(workouts) {
        const zoneSelect = document.getElementById('zone');
        if (!zoneSelect) return;

        const zones = new Set();
        workouts.forEach(w => {
            if (w.primary_zone) zones.add(w.primary_zone);
        });

        let options = '<option value="">All Types</option>';
        Array.from(zones).sort().forEach(zone => {
            const zoneName = this.zones[zone] || `Zone ${zone}`;
            options += `<option value="${zone}">${zoneName}</option>`;
        });
        
        zoneSelect.innerHTML = options;
    }

    /**
     * Render workout cards
     */
    renderWorkouts(workouts) {
        const container = document.getElementById('workoutCards');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;

        if (workouts.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            this.updateResultCount(0);
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = workouts.map(workout => `
            <div class="workout-card" onclick="app.showWorkoutDetail('${workout.id}')">
                <div class="card-header">
                    <h3>${this.escapeHtml(workout.name)}</h3>
                    <span class="category-badge">${this.escapeHtml(workout.category || 'Unknown')}</span>
                </div>
                <div class="card-stats">
                    <div class="stat">
                        <span class="stat-value">${workout.duration_seconds ? Math.round(workout.duration_seconds / 60) : '?'}</span>
                        <span class="stat-label">min</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${workout.primary_zone || '?'}</span>
                        <span class="stat-label">Zone</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${workout.tss || '?'}</span>
                        <span class="stat-label">TSS</span>
                    </div>
                </div>
            </div>
        `).join('');

        this.updateResultCount(workouts.length);
    }

    /**
     * Show workout detail modal
     */
    showWorkoutDetail(workout) {
        const modal = document.getElementById('workoutModal');
        if (!modal) return;

        const workoutData = window.currentWorkouts.find(w => w.id === workout);
        if (!workoutData) return;

        document.getElementById('detailName').textContent = workoutData.name || 'Unknown';
        document.getElementById('detailDescription').textContent = workoutData.description || 'No description available';
        document.getElementById('detailAuthor').textContent = workoutData.author || 'Unknown';
        document.getElementById('detailCategory').textContent = workoutData.category || 'Unknown';
        document.getElementById('detailDuration').textContent = workoutData.duration_seconds ? Math.round(workoutData.duration_seconds / 60) : '?';
        document.getElementById('detailZone').textContent = workoutData.primary_zone ? `Zone ${workoutData.primary_zone}` : '?';
        document.getElementById('detailTSS').textContent = workoutData.tss || '?';
        document.getElementById('detailAvgPower').textContent = workoutData.avg_power || '?';

        window.selectedWorkout = workoutData;

        modal.style.display = 'flex';
    }

    /**
     * Close modal
     */
    closeModal(modalId = 'workoutModal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        const storage = new StorageManager();
        const modal = document.getElementById('settingsModal');
        
        if (modal) {
            document.getElementById('apiKey').value = storage.getApiKey();
            document.getElementById('athleteId').value = storage.getAthleteId();
            modal.style.display = 'flex';
        }
    }

    /**
     * Show update banner
     */
    showUpdateBanner(count) {
        const banner = document.getElementById('updateBanner');
        const message = document.getElementById('updateMessage');
        
        if (banner && message) {
            message.textContent = `${count} new workouts available!`;
            banner.style.display = 'flex';
        }
    }

    /**
     * Hide update banner
     */
    hideUpdateBanner() {
        const banner = document.getElementById('updateBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update TSS range label
     */
    updateTSSLabel() {
        const min = document.getElementById('tssMin')?.value || 0;
        const max = document.getElementById('tssMax')?.value || 500;
        const label = document.getElementById('tssLabel');
        
        if (label) {
            label.textContent = `TSS: ${min} - ${max}`;
        }
    }
}

// Export for use in other files
window.UIManager = UIManager;
