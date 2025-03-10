/**
 * Part of the compliance check script,
 * Checks that the file structure is correct.
 */

import * as fs from 'fs';
import * as path from 'path';

// Message displayed when required file structure is incorrect
export const STUDENT_FILESTRUCTURE_MESSAGE = `
Zola-Gordon/
├── index.md
├── mon/
│   ├── index.md
│   ├── temps-X.Y/
│   │   ├── index.md (MANDATORY if markdown files are present)
│   │   ├── other_file.md (OPTIONAL)
│   │   ├── subdirectory/ (OPTIONAL)
│   │   │   ├── ...
│   ├── ...
│   ├── bonus/
│   │   ├── index.md (MANDATORY if markdown files are present)
│   │   ├── other_file.md (OPTIONAL)
│   │   ├── subdirectory/ (OPTIONAL)
│   │   │   ├── ...
├── pok/
│   ├── index.md
│   ├── temps-X/
│   │   ├── index.md (MANDATORY if markdown files are present)
│   │   ├── other_file.md (OPTIONAL)
│   │   ├── subdirectory/ (OPTIONAL)
│   │   │   ├── ...
│   ├── ...
│   ├── bonus/
│   │   ├── index.md (MANDATORY if markdown files are present)
│   │   ├── other_file.md (OPTIONAL)
│   │   ├── subdirectory/ (OPTIONAL)
│   │   │   ├── ...
`;

// Promos directory name
export const PROMO_DIR = 'promos';
// Regex to validate the subdirectories of the mon directory (temps-X.Y and bonus)
const VALID_MON_SUBDIRS = /^(temps-\d+\.\d+|bonus)$/;
// Regex to validate the subdirectories of the pok directory (temps-X and bonus)
const VALID_POK_SUBDIRS = /^(temps-\d+|bonus)$/;
// Regex for non-student subdirectories (to avoid exploring them)
const NON_STUDENT_SUBDIRS = /^(_(.*)|\.(.*))$/;
// Regex for valid promotion format (XXXX-XXXX)
const VALID_PROMOTION = /^[0-9]{4}-[0-9]{4}$/;
// Regex for valid index file (html, njk or md)
const VALID_INDEX = /^(index\.(html|njk|md))$/;
// Regex for file patterns allow (html, njk or md)
const VALID_FILE = /^(.*\.(html|njk|md))$/;

/**
 * Recursively validates that all student directories in a given directory have the correct file structure.
 * @param srcPath The path to the directory to validate.
 * @returns A list of invalid file or directory paths.
 */
export function validateStudentsFileStructure(srcPath) {
    const promosDir = path.join(srcPath, PROMO_DIR);
    const invalidPaths = [];
    const entries = fs.readdirSync(promosDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(promosDir, entry.name);

        if (entry.isDirectory() && VALID_PROMOTION.test(entry.name)) {
            for (const student of fs.readdirSync(fullPath, { withFileTypes: true })) {
                const studentPath = path.join(fullPath, student.name);
                if (student.isDirectory() && !NON_STUDENT_SUBDIRS.test(student.name)) {
                    invalidPaths.push(...validateStudentFileStructure(studentPath));
                }
            }
        }
    }

    return invalidPaths;
}


/**
 * Ensure that a student's directory file structure matches the requirements
 *  Ensure the top-level has at least:
 * - index file (index.md, index.html, index.njk)
 * - mon/ directory
 * - pok/ directory
 * @param srcPath The path to the student's directory
 * @returns A list of invalid file or directory paths
 */
function validateStudentFileStructure(srcPath) {

    const invalidPaths = [];


    // You can adapt this to your needs.
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    let hasIndexMd = false;
    let hasMonDir = false;
    let hasPokDir = false;

    for (const entry of entries) {
        const fullPath = path.join(srcPath, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'mon') {
                hasMonDir = true;
                invalidPaths.push(...validateMonDirectory(fullPath));
            } else if (entry.name === 'pok') {
                hasPokDir = true;
                invalidPaths.push(...validatePokDirectory(fullPath));
            }
        } else {
            if (VALID_INDEX.test(entry.name)) {
                hasIndexMd = true;
            }
        }
    }

    // Check the top-level mandatory items
    if (!hasIndexMd) {
        invalidPaths.push(path.join(srcPath, 'index.md (MISSING)'));
    }
    if (!hasMonDir) {
        invalidPaths.push(path.join(srcPath, 'mon (DIRECTORY MISSING)'));
    }
    if (!hasPokDir) {
        invalidPaths.push(path.join(srcPath, 'pok (DIRECTORY MISSING)'));
    }

    return invalidPaths;
}

/**
 * Validate the mon/ directory and its subdirectories
 * @param srcPath The path to the mon/ directory
 * @returns A list of invalid file or directory paths
 */
function validateMonDirectory(srcPath) {
    // mon/ requires an index file, plus valid subdirectories: temps-X.Y or bonus
    // Valid subdirectories are "temps-X.Y" (e.g., temps-1.0) or "bonus".
    // They must have index files, and if there are any markdown files,
    const invalidPaths = [];
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    let hasIndex = false;

    for (const entry of entries) {
        const fullPath = path.join(srcPath, entry.name);

        if (entry.isDirectory()) {
            // If the subdirectory name matches temps-X.Y or bonus, 
            // we do further validation.
            if (VALID_MON_SUBDIRS.test(entry.name)) {
                invalidPaths.push(...validateSubdirectory(fullPath));
            }
        } else {
            if (VALID_INDEX.test(entry.name)) {
                hasIndex = true;
            }
        }
    }

    if (!hasIndex) {
        invalidPaths.push(path.join(srcPath, 'index.md (MISSING in mon/)'));
    }

    return invalidPaths;
}

/**
 * Validate the subdirectories of the mon or pok directory
 * If there are any .md files present in this subdirectory, 
 * an index file is required.
 * Also, subdirectories are optional, but allowed.
 * @param srcPath The path to the subdirectory
 * @returns A list of invalid file or directory paths
 */
function validateSubdirectory(srcPath) {

    const invalidPaths = [];
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    let hasIndex = false;
    let markdownCount = 0;

    for (const entry of entries) {
        const fullPath = path.join(srcPath, entry.name);

        if (entry.isFile()) {
            // If it's an html, njk or md file, we count it.
            if (VALID_FILE.test(entry.name)) {
                if (VALID_INDEX.test(entry.name)) {
                    hasIndex = true;
                }
                markdownCount++;
            }
        }
    }

    // If there's more than one markdown file (besides index.md),
    // we require an index file
    // At minimum, if there's any .md file (including index.md), 
    // we must ensure index.md is present.
    if (markdownCount > 0 && !hasIndex) {
        invalidPaths.push(path.join(srcPath, 'index.md (MISSING)'));
    }

    return invalidPaths;
}

function validatePokDirectory(srcPath) {
    // Similar structure checks for pok/ 
    // Must have index.md, plus valid subdirectories: temps-X or bonus
    const invalidPaths = [];
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    let hasIndexMd = false;

    for (const entry of entries) {
        const fullPath = path.join(srcPath, entry.name);

        if (entry.isDirectory()) {
            if (VALID_POK_SUBDIRS.test(entry.name)) {
                invalidPaths.push(...validateSubdirectory(fullPath));
            }
        } else {
            if (VALID_INDEX.test(entry.name)) {
                hasIndexMd = true;
            }
        }
    }

    if (!hasIndexMd) {
        invalidPaths.push(path.join(srcPath, 'index.md (MISSING in pok/)'));
    }

    return invalidPaths;
}
