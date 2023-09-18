export const WF_WIDTH = 700
const rxUrl = /^(https?:\/\/)?(\w+\.)?workflowy.com/
const rxHash = /^\/?#/

export function isWfUrl (input) {
  return rxHash.test(input) || rxUrl.test(input)
}

/**
 * Ensure a valid WorkFlowy URL
 *
 * @param   {string}  input   Either a hash #xxxxxxxx or full WorkFlowy URL
 * @param   {string}  origin  Optional WorkFlowy https:// origin
 * @return  {string}          A sanitised URL
 */
export function makeWfUrl (input, origin = window.location.origin) {
  // non wf urls; return as-is
  if (!isWfUrl(input)) {
    return input
  }

  // sanitize path
  let path = input
    .replace(rxUrl, '')
    .replace(rxHash, '/#')

  // ensure path ends with hash
  if (path.length < 2) {
    path = '/#'
  }

  // return url
  return origin + path
}
