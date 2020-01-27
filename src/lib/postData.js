import request from './request';
import Progress from './Progress';

let backends = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.ru/cgi/interpreter'
]

export default function postData(data, progress) {
  progress = progress || new Progress();
  const postData = {
    method: 'POST',
    responseType: 'json',
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
      // we can't do much anymore
      throw err;
    } 

    if (err.statusError) {
      progress.notify({
        loaded: -1
      });
    }

    serverIndex += 1;
    return fetchFrom(backends[serverIndex])
  }
}