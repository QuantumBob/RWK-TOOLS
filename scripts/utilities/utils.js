import * as dic from "./dictionary.js";

export const isFoundry8 = () => {
    const foundryVersion = game.version;
    return foundryVersion >= '0.8.0';// && foundryVersion < '0.9.0';
}
/**
 * checks foundry folders and returns true if name exists in given directory
 * @param {string} name 
 * @param {string} type 
 * @returns {boolean} folder exists or not
 */
export const folderExists = (name, type) => {

    const folders = isFoundry8() ? game.folders : game.folders.entries;
    return folders.some(folder => { folder.name === name && folder.type == type });
}

export const folderFactory = async (name, folderDirectory, parentFolder = null) => {

    const folders = isFoundry8() ? game.folders : game.folders.entries;

    let outFolder = null;

    folders.some(folder => {
        if (folder.name === name && folder.type == folderDirectory) {
            outFolder = folder;
            return true;
        } else {
            outFolder = false;
            return false;
        }
    });

    if (outFolder === false) {
        outFolder = await Folder.create({
            name: name,
            type: folderDirectory,
            parent: parentFolder
        });
    }

    return outFolder;
}

export const isDnDItem = (array) => {
    return array.some(r => dic.dndItemTypes.includes(r));
}

export const isItem = (array) => {

    return array.some(r => dic.allItemTypes.includes(r));
}

export const getItemType = (itemName) => {

    for (const typeArray of dic.typeArrays) {

        if (typeArray.find(element => { return itemName.includes(element) }))
            return typeArray[0];
    }

    return "equipment";
}

export const isRollable = (array) => {

    for (let j = 0; j < array.length; j++) {
        for (let i = 0; i < array[j].length; i++) {
            if (!isNaN(array[j].charAt(i)) && !(array[j].charAt(i) === " ")) {
                if (array[j].charAt(i - 1).toLowerCase() === "d")
                    return j;
            }
        }
    }
    return false;
}

export const evaluateDiceTerm = (term) => {

    let result = "";
    let returnArray = [];

    if (term.length === 1 && !isNaN(term))
        return 1;

    if (term.length === 1 && isNaN(term))
        return -1;

    if (!isNaN(term))
        return 1;

    let numArray = [];
    let seperatorArray = [];

    for (let i = 0; i < term.length; i++) {
        let a = term[i];
        if (isNaN(term[i])) {
            numArray.push("sep");
        } else {
            numArray.push("num");
        }
    }

    for (let i = 0; i < numArray.length; i++) {
        if (numArray[i] === "num")
            result += term[i];
        else {
            returnArray.push(result);
            result = "";
        }
    }
    returnArray.push(result);

    if (returnArray.length !== 2)
        return 1;
    else {
        return returnArray[1] - returnArray[0] + 1;
    }
}

export const checkHTML = (content) => {

    return /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(content);

}

export const convertCsvToHtml = (data) => {

    let allRows = data.split(/\r?\n|\r/);
    let table = '<table>';
    for (let singleRow = 0; singleRow < allRows.length; singleRow++) {
        if (singleRow === 0) {
            table += '<thead>';
            table += '<tr>';
        } else {
            table += '<tr>';
        }
        let rowCells = allRows[singleRow].split(',');
        for (let rowCell = 0; rowCell < rowCells.length; rowCell++) {
            if (singleRow === 0) {
                table += '<th>';
                table += rowCells[rowCell];
                table += '</th>';
            } else {
                table += '<td>';
                table += rowCells[rowCell];
                table += '</td>';
            }
        }
        if (singleRow === 0) {
            table += '</tr>';
            table += '</thead>';
            table += '<tbody>';
        } else {
            table += '</tr>';
        }
    }
    table += '</tbody>';
    table += '</table>';
    return table;
}



export const genericType = (type) => {
    switch (type.toLowerCase()) {
        case "item":
        case "backpack":
        case "class":
        case "consumable":
        case "equipment":
        case "feat":
        case "loot":
        case "spell":
        case "tool":
        case "tools":
        case "weapon":
        case "armour":
        case "adventuring gear":
        case "ammunition":
        case "ring":
        case "rod":
        case "wondrous item":
        case "scroll":
        case "potion":
        case "wand":
        case "goods":
            return "item";
        case "cost":
        case "price":
            return "cost";

    }
};

const removeLinebreaks = (str) => {
    return str.replace(/[\r\n]+/gm, "");
}

/**
 * generates factory functions to convert table rows to objects, based on the titles in the table's <thead>
 * @param  {Array<String>} headings the values of the table's <thead>
 * @return {(row: HTMLTableRowElement) => Object} a function that takes a table row and spits out an object
 */
const mapRow = (headings) => {

    const mapRowToObject = ({ cells }) => {

        return [...cells].reduce(function (result, cell, i) {

            const input = cell.querySelector("input,select");
            let value;

            if (input) {
                value = input.type === "checkbox" ? input.checked : input.value;
            } else {
                value = cell.innerText;
            }

            // should not need this now we have changed parseTable
            // if (headings.includes(value.toLowerCase()))
            //     return result;

            if (dic.allItemTypes.includes(value.toLowerCase()) || value === "")
                return result;

            // if (itemTypes.includes(headings[i].toLowerCase())) {
            //     Object.assign(result, { "type": [headings[i].toLowerCase()] });

            Object.assign(result, { [headings[i]]: value });

            return result;

        }, {});

    };
    return mapRowToObject;
}

/**
 * Given a table, generate an array of objects. Each object corresponds to a row in the table. Each object's key/value pairs correspond to a column's heading and the row's value for that column
 * 
 * Usage
 * const table = document.querySelector("table");
 * const data = parseTable(table);
 *
 * @param  {HTMLTableElement} table the table to convert
 * @return {Array<Object>}       array of objects representing each row in the table
 */
export const parseTable = (table, options) => {

    let headings;
    if (table.tHead) {
        if (options.genericItems) {
            headings = [...table.tHead.rows[0].cells].map(heading => genericType(heading.innerText));
        } else {
            headings = [...table.tHead.rows[0].cells].map(heading => heading.innerText);
            const i = isRollable(headings);
            if (i !== false) {
                const dice = headings[i];
                //headings.fill("description");
                headings = headings.map(heading => "description : " + heading);
                headings[i] = dice;
            }
        }
    } else {
        if (options.genericItems) {
            headings = [...table.rows[0].cells].map(heading => genericType(heading.innerText));
        } else {
            headings = [...table.rows[0].cells].map(heading => heading.innerText);
            const i = isRollable(headings);
            if (i !== false) {
                const dice = headings[i];
                // headings.fill("description");
                headings = headings.map(heading => "description" + heading);
                headings[i] = dice;
            }
        }
    }

    if (headings.includes(undefined))
        return [];

    let filteredArray = [...table.tBodies[0].rows].filter((row) => {

        let isHeading = true;
        let heading = row.innerText.toLowerCase();
        if (heading.indexOf(headings[0]) === -1 && heading.indexOf(headings[1]) === -1) {

            isHeading = false;
        }
        let isCategory = isItem([heading]);
        if (isHeading === true || isCategory === true) {
            return false;
        }
        return true;
    });

    let result = filteredArray.map(mapRow(headings));
    return result;
}

export const parseItem = (data, options) => {

    let item = {};
    item.name = parseName(data.className);

    //.getElementsByClassName(".ddb-statblock ddb-statblock-spell");
    let statBlock = Array.prototype.find.call(data, function (element) {
        if (element.nodeName === 'DIV')
            return element;
    });

    //elements = data.children.getElementsByClassName(".more-info-content");
    let content = Array.prototype.find.call(data, function (element) {
        return element.nodeName === 'DIV';
    });

}

const parseName = (data) => {
    let names = data.split(' ');
    let name = names.pop();
    if (name.includes("spell")) {
        return "No Name";
    }
    // let index = name.indexOf("-details");
    name = name.substring(0, name.indexOf("-details")).replace("-", " ");
    return name.replace(/^./, name[0].toUpperCase());
}