const FULL_CIRCLE = Math.PI * 2;
const HUB_RADIUS = 36;
const WHEEL_PADDING = 10;

function normalizeAngle( angle ) {
	return ( ( angle % FULL_CIRCLE ) + FULL_CIRCLE ) % FULL_CIRCLE;
}

export function createWheelRenderer( { canvas, ctx, colors, emptyText } ) {
	function draw( list, currentRotation = 0, {
		activeIndex = null,
		showActiveHighlight = true,
		excludedIndexes = []
	} = {} ) {
		const size = canvas.width;
		const center = size / 2;
		const radius = center - WHEEL_PADDING;
		const excludedSet = new Set( excludedIndexes );

		ctx.clearRect( 0, 0, size, size );

		if ( !list.length ) {
			ctx.fillStyle = '#1f2937';
			ctx.beginPath();
			ctx.arc( center, center, radius, 0, Math.PI * 2 );
			ctx.fill();

			ctx.fillStyle = '#e5e7eb';
			ctx.font = '24px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText( emptyText, center, center );
			return;
		}

		const arc = ( Math.PI * 2 ) / list.length;

		for ( let i = 0; i < list.length; i += 1 ) {
			const start = currentRotation + i * arc;
			const end = start + arc;
			const isExcluded = excludedSet.has( i );

			ctx.beginPath();
			ctx.moveTo( center, center );
			ctx.arc( center, center, radius, start, end );
			ctx.closePath();
			ctx.fillStyle = colors[ i % colors.length ];
			ctx.fill();

			if ( isExcluded ) {
				ctx.save();
				ctx.beginPath();
				ctx.moveTo( center, center );
				ctx.arc( center, center, radius, start, end );
				ctx.closePath();
				ctx.fillStyle = 'rgba(15, 23, 42, 0.58)';
				ctx.fill();
				ctx.restore();
			}

			if ( showActiveHighlight && i === activeIndex ) {
				ctx.save();
				ctx.beginPath();
				ctx.moveTo( center, center );
				ctx.arc( center, center, radius, start, end );
				ctx.closePath();
				ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
				ctx.fill();
				ctx.restore();
			}

			ctx.save();
			ctx.translate( center, center );
			ctx.rotate( start + arc / 2 );
			ctx.textAlign = 'right';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = isExcluded ? 'rgba(241, 245, 249, 0.72)' : '#ffffff';
			ctx.font = isExcluded ? '600 18px Arial' : 'bold 20px Arial';

			const label = list[ i ].length > 18 ? `${ list[ i ].slice( 0, 18 ) }...` : list[ i ];
			ctx.fillText( label, radius - 20, 0 );

			if ( isExcluded ) {
				ctx.font = 'bold 12px Arial';
				ctx.fillText( 'OUT', radius - 28, 22 );
			}

			ctx.restore();
		}

		ctx.beginPath();
		ctx.arc( center, center, HUB_RADIUS, 0, Math.PI * 2 );
		ctx.fillStyle = '#ffffff';
		ctx.fill();

		ctx.beginPath();
		ctx.arc( center, center, 10, 0, Math.PI * 2 );
		ctx.fillStyle = '#111827';
		ctx.fill();
	}

	function getPointerIndex( list, currentRotation ) {
		const arc = ( Math.PI * 2 ) / list.length;
		const normalized = ( ( -currentRotation ) % ( Math.PI * 2 ) + Math.PI * 2 ) % ( Math.PI * 2 );
		return Math.floor( normalized / arc ) % list.length;
	}

	function getWinner( list, finalRotation ) {
		return list[ getPointerIndex( list, finalRotation ) ];
	}

	function getRotationForIndex( list, index, segmentOffset = 0.5 ) {
		const arc = ( Math.PI * 2 ) / list.length;
		const normalized = index * arc + arc * segmentOffset;

		return ( ( -normalized ) % ( Math.PI * 2 ) + Math.PI * 2 ) % ( Math.PI * 2 );
	}

	function getIndexAtPoint( list, currentRotation, x, y ) {
		if ( !list.length ) {
			return null;
		}

		const size = canvas.width;
		const center = size / 2;
		const radius = center - WHEEL_PADDING;
		const distanceFromCenter = Math.hypot( x - center, y - center );

		if ( distanceFromCenter < HUB_RADIUS || distanceFromCenter > radius ) {
			return null;
		}

		const angle = normalizeAngle( Math.atan2( y - center, x - center ) );
		const arc = FULL_CIRCLE / list.length;
		const normalized = normalizeAngle( angle - currentRotation );

		return Math.floor( normalized / arc ) % list.length;
	}

	return {
		draw,
		getPointerIndex,
		getWinner,
		getRotationForIndex,
		getIndexAtPoint
	};
}
