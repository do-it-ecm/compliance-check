/**
 * Part of the compliance check script,
 * this module contains functions to validate that media files are not too large
 * and are not placed in the wrong directory.
 */

import * as fs from 'fs';
import * as path from 'path';

// Maximum size of a media file in bytes (50MB)
export const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
// Ignore directories when validating media placement
const IGNORE_DIRECTORIES = ['node_modules', '.git', '.github', 'dist', 'scripts', 'LICENSE', 'assets'];

/**
 * Recursively validates that all media files in a given directory are not too large.
 * @param srcPath The path to the directory to validate.
 * @returns A list of invalid media file paths.
 */
export function validateMediaDirectory(srcPath) {
    const invalidPaths = [];
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(srcPath, entry.name);

        if (entry.isDirectory()) {
            // Recursively validate subdirectories
            invalidPaths.push(...validateMediaDirectory(fullPath));
        } else {
            const stats = fs.statSync(fullPath);
            if (stats.size >= MAX_MEDIA_SIZE) {
                invalidPaths.push(fullPath);
            }
        }
    }

    return invalidPaths;
}

/**
 * Validates that media files are not placed in the wrong directory.
 * Explores recursively in the src directory, excluding the media directory.
 * Any file which does not end with .md is considered a media file.
 * @param srcPath The path to the directory to validate.
 * @returns A list of invalid media file paths.
 */
export function validateMediaPlacement(srcPath) {
    const invalidPaths = [];
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(srcPath, entry.name);

        if (IGNORE_DIRECTORIES.includes(entry.name)) {
            continue;
        } else if (entry.isDirectory()) {
            // Recursively validate subdirectories
            invalidPaths.push(...validateMediaPlacement(fullPath));
        } else {
            if (!(entry.name.endsWith('.md') || entry.name.endsWith('.njk') || entry.name.endsWith('.html'))) {
                invalidPaths.push(fullPath);
            }
        }
    }

    return invalidPaths;
}
