'use strict';

const { Readable } = require('stream');
const { splitTypeChart, orderedTypes } = require('./lib/type-chart');

const typeClasses = orderedTypes.map((x) => x.toLowerCase());
const displayTypes = typeClasses.map((x) => (x[0].toUpperCase() + x.substring(1)));
const abbrTypes = orderedTypes.map((x) => (
  { 
    'NORMAL': 'NRM',
    'FIGHTING': 'FTG',
    'FLYING': 'FLY',
    'POISON': 'PSN',
    'GROUND': 'GRD',
    'ROCK': 'ROCK',
    'BUG': 'BUG',
    'GHOST': 'GHO',
    'STEEL': 'STL',
    'FIRE': 'FIRE',
    'WATER': 'WTR',
    'GRASS': 'GRS',
    'ELECTRIC': 'ELEC',
    'PSYCHIC': 'PSY',
    'ICE': 'ICE',
    'DRAGON': 'DRG',
    'DARK': 'DARK',
    'FAIRY': 'FRY'
  }[x]
));

function toTitleCase() {
  return this[0].toUpperCase() + this.substr(1).toLowerCase();
}

function typeToListItem(i) {
  return `<li class="${typeClasses[i]}"><span>${abbrTypes[i]}</span></li>`;
}

function typeToImmunityListItem(i) {
  return `<li class="${typeClasses[i]} immune"><span>\
${abbrTypes[i]}<span class="immune-symbol">*</span></span></li>`;
}

function typesToList(types, typeTransform = typeToListItem) {
  if (types.length === 0) return '';
  return '<ul class="type-list">' + types.map(typeTransform).join('') + '</ul>';
}

function typesToMergedList(
  ordinaryList, 
  immunityList, 
  immunityTransform = typeToImmunityListItem, 
  ordinaryTransform = typeToListItem
) {
  if (ordinaryList.length === 0 && immunityList.length === 0) return '';
  return `<ul class="type-list">${immunityList.map(immunityTransform).join('')}${ordinaryList.map(ordinaryTransform).join('')}</ul>`;
}

function singleTypeChartToTable(chart) {
  return (`\
<table class="${chart.type.toLowerCase()}-table">
  <caption>
    <div class="relative">
      <div class="caption-container ${chart.type.toLowerCase()}">
        <span class="caption">${toTitleCase.call(chart.type)}</span>
      </div>
    </div>
  </caption>
  <colgroup>
    <col span="2">
    <col class="resist">
    <col class="neutral">
    <col class="super-effective">
  </colgroup>
  <thead>
    <tr><td rowspan="2" colspan="2" class="${chart.type.toLowerCase()}"></td><th scope="colgroup" colspan="3">Damage To</th></tr>
    <tr><th scope="col">-</th><th scope="col">1</th><th scope="col">+</th></tr>
  </thead>
  <tbody>
    <tr><th scope="rowgroup" rowspan="3"><span class="sideways-lr">Damage From</span></th>
        <th scope="row">-</th>
        <td>${typesToMergedList(chart.RR, [...chart.II, ...chart.IR, ...chart.RI])}</td>
        <td>${typesToMergedList(chart.RN, chart.IN)}</td>
        <td>${typesToMergedList(chart.RS, chart.IS)}</td>
    </tr>
    <tr><th scope="row">1</th>
        <td>${typesToMergedList(chart.NR, chart.NI)}</td>
        <td class="nn">${(chart.NN.length < 5) ? typesToList(chart.NN) : '<span class="nn-count">[\u2026' + chart.NN.length + '\u2026]</span>'}</td>
        <td>${typesToList(chart.NS)}</td>
    </tr>
    <tr><th scope="row">+</th>
        <td>${typesToMergedList(chart.SR, chart.SI)}</td>
        <td>${typesToList(chart.SN)}</td>
        <td>${typesToList(chart.SS)}</td>
    </tr>
  </tbody>
</table>`
  );
}

function* generatePage(splitTypeChart) {
  yield `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="css/type-chart.css">
  <title>Pokémon Type Effectiveness</title>
</head>
<body>
  <h1>Pokémon Type Effectiveness</h1>
  <div class="main">
    <ul class="type-charts-list">`;

  for (let chart of splitTypeChart) {
    yield `
      <li>
${singleTypeChartToTable(chart).replace(/^/mg, '        ')}
      </li>`
  }

  yield `
    </ul>
    <p class="footnote">* immunity / double resistance</p>
  </div>
</body>
</html>
`;
}

Readable.from(generatePage(splitTypeChart)).pipe(process.stdout);
//console.log(typesToList(splitTypeChart[0]["NR"]));