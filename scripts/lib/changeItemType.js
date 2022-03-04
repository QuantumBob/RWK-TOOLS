import { ChooseItemTypeDialog } from "./dialogs/chooseItemTypeDialog.js";

const changeItemTypeMain = async (li, itemType) => {
    ui.notifications.info("Amazing!");

    let key;

    if (key = li.data("entity-id")) {

        let item = game.items.get(key);

        let itemDetails = item.toObject();

        // delete old item
        await item.delete();

        // create new item with details from {}
        const newItem = await Item.create({
            name: itemDetails.name,
            type: itemType,
            folder: itemDetails.folder
        });
        newItem.data.price = itemDetails.data.price;
    }

}

const changeItemType = (li) => {

    new ChooseItemTypeDialog(li).render(true);

}

export { changeItemTypeMain, changeItemType }
