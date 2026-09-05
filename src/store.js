import Conf from 'conf';

const store = new Conf({
  projectName: 'echo-server',
  defaults: {
    port: 4703,
    eom: '\r',
    subscribers: [],
  },
});

export function getSettings() {
  return {
    port: store.get('port'),
    eom: store.get('eom'),
  };
}

export function setPort(port) {
  store.set('port', port);
}

export function setEOM(eom) {
  store.set('eom', eom);
}

export function getSubscribers() {
  return store.get('subscribers');
}

export function setSubscribers(subscribers) {
  store.set('subscribers', subscribers);
}
