export function parseItems( value ) {
	return value
		.split( '\n' )
		.map( item => item.trim() )
		.filter( Boolean );
}

export function formatItems( items ) {
	return items.join( '\n' );
}
