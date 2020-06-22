'use strict';
const YAML = require('yaml');
const writeFile = require('broccoli-file-creator');
const mergeTrees = require('broccoli-merge-trees');
const { readFileSync } = require('fs');

module.exports = {
  name: require('./package').name,

  treeForPublic() {
    let app = this._findHost();
    let options = typeof app.options === 'object' ? app.options : {};
    let addonConfig = options['empress-blog-netlify-cms'] || {};

    let netlifyConfigJson = YAML.parse(readFileSync('./netlify-templates/config.yml', 'utf8'));
    Object.assign(netlifyConfigJson, addonConfig['netlify-config'] || {});
    let netlifyConfigOutputYml = YAML.stringify(netlifyConfigJson);

    const netlifyConfigTree = writeFile(
      'admin/config.yml',
      netlifyConfigOutputYml
    );
    const netlifyIndexHtmlTree = writeFile(
      'admin/index.html',
      readFileSync('./netlify-templates/index.html', 'utf8')
    );

    return mergeTrees([netlifyConfigTree, netlifyIndexHtmlTree]);
  },

  contentFor(type) {
    if (type === 'head-footer') { 
      return '<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>';
    }

    if (type === 'body-footer') {
      return (`
        <script>
          if (window.netlifyIdentity) {
            window.netlifyIdentity.on("init", user => {
              if (!user) {
                window.netlifyIdentity.on("login", () => {
                  document.location.href = "/admin/";
                });
              }
            });
          }
        </script>
      `);
    }
  }
};
