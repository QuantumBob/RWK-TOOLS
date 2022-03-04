import { journals2Tables } from "./lib/Journals2Tables.js"
import { changeItemType } from "./lib/ChangeItemType.js"
import PasteWindow from "./lib/PasteWindow.js"
import { libWrapper } from "./shim.js";

Hooks.on("init", () => {

    if (game.system.data.name !== "dnd5e") {
        ui.notifications.info("RWK Tools needs DnD5e");
        return;
    }

    const baseItem = ItemDirectory.prototype._getEntryContextOptions;
    ItemDirectory.prototype._getEntryContextOptions = function () {
        const entries = game.user.isGM ? baseItem.call(this) : [];
        entries.push({
            name: game.i18n.localize('RWKITEM.ui.context.change.item-type'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user.isGM,
            callback: changeItemType,

        });
        return entries;
    };

    const baseEntry = JournalDirectory.prototype._getEntryContextOptions;
    JournalDirectory.prototype._getEntryContextOptions = function () {
        const entries = game.user.isGM ? baseEntry.call(this) : [];
        entries.push({
            name: game.i18n.localize('RWKTABLE.ui.context.search.table'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user.isGM,
            callback: journals2Tables,

        });
        return entries;
    };

    const baseFolder = JournalDirectory.prototype._getFolderContextOptions;
    JournalDirectory.prototype._getFolderContextOptions = function () {
        const entries = game.user.isGM ? baseFolder.call(this) : [];
        entries.push({
            name: game.i18n.localize('RWKTABLE.ui.context.search.tables'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user.isGM,
            callback: journals2Tables,

        });
        return entries;
    };

    // libWrapper section!!!

    // Adding export buttons to context menus for folders
    // let newContextOption = {
    //     name: "CF.exportFolderHint",
    //     icon: '<i class="fas fa-upload"></i>',
    //     condition: header => {
    //         return game.user?.isGM && header.parent().find('.document').length > 0
    //     },
    //     callback: header => {
    //         const li = header.parent()[0];
    //         FICManager.exportFolderStructureToCompendium(game.folders.get(li.dataset.folderId))
    //     }
    // }

    const baseFolder = JournalDirectory.prototype._getFolderContextOptions;
    // let newContextOption = {
    //     name: game.i18n.localize('RWKTABLE.ui.context.search.tables'),
    //     icon: '<i class="fas fa-search"></i>',
    //     condition: game.user.isGM ? baseFolder.call(this) : [],
    //     callback: journals2Tables
    // }

    libWrapper.register(mod, 'JournalDirectory.prototype._getFolderContextOptions', function (wrapped, ...args) {
        let newContextOption = {
            name: game.i18n.localize('RWKTABLE.ui.context.search.tables'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user?.isGM,
            callback: journals2Tables
        }
        return wrapped(...args).concat(newContextOption);
    }, 'WRAPPER');

    // const baseFolder = JournalDirectory.prototype._getFolderContextOptions;
    // JournalDirectory.prototype._getFolderContextOptions = function () {
    //     const entries = game.user.isGM ? baseFolder.call(this) : [];
    //     entries.push({
    //         name: game.i18n.localize('RWKTABLE.ui.context.search.tables'),
    //         icon: '<i class="fas fa-search"></i>',
    //         condition: game.user.isGM,
    //         callback: journals2Tables,

    //     });
    //     return entries;
    // };
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
        let button = $("<div class='header-actions action-buttons flexrow'><button class='ddb-muncher'><i class='fas fa-scroll'></i> RWK Table Import</button></div>");
        button.on('click', () => {
            new PasteWindow().render(true);
        });
        $(html).find(".directory-header").append(button);
    }

});