const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const pdf = require('html-pdf');
const ffmpeg = require('fluent-ffmpeg');
const AdmZip = require('adm-zip');
const unrar = require('unrar');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getFileFormat(filePath) {
    const extname = path.extname(filePath).toLowerCase();
    return extname.slice(1);
}

function promptForConversionChoice() {
    return new Promise((resolve) => {
        rl.question('Choose the format you want to convert to:\n1. jpg\n2. png\n3. txt\n4. html\n5. pdf\n6. mp3\n7. folder\nYour choice: ', (choice) => {
            resolve(choice);
        });
    });
}

function convertFile(originalFormat, targetFormat, filePath) {
    const extname = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, extname);
    const outputPath = path.join(path.dirname(filePath), `${fileName}_converted.${targetFormat}`);

    if (originalFormat === 'png' && targetFormat === 'jpg') {
        convertImage(filePath, outputPath, 'jpeg');
    } else if (originalFormat === 'pdf' && targetFormat === 'txt') {
        extractTextFromPDF(filePath);
    } else if (originalFormat === 'docx' && targetFormat === 'html') {
        convertDocxToHTML(filePath, outputPath);
    } else if (originalFormat === 'html' && targetFormat === 'pdf') {
        convertHtmlToPDF(filePath, outputPath);
    } else if (originalFormat === 'mp4' && targetFormat === 'mp3') {
        convertVideo(filePath, outputPath, 'mp3');
    } else if (originalFormat === 'zip' && targetFormat === 'folder') {
        extractZip(filePath, outputPath);
    } else if (originalFormat === 'rar' && targetFormat === 'folder') {
        extractRar(filePath, outputPath);
    } else {
        console.log("Unsupported format or conversion not available.");
    }
}

function convertImage(inputPath, outputPath, format) {
    sharp(inputPath)
        .toFormat(format)
        .toFile(outputPath, (err, info) => {
            if (err) {
                console.log("Error during image conversion:", err);
            } else {
                console.log(`Image converted successfully: ${info}`);
            }
        });
}

function extractTextFromPDF(inputPath) {
    fs.readFile(inputPath, (err, data) => {
        if (err) {
            console.log("Error reading PDF:", err);
            return;
        }

        pdfParse(data).then((pdfData) => {
            console.log("Text extracted from PDF:", pdfData.text);
        });
    });
}

function convertDocxToHTML(inputPath, outputPath) {
    fs.readFile(inputPath, (err, data) => {
        if (err) {
            console.log("Error reading DOCX:", err);
            return;
        }

        mammoth.convertToHtml({ buffer: data })
            .then((result) => {
                fs.writeFile(outputPath, result.value, (err) => {
                    if (err) {
                        console.log("Error writing HTML:", err);
                    } else {
                        console.log("DOCX converted to HTML successfully.");
                    }
                });
            });
    });
}

function convertHtmlToPDF(inputPath, outputPath) {
    const html = fs.readFileSync(inputPath, 'utf8');
    pdf.create(html).toFile(outputPath, (err, res) => {
        if (err) {
            console.log("Error converting HTML to PDF:", err);
        } else {
            console.log("HTML converted to PDF successfully.");
        }
    });
}

function convertVideo(inputPath, outputPath, format) {
    ffmpeg(inputPath)
        .audioCodec('libmp3lame')
        .toFormat(format)
        .on('end', () => {
            console.log(`Video converted to ${format} successfully.`);
        })
        .on('error', (err) => {
            console.log("Error converting video:", err);
        })
        .save(outputPath);
}

function extractZip(inputPath, outputPath) {
    const zip = new AdmZip(inputPath);
    zip.extractAllTo(outputPath, true);
    console.log("ZIP file extracted successfully.");
}

function extractRar(inputPath, outputPath) {
    const rar = new unrar(inputPath);
    rar.extract(outputPath, (err) => {
        if (err) {
            console.log("Error extracting RAR:", err);
        } else {
            console.log("RAR file extracted successfully.");
        }
    });
}

async function main() {
    const filePath = './file';

    if (!fs.existsSync(filePath)) {
        console.log("File does not exist at the given path.");
        rl.close();
        return;
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
       
        const files = fs.readdirSync(filePath);
        if (files.length > 1) {
            console.log("Multiple files found in the folder. Converting all files...");
            for (let file of files) {
                const fullPath = path.join(filePath, file);
                const originalFormat = getFileFormat(fullPath);
                console.log(`Detected file format: ${originalFormat} for file: ${file}`);
                const userChoice = await promptForConversionChoice();
                let targetFormat = '';
                switch (userChoice) {
                    case '1':
                        targetFormat = 'jpg';
                        break;
                    case '2':
                        targetFormat = 'png';
                        break;
                    case '3':
                        targetFormat = 'txt';
                        break;
                    case '4':
                        targetFormat = 'html';
                        break;
                    case '5':
                        targetFormat = 'pdf';
                        break;
                    case '6':
                        targetFormat = 'mp3';
                        break;
                    case '7':
                        targetFormat = 'folder';
                        break;
                    default:
                        console.log("Invalid choice.");
                        rl.close();
                        return;
                }
                console.log(`The file ${file} will be converted to: ${targetFormat}`);
                convertFile(originalFormat, targetFormat, fullPath);
            }
        } else {
            const singleFile = path.join(filePath, files[0]);
            console.log(`Only one file found. Converting the file: ${files[0]}`);
            const originalFormat = getFileFormat(singleFile);
            const userChoice = await promptForConversionChoice();
            let targetFormat = '';
            switch (userChoice) {
                case '1':
                    targetFormat = 'jpg';
                    break;
                case '2':
                    targetFormat = 'png';
                    break;
                case '3':
                    targetFormat = 'txt';
                    break;
                case '4':
                    targetFormat = 'html';
                    break;
                case '5':
                    targetFormat = 'pdf';
                    break;
                case '6':
                    targetFormat = 'mp3';
                    break;
                case '7':
                    targetFormat = 'folder';
                    break;
                default:
                    console.log("Invalid choice.");
                    rl.close();
                    return;
            }
            console.log(`The file ${files[0]} will be converted to: ${targetFormat}`);
            convertFile(originalFormat, targetFormat, singleFile);
        }
    } else {
        const originalFormat = getFileFormat(filePath); 
        console.log(`Detected file format: ${originalFormat}`);

        const userChoice = await promptForConversionChoice();
        let targetFormat = '';

        switch (userChoice) {
            case '1':
                targetFormat = 'jpg';
                break;
            case '2':
                targetFormat = 'png';
                break;
            case '3':
                targetFormat = 'txt';
                break;
            case '4':
                targetFormat = 'html';
                break;
            case '5':
                targetFormat = 'pdf';
                break;
            case '6':
                targetFormat = 'mp3';
                break;
            case '7':
                targetFormat = 'folder';
                break;
            default:
                console.log("Invalid choice.");
                rl.close();
                return;
        }

        console.log(`The file will be converted to: ${targetFormat}`);
        convertFile(originalFormat, targetFormat, filePath);
    }

    rl.close();
}

main();
