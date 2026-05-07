import { COLORS } from './constants.js';

export function paletteForCount( count, palette = COLORS ) {
	if ( count <= 0 ) {
		return [];
	}

	const colorCount = palette.length;
	const result = new Array( count );

	for ( let i = 0; i < count; i += 1 ) {
		result[ i ] = palette[ i % colorCount ];
	}

	if ( count > 1 && result[ count - 1 ] === result[ 0 ] ) {
		const previousColor = result[ count - 2 ];

		for ( let j = 1; j < colorCount; j += 1 ) {
			const candidate = palette[ j ];

			if ( candidate !== result[ 0 ] && candidate !== previousColor ) {
				result[ count - 1 ] = candidate;
				break;
			}
		}
	}

	return result;
}
