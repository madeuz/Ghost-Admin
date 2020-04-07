import Controller, {inject as controller} from '@ember/controller';
import {alias} from '@ember/object/computed';
import {computed} from '@ember/object';
import {get} from '@ember/object';
import {inject as service} from '@ember/service';

const TYPES = [{
    name: 'All push messages',
    value: null
}, {
    name: 'Draft push messages',
    value: 'draft'
}, {
    name: 'Scheduled push messages',
    value: 'scheduled'
}, {
    name: 'Sent push messages',
    value: 'sent'
}];

const ORDERS = [{
    name: 'Newest',
    value: null
}, {
    name: 'Oldest',
    value: 'created_at asc'
}, {
    name: 'Recently updated',
    value: 'updated_at desc'
}];

export default Controller.extend({

    pushMessageController: controller('pushMessages.new'),

    session: service(),
    store: service(),

    queryParams: ['status', 'order'],

    type: null,
    order: null,

    availableTypes: null,
    availableOrders: null,

    init() {
        this._super(...arguments);
        this.availableTypes = TYPES;
        this.availableOrders = ORDERS;
    },

    selectedPushMessage: alias('pushMessageController.pushMessage'),

    pushMessagesInfinityModel: alias('model'),

    showingAll: computed('type', function () {
        let {type} = this.getProperties(['type']);

        return !type;
    }),

    selectedType: computed('type', function () {
        let types = this.get('availableTypes');
        return types.findBy('value', this.get('type'));
    }),

    selectedOrder: computed('order', function () {
        let orders = this.get('availableOrders');
        return orders.findBy('value', this.get('order'));
    }),

    typeClassNames: computed('type', function () {
        let classNames = 'gh-contentfilter-menu gh-contentfilter-type';
        if (this.get('type')) {
            classNames = classNames + ' gh-contentfilter-selected';
        }
        return classNames;
    }),

    actions: {
        changeType(type) {
            this.set('type', get(type, 'value'));
        },

        changeOrder(order) {
            this.set('order', get(order, 'value'));
        },

        openEditor(pushMessage) {
            this.transitionToRoute('push-message.edit', 'pushMessage', pushMessage.get('id'));
        }
    }
});
