'use strict';

const attackMultipliers = require('./gm-typeEffective');
const assert = require('assert').strict;

const orderedTypes = [
  'NORMAL',
  'FIGHTING',
  'FLYING',
  'POISON',
  'GROUND',
  'ROCK',
  'BUG',
  'GHOST',
  'STEEL',
  'FIRE',
  'WATER',
  'GRASS',
  'ELECTRIC',
  'PSYCHIC',
  'ICE',
  'DRAGON',
  'DARK',
  'FAIRY'
];

const monolithicTypeChart = orderedTypes.map(function makeRow(name) {
  return attackMultipliers[name].map(function multiplierToString(val) {
    if (val < 0.4) return 'I'; // immune
    if (val < 0.9) return 'R'; // resist / not very effective
    if (val < 1.1) return 'N'; // neutral
    if (val < 1.7) return 'S'; // super effective
    assert.fail(TypeError('Unexpected value: ' + val));
  })
})

assert.equal(monolithicTypeChart.length, monolithicTypeChart[0].length);

const splitTypeChart = orderedTypes.map(function makeMatchupChart(name, i) {
  const chart = { type: name };

  for (let from of 'IRNS') {
    for (let to of 'IRNS') {
      chart[from + to] = [];
    }
  }

  orderedTypes.forEach(function pushType(_unused, j) {
    const to = monolithicTypeChart[i][j];
    const from = monolithicTypeChart[j][i];
    chart[from + to].push(j);
  });

  return chart;
});

exports.orderedTypes = orderedTypes;
exports.splitTypeChart = splitTypeChart;
exports.monolithicTypeChart = monolithicTypeChart;