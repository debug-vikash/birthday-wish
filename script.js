// ====== CONFIGURATION ======
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://snjifhxhorgsqwgzfhml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuamlmaHhob3Jnc3F3Z3pmaG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODAyNTYsImV4cCI6MjA4OTc1NjI1Nn0.wdxKWZAsYW0RYr_2ONr_oiSLX2P8QnYeOT3qaksUGtQ';

let supabaseClient;
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Utilities
const SHAPES = ['clip-heart', 'shape-circle', 'shape-blob', 'shape-diamond', 'shape-star'];
const DIRECTIONS = ['slide-enter-left', 'slide-enter-right', 'slide-enter-top', 'slide-enter-bottom'];

// Global background particles
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
createBackgroundParticles();

// ====== CREATOR PAGE LOGIC ======
const creatorForm = document.getElementById('creator-form');
if (creatorForm) {
    const photosInput = document.getElementById('photos');
    const previewContainer = document.getElementById('preview-container');
    const mobilePreview = document.getElementById('mobile-preview');
    const loadingDiv = document.getElementById('loading');
    const submitBtn = document.getElementById('submit-btn');
    const successPopup = document.getElementById('success-popup');
    const shareLinkInput = document.getElementById('share-link');
    const copyBtn = document.getElementById('copy-btn');

    // Floating Emoji Micro Animations
    setInterval(() => {
        if (document.hidden) return;
        const emojis = ['❤️', '✨', '🎉', '💖', '🌟'];
        const el = document.createElement('div');
        el.className = 'absolute text-3xl animate-float-text z-50 pointer-events-none opacity-80';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = `${Math.random() * 90}vw`;
        el.style.top = `${Math.random() * 90}vh`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }, 2500);

    // Preview Photos before Upload
    photosInput.addEventListener('change', () => {
        if(previewContainer) previewContainer.innerHTML = '';
        if(mobilePreview) mobilePreview.innerHTML = '';
        
        const files = Array.from(photosInput.files).slice(0, 10);
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = e => {
                // Desktop Floating Preview
                if(previewContainer) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                    img.className = `preview-card ${randomShape}`;
                    // Random starting position and delay
                    img.style.left = `${Math.random() * 70 + 10}%`;
                    img.style.top = `${Math.random() * 60 + 10}%`;
                    img.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 5}s`;
                    previewContainer.appendChild(img);
                }
                
                // Mobile Inline Preview
                if(mobilePreview) {
                    const mImg = document.createElement('img');
                    mImg.src = e.target.result;
                    mImg.className = 'mobile-preview-img object-cover rounded-xl';
                    mobilePreview.appendChild(mImg);
                }
            };
            reader.readAsDataURL(file);
        });
    });

    // Form Submit
    creatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const files = Array.from(photosInput.files).slice(0, 10);

        if (files.length === 0) {
            alert("Please upload at least one photo!");
            return;
        }

        if (!SUPABASE_URL || !supabaseClient) {
            alert("Supabase is not configured properly.");
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        creatorForm.style.opacity = '0.5';
        loadingDiv.classList.remove('hidden');

        try {
            const photoUrls = [];
            const timestamp = Date.now();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${timestamp}_${i}.${fileExt}`;

                const { data, error } = await supabaseClient.storage
                    .from('birthday-photos')
                    .upload(`${name.replace(/[^a-zA-Z0-9]/g, '_')}/${fileName}`, file, { cacheControl: '3600', upsert: false });

                if (error) throw new Error("Upload failed. Ensure bucket is correctly configured.");

                const { data: publicUrlData } = supabaseClient.storage
                    .from('birthday-photos')
                    .getPublicUrl(`${name.replace(/[^a-zA-Z0-9]/g, '_')}/${fileName}`);
                photoUrls.push(publicUrlData.publicUrl);
            }

            const { data: dbData, error: dbError } = await supabaseClient
                .from('surprises')
                .insert([{ name: name, photo_urls: photoUrls }])
                .select();

            if (dbError) throw new Error("Failed to save surprise data.");

            const surpriseId = dbData[0].id;
            const link = `${window.location.origin}/view.html?id=${surpriseId}`;
            shareLinkInput.value = link;

            loadingDiv.classList.add('hidden');
            creatorForm.classList.add('hidden');
            successPopup.classList.remove('hidden');

            if (previewContainer) previewContainer.innerHTML = ''; // Clear floating previews to focus on success

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            submitBtn.disabled = false;
            creatorForm.style.opacity = '1';
            loadingDiv.classList.add('hidden');
        }
    });

    copyBtn.addEventListener('click', () => {
        shareLinkInput.select();
        shareLinkInput.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied! ✨";
            copyBtn.classList.add('bg-green-500');
            // Trigger Confetti
            if (window.confetti) {
                confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#ff99cc', '#913e6c', '#ffffff'] });
            }
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.classList.remove('bg-green-500');
            }, 2000);
        });
    });
}

// ====== VIEWER PAGE LOGIC ======
const viewerBody = document.querySelector('.viewer-body');
if (viewerBody) {
    const urlParams = new URLSearchParams(window.location.search);
    const surpriseId = urlParams.get('id');
    
    const loader = document.getElementById('loader');
    const errorScreen = document.getElementById('error-screen');
    const experienceDiv = document.getElementById('experience');
    const bdayNameSpan = document.getElementById('bday-name');
    const heartsContainer = document.getElementById('hearts-container');
    const photoFramePopup = document.getElementById('photo-frame-popup');
    const frameImage = document.getElementById('frame-image');
    const closeFrameBtn = document.getElementById('close-frame-btn');
    
    // Music
    const musicBtn = document.getElementById('music-btn');
    const bgMusic = document.getElementById('bg-music');
    let isPlaying = false;

    // Slideshow
    const previewBtn = document.getElementById('preview-animation-btn');
    const slideshowOverlay = document.getElementById('slideshow-overlay');
    const slideshowContainer = document.getElementById('slideshow-image-container');
    const finalScreen = document.getElementById('final-screen');

    let loadedPhotos = [];

    musicBtn.addEventListener('click', () => {
        if (isPlaying) {
            bgMusic.pause();
            musicBtn.innerHTML = '♪ Play Music';
            isPlaying = false;
        } else {
            bgMusic.play().catch(e => console.log("Audio play failed:", e));
            musicBtn.innerHTML = '⏸ Pause Music';
            isPlaying = true;
        }
    });

    async function initViewer() {
        if (!surpriseId || !supabaseClient) {
            showError();
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('surprises')
                .select('*')
                .eq('id', surpriseId)
                .single();

            if (error || !data) throw error;

            bdayNameSpan.innerText = data.name;
            loadedPhotos = data.photo_urls || [];

            loader.classList.add('hidden');
            experienceDiv.classList.remove('hidden');

            startHearts();
            
        } catch (error) {
            console.error(error);
            showError();
        }
    }

    function showError() {
        loader.classList.add('hidden');
        errorScreen.classList.remove('hidden');
    }

    // Interactive Floating Hearts
    function startHearts() {
        if(loadedPhotos.length === 0) return;
        
        setInterval(() => {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.innerText = ['💖', '💕', '💗', '💓', '💝'][Math.floor(Math.random()*5)];
            heart.style.left = Math.random() * 90 + 'vw';
            
            // Random duration 8-15s
            const duration = Math.random() * 7 + 8;
            heart.style.animationDuration = duration + 's';
            
            heart.addEventListener('click', (e) => {
                // Heart explosion effect using confetti
                const rect = heart.getBoundingClientRect();
                const x = (rect.left + rect.width / 2) / window.innerWidth;
                const y = (rect.top + rect.height / 2) / window.innerHeight;
                if(window.confetti) {
                    confetti({
                        particleCount: 40,
                        spread: 60,
                        origin: { x, y },
                        colors: ['#ff99cc', '#ffffff', '#ffafbd'],
                        disableForReducedMotion: true
                    });
                }
                heart.remove();
                
                // Show photo popup
                const randomPhoto = loadedPhotos[Math.floor(Math.random() * loadedPhotos.length)];
                frameImage.src = randomPhoto;
                photoFramePopup.classList.remove('hidden');
            });
            
            heartsContainer.appendChild(heart);
            setTimeout(() => { heart.remove(); }, duration * 1000);
        }, 1200);   // Spawn a heart every 1.2s
    }

    closeFrameBtn.addEventListener('click', () => {
        photoFramePopup.classList.add('hidden');
    });

    // Start Ultra Attractive Slideshow
    previewBtn.addEventListener('click', () => {
        experienceDiv.classList.add('hidden');
        heartsContainer.classList.add('hidden');
        slideshowOverlay.classList.remove('hidden');
        
        // Ensure music plays during slideshow
        if (!isPlaying) {
            bgMusic.play().catch(e=>console.log(e));
            musicBtn.innerHTML = '⏸ Pause Music';
            isPlaying = true;
        }

        runSlideshow();
    });

    async function runSlideshow() {
        // Iterate through each uploaded photo
        for (let i = 0; i < loadedPhotos.length; i++) {
            await showSlidePhoto(loadedPhotos[i]);
        }
        
        // Show Final Screen after slideshow finishes
        slideshowContainer.innerHTML = '';
        finalScreen.classList.remove('hidden');
        
        if (window.confetti) {
            const duration = 5 * 1000;
            const end = Date.now() + duration;
            (function frame() {
                confetti({
                    particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff99cc', '#ffffff']
                });
                confetti({
                    particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff99cc', '#ffffff']
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            }());
        }
    }

    function showSlidePhoto(url) {
        return new Promise(resolve => {
            const img = document.createElement('img');
            img.src = url;
            
            // Random styling for each slide
            const randomDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            
            img.className = `slide-ultra ${randomDirection} ${randomShape}`;
            
            // Sparkle Particle Burst on entry (Center of screen approx)
            setTimeout(() => {
                if(window.confetti) {
                    confetti({
                        particleCount: 50,
                        spread: 120,
                        origin: { y: 0.5 },
                        colors: ['#ffffff', '#ff99cc', '#ffd1dc'],
                        disableForReducedMotion: true
                    });
                }
            }, 800); // Trigger burst shortly after entry animation starts

            slideshowContainer.appendChild(img);
            
            // Each fully animated slide takes about 4.5s of pacing before next starts overlapping
            setTimeout(() => {
                resolve();
            }, 4000); 

            // Clean up DOM later when animation finishes (CSS slideZoom is 8s)
            setTimeout(() => {
                img.remove();
            }, 9000);
        });
    }

    initViewer();
}
