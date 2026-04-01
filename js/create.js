/**
 * Creator Logic - Handling surprise generation and media uploads
 */

document.addEventListener('DOMContentLoaded', () => {
    const creatorForm = document.getElementById('creator-form');
    if (!creatorForm) return;

    const occasionSelect = document.getElementById('occasion');
    const customOccasionContainer = document.getElementById('custom-occasion-container');
    const customOccasionInput = document.getElementById('custom-occasion');
    const photosInput = document.getElementById('photos');
    const photoGallery = document.getElementById('photo-gallery');
    const musicInput = document.getElementById('music');
    const musicFilenameDisplay = document.getElementById('music-filename');
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
    const submitBtn = document.getElementById('submit-btn');
    const loadingDiv = document.getElementById('loading');
    const successPopup = document.getElementById('success-popup');
    const shareLinkInput = document.getElementById('share-link');
    const copyBtn = document.getElementById('copy-btn');
    const createAnotherBtn = document.getElementById('create-another-btn');

    let uploadedFiles = [];
    let objectUrls = [];
    let audioDuration = 0;
    let trimRafPending = false;
    window.isProcessing = false;

    // Toggle Custom Occasion Input
    if (occasionSelect) {
        occasionSelect.addEventListener('change', (e) => {
            const isCustom = e.target.value === 'Custom';
            customOccasionContainer?.classList.toggle('hidden', !isCustom);
            if (customOccasionInput) customOccasionInput.required = isCustom;
        });
    }

    // Audio Trimming Logic
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

            if (thumbStart) thumbStart.style.left = `${startPct}%`;
            if (thumbEnd) thumbEnd.style.left = `${endPct}%`;
            if (trimRangeHighlight) {
                trimRangeHighlight.style.left = `${startPct}%`;
                trimRangeHighlight.style.width = `${endPct - startPct}%`;
            }

            if (trimStartDisplay) trimStartDisplay.innerText = formatTime(trimStart.value);
            if (trimEndDisplay) trimEndDisplay.innerText = formatTime(trimEnd.value);
            if (trimDurationDisplay) trimDurationDisplay.innerText = `Total: ${Math.floor(trimEnd.value - trimStart.value)}s`;
            
            trimRafPending = false;
        });
    }

    if (trimStart) trimStart.addEventListener('input', updateTrimUI);
    if (trimEnd) trimEnd.addEventListener('input', updateTrimUI);

    if (previewTrimBtn && hiddenAudioPlayer) {
        previewTrimBtn.addEventListener('click', () => {
            if (hiddenAudioPlayer.paused) {
                hiddenAudioPlayer.currentTime = trimStart.value;
                hiddenAudioPlayer.play();
                if (previewTrimIcon) previewTrimIcon.innerText = 'pause';
            } else {
                hiddenAudioPlayer.pause();
                if (previewTrimIcon) previewTrimIcon.innerText = 'play_arrow';
            }
        });

        hiddenAudioPlayer.addEventListener('timeupdate', () => {
            if (hiddenAudioPlayer.currentTime >= trimEnd.value) {
                hiddenAudioPlayer.pause();
                hiddenAudioPlayer.currentTime = trimStart.value;
                if (previewTrimIcon) previewTrimIcon.innerText = 'play_arrow';
            }
        });
    }

    // Music Selection Handling
    if (musicInput && hiddenAudioPlayer) {
        musicInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (musicFilenameDisplay) {
                    musicFilenameDisplay.innerText = "Processing audio track...";
                    musicFilenameDisplay.classList.add('animate-pulse', 'text-primary');
                }
                
                if (window.currentAudioUrl) URL.revokeObjectURL(window.currentAudioUrl);
                const objectUrl = URL.createObjectURL(file);
                window.currentAudioUrl = objectUrl;
                
                hiddenAudioPlayer.src = objectUrl;
                hiddenAudioPlayer.load();
                
                hiddenAudioPlayer.onloadedmetadata = () => {
                    if (musicFilenameDisplay) {
                        musicFilenameDisplay.innerText = file.name;
                        musicFilenameDisplay.classList.remove('animate-pulse');
                    }
                    
                    audioDuration = hiddenAudioPlayer.duration;
                    trimStart.max = audioDuration;
                    trimEnd.max = audioDuration;
                    trimStart.value = 0;
                    trimEnd.value = audioDuration;
                    updateTrimUI();
                    
                    musicTrimContainer?.classList.remove('hidden');
                };
            } else {
                if (musicFilenameDisplay) {
                    musicFilenameDisplay.innerText = "Tap to select an audio file";
                    musicFilenameDisplay.classList.remove('text-primary', 'animate-pulse');
                }
                musicTrimContainer?.classList.add('hidden');
                hiddenAudioPlayer.pause();
                hiddenAudioPlayer.src = "";
            }
        });
    }

    // Photo Gallery Rendering
    function renderGallery() {
        if (!photoGallery) return;
        photoGallery.innerHTML = '';
        
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
                loaderDiv.remove();
                return;
            }
            
            const item = uploadedFiles[i];
            const url = item.thumbUrl || URL.createObjectURL(item.file);
            if (!item.thumbUrl) objectUrls.push(url);
            
            const div = document.createElement('div');
            div.className = 'relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 opacity-0 transition-opacity duration-500';
            div.innerHTML = `<img src="${url}" loading="lazy" class="w-full h-full object-cover shadow-inner">`;
            
            photoGallery.insertBefore(div, loaderDiv);
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => div.classList.remove('opacity-0'));
            });
            
            i++;
            setTimeout(renderNext, 50);
        }
        renderNext();
    }

    // Photo Selection and Compression
    if (photosInput) {
        photosInput.addEventListener('change', async (e) => {
            const filesToProcess = Array.from(photosInput.files).slice(0, 10);
            if (filesToProcess.length === 0) return;

            window.isProcessing = true;
            if (photoGallery) {
                photoGallery.innerHTML = '<div class="col-span-full text-center text-sm font-bold text-primary animate-pulse py-4 bg-pink-50 rounded-xl">Optimizing and compressing photos...</div>';
            }

            uploadedFiles.forEach(item => { if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl); });
            uploadedFiles = [];

            for (let i = 0; i < filesToProcess.length; i++) {
                const result = await compressImageFile(filesToProcess[i], 1000);
                uploadedFiles.push(result);
            }
            
            window.isProcessing = false;
            renderGallery();
        });
    }

    // Form Submission
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

        window.isProcessing = true;
        submitBtn.disabled = true;
        creatorForm.style.opacity = '0.5';
        loadingDiv?.classList.remove('hidden');
        
        const loadingText = document.getElementById('loading-text');
        const progressBar = document.getElementById('upload-progress-bar');
        
        if (loadingText) loadingText.innerText = "Processing magic...";
        if (progressBar) progressBar.style.width = '5%';

        try {
            const photoUrls = [];
            let musicUrl = null;
            const timestamp = Date.now();
            const safeNameFolder = name.replace(/[^a-zA-Z0-9]/g, '_');

            // 1. Upload Music
            if (musicFile) {
                if (loadingText) loadingText.innerText = "Uploading background music...";
                const musicExt = musicFile.name.split('.').pop();
                const musicFileName = `music_${timestamp}.${musicExt}`;
                const { error } = await supabaseClient.storage.from('birthday-music').upload(`${safeNameFolder}/${musicFileName}`, musicFile);
                if (error) throw new Error("Music upload failed.");
                musicUrl = supabaseClient.storage.from('birthday-music').getPublicUrl(`${safeNameFolder}/${musicFileName}`).data.publicUrl;
            }

            // 2. Upload Photos
            for (let i = 0; i < files.length; i++) {
                if (loadingText) loadingText.innerText = `Uploading photo ${i + 1} of ${files.length}...`;
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${timestamp}_${i}.${fileExt}`;
                const { error } = await supabaseClient.storage.from('birthday-photos').upload(`${safeNameFolder}/${fileName}`, file);
                if (error) throw new Error("Photo upload failed.");
                photoUrls.push(supabaseClient.storage.from('birthday-photos').getPublicUrl(`${safeNameFolder}/${fileName}`).data.publicUrl);
                if (progressBar) progressBar.style.width = `${10 + Math.floor(((i + 1) / files.length) * 80)}%`;
            }

            // 3. Save to DB
            if (loadingText) loadingText.innerText = "Creating surprise link...";
            const { data: { session } } = await supabaseClient.auth.getSession();
            const { data: dbData, error: dbError } = await supabaseClient.from('surprises').insert([{ 
                name, wish_message: message, occasion: selectedOccasion, photo_urls: photoUrls, 
                music_url: musicUrl, music_start_time: Number(trimStart.value), music_end_time: Number(trimEnd.value),
                user_id: session.user.id
            }]).select();

            if (dbError) throw dbError;

            const link = `${window.location.origin}/pages/view.html?id=${dbData[0].id}`;
            shareLinkInput.value = link;
            loadingDiv?.classList.add('hidden');
            creatorForm.classList.add('hidden');
            successPopup?.classList.remove('hidden');
            window.isProcessing = false;

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            submitBtn.disabled = false;
            creatorForm.style.opacity = '1';
            loadingDiv?.classList.add('hidden');
            window.isProcessing = false;
        }
    });

    // Copy Link
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            copyLinkToClipboard(shareLinkInput.value, copyBtn, false);
        });
    }

    // Reset Form
    if (createAnotherBtn) {
        createAnotherBtn.addEventListener('click', () => {
            creatorForm.reset();
            creatorForm.style.opacity = '1';
            submitBtn.disabled = false;
            if (photoGallery) photoGallery.innerHTML = '';
            musicFilenameDisplay.innerText = "Tap to select an audio file";
            musicTrimContainer?.classList.add('hidden');
            successPopup?.classList.add('hidden');
            creatorForm.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
