/**
 * Compliance check script
 * Runs all compliance checks and logs the results
 */
import path from 'path';
import fs from 'fs';
import { validateDirectory } from './filenames.mjs';
import { validateMediaDirectory, MAX_MEDIA_SIZE } from './medias.mjs';
import { validateStudentsFileStructure, STUDENT_FILESTRUCTURE_MESSAGE } from './filestructure.mjs';

const SOURCE_DIR = 'src';
const PROMOS_DIR = path.join(SOURCE_DIR, 'promos');

export function runComplianceChecks(rawSourceDir = SOURCE_DIR) {
    const sourceDir = path.resolve(rawSourceDir);
    console.log(`Running compliance checks on ${sourceDir}`);
    const invalidPaths = validateDirectory(sourceDir);
    const filesTooLarge = validateMediaDirectory(sourceDir);

    let promosPaths = [];
    if (sourceDir === path.resolve(SOURCE_DIR)) {
        // If the source directory is the default one, list all promotion directories
        promosPaths = fs.readdirSync(PROMOS_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => path.resolve(path.join(PROMOS_DIR, dirent.name)));
    } else {
        // Otherwise, assume the source directory is a promotion directory
        promosPaths = [sourceDir];
    }
    const invalidFileStructure = validateStudentsFileStructure(promosPaths);

    if (invalidPaths.length) {
        console.error('The following files or directories have invalid names (must be alphanumeric characters, upper or lower, dashes, underscores or dots):');
        invalidPaths.forEach(path => console.error(`    - ${path}`));
    }
    if (filesTooLarge.length) {
        console.error(`The following media files are too large (maximum size is ${Math.floor(MAX_MEDIA_SIZE / 1024 / 1024)}MB):`);
        filesTooLarge.forEach(path => console.error(`    - ${path}`));
    }
    if (invalidFileStructure.length) {
        console.error('The following student directories have an invalid file structure:');
        invalidFileStructure.forEach(path => console.error(`    - ${path}`));
        console.error('The file structure should be as follows:');
        console.error(STUDENT_FILESTRUCTURE_MESSAGE);
    }

    if (invalidPaths.length || filesTooLarge.length || invalidFileStructure.length) {
        console.error('Compliance checks failed !');
        process.exit(1);
    } else {
        console.log('Compliance checks passed !');
    }
}

// Check if the script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const sourceDir = process.argv[2] || process.env.INPUT_SOURCE || SOURCE_DIR;
    runComplianceChecks(sourceDir);
}
