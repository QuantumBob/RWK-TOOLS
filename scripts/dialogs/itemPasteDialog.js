import { processPastedData } from "../lib/ddb2Item.js";

class ItemPasteDialog extends Application {

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "rwk_item_paster",
            template: "modules/rwk-tools/templates/item_paste.html",
            resizable: false,
            height: "auto",
            width: 400,
            minimizable: true,
            title: "Convert HTML Monster/Spell"
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        const importEntitiesSelector = html.find("#importEntities");
        const folderStructureSelector = html.find('#folderStructure');
        const keepItem = html.find("#keepItem");
        const duplicateItem = html.find("#duplicateItem");
        const replaceItem = html.find("#replaceItem");
        const nameInput = html.find('#item-name');
        const convertButton = html.find("#submit");

        if (importEntitiesSelector.find('option:selected').val() == "Actor" || importEntitiesSelector.find('option:selected').val() == "Item") {
            keepItem.prop('disabled', false);
            duplicateItem.prop('disabled', false);
            replaceItem.prop('disabled', false);
        }

        // nameInput.on('input', () => {
        //     if (nameInput[0].value) {
        //         convertButton.prop('disabled', false);
        //     } else {
        //         convertButton.prop('disabled', true);
        //     }
        // })

        importEntitiesSelector.on('change', () => {
            let entityType = importEntitiesSelector.find('option:selected').val();

            if (entityType == "Actor" || entityType == "Item" || entityType == "Spell") {
                keepItem.prop('disabled', false);
                duplicateItem.prop('disabled', false);
                replaceItem.prop('disabled', false);
            } else {
                keepItem.prop('disabled', true);
                duplicateItem.prop('disabled', true)
                replaceItem.prop('disabled', true)
            }
        });

        html.find("#submit").on('click', () => {

            const textContent = html.find('#text-input')[0].value;
            if (!textContent) {
                ui.notifications.info("Paste some html then click Convert!");
                return;
            }

            const name = html.find('#item-name')[0].value;

            const entityType = importEntitiesSelector.find('option:selected').val();
            const folderStructure = folderStructureSelector.find('option:selected').val();
            const ifItemExists = $("input:radio[name=ifItemExists]:checked").val() === undefined ? 'keepItem' : $("input:radio[name=ifItemExists]:checked").val();

            const settings = {};
            settings.entityType = entityType;
            settings.ifItemExists = ifItemExists;
            settings.folderStructure = folderStructure;
            settings.searchInSubfolders = false;

            processPastedData(textContent, name, settings);
        });
    }
}

export { ItemPasteDialog }