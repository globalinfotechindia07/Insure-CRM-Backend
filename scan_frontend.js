const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Extract paths from backend routes/index.js
const routesContent = fs.readFileSync('c:/GII Projects/clean/Insure-CRM-Backend/src/routes/index.js', 'utf8');
const pathRegex = /path:\s*['"]\/([^'"]+)['"]/g;
let match;
const apiPaths = new Set();
while ((match = pathRegex.exec(routesContent)) !== null) {
    apiPaths.add(match[1]); // match[1] is the base path without leading slash
}

const unusedPaths = [];
const usedPaths = [];

// 2. For each path, grep the frontend src
console.log(`Checking ${apiPaths.size} routes in the frontend...`);
for (const apiPath of apiPaths) {
    try {
        // Findstring - ignore case, recurse
        execSync(`powershell -Command "Select-String -Path 'c:/GII Projects/clean/Insure-CRM-Frontend/src/*' -Pattern '${apiPath}' -Recurse -List -ErrorAction Stop"`, { stdio: 'ignore' });
        usedPaths.push(apiPath);
    } catch (e) {
        // grep returns non-zero if no match found
        unusedPaths.push(apiPath);
    }
}

console.log('\n--- UNUSED ROUTES (Not called in frontend) ---');
unusedPaths.forEach(p => console.log(p));

console.log('\n--- USED ROUTES ---');
usedPaths.forEach(p => console.log(p));
