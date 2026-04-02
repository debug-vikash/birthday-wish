// ====== CONFIGURATION ======
const SUPABASE_URL = 'https://snjifhxhorgsqwgzfhml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuamlmaHhob3Jnc3F3Z3pmaG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODAyNTYsImV4cCI6MjA4OTc1NjI1Nn0.wdxKWZAsYW0RYr_2ONr_oiSLX2P8QnYeOT3qaksUGtQ';

let supabaseClient;
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ====== SHARED CONSTANTS ======
const SHAPES = ['shape-blob', 'shape-tilted-polygon', 'shape-soft-wave', 'shape-asymmetric', 'shape-broken-heart'];
const DIRECTIONS = ['slide-enter-left', 'slide-enter-right', 'slide-enter-top', 'slide-enter-bottom'];

// ====== UTILITY FUNCTIONS ======

/**
 * Formats seconds into M:SS format
 */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Creates floating background particles
 */
function createBackgroundParticles() {
    const container = document.getElementById('particles-container');
    if(!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 80 + 20;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}vw`;
        p.style.animationDuration = `${Math.random() * 10 + 10}s`;
        p.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(p);
    }
}

/**
 * Copies a surprise link to clipboard (used in dashboard)
 */
function copyLinkToClipboard(id, btn, isDashboard = true) {
    const link = isDashboard 
        ? `${window.location.origin}/view?id=${id}` 
        : id; // if not dashboard, id is the full link
        
    navigator.clipboard.writeText(link).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "Copied! ✨";
        btn.classList.add('bg-green-500');
        
        if (window.confetti && !isDashboard) {
            confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 }, colors: ['#ff99cc', '#ff8fa3', '#ffffff'] });
        }
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('bg-green-500');
        }, 2000);
    });
}

/**
 * Sequentially floats emojis for micro-animation
 */
function startEmojiFloat() {
    setInterval(() => {
        if (document.hidden || (window.isProcessing)) return;
        const emojis = ['❤️', '✨', '🎉', '💖', '🌟'];
        const el = document.createElement('div');
        el.className = 'absolute text-3xl animate-float-text z-50 pointer-events-none opacity-80';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = `${Math.random() * 90}vw`;
        el.style.top = `${Math.random() * 90}vh`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }, 4000);
}

/**
 * Image Compressor Function for mobile performance
 */
function compressImageFile(file, maxWidth = 1000) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = Math.max(width, height);
                if (maxDim > maxWidth) {
                    const scale = maxWidth / maxDim;
                    width = Math.floor(width * scale);
                    height = Math.floor(height * scale);
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas 2D context not available");
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Create tiny thumbnail for gallery preview
                const thumbCanvas = document.createElement('canvas');
                const thumbScale = 150 / Math.max(width, height);
                const tWidth = Math.floor(width * thumbScale) || 150;
                const tHeight = Math.floor(height * thumbScale) || 150;
                thumbCanvas.width = tWidth;
                thumbCanvas.height = tHeight;
                const tCtx = thumbCanvas.getContext('2d');
                if (tCtx) tCtx.drawImage(canvas, 0, 0, width, height, 0, 0, tWidth, tHeight);
                
                thumbCanvas.toBlob(tBlob => {
                    const thumbUrl = tBlob ? URL.createObjectURL(tBlob) : null;
                    
                    canvas.toBlob(blob => {
                        img.src = '';
                        img.onload = null;
                        img.onerror = null;
                        
                        if (blob) {
                            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
                            resolve({ file: newFile, thumbUrl: thumbUrl });
                        } else {
                            resolve({ file: file, thumbUrl: thumbUrl });
                        }
                    }, 'image/jpeg', 0.75);
                }, 'image/jpeg', 0.5);
            } catch (err) {
                console.error("Compression failed, falling back to original file:", err);
                resolve({ file: file, thumbUrl: null });
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ file: file, thumbUrl: null });
        };
        img.src = url;
    });
}

// Initialize common UI elements
document.addEventListener('DOMContentLoaded', () => {
    createBackgroundParticles();
    startEmojiFloat();
});
