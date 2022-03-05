import { ChangeItemTypeDialog } from "../dialogs/changeItemTypeDialog.js";

const changeItemTypeMain = async (li, itemType) => {

    let key;

    if (key = li.data("document-id")) {

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

    new ChangeItemTypeDialog(li).render(true);

}

export { changeItemTypeMain, changeItemType }
