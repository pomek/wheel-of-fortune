import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import path from 'node:path';

const playwrightOutputDir = path.join( tmpdir(), 'wheel-of-fortune-playwright' );

export default defineConfig( {
	testDir: './tests',
	fullyParallel: true,
	retries: 0,
	outputDir: playwrightOutputDir,
	use: {
		baseURL: 'http://localhost:4173',
		headless: true
	},
	webServer: {
		command: 'pnpm dev:test',
		url: 'http://localhost:4173',
		reuseExistingServer: true,
		timeout: 120000
	}
} );
