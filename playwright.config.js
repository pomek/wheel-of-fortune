const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    retries: 0,
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
});
