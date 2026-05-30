/**
 * EMERGENCY KILL SWITCH
 * Deploy this to immediately disable all Tollbit redirects.
 * This worker does nothing except pass requests to origin.
 */
export default {
  async fetch(request) {
    return fetch(request);
  }
};
