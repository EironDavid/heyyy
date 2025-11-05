(function () {
	const audio = document.getElementById('bgm');
	const muteBtn = document.getElementById('muteToggle');
    const trackSelect = document.getElementById('trackSelect');
    const muteLabel = document.getElementById('muteLabel');
    const currentTrackLabel = document.getElementById('currentTrackLabel');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumePct = document.getElementById('volumePct');
	const envelope = document.getElementById('envelope');
	const openLetterBtn = document.getElementById('openLetterBtn');
	const floatingLayer = document.getElementById('floatingLayer');
	const replayBtn = document.getElementById('replayBtn');
	const replayMusicBtn = document.getElementById('replayMusicBtn');
	const tinyHeart6 = document.getElementById('tinyHeart6');
	const hiddenMsg6 = document.getElementById('hiddenMsg6');
	const dateMarker = document.getElementById('dateMarker');
	const siteFooter = document.getElementById('siteFooter');

	let attemptedAutoplay = false;
	let playbackBlocked = false;
    let currentTrackId = 'song-1';
	let activePage = 1;

    const TRACKS = {
        'song-1': {
            label: 'Song 1',
            candidates: [
                'assets/audio/song1.mp3',
                'assets/audio/with-a-smile.mp3',
                'with-a-smile.mp3',
                'SpotiDown.App - With A Smile - Eraserheads.mp3'
            ]
        },
        'song-2': {
            label: 'Song 2',
            candidates: [
                'assets/audio/song2.mp3',
                'assets/audio/umaaraw-umuulan.mp3',
                'Umaaraw Umuulan.mp3'
            ]
        }
    };

    const PREFERRED_TARGET_VOLUME = 0.4; // Ensure at least 20%
    const MIN_VOLUME = 0.2;
    function getUserTargetVolume() {
        let pct = 40;
        try {
            const saved = localStorage.getItem('volumePct');
            if (saved != null) pct = parseInt(saved, 10);
        } catch (_) {}
        pct = isFinite(pct) ? Math.max(20, Math.min(100, pct)) : 40; // clamp ≥20%
        return pct / 100;
    }

    function softFadeInAudio() {
		if (!audio) return;
        try { if (audio.volume < 0.01) audio.volume = 0.0; } catch (_) {}
        const userTarget = getUserTargetVolume();
        const target = Math.max(MIN_VOLUME, userTarget, PREFERRED_TARGET_VOLUME);
		const step = 0.04;
		const iv = setInterval(() => {
			try {
				audio.volume = Math.min(target, (audio.volume || 0) + step);
				if (audio.volume >= target) clearInterval(iv);
			} catch (_) { clearInterval(iv); }
		}, 200);
	}

    function setTrack(trackId) {
		if (!TRACKS[trackId]) trackId = 'with-a-smile';
		currentTrackId = trackId;
        // Try candidates in order; load first one that plays
        const candidates = TRACKS[trackId].candidates.slice();
        const tryNext = () => {
            if (!candidates.length) { showAudioNotice(); return; }
            const src = candidates.shift();
            audio.onerror = () => tryNext();
            audio.oncanplay = null;
            if (audio.getAttribute('src') !== src) {
                audio.setAttribute('src', src);
                audio.load();
            }
        };
        tryNext();
        if (currentTrackLabel) currentTrackLabel.textContent = TRACKS[trackId].label;
        tryPlay();
		try { localStorage.setItem('selectedTrack', trackId); } catch (_) {}
	}

    function tryPlay() {
		if (!audio) return;
		audio.loop = true;
        try {
            const userTarget = getUserTargetVolume();
            audio.volume = Math.max(MIN_VOLUME, userTarget);
        } catch (_) {}
		const playPromise = audio.play();
		if (playPromise && typeof playPromise.then === 'function') {
			playPromise.then(() => {
				playbackBlocked = false;
				updateMuteButton();
                softFadeInAudio();
            }).catch(() => {
				// Likely blocked by autoplay policies; wait for user interaction
				playbackBlocked = true;
				updateMuteButton();
                showAudioNotice();
			});
		}
	}

	function updateMuteButton() {
		if (!audio) return;
		const isMuted = audio.muted || playbackBlocked || audio.paused;
		if (muteLabel) muteLabel.textContent = isMuted ? 'Unmute' : 'Mute';
		if (muteBtn) {
			muteBtn.classList.toggle('is-paused', isMuted);
			muteBtn.setAttribute('aria-pressed', String(!isMuted));
		}
	}

	function toggleMute() {
		if (!audio) return;
		if (playbackBlocked) {
			tryPlay();
			return;
		}
		audio.muted = !audio.muted;
		if (!audio.muted && audio.paused) {
			tryPlay();
		}
		updateMuteButton();
	}

	function openEnvelope() {
		if (!envelope.classList.contains('is-open')) {
			envelope.classList.add('is-open');
			// After animation, navigate to Page 2
			setTimeout(() => navigateTo(2), 700);
			// User interaction is a good time to start playback if blocked
			if (playbackBlocked || !attemptedAutoplay) {
				tryPlay();
			}
		}
	}

	function navigateTo(pageNum) {
		activePage = pageNum;
		const all = document.querySelectorAll('.page');
		all.forEach(p => p.classList.remove('is-active'));
		const next = document.getElementById(`page-${pageNum}`);
		if (next) next.classList.add('is-active');
		location.hash = `#${pageNum}`;
		// Page-specific effects
		if (pageNum === 1) {
			// reseal envelope when returning
			envelope?.classList.remove('is-open');
		}
		if (pageNum === 5) ensureFloatingHearts();
		if (pageNum !== 5 && floatingLayer) floatingLayer.innerHTML = '';
    // Word-by-word reveals
    document.querySelectorAll(`#page-${pageNum} [data-reveal="words"]`).forEach(runWordReveal);
    // Ensure other messages on this page are visible
    document.querySelectorAll(`#page-${pageNum} .message`).forEach(m => m.classList.add('is-visible'));

		// Footer text
		if (siteFooter) {
			siteFooter.textContent = pageNum === 7 ? '💌 Always here, even in silence.' : '💌 Made with care, for you.';
		}

		// Final page: fade out letter and music softly after a short pause
		if (pageNum === 7) {
			setTimeout(() => {
				const letter = document.getElementById('letter-7');
				if (letter) letter.classList.add('is-fading');
				softFadeOutAudio();
			}, 2000);
		}
	}

	function runWordReveal(node) {
		const text = node.textContent || '';
		node.textContent = '';
		const words = text.split(' ');
		let i = 0;
		const add = () => {
			if (i >= words.length) return;
			node.textContent += (i === 0 ? '' : ' ') + words[i++];
			setTimeout(add, 160);
		};
    node.classList.add('is-visible');
		add();
	}

	function ensureFloatingHearts() {
		if (!floatingLayer) return;
		floatingLayer.innerHTML = '';
		for (let i = 0; i < 14; i++) {
			const h = document.createElement('div');
			h.className = 'float-heart';
			h.textContent = Math.random() < 0.5 ? '♥' : '❀';
			h.style.left = Math.floor(Math.random() * 100) + 'vw';
			h.style.animationDelay = (Math.random() * 10) + 's';
			h.style.opacity = String(0.2 + Math.random() * 0.3);
			floatingLayer.appendChild(h);
		}
	}

	function softFadeOutAudio() {
		if (!audio) return;
		let stepCount = 0;
		const iv = setInterval(() => {
			try {
				const current = audio.volume || 0.2;
				const next = Math.max(0, current - 0.04);
				audio.volume = next;
				if (next <= 0.01 || ++stepCount > 20) {
					clearInterval(iv);
					try { audio.pause(); } catch(_) {}
				}
			} catch (_) { clearInterval(iv); }
		}, 200);
	}

    // Events
	if (muteBtn) muteBtn.addEventListener('click', toggleMute);
	if (trackSelect) {
		trackSelect.addEventListener('change', (e) => {
			const value = e.target.value;
			setTrack(value);
		});
	}
    if (volumeSlider) {
        // Initialize from saved
        try {
            const saved = localStorage.getItem('volumePct');
            if (saved != null) {
                const pct = Math.max(20, Math.min(100, parseInt(saved, 10)));
                volumeSlider.value = String(pct);
                if (volumePct) volumePct.textContent = pct + '%';
            }
        } catch (_) {}
        const onVol = () => {
            const pct = Math.max(20, Math.min(100, parseInt(volumeSlider.value, 10)));
            if (volumePct) volumePct.textContent = pct + '%';
            try { localStorage.setItem('volumePct', String(pct)); } catch (_) {}
            if (audio) {
                try { audio.volume = pct / 100; } catch (_) {}
                if (audio.paused && !playbackBlocked) tryPlay();
            }
            volumeSlider.setAttribute('aria-valuenow', String(pct));
        };
        volumeSlider.addEventListener('input', onVol);
        volumeSlider.addEventListener('change', onVol);
    }
	if (envelope) {
		envelope.addEventListener('click', openEnvelope);
		envelope.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openEnvelope();
			}
		});
	}
	if (openLetterBtn) openLetterBtn.addEventListener('click', openEnvelope);
	if (replayBtn) replayBtn.addEventListener('click', () => navigateTo(1));
	if (replayMusicBtn) replayMusicBtn.addEventListener('click', () => { try { audio.currentTime = 0; } catch(_){} tryPlay(); });
	if (tinyHeart6 && hiddenMsg6) tinyHeart6.addEventListener('click', () => hiddenMsg6.classList.toggle('is-visible'));

    // Audio notice helpers
    const audioNotice = document.getElementById('audioNotice');
    const audioStartBtn = document.getElementById('audioStartBtn');
    function showAudioNotice() {
        if (!audioNotice) return;
        audioNotice.hidden = false;
    }
    function hideAudioNotice() {
        if (!audioNotice) return;
        audioNotice.hidden = true;
    }
    if (audioStartBtn) audioStartBtn.addEventListener('click', () => { hideAudioNotice(); tryPlay(); });

	document.addEventListener('click', (e) => {
		const target = e.target;
		if (target.matches('.nav-next')) navigateTo(parseInt(target.getAttribute('data-next'), 10));
		if (target.matches('.nav-back')) navigateTo(parseInt(target.getAttribute('data-back'), 10));
	});

    document.addEventListener('DOMContentLoaded', () => {
		if (!attemptedAutoplay) {
			attemptedAutoplay = true;
			// Initialize track from saved preference
			try {
				const saved = localStorage.getItem('selectedTrack');
				if (saved && TRACKS[saved]) {
					if (trackSelect) trackSelect.value = saved;
					setTrack(saved);
				} else {
					setTrack(currentTrackId);
				}
			} catch (_) {
				setTrack(currentTrackId);
			}
		}
		updateMuteButton();
        // Ensure minimum starting volume or user target
        try {
            const userTarget = getUserTargetVolume();
            if (volumeSlider) {
                const pct = Math.round(userTarget * 100);
                volumeSlider.value = String(pct);
                if (volumePct) volumePct.textContent = pct + '%';
            }
            audio.volume = Math.max(MIN_VOLUME, userTarget);
        } catch(_) {}
		// Date marker
		if (dateMarker) {
			const now = new Date();
			const options = { year: 'numeric', month: 'long', day: 'numeric' };
			dateMarker.textContent = now.toLocaleDateString(undefined, options);
		}
		// Initial route
		const hash = location.hash.replace('#','');
		navigateTo(hash ? parseInt(hash, 10) || 1 : 1);
	});
})();

