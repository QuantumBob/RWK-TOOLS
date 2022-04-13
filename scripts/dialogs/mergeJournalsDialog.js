export class MergeJournalsDialog extends FormApplication {

    constructor(li) {
        super();
        MergeJournalsDialog.clickedJournalId = li[0].dataset.documentId;
        MergeJournalsDialog.keepOther = true;
        MergeJournalsDialog.monk = false;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "rwk-merge-journals",
            template: "modules/rwk-tools/templates/merge-journals.html",
            resizable: true,
            height: 400,
            width: 400,
            minimizable: true,
            closeOnSubmit: true,
            popOut: true,
            title: "Merge Journals"
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    static async renderMergeDialog(dialog, html, data) {

        let catHtml = [];
        let template;

        let dialogHtml = await renderTemplate("modules/rwk-tools/templates/journalListHeader.html", {});

        for (const journal of game.journal) {
            const group = journal.name.at(0).toUpperCase();
            template = await renderTemplate("modules/rwk-tools/templates/journalButton.html", {
                data: {
                    group: group,
                    data: journal
                }
            });
            catHtml.push({ name: journal.name, value: template });
        }

        catHtml.sort((a, b) => {
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
            return 0;
        });

        let group = catHtml[0].name.at(0).toUpperCase();
        dialogHtml += await renderTemplate("modules/rwk-tools/templates/groupButton.html", { data: group });
        for (const element of catHtml) {
            if (element.name === "AzgaarFM" || element.name === "") continue;
            if (group !== element.name.at(0).toUpperCase()) {
                group = element.name.at(0).toUpperCase();
                dialogHtml += await renderTemplate("modules/rwk-tools/templates/closeDiv.html", {});
                dialogHtml += await renderTemplate("modules/rwk-tools/templates/groupButton.html", { data: group });
            }
            dialogHtml += element.value;
        }
        dialogHtml += await renderTemplate("modules/rwk-tools/templates/closeDiv.html", {});

        html.find(".rwk-merge-journals").last().prepend(dialogHtml);
        this.attachEventListeners(html);
    }

    static attachEventListeners(html) {
        /* radio selector for pin fixer zoom types */
        html.find("#keep-second").on('change', (event) => {
            ui.notifications.info("check!");
            MergeJournalsDialog.keepOther = event.target.checked;
        });
        /* buttons for collapsible list show/hide */
        html.find(".collapsible").on('click', (event) => {
            event.currentTarget.classList.toggle("opened");
            var content = event.currentTarget.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
        /* copy which note has been selected as the duplicator */
        html.find(".rwk-journal").on('click', (event) => {
            if (!game.keyboard_downKeys) {
                MergeJournalsDialog.otherJournalId = event.target.dataset?.id;
                ui.notifications.info(event.target.innerText + " journal data copied.");
            }
            return false;
        });
        /* stop selection of note duplicator when pressing Enter */
        html.find(".mapnote").on('keydown', (event) => {
            return false;
        });
        /* process changes to the search input box */
        html.find('.filter[data-type=text] input, .filter[data-type=text] select').on('keyup change paste', event => {
            if (event.key === "Enter") return;

            const group = $(event.target).parents('.filter').data('cat');
            const key = group.replace(/\./g, '');
            const value = event.target.value.toLowerCase();

            this.replaceList(html, group, value);
        });
    }

    static async replaceList(html, group, searchString) {
        let elements = html.find(`.rwk-journal[data-group='${group}']`);

        if (elements?.length) {
            try {
                for (let element of elements) {

                    if (Object.values(element.classList).includes("filter"))
                        continue;

                    if (!element.innerText.toLowerCase().startsWith(searchString)) {
                        element.style.display = "none";
                    } else {
                        element.style.display = "block"
                    }
                }
            } catch (e) {
                if (e === STOP_SEARCH) {
                    //stopping search early
                }
                else {
                    throw e;
                }
            }
            return;
        }
    }

    async _updateObject(event, formData) {
        const clickedJournal = game.journal.get(MergeJournalsDialog.clickedJournalId);
        const otherJournal = game.journal.get(MergeJournalsDialog.otherJournalId);

        if (!clickedJournal || !otherJournal) return;

        /* If Monks Enhanced Journal is active load the classes required to render it. */
        if (game.modules.get("monks-enhanced-journal")?.active) {

            let update = {};
            update._id = clickedJournal.data._id;

            update.flags = mergeObject(clickedJournal.data.flags, otherJournal.data.flags, { overwrite: false });
            update.flags["monks-enhanced-journal"].relationships = clickedJournal.data.flags["monks-enhanced-journal"].relationships.concat(otherJournal.data.flags["monks-enhanced-journal"].relationships);
            const newContent = clickedJournal.data.content + "<hr>" + otherJournal.data.content;
            update.content = newContent;

            await clickedJournal.update(update);
        } else {
            let update = {};
            update._id = clickedJournal.data._id;

            update.flags = mergeObject(clickedJournal.data.flags, otherJournal.data.flags, { overwrite: false });
            update.data.content = clickedJournal.data.content + "<hr>" + otherJournal.data.content;

            await clickedJournal.update(update);
        }
    }
}
Hooks.on("renderMergeJournalsDialog", (...args) => MergeJournalsDialog.renderMergeDialog(...args));