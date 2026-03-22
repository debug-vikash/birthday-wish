// ====== CONFIGURATION ======
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://snjifhxhorgsqwgzfhml.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuamlmaHhob3Jnc3F3Z3pmaG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODAyNTYsImV4cCI6MjA4OTc1NjI1Nn0.wdxKWZAsYW0RYr_2ONr_oiSLX2P8QnYeOT3qaksUGtQ';

let supabaseClient;
if (typeof window.supabase !== 'undefined') {
    // Initialize Supabase Client
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// ====== CREATOR PAGE LOGIC ======
const creatorForm = document.getElementById('creator-form');
if (creatorForm) {
    const photosInput = document.getElementById('photos');
    const previewContainer = document.getElementById('preview-container');
    const loadingDiv = document.getElementById('loading');
    const submitBtn = document.getElementById('submit-btn');
    const successPopup = document.getElementById('success-popup');
    const shareLinkInput = document.getElementById('share-link');
    const copyBtn = document.getElementById('copy-btn');
    
    // Preview Photos before Upload
    photosInput.addEventListener('change', () => {
        previewContainer.innerHTML = '';
        const files = Array.from(photosInput.files).slice(0, 10); // max 10
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = document.createElement('img');
                img.src = e.target.result;
                previewContainer.appendChild(img);
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

        if (!SUPABASE_URL) {
            alert("Please update SUPABASE_URL and SUPABASE_ANON_KEY in script.js to continue.");
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        loadingDiv.classList.remove('hidden');

        try {
            const photoUrls = [];
            const timestamp = Date.now();
            
            // Upload each image to Supabase Storage 'birthday-photos' bucket
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${timestamp}_${i}.${fileExt}`;
                
                // Note: bucket 'birthday-photos' must exist and be public
                const { data, error } = await supabaseClient.storage
                    .from('birthday-photos')
                    .upload(`${name.replace(/[^a-zA-Z0-9]/g, '_')}/${fileName}`, file, { cacheControl: '3600', upsert: false });
                
                if (error) {
                    console.error("Upload error:", error);
                    throw new Error("Failed to upload image. Does the bucket 'birthday-photos' exist?");
                }
                
                // Get the public URL for the uploaded file
                const { data: publicUrlData } = supabaseClient.storage
                    .from('birthday-photos')
                    .getPublicUrl(`${name.replace(/[^a-zA-Z0-9]/g, '_')}/${fileName}`);
                    
                photoUrls.push(publicUrlData.publicUrl);
            }

            // Save the surprise details in Supabase Database 'surprises' table
            const { data: dbData, error: dbError } = await supabaseClient
                .from('surprises')
                .insert([{ name: name, photo_urls: photoUrls }])
                .select();
                
            if (dbError) {
                console.error("Database insert error:", dbError);
                throw new Error("Failed to save data. Does the table 'surprises' exist?");
            }
            
            const surpriseId = dbData[0].id;
            
            // Output link
            const link = `${window.location.origin}/view.html?id=${surpriseId}`;
            shareLinkInput.value = link;
            
            loadingDiv.classList.add('hidden');
            successPopup.classList.remove('hidden');
            
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            submitBtn.disabled = false;
            loadingDiv.classList.add('hidden');
        }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        shareLinkInput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied! ✨';
        setTimeout(() => copyBtn.textContent = 'Copy Link', 2000);
    });
}

// ====== VIEWER PAGE LOGIC ======
const viewerScreen = document.getElementById('experience');
if (viewerScreen) {
    const urlParams = new URLSearchParams(window.location.search);
    const surpriseId = urlParams.get('id');
    const loader = document.getElementById('loader');
    const errorScreen = document.getElementById('error-screen');
    
    let surpriseData = null;
    let musicPlaying = false;
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-btn');

    // Music toggle
    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop click from bubbling up to the slideshow trigger
        if (musicPlaying) {
            bgMusic.pause();
            musicBtn.innerHTML = '♪ Play Music';
        } else {
            bgMusic.play().catch(err => console.log("Audio play blocked:", err));
            musicBtn.innerHTML = '❚❚ Pause Music';
        }
        musicPlaying = !musicPlaying;
    });

    async function initViewer() {
        if (!surpriseId) {
            loader.classList.add('hidden');
            errorScreen.classList.remove('hidden');
            return;
        }

        try {
            // Fetch surprise from DB
            const { data, error } = await supabaseClient
                .from('surprises')
                .select('*')
                .eq('id', surpriseId)
                .single();

            if (error || !data) throw error || new Error("Surprise not found");
            
            surpriseData = data;
            document.getElementById('bday-name').textContent = data.name;
            
            loader.classList.add('hidden');
            viewerScreen.classList.remove('hidden');
            
            startFloatingHearts();
            
        } catch (error) {
            console.error(error);
            loader.classList.add('hidden');
            errorScreen.classList.remove('hidden');
        }
    }

    // 1. Floating Hearts
    function startFloatingHearts() {
        const container = document.getElementById('hearts-container');
        const heartIcons = ['❤️', '💖', '💝', '💕', '💗', '💓', '✨'];
        
        setInterval(() => {
            const heart = document.createElement('div');
            heart.classList.add('floating-heart');
            heart.textContent = heartIcons[Math.floor(Math.random() * heartIcons.length)];
            heart.style.left = `${Math.random() * 90}vw`;
            heart.style.animationDuration = `${6 + Math.random() * 6}s`;
            
            const scale = 0.6 + Math.random() * 0.8;
            heart.style.transform = `scale(${scale})`;
            
            container.appendChild(heart);
            
            // Interaction: clicking a heart shows a random photo
            heart.addEventListener('click', (e) => {
                e.stopPropagation();
                showRandomPhoto();
                heart.style.animationPlayState = 'paused';
                heart.style.opacity = '0';
                setTimeout(() => heart.remove(), 300);
            });

            // Cleanup
            setTimeout(() => {
                if (container.contains(heart)) heart.remove();
            }, 12000); 
        }, 600);
    }

    // 2. Photo Popup Frame
    const photoFramePopup = document.getElementById('photo-frame-popup');
    const frameImage = document.getElementById('frame-image');
    const closeFrameBtn = document.getElementById('close-frame-btn');

    function showRandomPhoto() {
        if (!surpriseData || surpriseData.photo_urls.length === 0) return;
        const urls = surpriseData.photo_urls;
        const randomUrl = urls[Math.floor(Math.random() * urls.length)];
        frameImage.src = randomUrl;
        photoFramePopup.classList.remove('hidden');
    }

    closeFrameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        photoFramePopup.classList.add('hidden');
    });

    // 3. Full Screen Slideshow
    let slideshowStarted = false;
    document.addEventListener('click', (e) => {
        // Start slideshow if clicking anywhere EXCEPT on music btn, hearts, or close button
        if (!viewerScreen.classList.contains('hidden') 
            && !slideshowStarted 
            && e.target.id !== 'music-btn' 
            && !e.target.classList.contains('floating-heart')
            && !e.target.closest('#photo-frame-popup')) {
            startSlideshow();
        }
    });

    function startSlideshow() {
        if (!surpriseData || surpriseData.photo_urls.length === 0 || slideshowStarted) return;
        slideshowStarted = true;
        
        photoFramePopup.classList.add('hidden'); 
        const overlay = document.getElementById('slideshow-overlay');
        const container = document.getElementById('slideshow-image-container');
        overlay.classList.remove('hidden');

        // Optional: autoplay music on tap if not already playing
        if (!musicPlaying) {
            bgMusic.play().catch(() => {});
            musicPlaying = true;
            musicBtn.innerHTML = '❚❚ Pause Music';
        }

        const urls = surpriseData.photo_urls;
        let index = 0;

        function showNextSlide() {
            if (index >= urls.length) {
                // End of slideshow
                overlay.classList.add('hidden');
                showConfettiAndFinalMessage();
                return;
            }

            container.innerHTML = ''; // clear previous
            const img = document.createElement('img');
            img.src = urls[index];
            img.className = 'slide-item';
            container.appendChild(img);

            // Small delay to trigger CSS transition
            setTimeout(() => {
                img.classList.add('active');
            }, 50);

            index++;
            setTimeout(showNextSlide, 3500); // 3.5 seconds per slide
        }

        showNextSlide();
    }

    // 4. Confetti and Glow Final Message
    function showConfettiAndFinalMessage() {
        const finalScreen = document.getElementById('final-screen');
        finalScreen.classList.remove('hidden');

        // Confetti burst from both sides
        const duration = 4000;
        const end = Date.now() + duration;

        (function frame() {
            // Check if user is still on page
            if (Date.now() < end) {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#ff4d6d', '#ff758f', '#ffffff']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#ff4d6d', '#ff758f', '#ffffff']
                });
                requestAnimationFrame(frame);
            }
        }());
    }

    // Initialize Viewer
    initViewer();
}
