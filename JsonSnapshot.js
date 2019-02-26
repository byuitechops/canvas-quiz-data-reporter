const canvas = require('canvas-api-wrapper');
const fs = require('fs');
const path = require('path');

async function getInputViaApi() {
    canvas.subdomain = 'byui.beta'
    return await canvas.get('https://byui.beta.instructure.com/api/v1/accounts/1/courses?enrollment_term_id=23&per_page=100')
}

async function main() {
    const write = JSON.stringify(await getInputViaApi(), null, 4)
    fs.writeFileSync(path.resolve('./', 'snapshot.json'), write);
}

main();