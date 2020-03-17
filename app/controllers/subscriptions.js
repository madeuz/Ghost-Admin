import Controller from '@ember/controller';
import {alias} from '@ember/object/computed';
import {computed} from '@ember/object';
import {get} from '@ember/object';
import {inject as service} from '@ember/service';

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

    session: service(),
    store: service(),

    queryParams: ['tag', 'order'],

    tag: null,
    order: null,

    _hasLoadedTags: false,

    availableOrders: null,

    init() {
        this._super(...arguments);
        this.availableOrders = ORDERS;
    },

    subscriptionsInfinityModel: alias('model'),

    showingAll: computed('tag', function () {
        let {tag} = this.getProperties(['tag']);

        return !tag;
    }),

    selectedOrder: computed('order', function () {
        let orders = this.get('availableOrders');
        return orders.findBy('value', this.get('order'));
    }),

    _availableTags: computed(function () {
        return this.get('store').peekAll('tag');
    }),

    availableTags: computed('_availableTags.[]', function () {
        let tags = this.get('_availableTags')
            .filter(tag => tag.get('id') !== null)
            .sort((tagA, tagB) => tagA.name.localeCompare(tagB.name, undefined, {ignorePunctuation: true}));
        let options = tags.toArray();

        options.unshiftObject({name: 'All tags', slug: null});

        return options;
    }),

    selectedTag: computed('tag', '_availableTags.[]', function () {
        let tag = this.get('tag');
        let tags = this.get('availableTags');

        return tags.findBy('slug', tag);
    }),

    tagClassNames: computed('tag', function () {
        let classNames = 'gh-contentfilter-menu gh-contentfilter-type';
        if (this.get('tag')) {
            classNames = classNames + ' gh-contentfilter-selected';
        }
        return classNames;
    }),

    actions: {
        changeTag(tag) {
            this.set('tag', get(tag, 'slug'));
        },

        changeOrder(order) {
            this.set('order', get(order, 'value'));
        },

        showSubscription(subscription) {
            this.transitionToRoute('subscriptions.read', 'subscription', subscription.get('id'));
        }
    }
});
