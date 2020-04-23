/* eslint-env node */
module.exports = function(api) {
    api.cache(true);
    return {
        "presets": [
            "@babel/preset-env",
            "@babel/preset-flow"
        ],
        "env": {
            "test": {
                "plugins": ["istanbul"]
            },
            "production": {
                "plugins": [
                    "@babel/plugin-transform-modules-umd",
                    // Custom transformer for making VirtualClock work nicely as a UMD module
                    ({template}) => ({
                        post(fileMap) {
                            fileMap.path.traverse({
                                AssignmentExpression(path) {
                                    const expressionTarget = path.get('left');
                                    const expressionValue = path.get('right');
                                    // Match assignment of default to exports
                                    if (
                                        path.parentPath.isExpressionStatement() &&
                                        path.parentPath.parentPath.isBlockStatement() &&
                                        path.parentPath.parentPath.parentPath.isFunctionExpression() &&
                                        expressionTarget.matchesPattern('_exports.default') &&
                                        !(
                                            expressionValue.isUnaryExpression({ operator: "void" }) &&
                                            expressionValue.get('argument').isNumericLiteral({ value: 0 })
                                        )
                                    ) {
                                        path.insertAfter(template('return ' + expressionTarget)());
                                        path.insertAfter(template(expressionTarget + '.default = ' + expressionTarget)());
                                    }

                                    // Match assignment of exports to global
                                    if (
                                        path.parentPath.isExpressionStatement() &&
                                        path.parentPath.parentPath.isBlockStatement() &&
                                        path.parentPath.parentPath.parentPath.isIfStatement() &&
                                        expressionTarget.matchesPattern('global', true) &&
                                        expressionValue.matchesPattern('mod.exports') &&
                                        path.scope.hasBinding('factory')
                                    ) {
                                        path.parentPath.parentPath.replaceWith(template(`
                                            {
                                                // Assign to both titlecased and camelcased version, for backwards compatibility
                                                ${expressionTarget} = ${expressionTarget.toString().replace(/\.([a-z])/, match => match.toUpperCase())} = factory({});
                                            }
                                        `)());
                                    }
                                },
                                IfStatement(path) {
                                    // Match UMD global function
                                    if (
                                        path.parentPath.isIfStatement() &&
                                        path.get('test').isBinaryExpression({ operator: "!==" }) &&
                                        path.get('test').get('left').isUnaryExpression({ operator: "typeof" }) &&
                                        path.get('test').get('left').get('argument').isIdentifier({ name: 'exports' }) &&
                                        path.get('test').get('right').isStringLiteral({ value: "undefined" }) &&
                                        path.get('consequent').isBlockStatement() &&
                                        path.get('consequent').get('body').length === 1 &&
                                        !(
                                            path.parentPath.get('test').isLogicalExpression({ operator: "&&" }) &&
                                            path.parentPath.get('test').get('left').isBinaryExpression({ operator: "!==" }) &&
                                            path.parentPath.get('test').get('left').get('left').isUnaryExpression({ operator: "typeof" }) &&
                                            path.parentPath.get('test').get('left').get('left').get('argument').isIdentifier({ name: 'module' }) &&
                                            path.parentPath.get('test').get('left').get('right').isStringLiteral({ value: "undefined" }) &&
                                            path.parentPath.get('test').get('right').isBinaryExpression({ operator: "!==" }) &&
                                            path.parentPath.get('test').get('right').get('left').isUnaryExpression({ operator: "typeof" }) &&
                                            path.parentPath.get('test').get('right').get('left').get('argument').matchesPattern('module.exports') &&
                                            path.parentPath.get('test').get('right').get('right').isStringLiteral({ value: "undefined" })
                                        ) &&
                                        path.scope.hasBinding('factory')
                                    ) {
                                        path.replaceWith(template(`
                                            if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
                                                module.exports = factory(module.exports);
                                            } else ${path}
                                        `)());
                                    }
                                }
                            });
                        }
                    })
                ]
            }
        }
    };
};
