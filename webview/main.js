/* eslint-disable no-undef */

(function () {
    const vscode = acquireVsCodeApi();

    const { media = [], options = {} } = vscode.getState() || {};

    const mediaList = () => document.querySelector('.media-list');
    const searchField = () => document.querySelector('.search');
    const expansionToggler = () => document.querySelectorAll('.expand-toggler');
    const filterCheckboxes = () => document.querySelectorAll('.filter.checkbox');

    // Initialise
    updateOptions(options);
    updateMediaList(media);

    /**
     * @param {Object} state
     */
    function _updateState(state = {}) {
        vscode.setState({
            ...vscode.getState(),
            ...state,
        });
    }

    /**
     * @param {Object} options
     */
    function updateOptions(options = {}) {
        const { searchTerm = '', omit = [] } = options;
        searchField().value = searchTerm;
        filterCheckboxes().forEach((checkbox) => {
            checkbox.checked = !omit.includes(checkbox.value);
        });
        _updateState({ options });
    }

    /**
     * @param {Array<Object>} media
     */
    function updateMediaList(media = []) {
        mediaList().innerHTML = media.reduce((html, { id, previewHtml, label, description, mimeType }) => {
            return /*html*/ `\
            ${html}
            <li class="media item pointer relative" data-item-id="${id}">
                <a class="open fill" role="button" title="${description}">
                    <div class="preview container fill">${previewHtml}</div>
                    <div class="info">
                        <div class="icon-${mimeType ?? 'unknown'}"></div>
                        <span>${label}</span>
                    </div>
                </a>
                <div class="controls container absolute self-center fill no-event column border-box">
                    <div class="row content-space-between">
                        <vscode-button
                            class="explorer button"
                            appearance="secondary"
                            title="Reveal in Explorer"
                            ariaLabel="Reveal in Explorer"
                        >
                            <span class="codicon codicon-files"></span>
                        </vscode-button>
                        <vscode-button
                            class="link button"
                            appearance="secondary"
                            title="Insert link"
                            ariaLabel="Insert link"
                        >
                            <span class="codicon codicon-link"></span>
                        </vscode-button>
                    </div>
                </div>
            </li>\
            `;
        }, '');

        // Update the saved state
        _updateState({ media });
    }

    /**
     * @param {String} id
     */
    function openMedia(id) {
        vscode.postMessage({ type: 'open', id });
    }

    /**
     * @param {String} id
     */
    function insertMedia(id) {
        vscode.postMessage({ type: 'insert', id });
    }

    /**
     * @param {String} id
     */
    function openInExplorer(id) {
        vscode.postMessage({ type: 'explorer', id });
    }

    /**
     * @param {String | undefined} value
     */
    function search(value) {
        vscode.postMessage({ type: 'search', value });
    }

    /**
     * @param {String} value
     * @param {Boolean} show
     */
    function filter(value, show) {
        vscode.postMessage({ type: 'filter', value, show });
    }

    // Events
    searchField()?.addEventListener('keyup', (_) => {
        search(searchField()?.currentValue);
    });

    expansionToggler().forEach((element) => {
        element.addEventListener('click', (event) => {
            event.target?.closest('.expandable')?.classList.toggle('expanded');
        });
    });

    filterCheckboxes().forEach((element) => {
        element.addEventListener('change', (event) => {
            if (!event.target) return;

            const {
                value,
                checked,
            } = event.target.closest('.checkbox');
            filter(value, checked);
        });
    });

    mediaList()?.addEventListener("click", (event) => {
        if (!event.target) return;

        const getId = () => event.target.closest('[data-item-id]')?.getAttribute('data-item-id');

        if (event.target.closest('.explorer')) {
            const id = getId();
            openInExplorer(id);
        }

        if (event.target.closest('.link')) {
            const id = getId();
            insertMedia(id);
        }

        if (event.target.closest('.open')) {
            const id = getId();
            openMedia(id);
        }
    });

    const getVideoElement = (event) => event.target.closest('.preview video');

    mediaList()?.addEventListener("mouseover", (event) => {
        const video = getVideoElement(event);
        if (video) {
            video.play();
        }
    });

    mediaList()?.addEventListener("mouseout", (event) => {
        const video = getVideoElement(event);
        if (video) {
            video.pause();
        }
    });

    window.addEventListener('message', event => {
        const { data: message } = event;
        switch (message.type) {
            case 'media':
                {
                    const { media = [], options } = message;
                    updateMediaList(media);
                    updateOptions(options);
                    break;
                }
        }
    });
}());


