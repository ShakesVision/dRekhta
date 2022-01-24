# dRekhta 

This is a continuation for scraperForLitUrdu repo, which has now been made into an android app with the same node.js backend plus some improvements.

This has been built only in 2 days, so pardon the bad UI. If you can improve the UI, please do create a pull request.

## How to use

#### Copy links to scrape

1. Go to [rekhta.org](https://rekhta.org) and go to a poet's/author's listing page, e.g. Ghalib's all ghazals https://www.rekhta.org/poets/mirza-ghalib/ghazals?lang=ur
2. Scroll to the bottom of the page so that all the links are loaded.
3. Add `CopyRekhtaLinks` bookmarklet from [here](https://www.shakeeb.in/2020/12/rekhta-content-scraper-by-shakeeb-ahmad.html) to copy all links. (In PC, simply drag-drop the link to bookmarks bar. In android phone, copy the link, create a new bookmark and paste.)
4. When you're on poet's listing page, use CopyRekhtaLinks bookmarklet. In PC, just click the bookmark. In android, type the name in the address-bar and select CopyRekhtaLinks bookmark you saved in step 3.
5. Congratulations! You have copied all the links. 
#### Use dRekhta
1. Paste in all the links in dRekhta's top text-area. Input a file name.
2. Click `Start Fetching` and wait for the app to scrape all the links.
3. If you've downloaded a poet's data, you can also read the content and share it on WhatsApp.
## How to contribute

The app has been compiled using [androidjs.](https://github.com/android-js/) 

So you have to:

1. Install androidjs
2. Clone the repository
3. Open the project directory and run `npm i`
4. Run `node .` to run the server
5. Open the front-end i.e. `index.html` manually in a browser or using "Live Server".
6. Make changes, test in the pc. 
7. Once finalized, build the APK using `androidjs b --release`

Pull requests are most welcome.