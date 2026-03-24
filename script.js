// ====== CONFIGURATION ======
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://snjifhxhorgsqwgzfhml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuamlmaHhob3Jnc3F3Z3pmaG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODAyNTYsImV4cCI6MjA4OTc1NjI1Nn0.wdxKWZAsYW0RYr_2ONr_oiSLX2P8QnYeOT3qaksUGtQ';

let supabaseClient;
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Utilities
const SHAPES = ['shape-blob', 'shape-tilted-polygon', 'shape-soft-wave', 'shape-asymmetric', 'shape-broken-heart'];
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
    const occasionSelect = document.getElementById('occasion');
    const customOccasionContainer = document.getElementById('custom-occasion-container');
    const customOccasionInput = document.getElementById('custom-occasion');
    const photosInput = document.getElementById('photos');
    const previewContainer = document.getElementById('preview-container');
    const mobilePreview = document.getElementById('mobile-preview');
    const loadingDiv = document.getElementById('loading');
    const submitBtn = document.getElementById('submit-btn');
    const successPopup = document.getElementById('success-popup');
    const shareLinkInput = document.getElementById('share-link');
    const copyBtn = document.getElementById('copy-btn');
    const musicInput = document.getElementById('music');
    const musicFilenameDisplay = document.getElementById('music-filename');
    const createAnotherBtn = document.getElementById('create-another-btn');

    // Toggle Custom Occasion Input
    if (occasionSelect) {
        occasionSelect.addEventListener('change', (e) => {
            if (e.target.value === 'Custom') {
                customOccasionContainer.classList.remove('hidden');
                customOccasionInput.required = true;
            } else {
                customOccasionContainer.classList.add('hidden');
                customOccasionInput.required = false;
            }
        });
    }

    // Music Trim Elements
    const musicTrimContainer = document.getElementById('music-trim-container');
    const trimStart = document.getElementById('trim-start');
    const trimEnd = document.getElementById('trim-end');
    const thumbStart = document.getElementById('thumb-start');
    const thumbEnd = document.getElementById('thumb-end');
    const trimRangeHighlight = document.getElementById('trim-range-highlight');
    const trimStartDisplay = document.getElementById('trim-start-display');
    const trimEndDisplay = document.getElementById('trim-end-display');
    const trimDurationDisplay = document.getElementById('trim-duration-display');
    const previewTrimBtn = document.getElementById('preview-trim-btn');
    const previewTrimIcon = document.getElementById('preview-trim-icon');
    const hiddenAudioPlayer = document.getElementById('hidden-audio-player');

    let audioDuration = 0;
    let trimRafPending = false;

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    function updateTrimUI() {
        if (Number(trimStart.value) >= Number(trimEnd.value) - 0.5) {
            trimStart.value = Number(trimEnd.value) - 0.5;
        }
        if (Number(trimEnd.value) <= Number(trimStart.value) + 0.5) {
            trimEnd.value = Number(trimStart.value) + 0.5;
        }

        if (trimRafPending) return;
        trimRafPending = true;

        requestAnimationFrame(() => {
            const startPct = (trimStart.value / audioDuration) * 100;
            const endPct = (trimEnd.value / audioDuration) * 100;

            thumbStart.style.left = `${startPct}%`;
            thumbEnd.style.left = `${endPct}%`;
            trimRangeHighlight.style.left = `${startPct}%`;
            trimRangeHighlight.style.width = `${endPct - startPct}%`;

            trimStartDisplay.innerText = formatTime(trimStart.value);
            trimEndDisplay.innerText = formatTime(trimEnd.value);
            trimDurationDisplay.innerText = `Total: ${Math.floor(trimEnd.value - trimStart.value)}s`;
            
            trimRafPending = false;
        });
    }

    if (trimStart) trimStart.addEventListener('input', updateTrimUI);
    if (trimEnd) trimEnd.addEventListener('input', updateTrimUI);

    if (previewTrimBtn) {
        previewTrimBtn.addEventListener('click', () => {
            if (hiddenAudioPlayer.paused) {
                hiddenAudioPlayer.currentTime = trimStart.value;
                hiddenAudioPlayer.play();
                previewTrimIcon.innerText = 'pause';
            } else {
                hiddenAudioPlayer.pause();
                previewTrimIcon.innerText = 'play_arrow';
            }
        });

        hiddenAudioPlayer.addEventListener('timeupdate', () => {
            if (hiddenAudioPlayer.currentTime >= trimEnd.value) {
                hiddenAudioPlayer.pause();
                hiddenAudioPlayer.currentTime = trimStart.value;
                previewTrimIcon.innerText = 'play_arrow';
            }
        });
    }

    // Update Music Filename Display and Initialize Trim
    if(musicInput) {
        musicInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                const file = e.target.files[0];
                musicFilenameDisplay.innerText = "Processing audio track...";
                musicFilenameDisplay.classList.add('animate-pulse', 'text-primary');
                
                // Load audio to get duration
                if (window.currentAudioUrl) URL.revokeObjectURL(window.currentAudioUrl);
                const objectUrl = URL.createObjectURL(file);
                window.currentAudioUrl = objectUrl;
                
                hiddenAudioPlayer.src = objectUrl;
                hiddenAudioPlayer.load(); // explicitly kick off load for mobile
                
                hiddenAudioPlayer.onloadedmetadata = () => {
                    musicFilenameDisplay.innerText = file.name;
                    musicFilenameDisplay.classList.remove('animate-pulse');
                    
                    audioDuration = hiddenAudioPlayer.duration;
                    trimStart.max = audioDuration;
                    trimEnd.max = audioDuration;
                    trimStart.value = 0;
                    trimEnd.value = audioDuration;
                    updateTrimUI();
                    
                    if (musicTrimContainer) musicTrimContainer.classList.remove('hidden');
                };
                
                hiddenAudioPlayer.onerror = () => {
                     // Fallback if metadata blocks
                     musicFilenameDisplay.innerText = file.name + " (Ready)";
                     musicFilenameDisplay.classList.remove('animate-pulse');
                };
            } else {
                musicFilenameDisplay.innerText = "Tap to select an audio file";
                musicFilenameDisplay.classList.remove('text-primary', 'animate-pulse');
                if (musicTrimContainer) musicTrimContainer.classList.add('hidden');
                hiddenAudioPlayer.pause();
                hiddenAudioPlayer.src = "";
            }
        });
    }

    // Floating Emoji Micro Animations
    window.isProcessing = false;
    setInterval(() => {
        if (document.hidden || window.isProcessing) return;
        const emojis = ['❤️', '✨', '🎉', '💖', '🌟'];
        const el = document.createElement('div');
        el.className = 'absolute text-3xl animate-float-text z-50 pointer-events-none opacity-80';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = `${Math.random() * 90}vw`;
        el.style.top = `${Math.random() * 90}vh`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }, 4000); // Throttled from 2.5s to 4s to reduce memory garbage collection

    // Preview Photos before Upload
    let uploadedFiles = [];
    const photoGallery = document.getElementById('photo-gallery');
    let objectUrls = [];



    function clearUploadedFiles() {
        if (uploadedFiles) {
            uploadedFiles.forEach(item => {
                if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
            });
        }
        uploadedFiles = [];
    }

    function renderGallery() {
        if(!photoGallery) return;
        photoGallery.innerHTML = '';
        
        // Revoke old URLs to prevent memory leaks
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        objectUrls = [];
        
        if (uploadedFiles.length === 0) return;
        
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'col-span-full text-center text-sm font-bold text-primary animate-pulse py-2';
        loaderDiv.innerText = 'Arranging memories...';
        photoGallery.appendChild(loaderDiv);

        let i = 0;
        function renderNext() {
            if (i >= uploadedFiles.length) {
                if (photoGallery.contains(loaderDiv)) loaderDiv.remove();
                return;
            }
            
            const item = uploadedFiles[i];
            const url = item.thumbUrl || URL.createObjectURL(item.file);
            if (!item.thumbUrl) objectUrls.push(url);
            
            const div = document.createElement('div');
            div.className = 'relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 opacity-0 transition-opacity duration-500';
            div.innerHTML = `
                <img src="${url}" loading="lazy" class="w-full h-full object-cover shadow-inner">
            `;
            
            if (photoGallery.contains(loaderDiv)) {
                photoGallery.insertBefore(div, loaderDiv);
            } else {
                photoGallery.appendChild(div);
            }
            
            // Fade in naturally
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    div.classList.remove('opacity-0');
                });
            });
            
            i++;
            setTimeout(renderNext, 50); // Faster render since it's just thumbnails
        }
        
        renderNext();
    }

    // Image Compressor Function for mobile performance
    function compressImageFile(file, maxWidth = 1000) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url); // Release early
                
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
                            // Cleanup image reference
                            img.src = '';
                            img.onload = null;
                            img.onerror = null;
                            
                            if (blob) {
                                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() });
                                resolve({ file: newFile, thumbUrl: thumbUrl });
                            } else {
                                resolve({ file: file, thumbUrl: thumbUrl }); // fallback
                            }
                        }, 'image/jpeg', 0.75); // Compress quality to 75%
                    }, 'image/jpeg', 0.5);
                } catch (err) {
                    console.error("Compression failed, falling back to original file:", err);
                    resolve({ file: file, thumbUrl: null });
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve({ file: file, thumbUrl: null }); // fallback
            };
            img.src = url;
        });
    }

    photosInput.addEventListener('change', async (e) => {
        if(photoGallery) photoGallery.innerHTML = '';
        if(previewContainer) previewContainer.innerHTML = ''; 
        
        const filesToProcess = Array.from(photosInput.files).slice(0, 10);
        if (filesToProcess.length === 0) return;

        window.isProcessing = true; // Pause animations

        // Show generic processing state
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'col-span-full text-center text-sm font-bold text-primary animate-pulse py-4 bg-pink-50 rounded-xl';
        loaderDiv.innerText = 'Optimizing and compressing photos...';
        photoGallery.appendChild(loaderDiv);

        clearUploadedFiles();
        // Compress sequentially to save RAM on budget phones
        for (let i = 0; i < filesToProcess.length; i++) {
            const result = await compressImageFile(filesToProcess[i], 1000);
            uploadedFiles.push(result);
        }
        
        window.isProcessing = false; // Resume animations
        
        if (photoGallery.contains(loaderDiv)) loaderDiv.remove();
        renderGallery();
    });

    // Form Submit
    creatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const message = document.getElementById('message').value.trim();
        let selectedOccasion = occasionSelect ? occasionSelect.value : 'Birthday';
        
        if (selectedOccasion === 'Custom' && customOccasionInput) {
            selectedOccasion = customOccasionInput.value.trim();
        }
            const files = uploadedFiles.slice(0, 10).map(i => i.file);
            const musicFile = musicInput && musicInput.files.length > 0 ? musicInput.files[0] : null;

            if (files.length === 0) {
                alert("Please upload at least one photo!");
                return;
            }

            if (!SUPABASE_URL || !supabaseClient) {
                alert("Supabase is not configured properly.");
                return;
            }

            window.isProcessing = true; // Pause animations during upload

            // Show loading state
            submitBtn.disabled = true;
            creatorForm.style.opacity = '0.5';
            loadingDiv.classList.remove('hidden');
            
            const loadingText = document.getElementById('loading-text');
            const progressContainer = document.getElementById('upload-progress-container');
            const progressBar = document.getElementById('upload-progress-bar');
            
            if (loadingText) loadingText.innerText = "Processing magic...";
            if (progressContainer) {
                progressContainer.classList.remove('hidden');
                progressBar.style.width = '5%';
            }

            try {
                const photoUrls = [];
                let musicUrl = null;
                const timestamp = Date.now();
                const safeNameFolder = name.replace(/[^a-zA-Z0-9]/g, '_');

                // 1. Upload Music (If selected)
                if (musicFile) {
                    if (loadingText) loadingText.innerText = "Uploading background music...";
                    const musicExt = musicFile.name.split('.').pop();
                    const musicFileName = `music_${timestamp}.${musicExt}`;
                    
                    const { error: musicError } = await supabaseClient.storage
                        .from('birthday-music')
                        .upload(`${safeNameFolder}/${musicFileName}`, musicFile, { cacheControl: '3600', upsert: false });
                    
                    if (musicError) throw new Error("Music upload failed. Ensure 'birthday-music' bucket is public and RLS is enabled correctly.");
                    
                    const { data: musicPublicUrlData } = supabaseClient.storage
                        .from('birthday-music')
                        .getPublicUrl(`${safeNameFolder}/${musicFileName}`);
                    musicUrl = musicPublicUrlData.publicUrl;
                }

                // 2. Upload Photos sequentially with progress
                for (let i = 0; i < files.length; i++) {
                    if (loadingText) loadingText.innerText = `Uploading photo ${i + 1} of ${files.length}...`;
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${timestamp}_${i}.${fileExt}`;

                    const { data, error } = await supabaseClient.storage
                        .from('birthday-photos')
                        .upload(`${safeNameFolder}/${fileName}`, file, { cacheControl: '3600', upsert: false });

                    if (error) throw new Error("Upload failed. Ensure bucket is correctly configured.");

                    const { data: publicUrlData } = supabaseClient.storage
                        .from('birthday-photos')
                        .getPublicUrl(`${safeNameFolder}/${fileName}`);
                    photoUrls.push(publicUrlData.publicUrl);
                    
                    if (progressBar) {
                        const pct = 10 + Math.floor(((i + 1) / files.length) * 80); // 10% to 90%
                        progressBar.style.width = `${pct}%`;
                    }
                }

                if (loadingText) loadingText.innerText = "Creating surprise link...";
                if (progressBar) progressBar.style.width = '95%';

                // 3. Insert Database Record
                const { data: dbData, error: dbError } = await supabaseClient
                    .from('surprises')
                    .insert([{ 
                        name: name, 
                        wish_message: message, 
                        occasion: selectedOccasion,
                        photo_urls: photoUrls,
                        music_url: musicUrl,
                        music_start_time: Number(trimStart.value) || null,
                        music_end_time: Number(trimEnd.value) || null
                    }])
                    .select();

                if (dbError) {
                    console.error("Supabase Database Error Details:", dbError);
                    throw new Error("Failed to save surprise data. See console for exact database error.");
                }

                if (progressBar) progressBar.style.width = '100%';

                const surpriseId = dbData[0].id;
                const link = `${window.location.origin}/view.html?id=${surpriseId}`;
                shareLinkInput.value = link;

                loadingDiv.classList.add('hidden');
                creatorForm.classList.add('hidden');
                successPopup.classList.remove('hidden');

            if (previewContainer) previewContainer.innerHTML = ''; // Clear floating previews to focus on success

            window.isProcessing = false; // Resume animations

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            submitBtn.disabled = false;
            creatorForm.style.opacity = '1';
            loadingDiv.classList.add('hidden');
            window.isProcessing = false; // Resume animations in case of error
        }
    });

    copyBtn.addEventListener('click', () => {
        shareLinkInput.select();
        shareLinkInput.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(shareLinkInput.value).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied! ✨";
            copyBtn.classList.add('bg-green-500');
            // Trigger Confetti gentle
            if (window.confetti) {
                confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 }, colors: ['#ff99cc', '#913e6c', '#ffffff'] });
            }
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.classList.remove('bg-green-500');
            }, 2000);
        });
    });

    if (createAnotherBtn) {
        createAnotherBtn.addEventListener('click', () => {
            creatorForm.reset();
            creatorForm.style.opacity = '1';
            submitBtn.disabled = false;
            
            if (photoGallery) photoGallery.innerHTML = '';
            
            if (musicFilenameDisplay) {
                musicFilenameDisplay.innerText = "Tap to select an audio file";
                musicFilenameDisplay.classList.remove('text-primary');
            }
            if (musicTrimContainer) musicTrimContainer.classList.add('hidden');
            
            if (customOccasionContainer) customOccasionContainer.classList.add('hidden');
            if (customOccasionInput) customOccasionInput.required = false;
            
            clearUploadedFiles();
            successPopup.classList.add('hidden');
            creatorForm.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
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
    const customMessageText = document.getElementById('custom-message-text');
    const customMessageCard = document.getElementById('custom-message-card');
    const watchAgainBtn = document.getElementById('watch-again-btn');

    let loadedPhotos = [];
    let loadedMessage = "";
    let musicStartTime = 0;
    let musicEndTime = null;

    // Safely and Softly Fade in Audio 
    function fadeAudioIn(audio, targetVolume = 0.4, step = 0.05, interval = 100) {
        audio.volume = 0;
        let playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                if(musicBtn) musicBtn.innerHTML = '⏸ Pause Music';
                
                let fadeAudio = setInterval(function () {
                    if (audio.volume < targetVolume - step) {
                        audio.volume += step;
                    } else {
                        audio.volume = targetVolume;
                        clearInterval(fadeAudio);
                    }
                }, interval);
            }).catch(e => {
                console.log("Audio play blocked by browser. User must interact first.", e);
                isPlaying = false;
                if(musicBtn) musicBtn.innerHTML = '♪ Play Music';
            });
        }
    }

    function playOptimizedMusic() {
        bgMusic.currentTime = musicStartTime;
        fadeAudioIn(bgMusic, 0.4);
        
        let targetEndTime = musicEndTime && musicEndTime > 0 ? musicEndTime : bgMusic.duration || 12;

        // Loop within set segment bounds
        bgMusic.ontimeupdate = () => {
            if (bgMusic.currentTime >= targetEndTime - 0.5) { // start fade out 0.5s before loop end
                if (!bgMusic.isFadingOut) {
                    bgMusic.isFadingOut = true;
                    // Quick fade out
                    let fadeOutInterval = setInterval(() => {
                        if (bgMusic.volume > 0.05) {
                            bgMusic.volume -= 0.05;
                        } else {
                            bgMusic.volume = 0;
                            clearInterval(fadeOutInterval);
                            bgMusic.currentTime = musicStartTime;
                            bgMusic.isFadingOut = false;
                            fadeAudioIn(bgMusic, 0.4, 0.05, 50); // Fast fade in
                        }
                    }, 50);
                }
            }
        };
    }

    musicBtn.addEventListener('click', () => {
        if (isPlaying) {
            bgMusic.pause();
            musicBtn.innerHTML = '♪ Play Music';
            isPlaying = false;
        } else {
            let targetEndTime = musicEndTime && musicEndTime > 0 ? musicEndTime : bgMusic.duration || 12;
            if (bgMusic.currentTime < musicStartTime || bgMusic.currentTime > targetEndTime) {
                playOptimizedMusic();
            } else {
                fadeAudioIn(bgMusic, 0.4);
            }
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
            const occasionTextSpan = document.getElementById('occasion-text');
            if (occasionTextSpan) {
                occasionTextSpan.innerText = data.occasion || 'Birthday';
            }
            loadedPhotos = data.photo_urls || [];
            loadedMessage = data.wish_message || "";
            musicStartTime = data.music_start_time || 0;
            musicEndTime = data.music_end_time || null;
            
            // Apply custom music if user uploaded it
            if (data.music_url) {
                bgMusic.src = data.music_url;
                bgMusic.load();
                
                // wait for metadata to set duration correctly if no explicit end time
                bgMusic.onloadedmetadata = () => {
                    if(!musicEndTime) musicEndTime = bgMusic.duration;
                    playOptimizedMusic();
                }
            } else {
                playOptimizedMusic();
            }

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
        // Unlock scroll after page load
        document.body.style.overflowY = 'auto';

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
                // Heart pop animation
                heart.classList.add('pop-scale');
                
                // Heart explosion effect using confetti
                const rect = heart.getBoundingClientRect();
                const x = (rect.left + rect.width / 2) / window.innerWidth;
                const y = (rect.top + rect.height / 2) / window.innerHeight;
                if(window.confetti) {
                    confetti({
                        particleCount: 50,
                        spread: 60,
                        origin: { x, y },
                        colors: ['#ff99cc', '#ffffff', '#ffafbd'],
                        disableForReducedMotion: true
                    });
                }
                
                // Remove heart after pop animation completes
                setTimeout(() => heart.remove(), 400);
                
                // Show photo popup elegantly
                const randomPhoto = loadedPhotos[Math.floor(Math.random() * loadedPhotos.length)];
                frameImage.src = randomPhoto;
                
                photoFramePopup.classList.remove('hidden', 'fade-out-scale');
                photoFramePopup.classList.add('zoom-in-fade');
                
                // Auto hide photo popup after 3 seconds
                if (window.photoHideTimeout) clearTimeout(window.photoHideTimeout);
                window.photoHideTimeout = setTimeout(() => {
                    photoFramePopup.classList.remove('zoom-in-fade');
                    photoFramePopup.classList.add('fade-out-scale');
                    
                    // Wait for fade out animation to finish before hiding
                    setTimeout(() => {
                        if (photoFramePopup.classList.contains('fade-out-scale')) {
                            photoFramePopup.classList.add('hidden');
                        }
                    }, 500);
                }, 3000);
            });
            
            heartsContainer.appendChild(heart);
            setTimeout(() => { heart.remove(); }, duration * 1000);
        }, 2000);   // Throttle spawn a heart every 2s instead of 1.2s
    }
    
    // Sparkle burst on Start The Magic button hover
    if (previewBtn) {
        previewBtn.addEventListener('mouseenter', (e) => {
            if (!window.confetti || window.innerWidth < 768) return; // Only hover effect on desktop
            const rect = previewBtn.getBoundingClientRect();
            // Create a small burst somewhere on the button
            const x = (rect.left + Math.random() * rect.width) / window.innerWidth;
            const y = (rect.top + Math.random() * rect.height) / window.innerHeight;
            
            confetti({
                particleCount: 15,
                spread: 40,
                startVelocity: 15,
                origin: { x, y },
                colors: ['#ffffff', '#ff99cc', '#ffd1dc'],
                disableForReducedMotion: true,
                ticks: 50
            });
        });
    }

    // removed closeFrameBtn listener because the button was removed and dialog auto-hides

    // Start Ultra Attractive Slideshow
    previewBtn.addEventListener('click', () => {
        experienceDiv.classList.add('hidden');
        heartsContainer.classList.add('hidden');
        slideshowOverlay.classList.remove('hidden');
        
        // Temporarily disable scroll during the ultra slideshow animation
        document.body.style.overflow = 'hidden';
        
        // Ensure music plays delicately during slideshow
        if (!isPlaying) {
            fadeAudioIn(bgMusic, 0.4);
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
        slideshowOverlay.classList.add('hidden'); // Clear overlay so interaction is possible
        finalScreen.classList.remove('hidden');
        
        // Automatically re-enable scrolling so user can scroll down and read custom message fully
        document.body.style.overflow = ''; 
        document.body.style.overflowY = 'auto';
        
        // Ensure screen focuses at the top of the final screen
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Render custom message
        if (loadedMessage.length > 0 && customMessageCard && customMessageText) {
            customMessageText.innerText = loadedMessage;
            customMessageCard.classList.remove('hidden');
            
            // Subtle sparkle around text
            setTimeout(() => {
                if(window.confetti) {
                    confetti({ particleCount: 50, spread: 80, origin: { y: 0.7 }, colors: ['#ffffff', '#ff99cc'], disableForReducedMotion: true });
                }
            }, 1000);
        }
        
        if (window.confetti) {
            let bursts = 0;
            const endConfettiInterval = setInterval(() => {
                confetti({ particleCount: 25, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff99cc', '#ffffff'] });
                confetti({ particleCount: 25, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff99cc', '#ffffff'] });
                bursts++;
                if(bursts > 10) clearInterval(endConfettiInterval);
            }, 300); // Trigger bursts cleanly without overloading frame renderer
        }
    }

    function showSlidePhoto(url) {
        return new Promise(resolve => {
            const img = document.createElement('img');
            img.src = url;
            
            // Random styling for each slide
            const randomDirection = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            
            // Removed float-rotate-anim because it overwrites the slideIn opacity keyframes, causing invisible slides
            img.className = `slide-ultra ${randomDirection} ${randomShape}`;
            
            // Sparkle Particle Burst on entry (Center of screen approx)
            setTimeout(() => {
                if(window.confetti) {
                    confetti({
                        particleCount: 30, // Strongly reduced to avoid slide loading stutters
                        spread: 80,
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

    if (watchAgainBtn) {
        watchAgainBtn.addEventListener('click', () => {
            // Hide final screen
            finalScreen.classList.add('hidden');
            // Show overlay again and freeze scroll
            slideshowOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Restart audio loop
            playOptimizedMusic();

            // Run slideshow
            runSlideshow();
        });
    }

    initViewer();
}
