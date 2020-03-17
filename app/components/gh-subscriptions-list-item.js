import Component from '@ember/component';
import {inject as service} from '@ember/service';

export default Component.extend({
    ghostPaths: service(),
    notifications: service(),

    tagName: 'li',
    classNames: ['gh-list-row', 'gh-subscriptions-list-item'],

    _deleteSubscription() {
        let subscription = this.subscription;

        return subscription.destroyRecord().then(() => {}, (error) => {
            this._deleteSubscriptionFailure(error);
        });
    },

    _deleteSubscriptionFailure(error) {
        this.notifications.showAPIError(error, {key: 'subscription.delete'});
    }
});
