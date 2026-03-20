import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

function runCommand( command, args, { cwd } = {} ) {
	execFileSync( command, args, {
		cwd,
		stdio: 'inherit'
	} );
}

function readCommandOutput( command, args, { cwd } = {} ) {
	return execFileSync( command, args, {
		cwd,
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'pipe' ]
	} ).trim();
}

function normalizeBasePath( value ) {
	if ( !value ) {
		return './';
	}

	const trimmed = value.trim();

	if ( trimmed === '.' || trimmed === './' ) {
		return './';
	}

	if ( trimmed.startsWith( './' ) ) {
		return trimmed.endsWith( '/' ) ? trimmed : `${ trimmed }/`;
	}

	return trimmed.endsWith( '/' ) ? trimmed : `${ trimmed }/`;
}

async function deploy() {
	const projectRoot = process.cwd();
	const originUrl = readCommandOutput( 'git', [ 'config', '--get', 'remote.origin.url' ], {
		cwd: projectRoot
	} );
	const basePath = normalizeBasePath( process.env.GH_PAGES_BASE || './' );
	const commitMessage = process.env.GH_PAGES_COMMIT_MESSAGE || `Build: ${ new Date().toISOString() }.`;
	const distPath = path.join( projectRoot, 'dist' );
	const temporaryRoot = await mkdtemp( path.join( tmpdir(), 'gh-pages-deploy-' ) );
	const publishPath = path.join( temporaryRoot, 'publish' );

	console.log( `Building with base path: ${ basePath }` );
	runCommand( 'pnpm', [ 'build', '--base', basePath ], {
		cwd: projectRoot
	} );

	await stat( distPath );
	await writeFile( path.join( distPath, '.nojekyll' ), '' );

	await cp( distPath, publishPath, {
		recursive: true
	} );

	try {
		runCommand( 'git', [ 'init' ], { cwd: publishPath } );
		runCommand( 'git', [ 'checkout', '-b', 'gh-pages' ], { cwd: publishPath } );
		runCommand( 'git', [ 'add', '--all' ], { cwd: publishPath } );
		runCommand( 'git', [ 'commit', '-m', commitMessage ], { cwd: publishPath } );
		runCommand( 'git', [ 'remote', 'add', 'origin', originUrl ], { cwd: publishPath } );
		runCommand( 'git', [ 'push', 'origin', 'HEAD:gh-pages', '--force' ], { cwd: publishPath } );
	} finally {
		await rm( temporaryRoot, {
			recursive: true,
			force: true
		} );
	}

	console.log( 'Successfully deployed to gh-pages.' );
}

deploy().catch( error => {
	console.error( error.message );
	process.exit( 1 );
} );
