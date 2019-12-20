import Helper from '@ember/component/helper';
import moment from 'moment';
import {assert} from '@ember/debug';
import {inject as service} from '@ember/service';

export default Helper.extend({
    settings: service(),

    compute([timeago]) {
        assert('You must pass a time to the gh-format-post-time helper', timeago);

        let timezone = this.get('settings.activeTimezone');
        let time = moment.tz(timeago, timezone);
        
        return time.format('DD.MM.YYYY - HH:mm');
    }
});
