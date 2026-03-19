export function createWheelRenderer({ canvas, ctx, colors, emptyText }) {
    function draw(list, currentRotation = 0) {
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
            ctx.fillText(emptyText, center, center);
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

    function getPointerIndex(list, currentRotation) {
        const arc = (Math.PI * 2) / list.length;
        const normalized = ((Math.PI * 1.5 - currentRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        return Math.floor(normalized / arc) % list.length;
    }

    function getWinner(list, finalRotation) {
        return list[getPointerIndex(list, finalRotation)];
    }

    return {
        draw,
        getPointerIndex,
        getWinner
    };
}
