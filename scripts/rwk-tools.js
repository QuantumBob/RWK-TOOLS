import { TablePasteDialog } from "./lib/TablePasteDialog.js"
import { journals2Tables } from "./lib/Journals2Tables.js"
import { changeItemType } from "./lib/ChangeItemType.js"
import { libWrapper } from "./shim.js";

const mod = "rwk-tools";

Hooks.on("init", () => {

    if (game.system.data.name !== "dnd5e") {
        ui.notifications.info("RWK Tools needs DnD5e");
        return;
    }

    libWrapper.register(mod, 'JournalDirectory.prototype._getEntryContextOptions', function (wrapped, ...args) {
        const searchTableContextOption = {
            name: game.i18n.localize('RWKTABLE.ui.context.search.table'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user.isGM,
            callback: journals2Tables,
        };
        const changeItemTypeContextMenu = {
            name: game.i18n.localize('RWKITEM.ui.context.change.item-type'),
            icon: '<i class="fas fa-search"></i>',
            condition: game.user.isGM,
            callback: changeItemType,
        };
        return wrapped(...args).concat(searchTableContextOption, changeItemTypeContextMenu);
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