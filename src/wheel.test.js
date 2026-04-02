import { describe, expect, it, vi } from 'vitest';

import { createWheelRenderer } from './wheel.js';

function createContext() {
	return {
		clearRect: vi.fn(),
		beginPath: vi.fn(),
		arc: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		moveTo: vi.fn(),
		closePath: vi.fn(),
		save: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		fillText: vi.fn(),
		restore: vi.fn(),
		fillStyle: '',
		strokeStyle: '',
		lineWidth: 0,
		shadowColor: '',
		shadowBlur: 0,
		font: '',
		textAlign: '',
		textBaseline: ''
	};
}

describe( 'wheel', () => {
	it( 'draws empty wheel text when there are no items', () => {
		const ctx = createContext();
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx,
			colors: [ '#111111' ],
			emptyText: 'Add items'
		} );

		renderer.draw( [] );

		expect( ctx.clearRect ).toHaveBeenCalledWith( 0, 0, 520, 520 );
		expect( ctx.fillText ).toHaveBeenCalledWith( 'Add items', 260, 260 );
	} );

	it( 'truncates long labels when drawing wheel segments', () => {
		const ctx = createContext();
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx,
			colors: [ '#111111', '#222222' ],
			emptyText: 'Add items'
		} );

		renderer.draw( [ 'Very long pizza topping name', 'Burger' ], 0 );

		expect( ctx.fillText ).toHaveBeenCalledWith( 'Very long pizza to...', 230, 0 );
		expect( ctx.fillText ).toHaveBeenCalledWith( 'Burger', 230, 0 );
	} );

	it( 'draws a highlighted fill for the active segment', () => {
		const ctx = createContext();
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx,
			colors: [ '#111111', '#222222', '#333333' ],
			emptyText: 'Add items'
		} );

		renderer.draw( [ 'A', 'B', 'C' ], 0, { activeIndex: 1 } );

		expect( ctx.fill ).toHaveBeenCalledTimes( 6 );
	} );

	it( 'can suppress active highlight rendering', () => {
		const ctx = createContext();
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx,
			colors: [ '#111111', '#222222', '#333333' ],
			emptyText: 'Add items'
		} );

		renderer.draw( [ 'A', 'B', 'C' ], 0, {
			activeIndex: 1,
			showActiveHighlight: false
		} );

		expect( ctx.fill ).toHaveBeenCalledTimes( 5 );
	} );

	it( 'calculates the pointer index and winner from rotation', () => {
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx: createContext(),
			colors: [ '#111111' ],
			emptyText: 'Add items'
		} );

		expect( renderer.getPointerIndex( [ 'A', 'B', 'C', 'D' ], 0 ) ).toBe( 0 );
		expect( renderer.getPointerIndex( [ 'A', 'B', 'C', 'D' ], Math.PI / 2 ) ).toBe( 3 );
		expect( renderer.getWinner( [ 'A', 'B', 'C', 'D' ], Math.PI / 2 ) ).toBe( 'D' );
	} );

	it( 'calculates a rotation that lands on the requested item', () => {
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx: createContext(),
			colors: [ '#111111' ],
			emptyText: 'Add items'
		} );
		const items = [ 'A', 'B', 'C', 'D' ];
		const rotation = renderer.getRotationForIndex( items, 1 );

		expect( renderer.getWinner( items, rotation ) ).toBe( 'B' );
	} );

	it( 'maps click coordinates to the matching segment', () => {
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx: createContext(),
			colors: [ '#111111' ],
			emptyText: 'Add items'
		} );
		const items = [ 'A', 'B', 'C', 'D' ];

		expect( renderer.getIndexAtPoint( items, 0, 390, 390 ) ).toBe( 0 );
		expect( renderer.getIndexAtPoint( items, 0, 130, 390 ) ).toBe( 1 );
		expect( renderer.getIndexAtPoint( items, 0, 130, 130 ) ).toBe( 2 );
		expect( renderer.getIndexAtPoint( items, 0, 390, 130 ) ).toBe( 3 );
	} );

	it( 'ignores clicks outside the wheel ring', () => {
		const renderer = createWheelRenderer( {
			canvas: { width: 520 },
			ctx: createContext(),
			colors: [ '#111111' ],
			emptyText: 'Add items'
		} );
		const items = [ 'A', 'B', 'C', 'D' ];

		expect( renderer.getIndexAtPoint( items, 0, 260, 260 ) ).toBeNull();
		expect( renderer.getIndexAtPoint( items, 0, 520, 260 ) ).toBeNull();
	} );
} );
