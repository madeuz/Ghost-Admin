/* eslint-disable camelcase */
import ApplicationSerializer from 'ghost-admin/serializers/application';
import {camelize} from '@ember/string';
import {pluralize} from 'ember-inflector';

export default ApplicationSerializer.extend({
    attrs: {
        clickURL: {key: 'click_url'},
        expiryAtUTC: {key: 'expiry_at'},
        scheduledAtUTC: {key: 'scheduled_at'},
        createdAtUTC: {key: 'created_at'},
        updatedAtUTC: {key: 'updated_at'}
    },

    // if we use `queryRecord` ensure we grab the first record to avoid
    // DS.SERIALIZER.REST.QUERYRECORD-ARRAY-RESPONSE deprecations
    normalizeResponse(store, primaryModelClass, payload, id, requestType) {
        if (requestType === 'queryRecord') {
            let singular = primaryModelClass.modelName;
            let plural = pluralize(singular);

            if (payload[plural]) {
                payload[singular] = payload[plural][0];
                delete payload[plural];
            }
        }
        return this._super(...arguments);
    },

    payloadKeyFromModelName(modelName) {
        return camelize(modelName).toLowerCase();
    }
});

