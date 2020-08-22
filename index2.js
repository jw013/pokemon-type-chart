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
      <svg x="18" y="18" width="64" height="64">
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
      <path id="defending-resist-curve" class="r_" d="M-12.246 29.564 A32 32 0 0 0 29.564 -12.246" stroke-width="4"/>
      <path id="attacking-resist-curve" class="_r" d="M16.838 40.561 A44 44 0 0 1 -40.561 -16.838" stroke-width="4"/>
      <marker id="resisted-arrow" markerWidth="2" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse">
        <polygon points="0,0 2,0.8 2,3.2 0,4 .5,2"/>
      </marker>
      <marker id="super-effective-arrow" markerWidth="5" markerHeight="4" refX="2" refY="2" orient="auto-start-reverse">
        <polygon points="0,0 5,2 0,4 .5,2"/>
      </marker>
      <line id="matchup-line" x1="0" x2="0" y1="32" y2="44" stroke-width="2"/>
    </defs>
    <symbol id="matchup-ring" viewBox="-50 -50 100 100">
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
    <symbol id="defending-ring" viewBox="-50 -50 100 100">
      <use href="#defending-resist-curve"/>
      <use class="sr" href="#matchup-line"/>
      <use class="sn" href="#matchup-line"/>
      <use class="ss" href="#matchup-line"/>
      <use class="rs" href="#matchup-line"/>
      <use class="rn" href="#matchup-line"/>
      <use class="rr" href="#matchup-line"/>
    </symbol>
    <symbol id="attacking-ring" viewBox="-50 -50 100 100">
      <use href="#attacking-resist-curve"/>
      <use class="nr" href="#matchup-line"/>
      <use class="sr" href="#matchup-line"/>
      <use class="ss" href="#matchup-line"/>
      <use class="ns" href="#matchup-line"/>
      <use class="rs" href="#matchup-line"/>
      <use class="rr" href="#matchup-line"/>
    </symbol>
    <symbol id="sword-symbol" viewBox="0 0 256 256">
      <path d="m123.5 187.65c0 2.4853 2.0147 4.5 4.5 4.5s4.5-2.0147 4.5-4.5c-0.1666-5.7723-0.33366-12.674-0.50015-18.46-1.3282 0.14841-2.6636 0.31147-4 0.31139-1.3365-5.6e-4 -2.6719-0.16429-4-0.31339-0.11565 6.3453-0.34647 12.997-0.49985 18.462z"/>
      <path d="m110.2 147.5-8.8984 6.4668a33 33 0 0 0 26.697 13.602 33 33 0 0 0 26.697-13.602l-8.8984-6.4668a22 22 0 0 1-17.799 9.0684 22 22 0 0 1-17.799-9.0684z"/>
      <path d="m128 63.851-10.021 19.158v62.211l-3.4141 3.6337a19 20.222 0 0 0 13.436 5.9224 19 20.222 0 0 0 13.436-5.9224l-3.4141-3.6337v-62.211z"/>
    </symbol>
    <symbol id="shield-symbol" viewBox="0 0 256 256">
      <path d="m128 74c-12 8-37 12-54 12 5.5248 73.61 36 100 54 108 17-8 48.475-34.39 54-108-17 0-42-4-54-12z"/>
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
      <figure class="defense">
        <svg role="img" viewBox="0 0 100 100" class="main-type normal">
          <title>Defending</title>
          <svg x="18" y="18" width="64" height="64">
            <foreignObject width="100%" height="100%"><div class="type-icon normal"></div></foreignObject>
            <use href="#shield-symbol"/>
          </svg>
          <use href="#defending-ring"/>
        </svg>
        <div class="sector rs"></div>
        <div class="sector rn"></div>
        <div class="sector rr"></div>
        <div class="sector ss"></div>
        <div class="sector sn"></div>
        <div class="sector sr"></div>
        <p class="label super-effective">&times;1.6</p>
        <p class="label resisted">&times;0.625</p>
        <p class="label immune">
          <svg role="img" viewBox="0 0 128 128" class="type-icon normal satellite immune">
            <title>immune</title>
            <use href="#sword-symbol"/>
          </svg>
          &times;0.39
        </p>
      </figure>
    </li>
    <li aria-hidden="true" class="legend">
      <figure class="offense">
        <svg role="img" viewBox="0 0 100 100" class="main-type normal">
          <title>Attacking</title>
          <svg x="18" y="18" width="64" height="64">
            <foreignObject width="100%" height="100%"><div class="type-icon normal"></div></foreignObject>
            <use href="#sword-symbol"/>
          </svg>
          <use href="#attacking-ring"/>
        </svg>
        <div class="sector sr"></div>
        <div class="sector nr"></div>
        <div class="sector rr"></div>
        <div class="sector ss"></div>
        <div class="sector ns"></div>
        <div class="sector rs"></div>
        <p class="label super-effective">&times;1.6</p>
        <p class="label resisted">&times;0.625</p>
        <p class="label immune">
          &times;0.39
          <svg role="img" viewBox="0 0 128 128" class="type-icon normal satellite immune">
            <title>immune</title>
            <use href="#shield-symbol"/>
          </svg>
        </p>
      </figure>
    </li>
  `

  yield `
  </ul>
</body>
</html>
`;
}

Readable.from(generatePage(splitTypeChart)).pipe(process.stdout);