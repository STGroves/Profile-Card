import Utilities from '@stgroves/js-utilities/utilities.js';

class ProfileCard extends HTMLElement {
    /**
     * @type {Data}
     */
    #data;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});

        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';

        this.shadowRoot.appendChild(style);
    }

    async connectedCallback() {
        const dataURL = this.getAttribute('data-url');

        if (!dataURL)
            throw new Error('No data URL provided');

        Utilities.loadCSSFromFile(new URL('style.css', import.meta.url))
            .then(css => {
                this.shadowRoot.adoptedStyleSheets = [css.sheet];
            });

        fetch(dataURL).then(response => console.log(response.json()));

        Utilities.loadJSONFromFile(dataURL)
            .then(/** @param {Data} json */json => {
                this.#data = json;
                this.#createCard();
            });
    }

    #createCard() {
        const root = document.createElement('div');

        const columns = [
            {infoColumn: [this.#createCardInfo, this.#createSkillArea]},
            {miscColumn: [this.#createProfileImage, this.#createLinks]}
        ];

        columns.forEach(column => {
            Object.entries(column).forEach(([key, value]) => {
                root.appendChild(this.#createColumn(key, value));
            });
        });

        root.id = 'profile-card';

        this.shadowRoot.appendChild(root);
    }

    /**
     *
     * @param {string} label
     * @param {ProfileCard~SectionCallback[]} callbacks
     */
    #createColumn(label, callbacks) {
        const column = document.createElement('div');
        column.id = label;

        callbacks.forEach(callback => {
            const element = callback();
            column.append(element);
        });

        return column;
    }

    #createCardInfo() {
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');

        this.#data.profileInfo.forEach(dataRow => {
            const row = document.createElement('tr');
            const col = document.createElement('td');

            dataRow.forEach((entry) => {
                const div = document.createElement('div');
                div.classList.add('spanWrapper');

                Object.entries(entry).forEach(
                    /** @param {string} key
                     * @param {string} value
                     */
                    ([key, value]) => {
                        const span = document.createElement('span');
                        span.id = key;
                        span.innerText = value;
                        div.appendChild(span);
                    });

                col.appendChild(div);
            });

            row.appendChild(col);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        return table;
    }

    #createSkillArea() {
        const skillsObj = this.#data.skills;

        const skillArea = document.createElement('section');
        const skillHeader = document.createElement('h2');
        const skillGroup = document.createElement('ul');

        skillArea.id = 'skills-area';

        skillHeader.id = 'proficiencies';
        skillHeader.textContent = 'Proficiencies';

        skillGroup.id = 'skills';

        Utilities.loadJSONFromFile(skillsObj.fileURL).then(json => {
            const skillsArray = Object.values(json).flat();
            const property = skillsObj.propertyKey;

            skillsArray.sort((a, b) => b.confidence - a.confidence)
                .slice(0, skillsObj.amount)
                .sort((a, b) => a[property].localeCompare(b[property]))
                .map(skill => {
                    const skillTag = document.createElement('li');

                    skillTag.classList.add('skillTag');
                    skillTag.textContent = skill[property];

                    skillGroup.append(skillTag);
                });

            skillArea.append(skillHeader, skillGroup);
        });

        return skillArea;
    }

    #createProfileImage() {
        const profileImageObj = this.#data.profileImage;

        const figure = document.createElement('figure');
        const img = document.createElement('img');
        const figcaption = document.createElement('figcaption');

        figure.id = 'profile-image';

        img.src = profileImageObj.imageURL;
        img.alt = 'Profile Image';

        figcaption.id = 'badge';
        figcaption.textContent = profileImageObj.badge;

        figure.append(img, figcaption);

        return figure;
    }

    #createLinks() {
        const section = document.createElement('section');

        section.id = 'profile-links';
        section.setAttribute('part', 'linkSection');

        Utilities.loadJSONFromFile(this.#data.linkURL).then(json => {
            json.links.forEach(/**@param {{iconClasses: string, name: string, url: string}} link */link => {
                const a = document.createElement('a');

                a.innerHTML = link.iconClasses;
                a.href = link.url;
                a.title = link.name;
                a.setAttribute('part', `link-${link.name}`);

                section.append(a);
            });
        });

        return section;
    }
}

customElements.define('profile-card', ProfileCard);

/**
 * @callback ProfileCard~SectionCallback
 * @returns {HTMLElement}
 */

/**
 * @typedef {{
 * profileInfo: Object.<string,string>[][],
 * profileImage: {imageURL: string, badge: string},
 * skills: {amount: number, fileURL: string, propertyKey: string},
 * linkURL: string
 * }} Data
 */