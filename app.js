import { createAudioPlayer } from './src/audio.js';
import {
    COLORS,
    DEFAULT_ITEMS,
    MAX_FULL_SPINS,
    MIN_FULL_SPINS,
    SPIN_DURATION,
    TEXT
} from './src/constants.js';
import { getElements } from './src/dom.js';
import { formatItems, parseItems } from './src/items.js';
import { createSpinner } from './src/spin.js';
import { createState } from './src/state.js';
import { createWheelRenderer } from './src/wheel.js';

const elements = getElements();
const state = createState();
const audio = createAudioPlayer();
const renderer = createWheelRenderer({
    canvas: elements.canvas,
    ctx: elements.ctx,
    colors: COLORS,
    emptyText: TEXT.emptyWheel
});

function setResult(message) {
    elements.resultEl.textContent = message;
}

function getItems() {
    return parseItems(elements.textarea.value);
}

function updateWheel() {
    state.items = getItems();
    setResult('');
    state.lastPointerIndex = state.items.length
        ? renderer.getPointerIndex(state.items, state.rotation)
        : null;
    renderer.draw(state.items, state.rotation);
}

function resetWheel() {
    state.rotation = 0;
    elements.textarea.value = formatItems(DEFAULT_ITEMS);
    setResult('');
    updateWheel();
}

const spinner = createSpinner({
    state,
    renderer,
    audio,
    spinBtn: elements.spinBtn,
    getItems,
    setResult,
    spinDuration: SPIN_DURATION,
    minFullSpins: MIN_FULL_SPINS,
    maxFullSpins: MAX_FULL_SPINS,
    minItemsMessage: TEXT.minItems,
    selectedPrefix: TEXT.selectedPrefix
});

elements.updateBtn.addEventListener('click', updateWheel);
elements.spinBtn.addEventListener('click', spinner.spin);
elements.resetBtn.addEventListener('click', resetWheel);

elements.textarea.value = formatItems(DEFAULT_ITEMS);
updateWheel();
