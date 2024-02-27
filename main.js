const fetch = require('node-fetch-retry');
const $ = require('node-html-parser');
const fs = require('fs');
const back = require('androidjs').back;
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
path = require("path");


console.log('Backend server started...')

back.on('scrape', (data) => {
    var { dir, name, links, format } = data;
    back.send('download-start', 'Fetching ' + links.length + ' links has been started')
    if (dir == 'window-test')
        dir = process.cwd();

    // var text = fs.readFileSync(`./links/wali.txt`, "utf-8");
    var URLs = links;
    var passedUrls = [];
    var failedUrls = [];
    var count = URLs.length;
    !fs.existsSync(`${dir}/dRekhta/`) && fs.mkdirSync(`${dir}/dRekhta/`, { recursive: true })
    var writeStream = fs.createWriteStream(`${dir}/dRekhta/${name}.txt`, { flags: 'a' });
    var failedStream = fs.createWriteStream(`${dir}/dRekhta/failed.txt`, { flags: 'a' });

    for (let i = 0; i < URLs.length; i++) {
        (async () => {
            try {
                var url = URLs[i];
                let opts = {
                    method: 'GET',
                    retry: 3,
                    pause: 1000,
                    callback: retry => { console.log(`Trying: ${retry}`) }
                }

                const response = await fetch(url, opts);
                const text = await response.text();
                var document = $.parse(text);

                //BOOK DOWNLOAD ONLY                
                if (format === 3) {
                    const bkData = bookDownload(url, document);
                    back.send('book-download', {
                        "message": "success",
                        bkData
                    })
                    return;
                }
                //PROSE ONLY            
                if (format === 2) {
                    var author = document.querySelector('.authorAddFavorite').rawText;
                    var a = new URL(url);
                    var link = a.pathname.replace(/\/.+\//, '').replace(/-stories$/, '');
                    var description = link.split("-").map(e => e.charAt(0).toUpperCase() + e.substring(1)).join(" ") + " in Urdu Unicode text.\n" + author + ' کا افسانہ "' + heading + '" اردو یونیکوڈ متن میں۔';
                }
                //COMMON
                var heading = document.querySelector('h1').rawText;
                var content = '';
                document.querySelectorAll('.pMC p').forEach(p => content += p.rawText + '\n');
                //WRITE PROSE
                if (format === 2) {
                    var o = { title: heading + " — " + author, text: content, label: "افسانے,مصنف:" + author, description, link, url };
                    var result = JSON.stringify(o);
                    writeStream.write(result + ',\n');
                }
                //WRITE POETRY
                if (format === 1) {
                    writeStream.write(content + '\n\n');
                }
                passedUrls.push(i);
                back.send('download-start', (i + 1) + '. \t' + heading)
                console.log((i + 1), heading);
                console.log(count);
                count--;
                if (count == 0)
                    back.send('download-end', { i, total: passedUrls.length })
                if (count == URLs.length)
                    writeStream.write((document.querySelector('a.ghazalAuthor').rawText.trim()) + URLs.length)
                // passedUrls = passedUrls.sort((a,b)=>a-b);
            }
            catch (err) {
                console.log(err); // TypeError: failed to fetch
                // console.log('LAST URL');
                back.send('download-start', err + '\n Message:' + err.message)
                failedStream.write(url + '\n');
                failedUrls.push(url);
            }
        })()
    }
})

back.on('read', (d) => {
    var [dir, name] = d.split('|');
    if (dir == 'window-test')
        dir = process.cwd();
    dir = `${dir}/dRekhta/`;
    const readFile = async filePath => {
        try {
            const data = await fs.promises.readFile(filePath, 'utf8')
            return data
        }
        catch (err) {
            console.log(err)
        }
    }
    readFile(`${dir}/${name}.txt`).then(d => {
        //remove duplicate newlines and convert to array
        if (d) {
            d = d.replace(/\\r\\n/g, '\n').split('\n\n');
            if (d[d.length - 1] === '\n') d.pop();
            back.send('read-return', d);
            console.log(d.length)
        }
    })
})

function FindTextBetween(source, start, end) {
    return source.split(start)[1].split(end)[0].trim();
}
function StringToStringArray(input) {
    return input.split(",").map(item => item.replace(/"/g, "").trim());
}

function bookDownload(url, document) {
    console.log(url);
    var _bookUrl = url;
    var pageContents = document + ''; //or document.head.innerHTML as scripts are only in <head>.
    var bookName = document.querySelector('span.c-book-name').innerText.trim();
    console.log(bookName);
    var author = document.querySelector('span.faded').innerText.replace(/\r?\n/g, '').replace(/ +/g, ' ').replace('by ', '').trim();
    var fileName = `${bookName} by ${author}`.trim().replace(/ +/g, ' ').replace(/ /g, '-');
    //var BookName = actualUrl.toLowerCase().replace("'/ebooks/", "").replace(/-ebooks'/g, '').trim().replace(/\//g, '-');

    var _bookId = FindTextBetween(pageContents, `var bookId = "`, `";`);
    var actualUrl = FindTextBetween(pageContents, "var actualUrl =", ";");
    var bookSlug = FindTextBetween(pageContents, "var bookslug ='", "';");

    var _pageCount = parseInt(FindTextBetween(pageContents, "var totalPageCount =", ";").trim());
    var pages = StringToStringArray(FindTextBetween(pageContents, "var pages = [", "];"));
    var pageIds = StringToStringArray(FindTextBetween(pageContents, "var pageIds = [", "];"));
    console.table({ bookName, author, fileName, bookSlug, _bookId, _bookUrl });

    //Fetching parameters
    var scrambledImages = [];
    var keys = [];
    var scrambleMap = [];
    for (var i = 0; i < _pageCount; i++) {
        var imgUrl = `https://ebooksapi.rekhta.org/images/${_bookId}/${pages[i]}`;
        var key = `https://ebooksapi.rekhta.org/api_getebookpagebyid_websiteapp/?wref=from-site&&pgid=${pageIds[i]}`;
        scrambledImages.push(imgUrl);
        keys.push(key);
        scrambleMap.push({ imgUrl, key });
        const SUB_FOLDER = `dRekhta/${bookSlug}`;
        const IMG_NAME = pages[i];
        dlImage(scrambleMap[i].key, scrambleMap[i].imgUrl, SUB_FOLDER, IMG_NAME);
    }
    var data = { bookName, author, _pageCount, _bookUrl, bookSlug, fileName, _bookId, actualUrl, pages, pageIds, scrambleMap };
    return data;
}

async function unscrambleImage(key, input, SUB_FOLDER, IMG_NAME) {
    try {
        const pageId = key.PageId;
        let originalHeight = key.PageHeight;
        let originalWidth = key.PageWidth;

        // Default values if original height/width are not provided
        if (originalHeight <= 0) {
            originalHeight = 1100;
        }
        if (originalWidth <= 0) {
            originalWidth = 1000;
        }

        const tileSize = 50;
        const borderWidth = 16;
        const scaleFactor = 1; // Adjust if necessary

        // The logic for "tilesize * data.x, and y" for canvasWidth and height doesn't work, adds a whitish margin (used by rekhta idk why and how). So Just use original ones as per api key. 
        const canvasWidth = originalWidth;
        const canvasHeight = originalHeight;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        // const canvas = createCanvas(originalWidth, originalHeight);
        const ctx = canvas.getContext('2d');
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const img = await loadImage(input); // Path to your original image
        console.log(img.width + 'x' + img.height);
        for (const sub of key.Sub) {
            // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
            // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            ctx.drawImage(
                img,
                sub.X1 * (tileSize + 16),
                sub.Y1 * (tileSize + 16),
                tileSize,
                tileSize,
                (sub.X2 * tileSize),
                (sub.Y2 * tileSize),
                tileSize,
                tileSize
            );
        }

        !fs.existsSync(`${SUB_FOLDER}`) && fs.mkdirSync(`${SUB_FOLDER}`, { recursive: true })
        const dir = path.resolve(__dirname, SUB_FOLDER, IMG_NAME);

        const out = fs.createWriteStream(dir); // Path where you want to save the unscrambled image
        const stream = canvas.createJPEGStream();
        stream.pipe(out);
        out.on('finish', () => console.log('Image unscrambled successfully!'));
    } catch (error) {
        console.error('Error unscrambling image:', error);
    }
}

/**
 * this will dl.image
 * @param {*} scrambledImageUrl
 */
async function dlImage(keyUrl, scrambledImageUrl, SUB_FOLDER, IMG_NAME) {
    try {
        // Download the scrambled image
        const { data: scrambledImage } = await axios.get(scrambledImageUrl, {
            responseType: 'arraybuffer'
        });

        // Download the key JSON
        const { data: key } = await axios.get(keyUrl);
        unscrambleImage(key, scrambledImage, SUB_FOLDER, IMG_NAME);
    } catch (error) {
        console.error('Error:', error.message);
    }
    // axios({
    //     method: "GET",
    //     url: scrambledImageUrl,
    //     responseType: "stream"
    // }).then(res => {
    //     res.data.pipe(fs.createWriteStream(dir));
    //     res.data.on("end", () => {
    //         console.log("download complete");
    //     });
    // });
}