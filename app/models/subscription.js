import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
    endpoint: attr('string'),
    p256dh: attr('string'),
    auth: attr('string'),
    expirationTime: attr('string'), // unused
    ip: attr('string'),
    tag: attr('string'),
    url: attr('string'),
    createdAtUTC: attr('moment-utc'),
    updatedAtUTC: attr('moment-utc')
});

