/* global key */
import Component from '@ember/component';
import boundOneWay from 'ghost-admin/utils/bound-one-way';
import {computed} from '@ember/object';
import {reads} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Component.extend({
    feature: service(),
    config: service(),
    mediaQueries: service(),

    pushMessage: null,

    isViewingSubview: false,

    // Allowed actions
    setProperty: () => {},
    showDeletePushMessageModal: () => {},

    scratchTitle: boundOneWay('pushMessage.title'),
    scratchExcerpt: boundOneWay('pushMessage.excerpt'),
    scratchClickUrl: boundOneWay('pushMessage.clickURL'),

    isMobile: reads('mediaQueries.maxWidth600'),

    title: computed('pushMessage.isNew', function () {
        if (this.get('pushMessage.isNew')) {
            return 'New Push Message';
        } else {
            return 'Push Message settings';
        }
    }),

    didReceiveAttrs() {
        this._super(...arguments);

        let oldPushMessageId = this._oldPushMessageId;
        let newPushMessageId = this.get('pushMessage.id');

        if (newPushMessageId !== oldPushMessageId) {
            this.reset();
        }

        this._oldPushMessageId = newPushMessageId;
    },

    actions: {
        setProperty(property, value) {
            this.setProperty(property, value);
        },

        setIcon(image) {
            this.setProperty('icon', image);
        },

        clearIcon() {
            this.setProperty('icon', '');
        },

        setPhoto(image) {
            this.setProperty('photo', image);
        },

        clearPhoto() {
            this.setProperty('photo', '');
        },

        deleteTag() {
            this.showDeleteTagModal();
        }
    },

    reset() {
        if (this.$()) {
            this.$('.settings-menu-pane').scrollTop(0);
        }
    },

    focusIn() {
        key.setScope('push-message-settings-form');
    },

    focusOut() {
        key.setScope('default');
    }

});
