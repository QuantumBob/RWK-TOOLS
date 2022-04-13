import { MergeJournalsDialog } from "../dialogs/mergeJournalsDialog.js";

const mergeJournals = (li) => {

    new MergeJournalsDialog(li).render(true);
}

export { mergeJournals }