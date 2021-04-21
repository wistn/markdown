/*
 * Author:wistn
 * since:2021-04-21
 * LastEditors:Do not edit
 * LastEditTime:2021-04-22
 * Description: There is pretty
 */

/*
Return pretty string for understanding a object like JSON.stringify() but can format all kind of obj. Note: if Map, Set, instance of the class, default function parameters(with '=') appears, that must uses js es6 or above.

obj: The object to convert to a JSON string.
space(optional): A String or Number object that's used to insert white space into the output string like JSON.stringify() for readability purposes.The initial value is 4 means insert 4 white spaces.
*/
function pretty(obj, space) {
    if (space == null) space = 4;
    var backslashN = '\n';
    var indent = '',
        subIndents = '';
    if (typeof space == 'number') {
        for (var i = 0; i < space; i++) {
            indent += ' ';
        }
    } else if (typeof space == 'string') {
        indent = space;
    }
    function str(obj) {
        var jsType = Object.prototype.toString.call(obj);
        if (jsType.match(/object (String|Date|Function|JSON|Math|RegExp)/)) {
            return JSON.stringify(String(obj));
        } else if (jsType.match(/object (Number|Boolean|Null)/)) {
            return JSON.stringify(obj);
        } else if (jsType.match(/object Undefined/)) {
            return JSON.stringify('undefined');
        } else {
            if (jsType.match(/object (Array|Arguments|Map|Set)/)) {
                if (jsType.match(/object (Map|Set)/)) {
                    // function and type in js es6 or above
                    obj = Array.from(obj);
                }
                var partial = [];
                subIndents = subIndents + indent;
                var len = obj.length;
                for (var i = 0; i < len; i++) {
                    partial.push(str(obj[i]));
                }
                var result =
                    len == 0
                        ? '[]'
                        : indent.length
                        ? '[' +
                          backslashN +
                          subIndents +
                          partial.join(',' + backslashN + subIndents) +
                          backslashN +
                          subIndents.slice(indent.length) +
                          ']'
                        : '[' + partial.join(',') + ']';
                subIndents = subIndents.slice(indent.length);
                return result;
            } else if (
                jsType.match(
                    /object (Object|Error|global|Window|HTMLDocument)/i
                ) ||
                obj instanceof Error
            ) {
                var partial = [];
                subIndents = subIndents + indent;
                var ownProps = Object.getOwnPropertyNames(obj);
                // Object.keys returns obj's own enumerable property names(no use for...in loop because including inherited enumerable properties from obj's prototype chain
                // Object.getOwnPropertyNames = Object.keys + obj's own non-enumerable property names
                var len = ownProps.length;
                for (var i = 0; i < len; i++) {
                    partial.push(
                        str(ownProps[i]) +
                            (indent.length ? ': ' : ':') +
                            str(obj[ownProps[i]])
                    );
                }
                var result =
                    len == 0
                        ? '{}'
                        : indent.length
                        ? '{' +
                          backslashN +
                          subIndents +
                          partial.join(',' + backslashN + subIndents) +
                          backslashN +
                          subIndents.slice(indent.length) +
                          '}'
                        : '{' + partial.join(',') + '}';
                subIndents = subIndents.slice(indent.length);
                return result;
            } else {
                return JSON.stringify(String(obj));
            }
        }
    }
    function decycle(obj) {
        // the function can solve circular structure like JSON.decycle, the return value can be decoded by JSON.retrocycle(JSON.parse())
        var arrParents = [];
        return (function derez(obj, path) {
            var jsType = Object.prototype.toString.call(obj);
            if (
                jsType.match(
                    /object (String|Date|Function|JSON|Math|RegExp|Number|Boolean|Null|Undefined)/
                )
            ) {
                return obj;
            } else {
                if (jsType.match(/object (Array|Arguments|Map|Set)/)) {
                    var len = arrParents.length;
                    for (var i = 0; i < len; i++) {
                        // arr like [obj, '$']
                        var arr = arrParents[i];
                        if (obj === arr[0]) {
                            return { $ref: arr[1] };
                        }
                    }
                    arrParents.push([obj, path]);
                    var newObj = [];
                    if (jsType.match(/object (Map|Set)/)) {
                        // function and type in js es6 or above
                        obj = Array.from(obj);
                    }
                    var length = obj.length;
                    for (var i = 0; i < length; i++) {
                        newObj[i] = derez(obj[i], path + '[' + i + ']');
                    }
                    return newObj;
                } else {
                    var len = arrParents.length;
                    for (var i = 0; i < len; i++) {
                        // arr like [obj, '$']
                        var arr = arrParents[i];
                        if (obj === arr[0]) {
                            return { $ref: arr[1] };
                        }
                    }
                    arrParents.push([obj, path]);
                    var newObj = {};
                    var ownProps = Object.getOwnPropertyNames(obj);
                    var length = ownProps.length;
                    for (var i = 0; i < length; i++) {
                        newObj[ownProps[i]] = derez(
                            obj[ownProps[i]],
                            path + '[' + JSON.stringify(ownProps[i]) + ']'
                        );
                    }
                    return newObj;
                }
            }
        })(obj, '$');
    }
    return str(decycle(obj));
}
/* // Examples:
class myClass {
    constructor() {
        this.instance_Array = [0];
        this.instanceArguments = arguments;
    }
}
var originObj = {
    objectKey: new Map([[new myClass(), new Set([true, new Error('myError')])]])
};
console.log(JSON.stringify(originObj));
// will print {"objectKey":{}}
var strPretty = pretty(originObj);
console.log(strPretty);
will_print = `
{
    "objectKey": [
        [
            {
                "instance_Array": [
                    0
                ],
                "instanceArguments": []
            },
            [
                true,
                {
                    "stack": "Error: myError\n    at ...",
                    "message": "myError"
                }
            ]
        ]
    ]
}`;
finalObj = JSON.parse(strPretty);
console.log(finalObj);
// will print { objectKey: [ [ [Object], [Array] ] ] }
 */
