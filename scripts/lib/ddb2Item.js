import { folderExists, isFoundry8, parseItem, isItem, isDnDItem, folderFactory, isRollable, evaluateDiceTerm, checkHTML, convertCsvToHtml, getItemType } from '../utilities/utils.js';

const processPastedData = async (textContent, name, options) => {

    let itemArray = [];

    const data = {};
    data.content = textContent;
    data.folderName = null;
    data.name = name;

    await createItemObjects(data, itemArray, options);

    if (itemArray.length === 0)
        return;

    if (options.entityType === 'Actor' || options.entityType === 'Item') {
        await mapEntitiesToItems(itemArray, options);
    }
    createItems(itemArray, options);

    ui.notifications.info("Pasted item Converted");
}

const createItemObjects = async (data, itemsArray, options) => {

    if (!checkHTML(data.content)) {
        data.content = convertCsvToHtml(data.content);
    }

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(data.content, 'text/html');

    // let items = htmlDoc.getElementsByClassName('spell-details');
    let items = $(htmlDoc).find('.spell-details');

    let nameCount = 1;

    for (const item of items) {

        const itemOject = {};
        itemOject.item = parseItem(item, options);
        if (itemOject.item.length === 0)
            return;

        if (options.folderStructure === "folder") {
            data.folderName = data.folderName === null ? data.name : data.folderName;
            itemOject.folder = await folderFactory(data.folderName, 'Items');
        } else {
            itemOject.folder = null;
        }

        itemOject.name = data.name + " " + nameCount.toString();
        itemsArray.push(itemOject);

        nameCount += 1;
    }
}

const createItems = async (itemsArray, options) => {

    for (const item of itemsArray) {

        let resultsArray = [];
        let rangeIndex = 1;
        let text = "";
        let id, weight, collection, resultType, index;

        if (isItem(Object.keys(item.rows[0]))) {

            for (const item of item.rows) {

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
        } else if (index = isRollable(Object.keys(item.rows[0])) !== false) {

            for (const row of item.rows) {

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

            for (const row of item.rows) {
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

        let newitem = await Rollitem.create({
            name: item.name,
            description: '',
            results: resultsArray,
            replacement: true,
            displayRoll: true,
            img: "modules/rwk-tools/images/scroll.webp",
            folder: item.folder
        });
        await newitem.normalize();
    }
}

const mapEntitiesToItems = async (itemsArray, options) => {

    let folder;

    for (let a = 0; a < itemsArray.length; a++) {
        let thisEntity = null;

        const folderName = new Date().toDateString();

        folder = await folderFactory(folderName, "Item");

        for (let i = 0; i < itemsArray[a].rows.length; i++) {

            const row = itemsArray[a].rows[i];

            // if itemArray row is empty or has no 'item' key ignore it 
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

                const price = formatCost(itemsArray[a].rows[i].cost, true);
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

                const price = formatCost(itemsArray[a].rows[i].cost, true);
                thisEntity.data.data.price = price;

            }

            itemsArray[a].rows[i].item = thisEntity;
        }
    }
    if (folder.content.length === 0)
        folder.delete();
}

export { processPastedData }