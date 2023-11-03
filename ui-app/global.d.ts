// Use type safe message keys with `next-intl`, based on the contents/keys of
// our default english locale.
type Messages = typeof import('./messages/en.json');
declare interface IntlMessages extends Messages {}
