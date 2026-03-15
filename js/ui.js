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
     * Show initial state - before any search
     */
    showInitialState() {
        const container = document.getElementById('workoutCards');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;
        
        container.innerHTML = '';
        if (emptyState) {
            emptyState.innerHTML = '<p>Use the filters above or click "Surprise Me" to find a workout!</p>';
            emptyState.style.display = 'block';
        }
        
        const countEl = document.getElementById('resultCount');
        if (countEl) {
            countEl.textContent = 'Ready to find your workout';
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
                        <span class="stat-value">${workout.duration_seconds ? Math.round(workout.duration_seconds / 60) : 0}</span>
                        <span class="stat-label">min</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${workout.primary_zone || '-'}</span>
                        <span class="stat-label">Zone</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${workout.tss !== undefined && workout.tss !== null ? workout.tss : 0}</span>
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
        
        // Handle 0 values properly - show 0 instead of ?
        const duration = workoutData.duration_seconds ? Math.round(workoutData.duration_seconds / 60) : 0;
        document.getElementById('detailDuration').textContent = duration;
        document.getElementById('detailZone').textContent = workoutData.primary_zone ? `Zone ${workoutData.primary_zone}` : 'N/A';
        document.getElementById('detailTSS').textContent = workoutData.tss !== undefined && workoutData.tss !== null ? workoutData.tss : 0;
        document.getElementById('detailAvgPower').textContent = workoutData.avg_power || 0;

        // Render intensity visualization
        this.renderWorkoutIntensity(workoutData);

        window.selectedWorkout = workoutData;

        modal.style.display = 'flex';
    }

    /**
     * Render workout intensity visualization - Power vs Time chart
     */
    renderWorkoutIntensity(workoutData) {
        const container = document.getElementById('intensityContainer');
        if (!container) return;
        
        const segments = workoutData.segments || [];
        
        if (!segments || segments.length === 0) {
            container.innerHTML = '<p class="intensity-note">No segment data available. Download the file to view workout details.</p>';
            return;
        }
        
        // Build chart data
        const data = segments.map(seg => seg.power || 0);
        const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
        
        // Zone colors
        const getZoneColor = (power) => {
            if (power < 55) return '#22c55e'; // Zone 1 - Green
            if (power < 75) return '#3b82f6'; // Zone 2 - Blue
            if (power < 90) return '#eab308'; // Zone 3 - Yellow
            if (power < 105) return '#f97316'; // Zone 4 - Orange
            return '#ef4444'; // Zone 5+ - Red
        };
        
        // Calculate SVG dimensions
        const width = 600;
        const height = 200;
        const padding = { top: 25, right: 30, bottom: 35, left: 55 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Scale calculations
        const maxPower = Math.max(...data, 110);
        const xScale = (duration) => (duration / totalDuration) * chartWidth;
        const yScale = (power) => chartHeight - (power / maxPower) * chartHeight;
        
        // Build SVG paths
        let currentX = padding.left;
        let bars = '';
        
        segments.forEach((seg, i) => {
            const barWidth = (seg.duration / totalDuration) * chartWidth;
            const power = seg.power || 0;
            const barHeight = (power / maxPower) * chartHeight;
            const y = padding.top + chartHeight - barHeight;
            const color = getZoneColor(power);
            
            bars += `<rect x="${currentX}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" />`;
            currentX += barWidth;
        });
        
        // Y-axis labels
        let yLabels = '';
        for (let p = 0; p <= maxPower; p += 25) {
            const y = yScale(p) + padding.top;
            yLabels += `<text x="${padding.left - 5}" y="${y + 3}" text-anchor="end" fill="#94a3b8" font-size="10">${p}%</text>`;
        }
        
        // X-axis labels
        let xLabels = '';
        const xSteps = 4;
        for (let i = 0; i <= xSteps; i++) {
            const time = Math.round((totalDuration / xSteps) * i);
            const x = padding.left + (chartWidth / xSteps) * i;
            xLabels += `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="#94a3b8" font-size="10">${this.formatTime(time)}</text>`;
        }
        
        // Grid lines
        let gridLines = '';
        for (let p = 25; p < maxPower; p += 25) {
            const y = padding.top + (chartHeight - (p / maxPower) * chartHeight);
            gridLines += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#334155" stroke-width="1" />`;
        }
        
        // Y-axis labels
        let yLabels = '';
        for (let p = 0; p <= maxPower; p += 25) {
            const y = padding.top + (chartHeight - (p / maxPower) * chartHeight);
            yLabels += `<text x="${padding.left - 8}" y="${y + 3}" text-anchor="end" fill="#94a3b8" font-size="10">${p}%</text>`;
        }
        
        container.innerHTML = `
            <div class="chart-container">
                <svg viewBox="0 0 ${width} ${height}" class="workout-chart">
                    ${gridLines}
                    ${bars}
                    ${yLabels}
                    ${xLabels}
                </svg>
            </div>
        `;
    }
    
    /**
     * Format seconds to MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
