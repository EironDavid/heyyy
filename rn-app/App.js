import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const PAGES = [
	{ id: 1 },
	{ id: 2, text: 'Hey, I know it’s been tough, but you’re here. That matters.' },
	{ id: 3, text: 'You don’t have to fix everything at once. It’s okay to rest.' },
	{ id: 4, text: 'You’ve been strong for so long. You deserve a moment of peace.' },
	{ id: 5, text: 'Even when you doubt yourself, someone believes in you.' },
	{ id: 6, text: 'You bring light to others more than you notice.' },
	{ id: 7, text: 'Take a deep breath. You are loved.' },
];

export default function App() {
	const [page, setPage] = useState(1);
	const [muted, setMuted] = useState(false);
	const [hiddenVisible, setHiddenVisible] = useState(false);
	const envelopeTilt = useRef(new Animated.Value(0)).current;
	const heartsAnim = useRef(new Animated.Value(0)).current;
	const soundRef = useRef(null);

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(envelopeTilt, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
				Animated.timing(envelopeTilt, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
			])
		).start();
	}, [envelopeTilt]);

	useEffect(() => {
		Animated.loop(
			Animated.timing(heartsAnim, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
		).start();
	}, [heartsAnim]);

	useEffect(() => {
		(async () => {
			try {
				await Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
				const sound = new Audio.Sound();
				soundRef.current = sound;
				await sound.loadAsync(
					// Replace with your local asset once added to assets folder
					// require('./assets/with-a-smile.mp3')
					{ uri: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_7ad86a46a4.mp3?filename=gentle-ambient-110855.mp3' },
					{ shouldPlay: true, isLooping: true, volume: 0.2 }
				);
				// Soft fade towards 0.4
				let vol = 0.2;
				const iv = setInterval(async () => {
					try {
						vol = Math.min(0.4, vol + 0.04);
						await sound.setVolumeAsync(vol);
						if (vol >= 0.4) clearInterval(iv);
					} catch (e) { clearInterval(iv); }
				}, 200);
			} catch (e) {
				// noop
			}
		})();
		return () => { if (soundRef.current) { soundRef.current.unloadAsync(); } };
	}, []);

	useEffect(() => {
		if (!soundRef.current) return;
		(async () => { await soundRef.current.setIsMutedAsync(muted); })();
	}, [muted]);

	const tiltDeg = envelopeTilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-2deg'] });
	const goNext = () => setPage((p) => Math.min(7, p + 1));
	const goBack = () => setPage((p) => Math.max(1, p - 1));

	return (
		<SafeAreaView style={[styles.container, bgForPage(page)]}>
			<ExpoStatusBar style="dark" />
			<View style={styles.topRight}>
				<TouchableOpacity style={styles.muteBtn} onPress={() => setMuted((m) => !m)}>
					<View style={[styles.wave, muted && styles.wavePaused]} />
					<Text style={styles.muteText}>{muted ? 'Unmute' : 'Mute'}</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.centerWrap}>
				{page === 1 ? (
					<View style={{ alignItems: 'center' }}>
						<Animated.View style={[styles.envelope, { transform: [{ rotate: tiltDeg }] }]}>
							<View style={styles.envBack} />
							<View style={styles.envFlap} />
							<View style={styles.envLetter}><Text style={styles.heart}>💌</Text><Text style={styles.note}>A letter for you.</Text></View>
						</Animated.View>
						<TouchableOpacity style={styles.primaryBtn} onPress={() => setPage(2)}>
							<Text style={styles.primaryBtnText}>Open Letter</Text>
						</TouchableOpacity>
					</View>
				) : (
					<View style={{ alignItems: 'center' }}>
						<Text style={[styles.message, page >= 5 && styles.handwriting]}>{PAGES.find(x => x.id === page)?.text}</Text>
						<View style={styles.actions}>
							{page > 2 && <TouchableOpacity onPress={goBack} style={styles.navBtn}><Text style={styles.navText}>← Back</Text></TouchableOpacity>}
							{page < 7 && <TouchableOpacity onPress={goNext} style={styles.navBtn}><Text style={styles.navText}>Next →</Text></TouchableOpacity>}
							{page === 7 && (
								<>
									<TouchableOpacity onPress={() => setPage(1)} style={styles.navBtn}><Text style={styles.navText}>Start Over</Text></TouchableOpacity>
									<TouchableOpacity onPress={() => { if (soundRef.current) { soundRef.current.setPositionAsync(0); soundRef.current.playAsync(); } }} style={styles.navBtn}><Text style={styles.navText}>Replay Music</Text></TouchableOpacity>
								</>
							)}
						</View>
						{page === 4 && <FloatingHearts anim={heartsAnim} />}
						{page === 7 && (
							<View style={{ alignItems: 'center', marginTop: 8 }}>
								<TouchableOpacity onPress={() => setHiddenVisible((v) => !v)}><Text style={styles.tinyHeart}>❤</Text></TouchableOpacity>
								{hiddenVisible && <Text style={[styles.hiddenMsg, styles.handwriting]}>Psst… you are more cherished than you know. 💖</Text>}
								<Text style={styles.footerSmall}>Made for you on {new Date().toLocaleDateString()}</Text>
							</View>
						)}
					</View>
				)}
			</View>

			<Text style={styles.footer}>💌 Made with care, for you.</Text>
		</SafeAreaView>
	);
}

function FloatingHearts({ anim }) {
	const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -200] });
	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="none">
			{new Array(12).fill(0).map((_, i) => (
				<Animated.Text key={i} style={{ position: 'absolute', left: `${(i * 8) % 90}%`, bottom: -20, opacity: 0.3 + (i % 3) * 0.1, transform: [{ translateY }], fontSize: 14 }}>
					{ i % 2 === 0 ? '♥' : '❀' }
				</Animated.Text>
			))}
		</View>
	);
}

function bgForPage(p) {
	switch (p) {
		case 2: return { backgroundColor: '#EDF6FF' };
		case 3: return { backgroundColor: '#FFF2F4' };
		case 4: return { backgroundColor: '#EEF8FF' };
		case 5: return { backgroundColor: '#F6F7FF' };
		case 6: return { backgroundColor: '#EEFCFF' };
		case 7: return { backgroundColor: '#F9F6FF' };
		default: return { backgroundColor: '#EEF2FF' };
	}
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
	topRight: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center' },
	wave: { width: 10, height: 10, borderRadius: 5, marginRight: 6, backgroundColor: '#9ad0ff' },
	wavePaused: { opacity: 0.4 },
	muteBtn: { backgroundColor: 'white', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, elevation: 3, shadowColor: '#223', shadowOpacity: 0.1, shadowRadius: 10 },
	muteText: { fontSize: 14 },
	centerWrap: { alignItems: 'center', justifyContent: 'center' },
	envelope: { width: 300, height: 210, alignItems: 'center', justifyContent: 'center' },
	envBack: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e9ecff' },
	envFlap: { position: 'absolute', left: 0, right: 0, top: 0, height: 110, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: '#ffdff0', borderWidth: 1, borderColor: '#ffd1e7', borderBottomWidth: 0 },
	envLetter: { position: 'absolute', left: 18, right: 18, top: 60, bottom: 24, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eef0ff', alignItems: 'center', justifyContent: 'center' },
	heart: { fontSize: 28 },
	note: { marginTop: 6, color: '#6f6a7a' },
	primaryBtn: { marginTop: 14, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, elevation: 3, shadowColor: '#223', shadowOpacity: 0.1, shadowRadius: 10 },
	primaryBtnText: { fontSize: 16 },
	message: { fontSize: 18, color: '#2a2a33', textAlign: 'center', maxWidth: 320 },
	handwriting: { fontStyle: 'italic' },
	actions: { marginTop: 16, flexDirection: 'row', gap: 12 },
	navBtn: { backgroundColor: '#fff', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, elevation: 3, shadowColor: '#223', shadowOpacity: 0.1, shadowRadius: 10 },
	navText: { fontSize: 14 },
	footer: { position: 'absolute', bottom: 12, textAlign: 'center', fontSize: 12, color: '#6c7085' },
	footerSmall: { marginTop: 6, fontSize: 12, color: '#6c7085' },
	tinyHeart: { fontSize: 18, opacity: 0.7, textAlign: 'center' },
	hiddenMsg: { marginTop: 6, color: '#5f6472', textAlign: 'center' }
});


