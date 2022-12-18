"use strict";

var mapnik = require('../');
var assert = require('assert');
var path = require('path');

mapnik.register_datasource(path.join(mapnik.settings.paths.input_plugins,'geojson.input'));

describe('mapnik.Geometry ', function() {
    it('should throw with invalid usage', function() {
        // geometry cannot be created directly for now
        assert.throws(function() { mapnik.Geometry(); });
    });

    it('should access a geometry from a feature', function() {
        var feature = new mapnik.Feature(1);
        var point = {
         "type": "MultiPoint",
         "coordinates": [[0,0],[1,1]]
        };
        var input = {
            type: "Feature",
            properties: {},
            geometry: point
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.type(),mapnik.Geometry.MultiPoint);
        assert.deepEqual(JSON.parse(geom.toJSONSync()),point);
        var expected_wkb = new Buffer.from('0104000000020000000101000000000000000000000000000000000000000101000000000000000000f03f000000000000f03f', 'hex');
        assert.deepEqual(geom.toWKB(),expected_wkb);
    });

    it('should fail on toJSON due to bad parameters', function() {
        var feature = new mapnik.Feature(1);
        var point = {
         "type": "MultiPoint",
         "coordinates": [[0,0],[1,1]]
        };
        var input = {
            type: "Feature",
            properties: {},
            geometry: point
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.type(),mapnik.Geometry.MultiPoint);
        assert.throws(function() { geom.toJSONSync(null); });
        assert.throws(function() { geom.toJSONSync({transform:null}); });
        assert.throws(function() { geom.toJSONSync({transform:{}}); });
        assert.throws(function() { geom.toJSON(null, function(err,json) {}); });
        assert.throws(function() { geom.toJSON({transform:null}, function(err, json) {}); });
        assert.throws(function() { geom.toJSON({transform:{}}, function(err, json) {}); });
    });

    it('should throw if we attempt to create a Feature from a geojson geometry (rather than geojson feature)', function() {
        var geometry = {
            type: 'Point',
            coordinates: [ 7.415119300000001, 43.730364300000005 ]
        };
        // starts throwing, as expected, at Mapnik v3.0.9 (https://github.com/mapnik/node-mapnik/issues/560)
        if (mapnik.versions.mapnik_number >= 300009) {
            assert.throws(function() {
                var transformed = mapnik.Feature.fromJSON(JSON.stringify(geometry));
            });
        }
    });

    it('should throw from empty geometry from toWKB', function() {
        var s = new mapnik.Feature(1);
        assert.throws(function() {
            var geom = s.geometry().toWKB();
        });
    });

    it('should return a type name for a Point', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: [ 10, 15 ]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.typeName(), 'Point');
    });

    it('should return a type name for a LineString', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [[ 10, 15 ], [ 20, 30 ]]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.typeName(), 'LineString');
    });

    it('should return a type name for a Polygon', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [[[ 10, 15 ], [ 20, 30 ], [ 40, 30 ], [ 10, 15 ]]]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.typeName(), 'Polygon');
    });

    it('should return a type name for a MultiPoint', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiPoint',
                coordinates: [[ 10, 15 ], [ 20, 30 ]]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.typeName(), 'MultiPoint');
    });

    it('should return a type name for a MultiLineString', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiLineString',
                coordinates: [[[ 10, 15 ], [ 20, 30 ]], [[ 40, 30 ], [ 10, 15 ]]]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.typeName(), 'MultiLineString');
    });

    it('should return a type name for a MultiPolygon', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'MultiPolygon',
                coordinates: [
                    [[[ 10, 15 ], [ 20, 30 ], [ 40, 30 ], [ 10, 15 ]]],
                    [[[ 40, 55 ], [ 60, 70 ], [ 80, 70 ], [ 40, 55 ]]]
                ]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.typeName(), 'MultiPolygon');
    });

    it('should return a type name for a GeometryCollection', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'GeometryCollection',
                geometries: [
                    {
                        type: 'LineString',
                        coordinates: [[ 10, 15 ], [ 20, 30 ]]
                    },
                    {
                        type: 'Point',
                        coordinates: [ 10, 15 ]
                    }
                ]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        assert.equal(geom.typeName(), 'GeometryCollection');
    });

    it('should return a type name for a broken geometry', function() {
        var input = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Point',
                coordinates: [ 10, 15 ]
            }
        };
        var f = new mapnik.Feature.fromJSON(JSON.stringify(input));
        var geom = f.geometry();
        geom.type = function() { return 777; }
        assert.equal(geom.typeName(), 'Unknown');
    });
});
