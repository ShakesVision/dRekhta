const fetch = require('node-fetch-retry');
const $ = require('node-html-parser');
const fs = require('fs');
const back = require('androidjs').back;

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
        d = d.replace(/\\r\\n/g, '\n').split('\n\n');
        if (d[d.length - 1] === '\n') d.pop();
        back.send('read-return', d);
        console.log(d.length)
    })
})