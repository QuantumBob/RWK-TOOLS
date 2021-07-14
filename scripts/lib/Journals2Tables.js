import { J2TWindow } from "./J2TWindow.js";
import { folderExists, isFoundry8, parseTable, isItem, isDnDItem, folderFactory, isRollable, evaluateDiceTerm, checkHTML, convertCsvToHtml, getItemType } from '../utils.js';
/*something

*/
/**
 * Checks  what was right clicked via <li>, creates folders if neccessary and creates tables. This is the starting method of the module. 
 * @param {*} li 
 * @param {*} options
 * @returns nothing if there is an error 
 */
const j2tMain = (li, options) => {

    ui.notifications.info("Wait for it!");

    let key;

    if (key = li.data("entity-id")) {

        processSingleEntry(key, options);
    }
    else if (key = li.children(".create-entity")) {

        processFoldersOfEntries(key, options);
    }

    ui.notifications.info("Jouranl2Tables completed.");
}

/* TableResultData @ https://foundryvtt.com/api/data.TableResultData.html*/
/**
 * Creates the tables in tableArray. Can create items or use existing ones or create a simple text table
 * @param {Array} tablesArray 
 * @param {Object} options 
 */
const createTables = async (tablesArray, options) => {

    for (const table of tablesArray) {

        let resultsArray = [];
        let rangeIndex = 1;
        let text = "";
        let id, weight, collection, resultType, index;

        if (isItem(Object.keys(table.rows[0]))) {

            for (const item of table.rows) {

                if (options.entityType === "Text") {
                    text = item.item + " : " + formatCost(item.cost);
                    id = null;
                    collection = null;
                    resultType = 0;
                } else {
                    text = item.item.name;
                    id = item.item.id;
                    collection = options.entityType === "Text" ? null : options.entityType;
                    resultType = 1;
                }

                if (!text) {
                    text = "TEXT MISSING";
                }

                if (!weight || weight < 1) {
                    weight = 1;
                }

                weight = parseInt(weight);

                resultsArray.push({
                    "type": resultType,
                    "text": text,
                    "collection": collection,
                    "resultId": id,
                    "weight": weight || 1,
                    "range": [rangeIndex, rangeIndex + (weight - 1)],
                    "drawn": false
                });
                rangeIndex += weight;
            }
        } else if (index = isRollable(Object.keys(table.rows[0])) !== false) {

            for (const row of table.rows) {

                if (options.entityType === "Text") {

                    for (let [key, value] of Object.entries(row)) {

                        if (key.indexOf("description") !== -1) {
                            // text += " " + value;
                            if (text === "")
                                text = value;
                            else
                                text += ", " + value;
                        } else
                            weight = evaluateDiceTerm(value);
                    }

                    id = null;
                    collection = null;
                    resultType = 0;

                } else {
                    // text = row.entry.name;
                    // id = row.entry.id;
                    // collection = options.entityType === "Text" ? null : options.entityType;
                    // resultType = 1;
                }

                if (!text) {
                    text = "TEXT MISSING";
                }

                if (!weight || weight < 1) {
                    weight = 1;
                }

                weight = parseInt(weight);

                resultsArray.push({
                    "type": resultType,
                    "text": text,
                    "collection": collection,
                    "resultId": id,
                    "weight": weight || 1,
                    "range": [rangeIndex, rangeIndex + (weight - 1)],
                    "drawn": false
                });
                rangeIndex += weight;
                text = "";
            }
        } else {

            for (const row of table.rows) {
                for (let [key, value] of Object.entries(row)) {
                    if (text === "")
                        text = key + " : " + value;
                    else
                        text += ", " + key + " : " + value;
                }

                if (!text) {
                    text = "TEXT MISSING";
                }

                if (!weight || weight < 1) {
                    weight = 1;
                }

                weight = parseInt(weight);

                resultsArray.push({
                    "type": 0,
                    "text": text,
                    "weight": weight || 1,
                    "range": [rangeIndex, rangeIndex + (weight - 1)],
                    "drawn": false
                });
                rangeIndex += weight;
                text = "";
            }
        }

        let newTable = await RollTable.create({
            name: table.name,
            description: '',
            results: resultsArray,
            replacement: true,
            displayRoll: true,
            img: "modules/RWK-TOOLS/images/scroll.webp",
            folder: table.folder
        });
        await newTable.normalize();
    }
}

const mapEntitiesToTables = async (tablesArray, options) => {

    let folder;

    for (let a = 0; a < tablesArray.length; a++) {
        let thisEntity = null;

        const folderName = new Date().toDateString();

        folder = await folderFactory(folderName, "Item");

        for (let i = 0; i < tablesArray[a].rows.length; i++) {

            const row = tablesArray[a].rows[i];

            // if tableArray row is empty or has no 'item' key ignore it 
            if (Object.entries(row).length === 0 || !row.hasOwnProperty('item'))
                continue;

            thisEntity = game.items.getName(row.item);

            if (thisEntity === undefined || options.ifItemExists === "duplicateItem") {

                let itemType = getItemType(row.item);

                thisEntity = await Item.create({
                    name: row.item,
                    type: itemType,
                    folder: folder
                });

                const price = formatCost(tablesArray[a].rows[i].cost, true);
                thisEntity.data.data.price = price;

            } else if (options.ifItemExists === "replaceItem") {

                let itemDetails = thisEntity.toObject();
                await thisEntity.delete();

                let itemType = getItemType(row.item);

                // create new item with details from {}
                thisEntity = await Item.create({
                    name: itemDetails.name,
                    type: itemType,
                    folder: itemDetails.folder
                });

                const price = formatCost(tablesArray[a].rows[i].cost, true);
                thisEntity.data.data.price = price;

            }

            tablesArray[a].rows[i].item = thisEntity;
        }
    }
    if (folder.content.length === 0)
        folder.delete();
}

const processPastedData = async (textContent, name, options) => {

    ui.notifications.info("Pasted!");

    let tablesArray = [];

    const data = {};
    data.content = textContent;
    data.folderName = null;
    data.name = name;

    await createTableObjects(data, tablesArray, options);

    if (tablesArray.length === 0)
        return;

    if (options.entityType === 'Actor' || options.entityType === 'Item') {
        await mapEntitiesToTables(tablesArray, options);
    }
    createTables(tablesArray, options);

    ui.notifications.info("Convert Pasted Complete!");
}

const processSingleEntry = async (key, options) => {

    let tablesArray = [];
    let journalEntry = game.journal.get(key);

    const journalEntryData = {};
    journalEntryData.content = journalEntry.data.content;
    journalEntryData.folderName = journalEntry.folder.name;
    journalEntryData.name = journalEntry.name;

    await createTableObjects(journalEntryData, tablesArray, options);

    if (tablesArray.length === 0)
        return;

    if (options.entityType === 'Actor' || options.entityType === 'Item') {
        await mapEntitiesToTables(tablesArray, options);
    }
    createTables(tablesArray, options);

}

const processFoldersOfEntries = async (key, options) => {

    const folders = isFoundry8() ? game.folders : game.folders.entries;

    let journalFolder = folders.get(key.data("folder"));

    if (options.searchInSubfolders) {
        iterateFolders(journalFolder, true, options);

    } else {
        for (const journalEntry of journalFolder.content) {
            processSingleEntry(journalEntry.id, options);
        }
    }
}

const iterateFolders = async (journalFolder, recursive, options) => {

    for (const journalEntry of journalFolder.content) {
        await processSingleEntry(journalEntry.id, options);
    }

    // Iterate thru subfolders and make recursive call to this function
    if (recursive) {
        for (const subFolder of journalFolder.children) {
            iterateFolders(subFolder, true, options);
        }
    }
}

const createTableObjects = async (data, tablesArray, options) => {

    if (!checkHTML(data.content)) {
        data.content = convertCsvToHtml(data.content);
    }

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(data.content, 'text/html');

    let tables = htmlDoc.getElementsByTagName('table');

    let nameCount = 1;
    for (const table of tables) {

        const tableOject = {};
        tableOject.rows = parseTable(table, options);
        if (tableOject.rows.length === 0)
            return;

        if (options.folderStructure === "folder") {
            data.folderName = data.folderName === null ? data.name : data.folderName;
            tableOject.folder = await folderFactory(data.folderName, 'RollTable');
        } else {
            tableOject.folder = null;
        }

        tableOject.name = data.name + " " + nameCount.toString();
        tablesArray.push(tableOject);

        nameCount += 1;
    }
}

/**
 * Create a copy of the given folder in the newFolderType directory.
 * @param {*} inFolder 
 * @param {string} newFolderType 
 * @param {string} folderStructure 
 * @param {*} parentFolder 
 * @returns the new folder or null
 */
const duplicateFolder = async (inFolder, newFolderType, parentFolder = null) => {

    if (inFolder === null)
        return null;

    let outFolder = null;

    if (folderExists(inFolder.name, newFolderType)) {
        const folders = isFoundry8() ? game.folders : game.folders.entries;
        outFolder = folders.getName(inFolder.name);
    } else {

        outFolder = await Folder.create({
            name: inFolder.name,
            type: newFolderType,
            parent: parentFolder
        });
    }

    return outFolder;
}

const formatCost = (cost, asGp = false) => {

    cost = cost.toLowerCase();
    let coinType = cost.match(/platinum|gold|silver|copper/g);
    let coinValue = cost.match(/(\d+)/g);

    if (asGp) {

        let amount = 0;
        for (let i = 0; i < coinType.length; i++) {
            switch (coinType[i]) {
                case 'platinum':
                    amount = amount + (+coinValue[i] * 10);
                    break;
                case 'gold':
                    amount = amount + +coinValue[i];
                    break;
                case 'silver':
                    amount = amount + (+coinValue[i] * 0.1);
                    break;
                case 'copper':
                    amount = amount + (+coinValue[i] * 0.01);
                    break;
                default: amount = +amount;
            }
        }
        if (amount > 1)
            return +amount;
        return amount;

    } else {
        let text = "";
        for (let i = 0; i < coinType.length; i++) {
            switch (coinType[i]) {
                case 'platinum':
                    text = text + coinValue[i] + ' pp, ';
                    break;
                case 'gold':
                    text = text + coinValue[i] + ' gp, ';
                    break;
                case 'silver':
                    text = text + coinValue[i] + ' sp, ';
                    break;
                case 'copper':
                    text = text + coinValue[i] + ' cp';
                    break;
                default: text = text + "";
            }
        }
        return text;
    }
}

const journals2Tables = (li) => {

    new J2TWindow(li).render(true);
}

export { j2tMain, journals2Tables, processPastedData }