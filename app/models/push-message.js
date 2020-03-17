import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
    title: attr('string'),
    excerpt: attr('string'),
    icon: attr('string'),
    photo: attr('string'),
    clickURL: attr('string'),
    expiryAtUTC: attr('moment-utc'),
    scheduledAtUTC: attr('moment-utc'),
    status: attr('string'),
    createdAtUTC: attr('moment-utc'),
    updatedAtUTC: attr('moment-utc'),
    createdBy: attr('number'),
    updatedBy: attr('number')
});
