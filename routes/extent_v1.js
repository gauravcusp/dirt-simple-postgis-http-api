const Joi = require('joi');
const config = require('../config');
const db = require('../config/db.js');
const squel = require('squel').useFlavour('postgres');

function formatSQL(request) {
  var extent = `
    ST_Extent(ST_Transform(${request.query.geom_column}, ${request.query.srid}))
  `;

  var sql = squel
    .select()
    .from(request.params.table)
    .field(extent, 'extent')
    .where(request.query.filter ? request.query.filter : '')
    .limit(10);

  return sql.toString();
}

module.exports = [
  {
    method: 'GET',
    path: '/bbox/v1/{table}',
    config: {
      description: 'feature extent',
      notes: 'Gets the bounding box of a feature(s).',
      tags: ['api'],
      validate: {
        params: {
          table: Joi.string()
            .required()
            .description('name of the table'),
        },
        query: {
          geom_column: Joi.string()
            .default('geom')
            .description(
              'The geometry column of the table. The default is <em>geom</em>.',
            ),
          srid: Joi.number()
            .integer()
            .default(4326)
            .description(
              'The SRID for the returned centroid. The default is <em>4326</em> WGS84 Lat/Lng.',
            ),
          filter: Joi.string().description(
            'Filtering parameters for a SQL WHERE statement.',
          ),
        },
      },
      jsonp: 'callback',
      cache: config.cache,
      handler: function(request, reply) {
        db
          .query(formatSQL(request))
          .then(function(data) {
            reply(data);
          })
          .catch(function(err) {
            reply({
              error: 'error running query',
              error_details: err,
            });
          });
      },
    },
  },
];
