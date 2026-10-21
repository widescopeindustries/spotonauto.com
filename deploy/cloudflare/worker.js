/**
 * AllOEMManuals public-access pass-through.
 * The custom crawler/payment gate was retired on 2026-10-09 for Mediavine launch.
 * Public pages must remain reachable by human reviewers, ad/verification agents,
 * and unknown automated clients. Do not restore UA/ASN/score-based payment gates
 * or redirects from public pages to paid feeds.
 * Cloudflare security settings and origin API authorization remain independent.
 */
export default {
  async fetch(request) {
    return fetch(request);
  },
};
