const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');

async function unscrambleImage(scrambledImageUrl, keyUrl, outputPath) {
    try {
        // Download the scrambled image
        const { data: scrambledImage } = await axios.get(scrambledImageUrl, {
            responseType: 'arraybuffer'
        });

        // Download the key JSON
        const { data: key } = await axios.get(keyUrl);

        const unscrambledImage = await unscramble(scrambledImage,key);

        // Save the unscrambled image to the filesystem
        // fs.writeFileSync(outputPath,unscrambledImage);
        
        // Iterate through each sub-section in the key and rearrange the image
        // for (const sub of Sub) {
        //     const sourceX = sub.X1 * cellSize + sub.X1 * borderWidth;
        //     const sourceY = sub.Y1 * cellSize + sub.Y1 * borderWidth;
        //     const targetX = sub.X2 * cellSize;
        //     const targetY = sub.Y2 * cellSize;

        //     // Extract and composite the sub-section
        //     target = target.composite([{
        //         input: Buffer.from(scrambledImage, 'binary'),
        //         left: targetX,
        //         top: targetY,
        //         blend: 'over',
        //         gravity: 'northwest',
        //         cutout: {
        //             x: sourceX,
        //             y: sourceY,
        //             width: cellSize + borderWidth,
        //             height: cellSize + borderWidth
        //         }
        //     }]);
        // }

        // Write the unscrambled image to the file system
        await unscrambledImage.toFile(outputPath);
        console.log('Unscrambled image saved at:', outputPath);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function unscramble(scrambledImage,key) {
    // Get image buffer
    // let sharpScrambledImage = await sharp(scrambledImage);
    
    // Parse key JSON
    const { X, Y, PageHeight, PageWidth, Sub } = key;

    // Set parameters
    const cellSize = 50;
    const borderWidth = 16;
    const xBuffer = 175;
    const yBuffer = 178;

    // Resize image to fit correct size
    let sharpScrambledImage = await sharp(scrambledImage).resize(PageWidth,PageHeight);
    // scrambledImage = Buffer.from(scrambledImage, 'binary');

    console.log(PageWidth,PageHeight);

    // Buffer.from(scrambledImage, 'binary')
    const metadataInput = await sharpScrambledImage.metadata();
    console.log(`Input size: ${metadataInput.width} x ${metadataInput.height}`)

    // Create a new Sharp image
    let target = await sharp({
        create: {
            // width: (PageWidth > 0 ? PageWidth : X * cellSize) + xBuffer,
            // height: (PageHeight > 0 ? PageHeight : Y * cellSize) + yBuffer,
            width: metadataInput.width,
            height: metadataInput.height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background
        }
    });
    const metadataTarget = await target.metadata();
    console.log(`Target size: ${metadataTarget.width} x ${metadataTarget.height}`)
    console.log(`Difference: ${metadataInput.width-metadataTarget.width} x ${metadataInput.height - metadataTarget.height}`)

    for (const sub of Sub) {
        const sourceX = sub.X1 * cellSize + sub.X1 * borderWidth;
        const sourceY = sub.Y1 * cellSize + sub.Y1 * borderWidth;
        const targetX = sub.X2 * cellSize;
        const targetY = sub.Y2 * cellSize;

        // Extract and composite the sub-section
        target = target.composite([{
            // input: sharpScrambledImage.jpeg(),
            input: Buffer.from(scrambledImage, 'binary'),
            left: targetX,
            top: targetY,
            blend: 'over',
            cutout: {
                x: sourceX,
                y: sourceY,
                width: cellSize + borderWidth,
                height: cellSize + borderWidth
            }
        }]);
    }
    return target;
}

// Usage
const scrambledImageUrl = 'https://ebooksapi.rekhta.org/images/d61f877d-5d74-4395-9485-045ec1a8c8a9/001.jpg';
const keyUrl = 'https://ebooksapi.rekhta.org/api_getebookpagebyid_websiteapp/?wref=from-site&&pgid=070c3acd-803b-4ce7-b43d-abafc021ddab';
// const scrambledImageUrl = 'https://ebooksapi.rekhta.org/images/d8e76c98-9254-4fa8-af36-b378987c4e24/001.jpg';
// const keyUrl = 'https://ebooksapi.rekhta.org/api_getebookpagebyid_websiteapp/?wref=from-site&&pgid=94e0c179-28f6-4a1f-877d-cbcc89ecb327';
const outputPath = '1.jpg';

unscrambleImage(scrambledImageUrl, keyUrl, outputPath);
