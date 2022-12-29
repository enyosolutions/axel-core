import qs from 'qs';
/**
 *
 *
 * @export
 * @param {*} identity the name of the store
 * @param {*} [storeExtension={}] the items that will extend store (state, getters, mutations, actions)
 * @param {string} [storeOptions={ apiUrl: '' }] the options that will be passed to the store
 * @returns
 */
export default function createDataStore(identity, storeExtension = {}, storeOptions = { apiUrl: '' }) {
  if (!identity) {
    throw new Error('error_missing_identity');
  }
  const apiUrl = storeOptions.apiUrl || identity;
  const initialState = {
    identity,
    items: [],
    itemsCount: 0,
    selectedItem: null,
    ...storeExtension.state,
  };

  // getters
  const getters = {
    ...storeExtension.getters,
  };

  // mutations
  const mutations = {
    items(state, data) {
      state.items = data;
    },
    itemsCount(state, data) {
      state.itemsCount = data;
    },
    selectedItem(state, data) {
      state.selectedItem = data;
    },
    selectedItemStats(state, data) {
      state.selectedItemStats = data;
    },
    ...storeExtension.mutations
  };

  // actions
  const actions = {
    createItem(context, payload) {
      if (!context.rootState.user.user || !context.rootState.user.organisation) {
        console.warn('[STORE][ITEM] user or organisation not defined');
        return Promise.resolve([]);
      }
      return this._vm.$http
        .post(`/api/${apiUrl}`, payload)
        .then((res) => {
          if (res.data && res.data.body) {
            if (res.data.totalCount) {
              context.commit('itemsCount', res.data.totalCount);
            }
            context.dispatch('getItems');
            return res.data.body;
          }
          return [];
        });
    },

    updateItem(context, item) {
      const { id } = item;
      if (!id) {
        throw new Error('error_missing_id_in_put_request');
      }
      if (!context.rootState.user.user || !context.rootState.user.organisation) {
        return Promise.resolve([]);
      }
      return this._vm.$http
        .put(
          `/api/${apiUrl}/${id}`,
          item
        )
        .then((res) => {
          if (res.data && res.data.body) {
            return res.data.body;
          }
          return [];
        });
    },

    async updateManyItems(context, { items, modifications }) {
      const p = items.map((item) =>
        context.dispatch('updateItem', {
          id: item.id,
          ...item,
          ...modifications,
        }));
      return Promise.all(p);
    },

    deleteItem(context, item) {
      const { id } = item;
      if (!id) {
        throw new Error('error_missing_id_in_put_request');
      }
      if (!context.rootState.user.user || !context.rootState.user.organisation) {
        return Promise.resolve([]);
      }
      return this._vm.$http
        .delete(
          `/api/${apiUrl}/${id}`,
          item
        )
        .then((res) => {
          if (res.data && res.data.body) {
            return res.data.body;
          }
          return res.data;
        });
    },

    getItems(context, options = {}) {
      if (!context.rootState.user.user || !context.rootState.user.organisation) {
        console.warn('[STORE][ITEM] user or organisation not defined');
        return Promise.resolve([]);
      }
      if (options.cache && context.state.items && context.state.items.length) {
        return context.state.items;
      }
      return this._vm.$http
        .get(`/api/${apiUrl}`, {
          ...options,
          paramsSerializer(params) {
            return qs.stringify(params, {
              arrayFormat: 'repeat',
            });
          },
        })
        .then((res) => {
          if (res.data && res.data.body) {
            if (res.data.totalCount) {
              context.commit('itemsCount', res.data.totalCount);
            }
            context.commit('items', res.data.body);
            return res.data;
          }
          return [];
        });
    },
    getAndSelectItem(context, id) {
      return context.dispatch('getItem', id)
        .then((item) => context.commit('selectedItem', item));
    },

    getItem(context, id) {
      if (!context.rootState.user.user || !context.rootState.user.organisation) {
        return Promise.resolve(null);
      }
      context.commit('selectedItem', null);
      return this._vm.$http
        .get(`/api/${apiUrl}/${id}`)
        .then((res) => {
          if (res.data && res.data.body) {
            context.commit('selectedItem', res.data.body);
            return res.data.body;
          }
          return null;
        });
    },

    getItemStats(context, id, options = {}) {
      if (!context.rootState.user.user || !context.rootState.user.organisation) {
        return Promise.resolve([]);
      }
      const { selectedItemStats } = context.state;
      if (selectedItemStats && selectedItemStats.id && selectedItemStats.id === id && !options.force) {
        return Promise.resolve(selectedItemStats);
      }
      context.commit('selectedItemStats', null);
      return this._vm.$http
        .get(`/api/${apiUrl}/${id}/stats`, options)
        .then((res) => {
          if (res.data && res.data.body) {
            context.commit('selectedItemStats', res.data.body);
            return res.data.body;
          }
          return [];
        });
    },
    ...storeExtension.actions
  };

  return {
    namespaced: true,
    state: initialState,
    getters,
    actions,
    mutations
  };
}
