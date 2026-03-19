export function getElements() {
    const textarea = document.getElementById('items');
    const updateBtn = document.getElementById('updateBtn');
    const spinBtn = document.getElementById('spinBtn');
    const resetBtn = document.getElementById('resetBtn');
    const resultEl = document.getElementById('result');
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');

    return {
        textarea,
        updateBtn,
        spinBtn,
        resetBtn,
        resultEl,
        canvas,
        ctx
    };
}
