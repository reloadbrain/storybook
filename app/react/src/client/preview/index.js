/* global window */

import { createStore } from 'redux';
import addons from '@storybook/addons';
import { setPreviewOptionsFn } from '@storybook/addon-options';
import createChannel from '@storybook/channel-postmessage';
import qs from 'qs';
import pick from 'lodash.pick';
import StoryStore from './story_store';
import ClientApi from './client_api';
import ConfigApi from './config_api';
import render, { renderOptions } from './render';
import init from './init';
import { selectStory } from './actions';
import reducer from './reducer';

// check whether we're running on node/browser
const { navigator } = global;
const isBrowser =
  navigator &&
  navigator.userAgent !== 'storyshots' &&
  !(navigator.userAgent.indexOf('Node.js') > -1);

const storyStore = new StoryStore();
const reduxStore = createStore(reducer);
const context = { storyStore, reduxStore };

if (isBrowser) {
  const queryParams = qs.parse(window.location.search.substring(1));
  const channel = createChannel({ page: 'preview' });
  channel.on('setCurrentStory', data => {
    reduxStore.dispatch(selectStory(data.kind, data.story));
  });
  Object.assign(context, { channel, window, queryParams });
  addons.setChannel(channel);
  init(context);
}

const clientApi = new ClientApi(context);
const configApi = new ConfigApi(context);

// do exports
export const storiesOf = clientApi.storiesOf.bind(clientApi);
export const setAddon = clientApi.setAddon.bind(clientApi);
export const addDecorator = clientApi.addDecorator.bind(clientApi);
export const clearDecorators = clientApi.clearDecorators.bind(clientApi);
export const getStorybook = clientApi.getStorybook.bind(clientApi);
export const configure = configApi.configure.bind(configApi);

// initialize the UI
const renderUI = () => {
  if (isBrowser) {
    render(context);
  }
};

reduxStore.subscribe(renderUI);

function previewOptions(options) {
  const renderOpt = pick(options, ['multistorySeparator', 'previewDecorator']);
  if (renderOptions(renderOpt)) render(context);
}

setPreviewOptionsFn(previewOptions);