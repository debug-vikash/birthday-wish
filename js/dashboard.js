/**
 * Dashboard Logic - Fetching, Displaying, and Deleting User Surprises
 */

let currentDeleteTarget = null;

async function loadDashboard() {
    const grid = document.getElementById('surprises-grid');
    const loading = document.getElementById('dashboard-loading');
    const empty = document.getElementById('dashboard-empty');
    
    if (!grid || !loading || !empty) return;
    
    grid.classList.add('hidden');
    empty.classList.add('hidden');
    loading.classList.remove('hidden');
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    
    try {
        const { data: surprises, error } = await supabaseClient
            .from('surprises')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        loading.classList.add('hidden');
        
        if (!surprises || surprises.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        
        grid.innerHTML = '';
        surprises.forEach(surprise => {
            const card = document.createElement('div');
            card.className = 'paper-card rounded-[20px] p-5 hover:translate-y-[-6px] transition-all duration-300 flex flex-col gap-4 group fade-in-up';
            card.id = `card-${surprise.id}`;
            
            const date = new Date(surprise.created_at).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
            });
            
            const previewImg = (surprise.photo_urls && surprise.photo_urls.length > 0) 
                ? surprise.photo_urls[0] 
                : 'https://images.unsplash.com/photo-1530103862676-fa392211b118?w=500&q=80';

            const musicUrl = surprise.music_url || '';
            const photoUrlsJson = encodeURIComponent(JSON.stringify(surprise.photo_urls || []));

            card.innerHTML = `
                <div class="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#fff3ec]">
                    <img src="${previewImg}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute top-3 left-3 bg-[#fffcf9]/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-semibold text-primary border border-[#f0e4d7]">
                        ${surprise.occasion || 'Surprise'}
                    </div>
                    <button onclick="showDeleteModal('${surprise.id}', '${photoUrlsJson}', '${encodeURIComponent(musicUrl)}')"
                        class="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#8a7e72] hover:text-red-400 hover:bg-red-50 transition-all border border-[#f0e4d7] opacity-0 group-hover:opacity-100">
                        <ion-icon name="trash-outline" class="text-sm"></ion-icon>
                    </button>
                </div>
                
                <div class="flex-1 space-y-1.5">
                    <div class="flex justify-between items-start">
                        <h4 class="font-serif font-bold text-lg text-[#4a3f35] line-clamp-1">To: ${surprise.name}</h4>
                        <span class="text-[10px] text-[#8a7e72] shrink-0">${date}</span>
                    </div>
                    <p class="text-[#8a7e72] text-sm line-clamp-2 italic">"${surprise.wish_message || 'A surprise for someone special...'}"</p>
                </div>
                
                <div class="flex gap-2 pt-1">
                    <a href="view.html?id=${surprise.id}" target="_blank" class="flex-1 bg-[#f5ece3] hover:bg-[#ede3d8] text-primary font-semibold py-2.5 rounded-xl text-center text-sm transition-all border border-[#f0e4d7] grow-btn">
                        View
                    </a>
                    <button onclick="copyLinkToClipboard('${surprise.id}', this)" class="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95">
                        Copy Link
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
        
        grid.classList.remove('hidden');
        
    } catch (err) {
        console.error("Dashboard Load Error:", err);
        loading.innerHTML = `<p class="text-red-400 font-medium">Error loading surprises. Please refresh.</p>`;
    }
}

// ====== DELETE FEATURE ======

function showDeleteModal(id, encodedPhotoUrls, encodedMusicUrl) {
    const modal = document.getElementById('delete-modal');
    if (!modal) return;
    currentDeleteTarget = {
        id,
        photoUrls: JSON.parse(decodeURIComponent(encodedPhotoUrls)),
        musicUrl: decodeURIComponent(encodedMusicUrl)
    };
    modal.classList.remove('hidden');
}

function hideDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('hidden');
    currentDeleteTarget = null;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden', 'opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        toast.classList.remove('opacity-100', 'translate-y-0');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
}

async function confirmDelete() {
    if (!currentDeleteTarget) return;
    const { id, photoUrls, musicUrl } = currentDeleteTarget;
    
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'deleting...'; }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        // 1. Delete photos from storage
        if (photoUrls && photoUrls.length > 0) {
            for (const url of photoUrls) {
                try {
                    const path = new URL(url).pathname.split('/birthday-photos/')[1];
                    if (path) await supabaseClient.storage.from('birthday-photos').remove([decodeURIComponent(path)]);
                } catch (e) { console.warn('Photo delete skip:', e); }
            }
        }

        // 2. Delete music from storage
        if (musicUrl) {
            try {
                const path = new URL(musicUrl).pathname.split('/birthday-music/')[1];
                if (path) await supabaseClient.storage.from('birthday-music').remove([decodeURIComponent(path)]);
            } catch (e) { console.warn('Music delete skip:', e); }
        }

        // 3. Delete from database (RLS ensures user_id match)
        const { error } = await supabaseClient.from('surprises').delete().eq('id', id).eq('user_id', session.user.id);
        if (error) throw error;

        // 4. Remove card from DOM
        const card = document.getElementById(`card-${id}`);
        if (card) {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9) translateY(10px)';
            setTimeout(() => {
                card.remove();
                // Check if grid is now empty
                const grid = document.getElementById('surprises-grid');
                const empty = document.getElementById('dashboard-empty');
                if (grid && grid.children.length === 0) {
                    grid.classList.add('hidden');
                    if (empty) empty.classList.remove('hidden');
                }
            }, 400);
        }

        hideDeleteModal();
        showToast('Deleted successfully ♡');

    } catch (err) {
        console.error('Delete error:', err);
        showToast('Failed to delete. Try again.');
    } finally {
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'delete'; }
    }
}

// Expose to global scope
window.copyLinkToClipboard = copyLinkToClipboard;
window.showDeleteModal = showDeleteModal;
window.hideDeleteModal = hideDeleteModal;
window.confirmDelete = confirmDelete;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
    }
});
