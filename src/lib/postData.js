import request from './request.js';
import Progress from './Progress.js';

let backends = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

export default function postData(data, progress, timeout) {
  progress = progress || new Progress();
  const postData = {
    method: 'POST',
    responseType: 'json',
    timeout,
    progress,
    headers: {
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: 'data=' + encodeURIComponent(data),
  };

  let serverIndex = 0;

  return fetchFrom(backends[serverIndex]);

  function fetchFrom(overpassUrl) {
    return request(overpassUrl, postData, 'POST')
      .catch(handleError);
  }

  function handleError(err) {
    if (err.cancelled) throw err;

    if (serverIndex >= backends.length - 1) {
      // we can't do much anymore - all servers failed
      err.allServersFailed = true;
      err.serversAttempted = backends.length;
      throw err;
    }

    progress.notify({
      loaded: -1
    });

    serverIndex += 1;
    return fetchFrom(backends[serverIndex])
  }
}
