import Controller, {inject as controller} from '@ember/controller';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Controller.extend({
    pushMessagesController: controller('pushMessages'),
    notifications: service(),
    router: service(),

    showDeletePushMessageModal: false,

    pushMessage: alias('model'),
    isMobile: alias('tagsController.isMobile'),

    actions: {
        setProperty(propKey, value) {
            this._savePushMessageProperty(propKey, value);
        },

        toggleDeletePushMessageModal() {
            this.toggleProperty('showDeletePushMessageModal');
        },

        deletePushMessage() {
            return this._deletePushMessage();
        },
        save() {
            return this.save.perform();
        },

        toggleUnsavedChangesModal(transition) {
            let leaveTransition = this.leaveScreenTransition;

            if (!transition && this.showUnsavedChangesModal) {
                this.set('leaveScreenTransition', null);
                this.set('showUnsavedChangesModal', false);
                return;
            }

            if (!leaveTransition || transition.targetName === leaveTransition.targetName) {
                this.set('leaveScreenTransition', transition);

                // if a save is running, wait for it to finish then transition
                if (this.save.isRunning) {
                    return this.save.last.then(() => {
                        transition.retry();
                    });
                }

                // we genuinely have unsaved data, show the modal
                this.set('showUnsavedChangesModal', true);
            }
        },

        leaveScreen() {
            let transition = this.leaveScreenTransition;

            if (!transition) {
                this.notifications.showAlert('Sorry, there was an error in the application. Please let the Ghost team know what happened.', {type: 'error'});
                return;
            }

            // roll back changes on model props
            this.tag.rollbackAttributes();

            return transition.retry();
        }
    },

    _savePushMessageProperty(propKey, newValue) {
        let pushMessage = this.pushMessage;
        let currentValue = pushMessage.get(propKey);

        if (newValue) {
            newValue = newValue.trim();
        }

        // Quit if there was no change
        if (newValue === currentValue) {
            return;
        }

        pushMessage.set(propKey, newValue);

        // TODO: This is required until .validate/.save mark fields as validated
        pushMessage.get('hasValidated').addObject(propKey);
    },

    save: task(function* () {
        let pushMessage = this.pushMessage;
        try {
            let savedPushMessage = yield pushMessage.save();
            // replace 'new' route with 'tag' route
            this.replaceRoute('push-messages.new', savedPushMessage);

            return savedPushMessage;
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error, {key: 'pushMessage.save'});
            }
        }
    }),

    _deletePushMessage() {
        let pushMessage = this.pushMessage;

        return pushMessage.destroyRecord().then(() => {
            this._deletePushMessageSuccess();
        }, (error) => {
            this._deletePushMessageFailure(error);
        });
    },

    _deletePushMessageSuccess() {
        let currentRoute = this.router.currentRouteName || '';

        if (currentRoute.match(/^push-messages/)) {
            this.transitionToRoute('push-messages.index');
        }
    },

    _deletePushMessageFailure(error) {
        this.notifications.showAPIError(error, {key: 'pushMessage.delete'});
    }
});
