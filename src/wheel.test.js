import { describe, expect, it, vi } from 'vitest';

import { createWheelRenderer } from './wheel.js';

function createContext() {
    return {
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        moveTo: vi.fn(),
        closePath: vi.fn(),
        save: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: ''
    };
}

describe('wheel', () => {
    it('draws empty wheel text when there are no items', () => {
        const ctx = createContext();
        const renderer = createWheelRenderer({
            canvas: { width: 520 },
            ctx,
            colors: ['#111111'],
            emptyText: 'Add items'
        });

        renderer.draw([]);

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 520, 520);
        expect(ctx.fillText).toHaveBeenCalledWith('Add items', 260, 260);
    });

    it('truncates long labels when drawing wheel segments', () => {
        const ctx = createContext();
        const renderer = createWheelRenderer({
            canvas: { width: 520 },
            ctx,
            colors: ['#111111', '#222222'],
            emptyText: 'Add items'
        });

        renderer.draw(['Very long pizza topping name', 'Burger'], 0);

        expect(ctx.fillText).toHaveBeenCalledWith('Very long pizza to...', 230, 0);
        expect(ctx.fillText).toHaveBeenCalledWith('Burger', 230, 0);
    });

    it('calculates the pointer index and winner from rotation', () => {
        const renderer = createWheelRenderer({
            canvas: { width: 520 },
            ctx: createContext(),
            colors: ['#111111'],
            emptyText: 'Add items'
        });

        expect(renderer.getPointerIndex(['A', 'B', 'C', 'D'], 0)).toBe(3);
        expect(renderer.getPointerIndex(['A', 'B', 'C', 'D'], Math.PI / 2)).toBe(2);
        expect(renderer.getWinner(['A', 'B', 'C', 'D'], Math.PI / 2)).toBe('C');
    });
});
