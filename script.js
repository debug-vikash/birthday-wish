/**
 * Birthday Wish - Emotional & Magical
 * ===================================
 * Pure Vanilla JavaScript - no libraries.
 * Flow: Name input → Wish screen → Hearts, photos, slideshow, surprise.
 */

// -------- Config --------
const HEART_COUNT = 50;
const CONFETTI_COUNT = 500;
const SECONDS_PER_PHOTO = 5;  // Each photo shown for 5 sec; total time = numPhotos * 5
const SHAPE_TYPES = ["heart", "circle", "rounded", "blob"];
const SLIDE_DIRECTIONS = ["slide-ltr", "slide-rtl", "slide-ttb", "slide-btt", "slide-diag1", "slide-diag2"];

// -------- DOM --------
const nameScreen = document.getElementById("nameScreen");
const wishScreen = document.getElementById("wishScreen");
const nameInput = document.getElementById("nameInput");
const createSurpriseBtn = document.getElementById("createSurpriseBtn");
const introHearts = document.getElementById("introHearts");
const birthdayName = document.getElementById("birthdayName");
const heartsContainer = document.getElementById("heartsContainer");
const tapHint = document.getElementById("tapHint");
const uploadSection = document.getElementById("uploadSection");
const photoInput = document.getElementById("photoInput");
const photoGallery = document.getElementById("photoGallery");
const photoPopup = document.getElementById("photoPopup");
const popupPhotoImg = document.getElementById("popupPhotoImg");
const closePopupBtn = document.getElementById("closePopupBtn");
const slideshowOverlay = document.getElementById("slideshowOverlay");
const slideshowContainer = document.getElementById("slideshowContainer");
const surpriseBtn = document.getElementById("surpriseBtn");
const shareBtn = document.getElementById("shareBtn");
const shareModal = document.getElementById("shareModal");
const shareModalText = document.getElementById("shareModalText");
const shareLinkInput = document.getElementById("shareLinkInput");
const finalMessage = document.getElementById("finalMessage");
const finalMessageTitle = document.getElementById("finalMessageTitle");
const finalMessageBody = document.getElementById("finalMessageBody");
const customSurpriseTitle = document.getElementById("customSurpriseTitle");
const customSurpriseBody = document.getElementById("customSurpriseBody");
const bgMusic = document.getElementById("bgMusic");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const musicIcon = document.querySelector(".music-icon");
const confettiLayer = document.getElementById("confettiLayer");

// -------- State --------
let uploadedPhotos = [];
let slideshowActive = false;
let isMusicPlaying = false;

/* ============================================
   1. NAME INPUT → Create Surprise
   ============================================ */

function goToWishScreen(name, prefillTitle = "", prefillBody = "", skipTransition = false) {
  birthdayName.textContent = name;
  if (customSurpriseTitle) customSurpriseTitle.value = prefillTitle;
  if (customSurpriseBody) customSurpriseBody.value = prefillBody;

  if (skipTransition) {
    nameScreen.classList.add("hidden");
    wishScreen.classList.remove("hidden");
    initHearts();
    bgMusic.play().catch(() => {});
    isMusicPlaying = true;
    musicToggleBtn.classList.add("playing");
    if (musicIcon) musicIcon.textContent = "❚❚";
    return;
  }

  nameScreen.classList.add("fade-out");
  setTimeout(() => {
    nameScreen.classList.add("hidden");
    wishScreen.classList.remove("hidden");
    initHearts();
    bgMusic.play().catch(() => {});
    isMusicPlaying = true;
    musicToggleBtn.classList.add("playing");
    if (musicIcon) musicIcon.textContent = "❚❚";
  }, 600);
}

createSurpriseBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Special Someone";
  goToWishScreen(name);
});

// Check for share link on load (?name=...&title=...&body=...)
(function checkShareLink() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  if (name) {
    nameInput.value = decodeURIComponent(name);
    goToWishScreen(
      decodeURIComponent(name),
      params.get("title") ? decodeURIComponent(params.get("title")) : "",
      params.get("body") ? decodeURIComponent(params.get("body")) : "",
      true  // skip transition - open directly on shared link
    );
  }
})();

// Intro screen: few subtle hearts
function initIntroHearts() {
  for (let i = 0; i < 8; i++) {
    setTimeout(() => createHeartElement(introHearts, false), i * 400);
  }
}
initIntroHearts();

/* ============================================
   2. FLOATING HEARTS (pulse, rotate, glow)
   ============================================ */

function createHeartElement(container, interactive = true) {
  const heart = document.createElement("div");
  heart.classList.add("heart", "heart-floating");

  // Random size
  const scale = 0.5 + Math.random() * 1.3;
  heart.style.setProperty("--heart-scale", scale);
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.animationDuration = `${10 + Math.random() * 14}s`;
  heart.style.animationDelay = `${Math.random() * 6}s`;

  // Some hearts pulse and glow
  if (Math.random() > 0.6) heart.classList.add("heart-pulse");
  if (Math.random() > 0.7) heart.classList.add("heart-glow");

  heart.addEventListener("animationend", () => {
    heart.remove();
    if (container === heartsContainer) createHeartElement(container, interactive);
  });

  if (interactive) {
    const onHeartClick = (e) => {
      e.stopPropagation();
      heart.classList.remove("heart-floating", "heart-pulse");
      heart.classList.add("heart-pop");
      heart.addEventListener("animationend", () => {
        heart.remove();
        createHeartElement(container, true);
      }, { once: true });

      if (uploadedPhotos.length > 0) {
        const idx = Math.floor(Math.random() * uploadedPhotos.length);
        popupPhotoImg.src = uploadedPhotos[idx];
        openPhotoPopup();
      }
    };
    heart.addEventListener("click", onHeartClick);
    heart.addEventListener("touchstart", onHeartClick, { passive: true });
  }

  container.appendChild(heart);
}

function initHearts() {
  for (let i = 0; i < HEART_COUNT; i++) {
    setTimeout(() => createHeartElement(heartsContainer, true), i * 150);
  }
}

/* ============================================
   3. PHOTO UPLOAD
   ============================================ */

photoInput.addEventListener("change", (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  uploadedPhotos = [];
  let loaded = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;

    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedPhotos.push(ev.target.result);
      loaded++;
      if (loaded === Array.from(files).filter(f => f.type.startsWith("image/")).length) {
        uploadSection.classList.add("fade-out");
        setTimeout(() => {
          uploadSection.style.display = "none";
          renderPhotoGallery();
          photoGallery.classList.remove("hidden");
          tapHint.classList.remove("hidden");
        }, 500);
      }
    };
    reader.readAsDataURL(file);
  }
});

function renderPhotoGallery() {
  photoGallery.innerHTML = "";
  uploadedPhotos.forEach((src, i) => {
    const shape = SHAPE_TYPES[i % SHAPE_TYPES.length];
    const item = document.createElement("div");
    item.className = `photo-frame-item frame-${shape}`;
    item.innerHTML = `<img src="${src}" alt="Memory ${i + 1}" />`;
    photoGallery.appendChild(item);
  });
}

/* ============================================
   4. HEART POPUP
   ============================================ */

function openPhotoPopup() {
  photoPopup.classList.remove("hidden");
}

function closePhotoPopup() {
  photoPopup.classList.add("hidden");
}

closePopupBtn.addEventListener("click", closePhotoPopup);
photoPopup.addEventListener("click", (e) => {
  if (e.target === photoPopup) closePhotoPopup();
});

/* ============================================
   5. TAP ANYWHERE → 10 sec slideshow
   ============================================ */

function maybeStartSlideshow(e) {
  if (uploadedPhotos.length === 0) return;
  if (!photoPopup.classList.contains("hidden")) return;
  if (!finalMessage.classList.contains("hidden")) return;
  if (e.target.closest(".music-btn")) return;
  if (e.target.closest(".surprise-btn")) return;
  if (e.target.closest(".share-btn")) return;

  if (slideshowOverlay.classList.contains("hidden")) {
    slideshowOverlay.classList.remove("hidden");
    if (tapHint) tapHint.classList.add("hidden");
    startSlideshow();
  }
}

document.addEventListener("click", maybeStartSlideshow);
document.addEventListener("touchstart", maybeStartSlideshow, { passive: true });

function startSlideshow() {
  if (uploadedPhotos.length === 0 || slideshowActive) return;

  slideshowActive = true;
  // Total time = number of photos * seconds per photo
  const intervalMs = SECONDS_PER_PHOTO * 1000;
  let index = 0;

  function showNext() {
    if (index >= uploadedPhotos.length) {
      slideshowActive = false;
      slideshowContainer.innerHTML = "";
      slideshowOverlay.classList.add("hidden");
      tapHint.classList.remove("hidden");
      return;
    }

    slideshowContainer.innerHTML = "";
    const slide = document.createElement("div");
    slide.className = `slideshow-item ${SLIDE_DIRECTIONS[Math.floor(Math.random() * SLIDE_DIRECTIONS.length)]}`;
    slide.innerHTML = `<img src="${uploadedPhotos[index]}" alt="Slide ${index + 1}" />`;
    slideshowContainer.appendChild(slide);

    index++;
    setTimeout(showNext, intervalMs);
  }

  showNext();
}

/* ============================================
   6. BIG SURPRISE → Confetti + You Are Special
   ============================================ */

surpriseBtn.addEventListener("click", () => {
  // Confetti blast
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    setTimeout(() => createConfettiPiece(), i * 12);
  }

  // Build final message from user's custom text
  const defaultTitle = "You Are Special ❤️";
  const title = (customSurpriseTitle?.value || "").trim() || defaultTitle;
  const body = (customSurpriseBody?.value || "").trim();

  finalMessageTitle.textContent = title;
  if (body) {
    finalMessageBody.textContent = body;
    finalMessageBody.classList.remove("hidden");
  } else {
    finalMessageBody.textContent = "";
    finalMessageBody.classList.add("hidden");
  }

  // Show final message
  finalMessage.classList.remove("hidden");

  // Hearts speed up
  heartsContainer.classList.add("hearts-fast");

  // Hide message after a while (optional - stays visible)
  setTimeout(() => {
    finalMessage.classList.add("hidden");
    heartsContainer.classList.remove("hearts-fast");
  }, 6000);
});

function createConfettiPiece() {
  const piece = document.createElement("div");
  piece.classList.add("confetti-piece");
  piece.style.left = `${Math.random() * 100}vw`;
  const colors = ["#ffe259", "#ff6a88", "#a18cd1", "#fbc2eb", "#ff9a9e", "#fff"];
  piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  piece.style.animationDuration = `${3 + Math.random() * 4}s`;
  piece.style.animationDelay = `${Math.random() * 1.5}s`;
  piece.addEventListener("animationend", () => piece.remove());
  confettiLayer.appendChild(piece);
}

/* ============================================
   7. SHARE - Create real shareable link
   ============================================ */

function buildShareUrl() {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  const name = birthdayName?.textContent?.trim() || nameInput?.value?.trim() || "Special Someone";
  params.set("name", name);
  const title = (customSurpriseTitle?.value || "").trim();
  const body = (customSurpriseBody?.value || "").trim();
  if (title) params.set("title", title);
  if (body) params.set("body", body);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

shareBtn.addEventListener("click", async () => {
  const url = buildShareUrl();

  try {
    await navigator.clipboard.writeText(url);
    shareModalText.textContent = "Link Copied Successfully!";
    shareLinkInput?.classList.add("hidden");
  } catch {
    shareModalText.textContent = "Copy this link to share:";
    if (shareLinkInput) {
      shareLinkInput.value = url;
      shareLinkInput.classList.remove("hidden");
      shareLinkInput.select();
    }
  }

  shareModal.classList.remove("hidden");
  setTimeout(() => {
    shareModal.classList.add("hidden");
    shareLinkInput?.classList.add("hidden");
  }, 4000);
});

// Close modal on background click
shareModal.addEventListener("click", (e) => {
  if (e.target === shareModal) {
    shareModal.classList.add("hidden");
    shareLinkInput?.classList.add("hidden");
  }
});

/* ============================================
   8. MUSIC
   ============================================ */

function toggleMusic() {
  if (isMusicPlaying) {
    bgMusic.pause();
    musicToggleBtn.classList.remove("playing");
    if (musicIcon) musicIcon.textContent = "▶";
  } else {
    bgMusic.play().catch(() => {});
    musicToggleBtn.classList.add("playing");
    if (musicIcon) musicIcon.textContent = "❚❚";
  }
  isMusicPlaying = !isMusicPlaying;
}

musicToggleBtn.addEventListener("click", toggleMusic);
