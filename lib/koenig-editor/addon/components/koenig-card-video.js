import $ from 'jquery';
import Component from '@ember/component';
import layout from '../templates/components/koenig-card-video';
import {action, computed, set, setProperties} from '@ember/object';
import {utils as ghostHelperUtils} from '@tryghost/helpers';
import {isEmpty} from '@ember/utils';
import {run} from '@ember/runloop';
import {inject as service} from '@ember/service';

const VIDEO_EXTENSIONS = ['3gp', 'mp4', 'm4a', 'm4p', 'm4b', 'm4r', 'm4v', 'm1v', 'ogg', 'mov', 'qt', 'webm', 'm4v', 'asf', 'wma', 'wmv', 'avi'];
const VIDEO_MIME_TYPES = 'video/3gpp,video/mp4,video/mpeg,video/ogg,video/quicktime,video/webm,video/x-m4v,video/ms-asf,video/x-ms-wmv,video/x-msvideo';

const {countWords} = ghostHelperUtils;

export default Component.extend({
    ghostPaths: service(),
    ajax: service(),
    notifications: service(),
    ui: service(),
    layout,

    // attrs
    editor: null,
    files: null,
    payload: null,
    isSelected: false,
    isEditing: false,
    isProcessing: false,
    processingProgress: 0,
    processingProgressCircle: Math.PI * (90 * 2),
    videoExtensions: VIDEO_EXTENSIONS,
    videoMimeTypes: VIDEO_MIME_TYPES,

    // properties
    handlesDragDrop: true,

    // closure actions
    selectCard() {},
    deselectCard() {},
    editCard() {},
    saveCard() {},
    deleteCard() {},
    moveCursorToNextSection() {},
    moveCursorToPrevSection() {},
    addParagraphAfterCard() {},
    registerComponent() {},

    videoSelector: computed('payload.videoSelector', function () {
        let selector = this.payload.videoSelector;
        let videoSelectors = {
            unsplash: 'gh-unsplash'
        };

        return videoSelectors[selector];
    }),

    counts: computed('payload.{src,caption}', function () {
        let wordCount = 0;
        let videoCount = 0;

        if (this.payload.src) {
            videoCount += 1;
        }

        if (this.payload.caption) {
            wordCount += countWords(this.payload.caption);
        }

        return {wordCount, videoCount};
    }),

    kgVideoStyle: computed('payload.cardWidth', function () {
        let cardWidth = this.payload.cardWidth;

        if (cardWidth === 'wide') {
            return 'video-wide';
        }

        if (cardWidth === 'full') {
            return 'video-full';
        }

        return 'video-normal';
    }),

    toolbar: computed('payload.{cardWidth,src}', function () {
        if (!this.payload.src) {
            return false;
        }

        let cardWidth = this.payload.cardWidth;

        return {
            items: [{
                title: 'Regular',
                icon: 'koenig/kg-img-regular',
                iconClass: `${!cardWidth ? 'fill-blue-l2' : 'fill-white'}`,
                action: run.bind(this, this._changeCardWidth, '')
            }, {
                title: 'Wide',
                icon: 'koenig/kg-img-wide',
                iconClass: `${cardWidth === 'wide' ? 'fill-blue-l2' : 'fill-white'}`,
                action: run.bind(this, this._changeCardWidth, 'wide')
            }, {
                title: 'Full',
                icon: 'koenig/kg-img-full',
                iconClass: `${cardWidth === 'full' ? 'fill-blue-l2' : 'fill-white'}`,
                action: run.bind(this, this._changeCardWidth, 'full')
            }, {
                divider: true
            }, {
                title: 'Replace video',
                icon: 'koenig/kg-replace',
                iconClass: 'fill-white',
                action: run.bind(this, this._triggerFileDialog)
            }]
        };
    }),

    init() {
        this._super(...arguments);

        if (!this.payload) {
            this.set('payload', {});
        } else if (this.payload.width && this.payload.height) {
            this.set('aspectRatio', (this.payload.height / this.payload.width) * 100);
        }

        let placeholders = ['summer', 'mountains', 'ufo-attack'];
        this.set('placeholder', placeholders[Math.floor(Math.random() * placeholders.length)]);

        this.registerComponent(this);
    },

    didReceiveAttrs() {
        this._super(...arguments);

        // `payload.files` can be set if we have an externaly set video that
        // should be uploaded. Typical example would be from a paste or drag/drop
        if (!isEmpty(this.payload.files)) {
            run.schedule('afterRender', this, function () {
                this.set('files', this.payload.files);

                // we don't want to  persist any file data in the document
                delete this.payload.files;
            });
        }
    },

    actions: {
        requestProcessing(pids) {
            const [pid] = pids;
            const processingUrl = this.get('ghostPaths.url').api('processing');
            this.set('isProcessing', true);
            
            this.ajax.request(`${processingUrl}${pid.url}/`).then((data) => {
                if (data.error) {
                    throw data.error;
                }
                
                if (data.finished) {
                    this.editor.run(() => {
                        this._updatePayloadAttr('src', data.url);
                        this._updatePayloadAttr('width', data.video.width);
                        this._updatePayloadAttr('height', data.video.height);
                        this.set('aspectRatio', (data.video.height / data.video.width) * 100);
                    });
                    this.set('isProcessing', false);
                    this.ajax.del(`${processingUrl}${pid.url}/`);
                } else {
                    if (!isNaN(data.progress)) {
                        this.set('processingProgress', data.progress.toFixed(2) || 0);
                        this.set('processingProgressCircle', ((100 - data.progress) / 100) * Math.PI * (90 * 2));
                    }
                    setTimeout(this.actions.requestProcessing.bind(this, [{url: pid.url}]), 1000);
                }
            }).catch((error) => {
                this.notifications.showAPIError(error);
            });
        },

        /**
         * Opens a file selection dialog - Triggered by "Upload Video" buttons,
         * searches for the hidden file input within the .gh-setting element
         * containing the clicked button then simulates a click
         * @param  {MouseEvent} event - MouseEvent fired by the button click
         */
        triggerFileDialog(event) {
            this._triggerFileDialog(event);
        },

        resetSrcs() {
            // create undo snapshot when clearing
            this.editor.run(() => {
                this._updatePayloadAttr('src', null);
            });
        },

        selectFromVideoSelector({src, caption, width, height}) {
            let {payload, saveCard} = this;
            let searchTerm;

            setProperties(payload, {src, caption, width, height, searchTerm});

            this.send('closeVideoSelector');

            // create undo snapshot when selecting an video
            this.editor.run(() => {
                saveCard(payload, false);
            });
        },

        closeVideoSelector() {
            if (!this.payload.src) {
                return this.deleteCard();
            }

            set(this.payload, 'videoSelector', undefined);

            // ensure focus is returned to the editor so that the card which
            // appears selected behaves as if it's selected
            this.editor.focus();
        }
    },

    updateCaption: action(function (caption) {
        this._updatePayloadAttr('caption', caption);
    }),

    dragOver(event) {
        if (!event.dataTransfer) {
            return;
        }

        // this is needed to work around inconsistencies with dropping files
        // from Chrome's downloads bar
        if (navigator.userAgent.indexOf('Chrome') > -1) {
            let eA = event.dataTransfer.effectAllowed;
            event.dataTransfer.dropEffect = (eA === 'move' || eA === 'linkMove') ? 'move' : 'copy';
        }

        event.stopPropagation();
        event.preventDefault();

        this.set('isDraggedOver', true);
    },

    dragLeave(event) {
        event.preventDefault();
        this.set('isDraggedOver', false);
    },

    drop(event) {
        event.preventDefault();
        this.set('isDraggedOver', false);

        if (event.dataTransfer.files) {
            this.set('files', [event.dataTransfer.files[0]]);
        }
    },

    _changeCardWidth(cardWidth) {
        // create undo snapshot when changing video size
        this.editor.run(() => {
            this._updatePayloadAttr('cardWidth', cardWidth);
        });
    },

    _updatePayloadAttr(attr, value) {
        let payload = this.payload;
        let save = this.saveCard;

        set(payload, attr, value);

        // update the mobiledoc and stay in edit mode
        save(payload, false);
    },

    _triggerFileDialog(event) {
        let target = event && event.target || this.element;

        // simulate click to open file dialog
        // using jQuery because IE11 doesn't support MouseEvent
        $(target)
            .closest('.__mobiledoc-card')
            .find('input[type="file"]')
            .click();
    }
});
