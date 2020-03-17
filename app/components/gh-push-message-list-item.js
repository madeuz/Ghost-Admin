import Component from '@ember/component';
import {inject as service} from '@ember/service';

export default Component.extend({
    ghostPaths: service(),
    notifications: service(),

    tagName: 'li',
    classNames: ['gh-list-row', 'gh-subscriptions-list-item'],

    _deletePushMessage() {
        let pushMessage = this.pushMessage;

        return pushMessage.destroyRecord().then(() => {}, (error) => {
            this._deletePushMessageFailure(error);
        });
    },

    _deletePushMessageFailure(error) {
        this.notifications.showAPIError(error, {key: 'pushMessage.delete'});
    }
});
