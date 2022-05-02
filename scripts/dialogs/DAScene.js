

export class DAScene extends FormApplication {
    constructor(...args) {
        super(...args);
        game.users.apps.push(this);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Dungeon Alchemist Import",
            id: "da-importer",
            template: "modules/rwk-tools/templates/da-importer.html",
            closeOnSubmit: true,
            popOut: true,
            width: 500,
            height: 710,
        });
    }

    static async init() {
        this.pic;
        this.json;
    }

    activateListeners(html) {
        super.activateListeners(html);
        // Parse map whenever the file input changes.
        DAScene.pic = html.find("#pic").change((event) => this.loadMapImage(event));
        DAScene.json = html.find("#json").change((event) => this.loadMapJSON(event));
    }

    /**
     * Load map file as text
     *
     * @param  {event} event    triggered by change of the "map" input
     * @return {Promise}        resolve once file is loaded.
     */
    loadMapImage(event) {
        return new Promise((resolve, reject) => {
            let input = $(event.currentTarget)[0];
            let fr = new FileReader();
            let file = input.files[0];

            fr.onload = () => {
                resolve(fr.result);
            };
            fr.readAsText(file);
        });
    }

    loadMapJSON(event) {
        return new Promise((resolve, reject) => {
            let input = $(event.currentTarget)[0];
            let fr = new FileReader();
            let file = input.files[0];

            fr.onload = () => {
                resolve(fr.result);
            };
            fr.readAsText(file);
        });
    }

    async _updateObject(event, formData) {

        let picture = DAScene.pic;
        let json = DAScene.json;
    }
}

Hooks.once("init", async (...args) => DAScene.init(...args));
