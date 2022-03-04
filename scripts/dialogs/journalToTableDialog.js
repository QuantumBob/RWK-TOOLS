import { journalToTableMain } from "./journals2Tables.js";

export class JournalToTableDialog extends Application {


    constructor(li) {
        super();
        this.li = li;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "rwk-j2t",
            template: "modules/rwk-tools/templates/rwk_j2t_dialog.html",
            resizable: false,
            height: "auto",
            width: 400,
            minimizable: true,
            title: "RWK J2T"
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        const importEntitiesSelector = html.find("#importEntities");
        const folderStructureSelector = html.find('#folderStructure');
        const keepItem = html.find("#keepItem");
        const duplicateItem = html.find("#duplicateItem");
        const replaceItem = html.find("#replaceItem");
        const singleEntry = this.li.data("entity-id") ? true : false;
        if (singleEntry) {
            folderStructureSelector.val("none");
            html.find('#searchInSubfolders').prop('disabled', true);
        }

        if (importEntitiesSelector.find('option:selected').val() == "Actor" || importEntitiesSelector.find('option:selected').val() == "Item") {
            keepItem.prop('disabled', false);
            duplicateItem.prop('disabled', false);
            replaceItem.prop('disabled', false);
        }

        importEntitiesSelector.on('change', () => {
            let entityType = importEntitiesSelector.find('option:selected').val();

            if (entityType == "Actor" || entityType == "Item") {
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
            const entityType = importEntitiesSelector.find('option:selected').val();
            const folderStructure = folderStructureSelector.find('option:selected').val();
            const ifItemExists = $("input:radio[name=ifItemExists]:checked").val() === undefined ? 'keepItem' : $("input:radio[name=ifItemExists]:checked").val();
            const searchInSubfolders = html.find('#searchInSubfolders')[0].checked;

            const settings = {};
            settings.entityType = entityType;
            settings.folderStructure = folderStructure;
            settings.ifItemExists = ifItemExists;
            settings.searchInSubfolders = searchInSubfolders;
            settings.genericItems = true;

            journalToTableMain(this.li, settings);
        });
    }
}