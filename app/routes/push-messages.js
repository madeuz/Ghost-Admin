import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {assign} from '@ember/polyfills';
import {isBlank} from '@ember/utils';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({
    infinity: service(),
    router: service(),

    queryParams: {
        type: {refreshModel: true},
        order: {refreshModel: true}
    },

    modelName: 'push-message',

    perPage: 30,

    init() {
        this._super(...arguments);

        // if we're already on this route and we're transiting _to_ this route
        // then the filters are being changed and we shouldn't create a new
        // browser history entry
        // see https://github.com/TryGhost/Ghost/issues/11057
        this.router.on('routeWillChange', (transition) => {
            if (transition.to && this.routeName === 'push-messages') {
                let toThisRoute = transition.to.find(route => route.name === this.routeName);
                if (transition.from && transition.from.name === this.routeName && toThisRoute) {
                    transition.method('replace');
                }
            }
        });
    },

    model(params) {
        return this.session.user.then(() => {
            let queryParams = {};
            let filterParams = {};
            let paginationParams = {
                perPageParam: 'limit',
                totalPagesParam: 'meta.pagination.pages'
            };

            assign(filterParams, this._getTypeFilters(params.type));

            let filter = this._filterString(filterParams);
            if (!isBlank(filter)) {
                queryParams.filter = filter;
            }

            if (!isBlank(params.order)) {
                queryParams.order = params.order;
            }

            let perPage = this.perPage;
            let paginationSettings = assign({perPage, startingPage: 1}, paginationParams, queryParams);

            return this.infinity.model(this.modelName, paginationSettings);
        });
    },

    actions: {
        queryParamsDidChange() {
            // scroll back to the top
            let contentList = document.querySelector('.content-list');
            if (contentList) {
                contentList.scrollTop = 0;
            }

            this._super(...arguments);
        }
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'PushMessages'
        };
    },

    _getTypeFilters(type) {
        let status = '[draft,scheduled,sent]';

        switch (type) {
        case 'draft':
            status = 'draft';
            break;
        case 'published':
            status = 'published';
            break;
        case 'sent':
            status = 'sent';
            break;
        }

        return {
            status
        };
    },

    _filterString(filter) {
        return Object.keys(filter).map((key) => {
            let value = filter[key];

            if (!isBlank(value)) {
                return `${key}:${filter[key]}`;
            }
        }).compact().join('+');
    }
});
