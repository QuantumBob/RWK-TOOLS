import { changeItemTypeMain } from "../lib/changeItemType.js";

export class ChangeItemTypeDialog extends Application {

    constructor(li) {
        super();
        this.li = li;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "rwk-cit",
            template: "modules/rwk-tools/templates/change_item_type.html",
            resizable: false,
            height: "auto",
            width: 400,
            minimizable: true,
            title: "Change Item's Type"
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find("#submit").on('click', () => {
            const itemTypeSelector = html.find("#newItemTypes");
            const itemType = itemTypeSelector.find('option:selected').val();

            changeItemTypeMain(this.li, itemType);
        });
    }
}