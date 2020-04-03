import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {isEmpty} from '@ember/utils';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({

    router: service(),

    controllerName: 'push-messages.new',
    templateName: 'push-messages/new',

    init() {
        this._super(...arguments);
        this.router.on('routeWillChange', (transition) => {
            this.showUnsavedChangesModal(transition);
        });
    },

    model() {
        return this.store.createRecord('push-message');
    },

    // reset the model so that mobile screens react to an empty selectedTag
    deactivate() {
        this._super(...arguments);

        let {controller} = this;
        controller.model.rollbackAttributes();
        controller.set('model', null);
    },

    showUnsavedChangesModal(transition) {
        if (transition.from && transition.from.name.match(/^push-messages\.new/) && transition.targetName) {
            let {controller} = this;
            let isUnchanged = isEmpty(Object.keys(controller.pushMessage.changedAttributes()));
            if (!controller.pushMessage.isDeleted && !isUnchanged) {
                transition.abort();
                controller.send('toggleUnsavedChangesModal', transition);
                return;
            }
        }
    }

});
