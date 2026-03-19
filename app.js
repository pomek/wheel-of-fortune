const SPIN_DURATION = 10000;
const MIN_FULL_SPINS = 6;
const MAX_FULL_SPINS = 10;

const textarea = document.getElementById('items');
const updateBtn = document.getElementById('updateBtn');
const spinBtn = document.getElementById('spinBtn');
const resetBtn = document.getElementById('resetBtn');
const resultEl = document.getElementById('result');
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');

const colors = [
    '#ef4444', '#f59e0b', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

let items = [];
let rotation = 0;
let isSpinning = false;
let audioContext = null;
let lastPointerIndex = null;

function getItems() {
    return textarea.value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
}

function drawWheel(list, currentRotation = 0) {
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    if (!list.length) {
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add items', center, center);
        return;
    }

    const arc = (Math.PI * 2) / list.length;

    for (let i = 0; i < list.length; i += 1) {
        const start = currentRotation + i * arc;
        const end = start + arc;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(start + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';

        const label = list[i].length > 18 ? `${list[i].slice(0, 18)}...` : list[i];
        ctx.fillText(label, radius - 20, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(center, center, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothNoise(t, seed) {
    return (
        Math.sin(t * 7.1 + seed) * 0.55 +
        Math.sin(t * 15.7 + seed * 1.37) * 0.3 +
        Math.sin(t * 28.3 + seed * 0.73) * 0.15
    );
}

function getPointerIndex(list, currentRotation) {
    const arc = (Math.PI * 2) / list.length;
    const normalized = ((Math.PI * 1.5 - currentRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor(normalized / arc) % list.length;
}

function getWinner(list, finalRotation) {
    return list[getPointerIndex(list, finalRotation)];
}

function ensureAudioContext() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return null;
        }
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    return audioContext;
}

function playTick(intensity = 1) {
    const ac = ensureAudioContext();
    if (!ac) {
        return;
    }

    const clamped = Math.max(0.35, Math.min(1, intensity));
    const now = ac.currentTime;
    const oscillator = ac.createOscillator();
    const gainNode = ac.createGain();
    const filter = ac.createBiquadFilter();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1500 - clamped * 250, now);
    oscillator.frequency.exponentialRampToValueAtTime(950 - clamped * 120, now + 0.02);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(650, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.05 + clamped * 0.09, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.028 + clamped * 0.012);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ac.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.035 + clamped * 0.012);
}

function updateWheel() {
    items = getItems();
    resultEl.textContent = '';
    lastPointerIndex = items.length ? getPointerIndex(items, rotation) : null;
    drawWheel(items, rotation);
}

function spinWheel() {
    items = getItems();

    if (isSpinning || items.length < 2) {
        if (items.length < 2) {
            resultEl.textContent = 'Add at least 2 items.';
        }
        return;
    }

    ensureAudioContext();

    isSpinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = '';

    const spins = MIN_FULL_SPINS + Math.floor(Math.random() * (MAX_FULL_SPINS - MIN_FULL_SPINS + 1));
    const extra = Math.random() * Math.PI * 2;
    const startRotation = rotation;
    const targetRotation = rotation + spins * Math.PI * 2 + extra;
    const startTime = performance.now();
    const noiseSeed = Math.random() * Math.PI * 2;
    const arc = (Math.PI * 2) / items.length;
    lastPointerIndex = getPointerIndex(items, rotation);

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / SPIN_DURATION, 1);
        const eased = easeInOutCubic(progress);
        const baseRotation = startRotation + (targetRotation - startRotation) * eased;

        let wobble = 0;

        if (progress < 0.35) {
            const intro = progress / 0.35;
            const envelope = Math.sin(intro * Math.PI);
            wobble += smoothNoise(intro, noiseSeed) * arc * 0.12 * envelope;
        }

        if (progress > 0.9) {
            const outro = (progress - 0.9) / 0.1;
            const speedFactor = 1 - eased;
            const overshootAmplitude = arc * 0.06 * Math.max(0.35, speedFactor * 8);
            const damped = Math.sin(outro * Math.PI * 1.6) * Math.exp(-outro * 2.8);
            wobble += overshootAmplitude * damped;
        }

        rotation = baseRotation + wobble;
        drawWheel(items, rotation);

        const currentPointerIndex = getPointerIndex(items, rotation);
        if (currentPointerIndex !== lastPointerIndex) {
            const intensity = Math.min(1, Math.abs(targetRotation - rotation) / (Math.PI * 1.5));
            playTick(intensity);
            lastPointerIndex = currentPointerIndex;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
            return;
        }

        rotation = targetRotation % (Math.PI * 2);
        drawWheel(items, rotation);
        resultEl.textContent = `Selected: ${getWinner(items, rotation)}`;
        isSpinning = false;
        spinBtn.disabled = false;
        lastPointerIndex = getPointerIndex(items, rotation);
    }

    requestAnimationFrame(animate);
}

function resetWheel() {
    rotation = 0;
    textarea.value = 'Pizza\nBurger\nSushi\nTaco\nKebab\nRamen';
    resultEl.textContent = '';
    updateWheel();
}

updateBtn.addEventListener('click', updateWheel);
spinBtn.addEventListener('click', spinWheel);
resetBtn.addEventListener('click', resetWheel);

updateWheel();
