// Global utility functions for the Mind Mashup competition

// Audio context for sound effects
let audioContext;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play a beep sound for distraction
function playBeep(frequency = 800, duration = 500, volume = 0.3) {
    initAudio();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Play multiple beeps for more distraction
function playDistractionSound() {
    const sounds = [
        { freq: 800, delay: 0 },
        { freq: 600, delay: 200 },
        { freq: 1000, delay: 400 },
        { freq: 400, delay: 600 }
    ];
    
    sounds.forEach(sound => {
        setTimeout(() => playBeep(sound.freq, 300, 0.2), sound.delay);
    });
}

// Format time for display
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return remainingSeconds.toString();
}

// Show/hide loading state
function setLoading(element, isLoading) {
    if (isLoading) {
        element.disabled = true;
        element.classList.add('loading');
        const originalText = element.textContent;
        element.dataset.originalText = originalText;
        element.textContent = 'Loading...';
    } else {
        element.disabled = false;
        element.classList.remove('loading');
        element.textContent = element.dataset.originalText || element.textContent;
    }
}

// Validate participant name
function validateName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Name is required' };
    }
    
    if (name.trim().length < 2) {
        return { valid: false, error: 'Name must be at least 2 characters long' };
    }
    
    if (name.trim().length > 50) {
        return { valid: false, error: 'Name must be less than 50 characters' };
    }
    
    // Check for valid characters (letters, numbers, spaces, basic punctuation)
    const validNamePattern = /^[a-zA-Z0-9\s\-_'.]+$/;
    if (!validNamePattern.test(name.trim())) {
        return { valid: false, error: 'Name contains invalid characters' };
    }
    
    return { valid: true };
}

// API helper functions
const api = {
    async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    },
    
    async get(url) {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
};

// Timer utilities
class Timer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.interval = null;
        this.isRunning = false;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.onTick(this.remaining);
        
        this.interval = setInterval(() => {
            this.remaining--;
            this.onTick(this.remaining);
            
            if (this.remaining <= 0) {
                this.stop();
                this.onComplete();
            }
        }, 1000);
    }
    
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.isRunning = false;
        }
    }
    
    pause() {
        this.stop();
    }
    
    resume() {
        if (!this.isRunning && this.remaining > 0) {
            this.start();
        }
    }
    
    reset() {
        this.stop();
        this.remaining = this.duration;
    }
}

// Local storage utilities for persistence
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(`mindmashup_${key}`, JSON.stringify(value));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`mindmashup_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(`mindmashup_${key}`);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }
    },
    
    clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('mindmashup_'));
            keys.forEach(key => localStorage.removeItem(key));
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
    }
};

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit answer (if on question page)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn && !submitBtn.disabled) {
            e.preventDefault();
            submitBtn.click();
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }
});

// Prevent accidental page refresh during competition
window.addEventListener('beforeunload', function(e) {
    const isOnQuestionPage = window.location.pathname === '/question';
    const hasActiveInput = document.querySelector('#answerInput:focus');
    
    if (isOnQuestionPage && hasActiveInput) {
        e.preventDefault();
        e.returnValue = 'You are in the middle of a question. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Initialize audio on first click
document.addEventListener('click', initAudio, { once: true });

// Export for use in other scripts
window.MindMashup = {
    playBeep,
    playDistractionSound,
    formatTime,
    setLoading,
    validateName,
    api,
    Timer,
    storage
};