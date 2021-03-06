/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');

var eslint = require('eslint');
var ruleNoUnusedVars = require('eslint/lib/rules/no-unused-vars');
var ruleNoUndef = require('eslint/lib/rules/no-undef');

const rules = require('..').rules;
const RuleTester = eslint.RuleTester;

const ruleTester = new RuleTester({
  parserOptions: {ecmaVersion: 6, sourceType: 'module'}
});

const esLintVersion = require('eslint/package.json').version;

ruleTester.defineRule('relay/compat-uses-vars', rules['compat-uses-vars']);

ruleTester.run('no-unused-vars', ruleNoUnusedVars, {
  valid: [
    {
      code: `
        /* eslint relay/compat-uses-vars: 1 */
        var require;
        var ExampleComponent;
        const {graphql} = require('RelayCompat');
        graphql\`
          query Example {
            ...ExampleComponent_prop
          }
        \`
      `
    },
    {
      // OK, since this is Relay Modern
      code: `
        /* eslint relay/compat-uses-vars: 1 */
        var require;
        const {graphql} = require('react-relay');
        graphql\`
          query Example {
            ...ExampleComponent_prop
          }
        \`
      `
    },
    {
      code: `
        /* eslint relay/compat-uses-vars: 1 */

        const OtherComponent = require('OtherComponent');
        const React = require('React');

        const {graphql} = require('RelayCompat');

        class ThisComponent extends React.Component {
          render() {
            graphql\`
              query ThisComponentQuery {
                viewer {
                  ...OtherComponent_viewer
                }
              }
            \`;
          }
        }
        module.exports = ThisComponent;
      `
    }
  ],
  invalid: [
    {
      filename: 'path/to/Example.react.js',
      code: `
        /* eslint relay/compat-uses-vars: 1 */
        const {graphql} = require('RelayCompat');
        const OtherComponent = require('other-component');
        const ExampleComponent = require('example-component');
        graphql\`
          query Example {
            ...ExampleComponent_prop
          }
        \`
      `,
      errors: [
        esLintVersion === '3.5.0'
          ? "'OtherComponent' is defined but never used."
          : "'OtherComponent' is assigned a value but never used."
      ]
    }
  ]
});

ruleTester.run('compat-uses-vars', rules['compat-uses-vars'], {
  valid: [
    {
      code: `
        var require;
        var ExampleComponent;
        const {graphql} = require('RelayCompat');
        graphql\`
          query Example {
            ...ExampleComponent_prop
          }
        \`
      `
    }
  ],
  invalid: [
    // missing name on query
    {
      filename: 'path/to/Example.react.js',
      code: `
        var require;
        const {graphql} = require('RelayCompat');
        graphql\`
          query Example {
            ...ExampleComponent_foo_bar
          }
        \`
      `,
      errors: [
        {
          message:
            'In compat mode, Relay expects the component that has the ' +
              '`ExampleComponent_foo_bar` fragment to be imported with the ' +
              'variable name `ExampleComponent`.',
          line: 6,
          column: 16,
          endLine: 6,
          endColumn: 40
        }
      ]
    }
  ]
});
