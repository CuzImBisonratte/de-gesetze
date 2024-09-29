// Modules
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');
const admZip = require('adm-zip');
const progressBar = require('progress');

// Config
const config = {
    tocLocation: process.env.TOC_LOCATION || "https://www.gesetze-im-internet.de/gii-toc.xml",
    progressBars: {
        enabled: process.env.PROGRESS_BARS || true,
        showPercentage: true,
        chars: {
            completed: "█",
            incomplete: "░"
        }
    }
}
const progressBarOptions = ":elapseds... :current/:total (:percent) [:bar] :etas remaining";

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

// Download all xml-packages
const downloadXmlPackages = async (toc) => {
    var downloadProgressBar = new progressBar("Downloading laws " + progressBarOptions, { total: Object.keys(toc).length, complete: config.progressBars.chars.completed, incomplete: config.progressBars.chars.incomplete });
    for (const [key, value] of Object.entries(toc)) {
        const response = await axios.get(value.link, { responseType: 'stream' });
        const writer = fs.createWriteStream(path.join(__dirname, "laws", "xml", key + ".zip"));
        response.data.pipe(writer);
        downloadProgressBar.tick();
    }
}

// Unzip all xml-packages
const unzipXmlPackages = async (toc) => {
    var unzipProgressBar = new progressBar("Unzipping laws " + progressBarOptions, { total: Object.keys(toc).length, complete: config.progressBars.chars.completed, incomplete: config.progressBars.chars.incomplete });
    for (const [key, value] of Object.entries(toc)) {
        await new Promise((resolve, reject) => {
            const zip = new admZip(path.join(__dirname, "laws", "xml", key + ".zip"));
            fs.mkdirSync(path.join(__dirname, "laws", "xml", key), { recursive: true });
            zip.extractAllToAsync(path.join(__dirname, "laws", "xml", key), true, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        unzipProgressBar.tick();
    }
    // There is only one xml file per zip so move it to /xml/SHORTNAME.xml
    var moveProgressBar = new progressBar("Moving laws " + progressBarOptions, { total: Object.keys(toc).length, complete: config.progressBars.chars.completed, incomplete: config.progressBars.chars.incomplete });
    for (const [key, value] of Object.entries(toc)) {
        const file = fs.readdirSync(path.join(__dirname, "laws", "xml", key))[0];
        fs.renameSync(path.join(__dirname, "laws", "xml", key, file), path.join(__dirname, "laws", "xml", key + ".xml"));
        moveProgressBar.tick();
    }
}

// Cleanup xml data
const cleanupXmlData = async (toc) => {
    var cleanupProgressBar = new progressBar("Cleaning up " + progressBarOptions, { total: Object.keys(toc).length, complete: config.progressBars.chars.completed, incomplete: config.progressBars.chars.incomplete });
    for (const [key, value] of Object.entries(toc)) {
        fs.rmSync(path.join(__dirname, "laws", "xml", key), { recursive: true });
        fs.rmSync(path.join(__dirname, "laws", "xml", key + ".zip"));
        cleanupProgressBar.tick();
    }
}

// Parse xml data to json
const convertToJson = async (toc) => {
    var parseProgressBar = new progressBar("Parsing laws " + progressBarOptions, { total: Object.keys(toc).length, complete: config.progressBars.chars.completed, incomplete: config.progressBars.chars.incomplete });
    for (const [key, value] of Object.entries(toc)) {
        const parser = new xml2js.Parser();
        const xml = fs.readFileSync(path.join(__dirname, "laws", "xml", key + ".xml"));
        parser.parseString(xml, (err, result) => {
            if (err) console.error(err);
            fs.writeFileSync(path.join(__dirname, "laws", "json-wip", key + ".json"), JSON.stringify(result, null, 4));
        });
        parseProgressBar.tick();
    }
}

// Format json data
const formatJson = (toc) => {
    var formatProgressBar = new progressBar("Formatting laws " + progressBarOptions, { total: Object.keys(toc).length, complete: config.progressBars.chars.completed, incomplete: config.progressBars.chars.incomplete });
    for (const [key, value] of Object.entries(toc)) {
        const json = JSON.parse(fs.readFileSync(path.join(__dirname, "laws", "json-wip", key + ".json"))).dokumente;
        // Gather metadata
        var metadata = {};
        metadata.title = json.norm[0].metadaten[0].langue[0];
        metadata.shortTitle = json.norm[0].metadaten[0].jurabk[0];
        metadata.date = json.norm[0].metadaten[0]["ausfertigung-datum"][0]._;
    }
}

// Main
const main = async () => {
    // Create directories
    fs.mkdirSync(path.join(__dirname, "laws"), { recursive: true });
    fs.mkdirSync(path.join(__dirname, "laws", "xml"), { recursive: true });
    fs.mkdirSync(path.join(__dirname, "laws", "json-wip"), { recursive: true });
    fs.mkdirSync(path.join(__dirname, "laws", "json"), { recursive: true });
    fs.mkdirSync(path.join(__dirname, "laws", "md"), { recursive: true });
    // Prepare toc
    const toc = await downloadToc();
    const tocPrepared = prepareToc(toc);
    // Prepare xml-packages
    await downloadXmlPackages(tocPrepared);
    await unzipXmlPackages(tocPrepared);
    await cleanupXmlData(tocPrepared);
    // Prepare json
    await convertToJson(tocPrepared);
}
main();