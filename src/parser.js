const parse5 = require('parse5');
const throttledRequests = require('./requests');

// constructor function for parser
function Parser(html) {
  this.raw = html;
  this.result = [];
}

Parser.prototype.parseHarvard = async function() {
  const harvard = parse5.parse(this.raw);
  const root = /(https:\/\/www\.seas\.harvard\.edu)/g;
  const tableRows = findNodes(harvard, "div", { "class": "views-field views-field-nothing-1"});

  let paths = [];
  for (let row of tableRows) {
    let link = findNodes(row, "a")[0].attrs[0].value.toString().trim();
    link = link.replace(root, "");
    paths.push(link);
    console.log(link);
  }

  const headers = {
    'Content-Type': 'text/html; charset=utf-8'
  };

  const baseOptions = {
    headers: headers,
    protocol: 'https:',
    host: 'www.seas.harvard.edu'
  };

  const sites = [];
  const profiles = await throttledRequests(paths, baseOptions);
  for (let profile of profiles) {
    const root = parse5.parse(profile);
    const websiteContainer = findNodes(root, "div", { "class": "views-field views-field-field-website" })[0];
    const websites = findNodes(websiteContainer, "a");

    if (websites.length > 0) {
      const information = findNodes(root, "div", { "class": "views-field views-field-title" })[0];
      let name = findNodes(information, "h1")[0].childNodes[0].value.toString().trim();
      name = name.replace(/(.+)\s+(\w+)/, "$2, $1");

      const urls = [];
      for (let website of websites) {
        const url = website.attrs[0].value.toString().trim();
        urls.push(url);
      }
      sites.push({ name, urls });
    }
  }

  this.result = sites;
};

Parser.prototype.parseCMU = async function() {
  const cmu = parse5.parse(this.raw);
  const root = /(https:\/\/csd\.cs\.cmu\.edu)/g;
  const table = findNodes(cmu, "table");
  const tableRows = findNodes(table[0], "td", { "class": "views-field views-field-field-computed-last-name"});

  const paths = [];
  for (let row of tableRows) {
    let link = findNodes(row, "a")[0].attrs[0].value.toString().trim();
    link = link.replace(root, "");
    paths.push(link);
    console.log(link);
  }

  const headers = {
    'Content-Type': 'text/html; charset=utf-8'
  };

  const baseOptions = {
    headers: headers,
    protocol: 'https:',
    host: 'csd.cs.cmu.edu'
  };

  const sites = [];
  const profiles = await throttledRequests(paths, baseOptions);
  for (let profile of profiles) {
    const root = parse5.parse(profile);
    const websites = findNodes(root, "a", { title: "Personal Website" });

    if (websites.length > 0) {
      const information = findNodes(root, "div", { "class": "information" })[0];
      let name = findNodes(information, "h2")[0].childNodes[0].value.toString().trim();
      name = name.replace(/(\w+)\s+(\w+)/, "$2, $1");

      const urls = [];
      for (let website of websites) {
        const url = website.attrs[0].value.toString().trim();
        urls.push(url);
      }
      sites.push({ name, urls });
    }
  }

  this.result = sites;
};

// helpers
function findNodes(rootNode, name, attrs = {}) {
  const results = [];

  (function find(elem, acc) {
    if (!elem) {
      return;
    }
    if (matchesNode(elem, name, attrs)) {
      acc.push(elem)
    }
    if (elem.childNodes) {
      elem.childNodes.forEach((child) => find(child, acc));
    }

  })(rootNode, results);


  return results;
}

function matchesNode(elem, name, attrs) {
  if (!elem || elem.nodeName !== name) {
    return false;
  }

  const entries = Object.entries(attrs);
  if (entries.length > 0) {
    for (const [key, value] of entries) {
      if (!elem.attrs.some(((attr) => (attr.name === key) && (attr.value === value)))) {
        return false;
      }
    }
  }

  return true;
}

module.exports = Parser;