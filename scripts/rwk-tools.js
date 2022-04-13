import { TablePasteDialog } from "./dialogs/tablePasteDialog.js"
import { ItemPasteDialog } from "./dialogs/itemPasteDialog.js";
import { journals2Tables } from "./lib/journals2Tables.js"
import { changeItemType } from "./lib/changeItemType.js"
import { mergeJournals } from "./lib/mergeJournals.js"
import { folderExists } from "./utilities/utils.js";
// import { libWrapper } from "./utilities/shim.js";

const mod = "rwk-tools";

// if we wanted to expose something in the module to the global scope we so it as follows
// globalThis.RWKTOOLS = {};

// add listeners to init hook
Hooks.on("init", () => {

    if (game.system.data.name !== "dnd5e") {
        console.error("RWK Tools | This module needs DnD5e")
        return;
    }

    // game.settings.registerMenu("rwk-tools", "settings-export-menu", {
    //     name: "",
    //     label: "Export Settings",      // The text label used in the button
    //     hint: "Export all settings to JSON file.",
    //     icon: "fas fa-bars",               // A Font Awesome icon used in the submenu button
    //     type: exportSettings,   // A FormApplication subclass
    //     restricted: true                   // Restrict this submenu to gamemaster only?
    // });
    // game.settings.register("rwk-tools", "settings-export", {
    //     scope: 'world',     // "world" = sync to db, "client" = local storage
    //     config: false,       // false if you dont want it to show in module config
    //     type: Object,       // Number, Boolean, String, Object
    //     default: {},
    // });


    // keybinding to toggle sidebar with CTRL S
    const { CONTROL } = KeyboardManager.MODIFIER_KEYS;
    game.keybindings.register("rwk-tools", "toggleSidebar", {
        name: "ToggleSidebar",
        editable: [
            { key: "KeyS", modifiers: [CONTROL] }
        ],
        onDown: () => {
            if (canvas.ready) {
                if (ui.sidebar._collapsed)
                    ui.sidebar.expand();
                else
                    ui.sidebar.collapse();
            }

            return true;
        },
        restricted: true
    });

    libWrapper.register(mod, 'ItemDirectory.prototype._getEntryContextOptions', function (wrapped, ...args) {
        const changeItemTypeContextMenu = {
            name: game.i18n.localize('RWKITEM.ui.context.change.item-type'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user.isGM,
            callback: changeItemType,
        };
        return wrapped(...args).concat(changeItemTypeContextMenu);
    }, 'WRAPPER');

    libWrapper.register(mod, 'JournalDirectory.prototype._getEntryContextOptions', function (wrapped, ...args) {
        const searchTableContextOption = {
            name: game.i18n.localize('RWKTABLE.ui.context.search.table'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user.isGM,
            callback: journals2Tables,
        };
        const mergeJournalsContextOption = {
            name: game.i18n.localize('RWKJOURNAL.ui.context.merge.journals'),
            icon: '<i class="fa-solid fa-object-group rwk-icon"></i>',
            condition: game.user.isGM,
            callback: mergeJournals,
        };
        return wrapped(...args).concat(searchTableContextOption, mergeJournalsContextOption);
    }, 'WRAPPER');

    libWrapper.register(mod, 'JournalDirectory.prototype._getFolderContextOptions', function (wrapped, ...args) {
        let newContextOption = {
            name: game.i18n.localize('RWKTABLE.ui.context.search.tables'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user?.isGM,
            callback: journals2Tables
        };
        return wrapped(...args).concat(newContextOption);
    }, 'WRAPPER');

    // libWrapper.register(mod, 'JournalDirectory.prototype._getEntryContextOptions', function (wrapped, ...args) {
    //     const mergeJournalsContextOption = {
    //         name: game.i18n.localize('RWKJOURNAL.ui.context.merge.journals'),
    //         icon: '<i class="fas fa-search"></i>',
    //         condition: game.user.isGM,
    //         callback: mergeJournals,
    //     };
    //     return wrapped(...args).concat(mergeJournalsContextOption);
    // }, 'WRAPPER');
});

Hooks.once('ready', () => {
    if (!game.modules.get('lib-wrapper')?.active && game.user.isGM)
        ui.notifications.error("Module Rwk-Tools requires the 'libWrapper' module. Please install and activate it.");
});

Hooks.on("preCreateItem", (item, options, userId) => {
    // only allow unique named items.
    if (game.items.getName(item.name)) {
        return false;
    }
});

Hooks.on("renderSidebarTab", async (app, html) => {

    if (!game.user.isGM) {
        return;
    }
    if (game.system.data.name !== "dnd5e") {
        ui.notifications.info("Journal2Tables needs DnD5e");
        return;
    }

    if (app?.options?.id === "tables" && game.user.isGM) {
        // let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-muncher'><i class='fas fa-scroll'></i> RWK Table Import</button></div>");
        let button = $("<div class='header-actions action-buttons flexrow'><button class='rwk-import'><i class='fas fa-scroll'></i> RWK Table Import</button></div>");
        button.on('click', () => {
            new TablePasteDialog().render(true);
        });
        $(html).find(".directory-header").append(button);
    }

    if (app?.options?.id === "items" && game.user.isGM) {
        let button = $("<div class='header-actions action-buttons flexrow'><button class='rwk-import'><i class='fas fa-scroll'></i> RWK DDB Import</button></div>");
        button.on('click', () => {
            new ItemPasteDialog().render(true);
        });
        $(html).find(".directory-header").append(button);
    }
    /* change text colour of journals in list to black if background is light */
    if (app?.options?.id === "journal" && game.user.isGM) {

        // let lis = $(html).find(".directory-list>li.folder");

        $(html).find(".directory-list>li.folder").each(function () {
            const bkColor = $(this).find(".folder-header").css("background-color");
            let color = parseColor(bkColor, true);
            if (color.length) {
                const [hue, sat, light] = rgbToHsl(...color);
                if (light >= 50) {
                    $(this).find(".folder-header").addClass("dark-title");
                }
            }
        });
    }
});

function parseColor(color, toNumber) {

    if (toNumber === true) {
        if (typeof color === 'number') {
            return (color | 0); //chop off decimal
        }
        if (typeof color === 'string') {
            if (color.includes('rgb(')) {
                color = color.replace('rgb(', '');
                color = color.replace(')', '');
                const arr = color.split(', ');
                let res = arr.map(el => {
                    return parseInt(el);
                });
                return res;
            }
            if (color[0] === '#')
                color = color.slice(1);
        }
        return window.parseInt(color, 16);
    } else {
        if (typeof color === 'number') {
            //make sure our hexadecimal number is padded out
            color = '#' + ('00000' + (color | 0).toString(16)).substr(-6);
        }

        return color;
    }
};

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [Math.floor(h * 360), Math.floor(s * 100), Math.floor(l * 100)];
}