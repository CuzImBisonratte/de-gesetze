// Modules
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');

// Config
const configLoaded = fs.existsSync(path.join(__dirname, 'config.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')) : {};
const config = {
    tocLocation: process.env.TOC_LOCATION || configLoaded.tocLocation || "https://www.gesetze-im-internet.de/gii-toc.xml",

}

// Download toc
const downloadToc = async () => {
    try {
        const response = await axios.get(config.tocLocation);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

// Prepare toc
const prepareToc = (toc) => {
    const parser = new xml2js.Parser();
    const tocPrepared = {};
    parser.parseString(toc, (err, result) => {
        if (err) console.error(err);
        result.items.item.forEach(element => {
            const gesName = element.title[0];
            const gesLink = element.link[0];
            const gesShortName = gesLink.split(".de/")[1].split("/xml.zip")[0];
            tocPrepared[gesShortName] = { link: gesLink, name: gesName };
        });
    });
    return tocPrepared;
}

// Main
const main = async () => {
    // Prepare toc
    const toc = await downloadToc();
    const tocPrepared = prepareToc(toc);
}
main();