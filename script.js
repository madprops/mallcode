/**
 * Morse Code Dictionary
 */
const MORSE_CODE = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z', '.----': '1', '..---': '2', '...--': '3',
    '....-': '4', '.....': '5', '-....': '6', '--...': '7',
    '---..': '8', '----.': '9', '-----': '0'
};

/**
 * Audio Context for Transmitter (Beep sound)
 */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let oscillator;
let gainNode;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioCtx.destination);

        oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 600; // Classic morse tone
        oscillator.connect(gainNode);
        oscillator.start();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/**
 * WebSocket Multiplayer Setup
 */
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);
ws.onmessage = (event) => {
    if (event.data === 'DOWN') {
        handlePress(null, false);
    } else if (event.data === 'UP') {
        handleRelease(null, false);
    }
};

/**
 * Three.js WebGL Setup
 */
const canvas = document.getElementById('glcanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020208, 0.0015);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 40;

// Background Particle Cloud
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000;
const posArray = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 150;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    color: 0x4488ff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particleMesh);

// Sprite Management
const sprites = [];
let activeSequenceSprite = null;

function createTextTexture(text, isWord = false, isSequence = false) {
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 1024;
    textCanvas.height = 256;
    const ctx = textCanvas.getContext('2d');

    ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);

    if (isWord) {
        ctx.font = 'bold 120px sans-serif';
        ctx.fillStyle = '#ffaa00';
    } else if (isSequence) {
        ctx.font = 'bold 100px sans-serif';
        ctx.fillStyle = '#66ccff';
    } else {
        ctx.font = 'bold 180px sans-serif';
        ctx.fillStyle = '#ffffff';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = isSequence ? 10 : 30;
    ctx.fillText(text, textCanvas.width / 2, textCanvas.height / 2);

    return new THREE.CanvasTexture(textCanvas);
}

function spawnSprite(text, type) {
    const texture = createTextTexture(text, type === 'word', type === 'sequence');
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(material);

    if (type === 'sequence') {
        sprite.scale.set(40, 10, 1);
        sprite.position.set(0, -15, 15); // Bottom center
    } else {
        sprite.scale.set(40, 10, 1);
        sprite.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10, type === 'word' ? 20 : 0);
        sprite.userData = {
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.05, Math.random() * 0.05 + 0.02, 0.05),
            life: 1.0,
            decay: type === 'word' ? 0.004 : 0.008,
            age: 0
        };
        sprites.push(sprite);
    }

    scene.add(sprite);
    return sprite;
}

/**
 * Adaptive Morse Code Logic
 */
let isPressed = false;
let pressStartTime = 0;
let currentSequence = "";
let currentWord = "";
let dotDuration = 120; // Will adapt to user speed (avg length of a dot)
let letterTimeout = null;
let wordTimeout = null;

// Forgiving fuzzy match logic (Levenshtein distance based)
function fuzzyMatch(seq) {
    let bestMatch = null;
    let bestScore = Infinity;

    for (const [morse, char] of Object.entries(MORSE_CODE)) {
        let diff = Math.abs(morse.length - seq.length);
        let mismatch = 0;
        for(let i = 0; i < Math.min(morse.length, seq.length); i++) {
            if (morse[i] !== seq[i]) mismatch++;
        }
        let score = diff * 2 + mismatch; // Heavily penalize length differences

        if (score < bestScore) {
            bestScore = score;
            bestMatch = char;
        }
    }
    // If it's close enough (score <= 2), forgive the mistake
    return bestScore <= 2 ? bestMatch : '?';
}

function updateSequenceDisplay() {
    if (activeSequenceSprite) {
        scene.remove(activeSequenceSprite);
        activeSequenceSprite.material.map.dispose();
        activeSequenceSprite.material.dispose();
        activeSequenceSprite = null;
    }
    if (currentSequence) {
        activeSequenceSprite = spawnSprite(currentSequence, 'sequence');
    }
}

function resolveLetter() {
    if (!currentSequence) return;
    let letter = MORSE_CODE[currentSequence];

    // Apply forgiving algorithm if exact match fails
    if (!letter) letter = fuzzyMatch(currentSequence);

    if (letter !== '?') {
        currentWord += letter;
        spawnSprite(letter, 'letter');
    } else {
        spawnSprite('?', 'letter'); // Unrecognized noise
    }

    currentSequence = "";
    updateSequenceDisplay();

    // A wait of 7 dot lengths total creates a new word. We've already waited ~3 to get here.
    wordTimeout = setTimeout(resolveWord, dotDuration * 4);
}

function resolveWord() {
    if (!currentWord) return;
    spawnSprite(currentWord, 'word');
    currentWord = "";
}

function handlePress(e, isLocal = true) {
    if (e && e.repeat) return; // Ignore hold-down keyboard repeats
    if (isPressed) return;

    if (isLocal !== false && ws.readyState === WebSocket.OPEN) {
        ws.send('DOWN');
    }

    initAudio(); // Required due to browser autoplay policies
    isPressed = true;
    pressStartTime = performance.now();

    clearTimeout(letterTimeout);
    clearTimeout(wordTimeout);

    gainNode.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.01);
    particleMesh.material.size = 0.5; // Visual flash
}

function handleRelease(e, isLocal = true) {
    if (!isPressed) return;
    isPressed = false;

    if (isLocal !== false && ws.readyState === WebSocket.OPEN) {
        ws.send('UP');
    }

    const duration = performance.now() - pressStartTime;
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
    particleMesh.material.size = 0.15;

    // Adaptive threshold check
    if (duration < dotDuration * 2) {
        currentSequence += ".";
        // Adapt to user's dot speed, bounded to sane limits (50ms - 250ms)
        dotDuration = Math.max(50, Math.min(250, (dotDuration * 0.7) + (duration * 0.3)));
    } else {
        currentSequence += "-";
    }

    updateSequenceDisplay();

    // Wait for the next input, if they pause for 3x dot duration, commit the letter
    letterTimeout = setTimeout(resolveLetter, dotDuration * 3);
}

// Event Listeners
window.addEventListener('mousedown', handlePress);
window.addEventListener('mouseup', handleRelease);
window.addEventListener('keydown', handlePress);
window.addEventListener('keyup', handleRelease);
window.addEventListener('touchstart', (e) => { e.preventDefault(); handlePress(e); }, { passive: false });
window.addEventListener('touchend', (e) => { e.preventDefault(); handleRelease(e); }, { passive: false });
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Idle particle motion
    particleMesh.rotation.y += 0.02 * delta;
    particleMesh.rotation.x += 0.01 * delta;

    // Camera interactive zoom effect
    const targetZ = isPressed ? 35 : 40;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.15);

    // Update floating text sprites
    for (let i = sprites.length - 1; i >= 0; i--) {
        const s = sprites[i];
        s.position.add(s.userData.velocity);
        s.userData.age += delta;
        s.userData.life -= s.userData.decay;

        // Fade in rapidly, then fade out over lifespan
        const fadeIn = Math.min(1.0, s.userData.age * 3.0);
        s.material.opacity = Math.max(0, fadeIn * s.userData.life);

        s.scale.x += s.userData.decay * 10;
        s.scale.y += s.userData.decay * 5;

        if (s.userData.life <= 0) {
            scene.remove(s);
            s.material.map.dispose();
            s.material.dispose();
            sprites.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

animate();