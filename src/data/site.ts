/**
 * Contact points, in one place.
 */

export const EMAIL = 'hello@foresightmachines.com';

/**
 * Where the decision form posts: FormSubmit, which emails each submission to
 * the address in the URL, with no account or key. The first submission to a
 * new address sends that inbox a one-time "Activate form" link; after it is
 * clicked, every submission arrives on its own. If a post ever fails, the
 * form falls back to the visitor's mail app and shows the message on the
 * page, ready to copy, so nothing is lost.
 */
export const FORM_ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;
