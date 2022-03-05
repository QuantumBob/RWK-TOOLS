import { TablePasteDialog } from "./dialogs/tablePasteDialog.js"
import { journals2Tables } from "./lib/journals2Tables.js"
import { changeItemType } from "./lib/changeItemType.js"
import { libWrapper } from "./utilities/shim.js";

const mod = "rwk-tools";

// add listeners to init hook
Hooks.on("init", () => {

    if (game.system.data.name !== "dnd5e") {
        console.error("RWK Tools | This module needs DnD5e")
        return;
    }

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
        return wrapped(...args).concat(searchTableContextOption);
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
            new TablePasteDialog().render(true);
        });
        $(html).find(".directory-header").append(button);
    }

});