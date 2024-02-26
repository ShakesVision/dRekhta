// sample code to DL using axios.
const axios = require("axios"),
  fs = require("fs"),
  path = require("path");

const SUB_FOLDER = "dRekhta/temp";
const IMG_NAME = "img.jpg";

const reqUrl =
  "https://ebooksapi.rekhta.org/images/d8e76c98-9254-4fa8-af36-b378987c4e24/001.jpg";

dlImage(reqUrl);


/**
 * this will dl.image
 * @param {*} reqUrl
 */
function dlImage(reqUrl) {
  !fs.existsSync(`${SUB_FOLDER}`) && fs.mkdirSync(`${SUB_FOLDER}`, { recursive: true })
  const dir = path.resolve(__dirname, SUB_FOLDER, IMG_NAME);

  axios({
    method: "GET",
    url: reqUrl,
    responseType: "stream"
  }).then(res => {
    res.data.pipe(fs.createWriteStream(dir));
    res.data.on("end", () => {
      console.log("download complete");
    });
  });
}

function rearrangeImage(source, data) {
    const cellSize = 50;
    const borderWidth = 16;
    const target = document.createElement('canvas');
    target.width = data.pageWidth > 0 ? data.pageWidth : source.width;
    target.height = data.pageHeight > 0 ? data.pageHeight : source.height;
    const gt = target.getContext('2d');

    data.sub.forEach(sub => {
        const sourceX = (sub.x1 * cellSize) + (sub.x1 * borderWidth);
        const sourceY = (sub.y1 * cellSize) + (sub.y1 * borderWidth);
        const targetX = (sub.x2 * cellSize);
        const targetY = (sub.y2 * cellSize);
        const sourceRectangle = { x: sourceX, y: sourceY, width: cellSize + borderWidth, height: cellSize + borderWidth };
        const targetRectangle = { x: targetX, y: targetY, width: cellSize + borderWidth, height: cellSize + borderWidth };

        gt.drawImage(source, sourceRectangle.x, sourceRectangle.y, sourceRectangle.width, sourceRectangle.height,
                     targetRectangle.x, targetRectangle.y, targetRectangle.width, targetRectangle.height);
    });

    return target;
}

