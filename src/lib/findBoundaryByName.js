import request from './request';

export default function findBoundaryByName(inputName) {
  let name = encodeURIComponent(inputName);
  return request(`https://nominatim.openstreetmap.org/search?format=json&q=${name}`, {responseType: 'json'})
      .then(extractBoundaries);
}

function extractBoundaries(x) {
  let areas = x.map(row => {
      let areaId, bbox;
      if (row.osm_type === 'relation') {
        // By convention the area id can be calculated from an existing 
        // OSM way by adding 2400000000 to its OSM id, or in case of a 
        // relation by adding 3600000000 respectively. So we are adding this
        // https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#By_area_.28area.29
        // Note: we may want to do another case for osm_type = 'way'. Need to check
        // if it returns correct values.
        areaId = row.osm_id + 36e8;
      } else if (row.osm_type === 'way') {
        areaId = row.osm_id + 24e8;
      }
      if (row.boundingbox) {
        bbox = [
          Number.parseFloat(row.boundingbox[0]),
          Number.parseFloat(row.boundingbox[2]),
          Number.parseFloat(row.boundingbox[1]),
          Number.parseFloat(row.boundingbox[3]),
        ];
      }

      return {
        areaId,
        bbox,
        osmId: row.osm_id,
        name: row.display_name,
        type: row.type,
      };
    });

  return areas;
}