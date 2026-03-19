import globals from 'globals';
import { defineConfig } from 'eslint/config';
import ckeditor5Rules from 'eslint-plugin-ckeditor5-rules';
import ckeditor5Config from 'eslint-config-ckeditor5';

export default defineConfig( [
	{
		ignores: [
			'coverage/**',
			'dist/**',
			'node_modules/**',
			'playwright-report/**',
			'test-results/**'
		]
	},
	{
		extends: ckeditor5Config,

		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node
			}
		},

		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
			reportUnusedInlineConfigs: 'warn'
		},

		plugins: {
			'ckeditor5-rules': ckeditor5Rules
		},

		rules: {
			'no-console': 'off',
			'mocha/no-global-tests': 'off',
			'ckeditor5-rules/license-header': 'off',
			'ckeditor5-rules/require-file-extensions-in-imports': [
				'error',
				{
					extensions: [ '.js', '.json', '.css' ]
				}
			]
		}
	},
	{
		files: [ 'src/**/*.js' ],

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: [ 'src/**/*.test.js' ],

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: [ 'tests/**/*.js' ],

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: [ 'playwright.config.js', 'vitest.config.js' ],

		languageOptions: {
			globals: {
				...globals.node
			}
		}
	}
] );
