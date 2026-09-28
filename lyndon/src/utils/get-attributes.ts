/**
 * Filter props from attributes.
 *
 * @param {array} props
 * @param {array} attributes
 */
// eslint-disable-next-line
export const getAttributes = (props: string[], attributes: any[]) => {
  return attributes.filter(a => a && !props.includes(a.name)).reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});
};
