'use strict';
const path = require('path');
const { EOL } = require('os');
const Blueprint = require('ember-cli/lib/models/blueprint');

module.exports = {
  description: '',

  normalizeEntityName() {
  },

  fileMapTokens: function() {
    let isAddon = this.project.isEmberCLIAddon();
    return {
      __base__() {
        if(isAddon) {
          return path.join('tests', 'dummy', 'public');
        }
        return 'public';
      }
    }
  },

  beforeInstall() {
    this.originalTaskForFn = Blueprint.prototype.taskFor;
    Blueprint.prototype.taskFor = function(taskName) {
      if (taskName === 'npm-install') {
        return;
      } else {
        return this.originalTaskForFn.call(this, taskName);
      }
    };
  },

  afterInstall() {
    let isAddon = this.project.isEmberCLIAddon();
    let file = isAddon? path.join('tests', 'dummy', 'app', 'index.html') : 'app/index.html';
    
    this.ui.writeLine(`Adding netlify-identity-widget script to ${file}`);

    return this.insertIntoFile(file, '\t\t<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>', {
      before: '</body>' + EOL
    }).then(() => {
      this.ui.writeLine(`Adding netlifyIdentity redirect script to ${file}`);
      return this.insertIntoFile(file, `
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
      `, { 
          before: '</body>' + EOL 
      }).then(() => {
        Blueprint.prototype.taskFor = this.originalTaskForFn;
      });
    });
  }
};
