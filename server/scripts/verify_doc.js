const path = require('path');
const fs = require('fs');
const textService = require('../services/textService');

const filePath = String.raw`c:\Users\busto\OneDrive\Documents\AI_UNESCO_PROJECT\client\src\assets\TEAM TALA FINAL NA FINAL NA.docx`;

async function run() {
    try {
        console.log("Reading file:", filePath);
        const buffer = fs.readFileSync(filePath);
        // textService expects (buffer, mimeType)
        const text = await textService.extractText(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        console.log("--- DOCUMENT START ---");
        console.log(text.substring(5000, 12000)); // Print middle section
        console.log("--- DOCUMENT END ---");
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
