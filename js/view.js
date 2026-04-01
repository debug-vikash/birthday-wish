/**
 * View Logic - Handling cinematic surprise experience
 */

document.addEventListener('DOMContentLoaded', () => {
    const viewerBody = document.querySelector('.viewer-body');
    if (!viewerBody) return;

    const urlParams = new URLSearchParams(window.location.search);
    const surpriseId = urlParams.get('id');
    
    const loader = document.getElementById('loader');
    const errorScreen = document.getElementById('error-screen');
    const experienceDiv = document.getElementById('experience');
    const bdayNameSpan = document.getElementById('bday-name');
    const heartsContainer = document.getElementById('hearts-container');
    const photoFramePopup = document.getElementById('photo-frame-popup');
    const frameImage = document.getElementById('frame-image');
    
    const musicBtn = document.getElementById('music-btn');
    const bgMusic = document.getElementById('bg-music');
    let isPlaying = false;

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

    // Parallax Effect
    function initParallax() {
        if (!experienceDiv) return;
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth < 768) return;
            const x = (e.clientX / window.innerWidth - 0.5) * 40;
            const y = (e.clientY / window.innerHeight - 0.5) * 40;
            
            requestAnimationFrame(() => {
                if (heartsContainer) heartsContainer.style.transform = `translate(${x}px, ${y}px)`;
                const pContainer = document.getElementById('particles-container');
                if (pContainer) pContainer.style.transform = `translate(${x * -0.5}px, ${y * -0.5}px)`;
                if (experienceDiv) experienceDiv.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
            });
        });
    }

    // Audio Control
    function fadeAudioIn(audio, targetVolume = 0.4, step = 0.05, interval = 100) {
        audio.volume = 0;
        audio.play().then(() => {
            isPlaying = true;
            if(musicBtn) musicBtn.innerHTML = '⏸ Pause Music';
            let fadeAudio = setInterval(() => {
                if (audio.volume < targetVolume - step) {
                    audio.volume += step;
                } else {
                    audio.volume = targetVolume;
                    clearInterval(fadeAudio);
                }
            }, interval);
        }).catch(e => {
            console.log("Autoplay blocked.");
            isPlaying = false;
            if(musicBtn) musicBtn.innerHTML = '♪ Play Music';
        });
    }

    function playOptimizedMusic() {
        if (!bgMusic) return;
        bgMusic.currentTime = musicStartTime;
        fadeAudioIn(bgMusic, 0.4);
        
        const targetEndTime = musicEndTime && musicEndTime > 0 ? musicEndTime : bgMusic.duration || 12;

        bgMusic.ontimeupdate = () => {
            if (bgMusic.currentTime >= targetEndTime - 0.5 && !bgMusic.isFadingOut) {
                bgMusic.isFadingOut = true;
                let fadeOut = setInterval(() => {
                    if (bgMusic.volume > 0.05) {
                        bgMusic.volume -= 0.05;
                    } else {
                        bgMusic.volume = 0;
                        clearInterval(fadeOut);
                        bgMusic.currentTime = musicStartTime;
                        bgMusic.isFadingOut = false;
                        fadeAudioIn(bgMusic, 0.4, 0.05, 50);
                    }
                }, 50);
            }
        };
    }

    if (musicBtn && bgMusic) {
        musicBtn.addEventListener('click', () => {
            if (isPlaying) {
                bgMusic.pause();
                musicBtn.innerHTML = '♪ Play Music';
                isPlaying = false;
            } else {
                playOptimizedMusic();
            }
        });
    }

    // Floating Hearts Logic
    function startHearts() {
        document.body.style.overflowY = 'auto';
        if (loadedPhotos.length === 0) return;
        
        const isMobile = window.innerWidth < 768;
        const spawnRate = isMobile ? 3500 : 2000;

        setInterval(() => {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.innerText = ['💖', '💕', '💗', '💓', '💝'][Math.floor(Math.random()*5)];
            heart.style.left = Math.random() * 90 + 'vw';
            const duration = Math.random() * 7 + 8;
            heart.style.animationDuration = duration + 's';
            
            heart.onclick = (e) => {
                heart.classList.add('pop-scale');
                const rect = heart.getBoundingClientRect();
                const x = (rect.left + rect.width / 2) / window.innerWidth;
                const y = (rect.top + rect.height / 2) / window.innerHeight;
                if(window.confetti) {
                    confetti({ particleCount: 50, spread: 60, origin: { x, y }, colors: ['#ff99cc', '#ffffff', '#ffafbd'] });
                }
                setTimeout(() => heart.remove(), 400);

                // Show Popup
                const randomPhoto = loadedPhotos[Math.floor(Math.random() * loadedPhotos.length)];
                if (frameImage) frameImage.src = randomPhoto;
                photoFramePopup?.classList.remove('hidden', 'fade-out-scale');
                photoFramePopup?.classList.add('zoom-in-fade');
                
                if (window.photoHideTimeout) clearTimeout(window.photoHideTimeout);
                window.photoHideTimeout = setTimeout(() => {
                    photoFramePopup?.classList.add('fade-out-scale');
                    setTimeout(() => photoFramePopup?.classList.add('hidden'), 500);
                }, 3000);
            };
            
            heartsContainer?.appendChild(heart);
            setTimeout(() => heart.remove(), duration * 1000);
        }, spawnRate);
    }

    // Slideshow Logic
    function showSlidePhoto(url) {
        return new Promise(resolve => {
            const img = document.createElement('img');
            img.src = url;
            const curveClasses = ['slide-curve-1', 'slide-curve-2', 'slide-curve-3'];
            const randomCurve = curveClasses[Math.floor(Math.random() * curveClasses.length)];
            const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            img.className = `slide-ultra ${randomCurve} ${randomShape}`;
            
            setTimeout(() => {
                if(window.confetti) confetti({ particleCount: 30, spread: 80, origin: { y: 0.5 }, colors: ['#ffffff', '#ff99cc', '#ffd1dc'] });
            }, 800);

            slideshowContainer?.appendChild(img);
            setTimeout(resolve, 3500); 
            setTimeout(() => img.remove(), 7000);
        });
    }

    async function runSlideshow() {
        for (const photo of loadedPhotos) await showSlidePhoto(photo);
        slideshowContainer.innerHTML = '';
        slideshowOverlay?.classList.add('hidden');
        finalScreen?.classList.remove('hidden');
        document.body.classList.add('bg-slow', 'overflow-y-auto');
        document.body.style.overflow = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (loadedMessage && customMessageText) {
            customMessageText.innerText = loadedMessage;
            customMessageCard?.classList.remove('hidden');
            setTimeout(() => {
                if(window.confetti) confetti({ particleCount: 50, spread: 80, origin: { y: 0.7 }, colors: ['#ffffff', '#ff99cc'] });
            }, 1000);
        }
    }

    previewBtn?.addEventListener('click', () => {
        experienceDiv?.classList.add('hidden');
        heartsContainer?.classList.add('hidden');
        slideshowOverlay?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (!isPlaying) playOptimizedMusic();
        runSlideshow();
    });

    watchAgainBtn?.addEventListener('click', () => {
        finalScreen?.classList.add('hidden');
        slideshowOverlay?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        playOptimizedMusic();
        runSlideshow();
    });

    // Initialize Page
    async function init() {
        if (!surpriseId || !supabaseClient) {
            loader?.classList.add('hidden');
            errorScreen?.classList.remove('hidden');
            return;
        }

        try {
            const { data, error } = await supabaseClient.from('surprises').select('*').eq('id', surpriseId).single();
            if (error || !data) throw error;

            if (bdayNameSpan) bdayNameSpan.innerText = data.name;
            const occasionSpan = document.getElementById('occasion-text');
            if (occasionSpan) occasionSpan.innerText = data.occasion || 'Birthday';
            
            loadedPhotos = data.photo_urls || [];
            loadedMessage = data.wish_message || "";
            musicStartTime = data.music_start_time || 0;
            musicEndTime = data.music_end_time || null;
            
            if (data.music_url && bgMusic) {
                bgMusic.src = data.music_url;
                bgMusic.onloadedmetadata = () => {
                    if(!musicEndTime) musicEndTime = bgMusic.duration;
                    playOptimizedMusic();
                }
            } else {
                playOptimizedMusic();
            }

            loader?.classList.add('hidden');
            experienceDiv?.classList.remove('hidden');
            setTimeout(() => document.getElementById('intro-title-group')?.classList.add('cinematic-enter'), 600);

            startHearts();
            initParallax();
        } catch (e) {
            console.error(e);
            loader?.classList.add('hidden');
            errorScreen?.classList.remove('hidden');
        }
    }

    init();
});
