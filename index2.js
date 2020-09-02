'use strict';

const { Readable } = require('stream');
const { splitTypeChart, orderedTypes } = require('./lib/type-chart');

const typeClasses = orderedTypes.map((x) => x.toLowerCase());
const typeTitles = typeClasses.map((x) => (x[0].toUpperCase() + x.substring(1)));

const immunityRegExp = /\bimmune\b/;
function typeToSVG(type, title, cssClass) {
  return `<svg role="img" viewBox="0 0 10 10" class="${type}${cssClass ? ` ${cssClass}` : ''} type-icon"><title>${title}</title><use width="100%" height="100%" href="img/type-icons.svg#${type}-symbol"/></svg>`;
}

function toTitleCase() {
  return this[0].toUpperCase() + this.substr(1).toLowerCase();
}

function typeToListItem(i) {
  const typeClass = typeClasses[i];
  const typeTitle = typeTitles[i];
  return `<li>${typeToSVG(typeClass, typeTitle, 'satellite')}</li>`;
}

function typeToImmunityListItem(i) {
  const typeClass = typeClasses[i];
  const typeTitle = typeTitles[i];
  return `<li>${typeToSVG(typeClass, typeTitle + ' (immune)', 'satellite immune')}</li>`;
}

function typesToList(cssClass, types, typeTransform = typeToListItem) {
  if (types.length === 0) return '';
  return `<div class="sector ${cssClass}"><ul class="type-list">` + types.map(typeTransform).join('') + '</ul></div>';
}

function typesToMergedList(
  cssClass,
  ordinaryList, 
  immunityList, 
  immunityTransform = typeToImmunityListItem, 
  ordinaryTransform = typeToListItem
) {
  if (ordinaryList.length === 0 && immunityList.length === 0) return '';
  return `<div class="sector ${cssClass}"><ul class="type-list">${ordinaryList.map(ordinaryTransform).join('')}${immunityList.map(immunityTransform).join('')}</ul></div>`;
}

/* \u2026 = ellipsis */
function singleTypeChartToTable(chart) {
  const typeUpper = chart.type;
  const typeLower = typeUpper.toLowerCase();
  const typeTitle = toTitleCase.call(typeUpper);
  return (`\
<table class="type-chart">
  <caption>
    <svg role="img" viewBox="0 0 100 100" class="main-type">
      <title>${typeTitle}</title>
      <svg x="20" y="20" width="60" height="60">
        <foreignObject width="100%" height="100%"><div class="type-icon ${typeLower}"></div></foreignObject>
        <use href="img/type-icons.svg#${typeLower}-symbol"/>
      </svg>
      <use href="#matchup-ring"/>
    </svg>
  </caption>
  <thead>
    <tr>
      <td></td>
      <th scope="col"><span class="sr-only">Not Very Effective</span></th>
      <th scope="col"><span class="sr-only">Neutral</span></th>
      <th scope="col"><span class="sr-only">Super Effective</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row"><span class="sr-only">Weak</span></th>
      <td>${typesToMergedList('sr', chart.SR, chart.SI)}</td>
      <td>${typesToList('sn', chart.SN)}</td>
      <td>${typesToList('ss', chart.SS)}</td>
    </tr>
    <tr>
      <th scope="row"><span class="sr-only">Neutral</span></th>
      <td>${typesToMergedList('nr', chart.NR, chart.NI)}</td>
      <td><div class="sr-only">${(chart.NN.length < 5) ? typesToList('nn', chart.NN) : '<span class="nn-count">\u2026' + chart.NN.length + '\u2026</span>'}</div></td>
      <td>${typesToList('ns', chart.NS)}</td>
    </tr>
    <tr>
      <th scope="row"><span class="sr-only">Resists</span></th>
      <td>${typesToMergedList('rr', chart.RR, [...chart.II, ...chart.IR, ...chart.RI])}</td>
      <td>${typesToMergedList('rn', chart.RN, chart.IN)}</td>
      <td>${typesToMergedList('rs', chart.RS, chart.IS)}</td>
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
  <link rel="stylesheet" href="css/type-chart2.css">
  <title>Pokémon Type Effectiveness</title>
</head>
<body>
  <svg aria-hidden="true" class="defs">
    <defs>
      <path id="defending-resist-curve" d="M-11.481 27.716 A30 30 0 0 0 27.716-11.481" stroke-width="4"/>
      <path id="attacking-resist-curve" d="M16.073 38.803 A42 42 0 0 1 -38.803 -16.073" stroke-width="4"/>
      <marker id="super-effective-arrow" markerWidth="6" markerHeight="5" refX="2" refY="2.5" orient="auto-start-reverse">
        <polygon points="0,0 6,2.5 0,5 .75,3"/>
      </marker>
      <marker id="resisted-arrow" markerWidth="2" markerHeight="5" refX="1" refY="2.5" orient="auto-start-reverse">
        <rect width="2" height="5"/>
      </marker>
      <line id="matchup-line" x1="0" x2="0" y1="30" y2="42" stroke-width="2"/>
      <line id="legend-matchup-line" x1="9" y1="5" x2="21" y2="5" stroke-width="2"/>
    </defs>
    <symbol id="matchup-ring" class="matchup-ring" viewBox="-50 -50 100 100">
      <use href="#defending-resist-curve"/>
      <use href="#attacking-resist-curve"/>
      <use class="nr" href="#matchup-line"/>
      <use class="sr" href="#matchup-line"/>
      <use class="sn" href="#matchup-line"/>
      <use class="ss" href="#matchup-line"/>
      <use class="ns" href="#matchup-line"/>
      <use class="rs" href="#matchup-line"/>
      <use class="rn" href="#matchup-line"/>
      <use class="rr" href="#matchup-line"/>
    </symbol>
  </svg>
  <h1>Pokémon Type Effectiveness</h1>
  <ul class="type-charts-list">`;

  for (let chart of splitTypeChart) {
    yield `
    <li>
${singleTypeChartToTable(chart).replace(/^/mg, '      ')}
    </li>`
  }

  yield `
    <li aria-hidden="true" class="legend">
      <figure>
        <span>&times;1.6</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Mutual weakness</title>
          <use class="ss" href="#legend-matchup-line"/>
        </svg>
        <span>&times;1.6</span>
        <span>&times;1</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Super Effective</title>
          <use class="ns" href="#legend-matchup-line"/>
        </svg>
        <span>&times;1.6</span>
        <span>&times;0.625</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Dominates</title>
          <use class="rs" href="#legend-matchup-line"/>
        </svg>
        <span>&times;1.6</span>
        <span>&times;0.625</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Resistance</title>
          <use class="rn" href="#legend-matchup-line"/>
        </svg>
        <span>&times;1</span>
        <span>&times;0.625</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Mutual Resistance</title>
          <use class="rr" href="#legend-matchup-line"/>
        </svg>
        <span>&times;0.625</span>
      </figure>
    </li>
    <li aria-hidden="true" class="legend">
      <figure>
        <span class="align">&times;1</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Resistance</title>
          <use class="nr" href="#legend-matchup-line"/>
        </svg>
        <span><svg role="img" viewBox="0 0 1 1" class="type-icon immune"></svg> &times;0.39</span>
        <span class="align">&times;0.39</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Resistance</title>
          <use class="rn" href="#legend-matchup-line"/>
        </svg>
        <span><svg role="img" viewBox="0 0 1 1" class="type-icon immune"></svg> &times;1</span>
        <span class="align">&times;0.39</span>
        <svg role="img" viewBox="0 0 30 10">
          <title>Resistance</title>
          <use class="rr" href="#legend-matchup-line"/>
        </svg>
        <span><svg role="img" viewBox="0 0 1 1" class="type-icon immune"></svg> &times;0.39</span>
      </figure>
    </li>`;

  yield `
  </ul>
</body>
</html>
`;
}

Readable.from(generatePage(splitTypeChart)).pipe(process.stdout);