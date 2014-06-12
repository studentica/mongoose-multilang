/**
 * mongoose-multilang
 *
 * Plugin for mongoose ORM that supports multilingual resources
 *
 * @author Florian Reifschneider <florian@studentica.co>
 */

var pluralize = require('pluralize');

var multilingualFieldsPlugin = function(schema, options) {
    var languages = options.languages || ["en"];
    var fields = options.fields || [];
    var defaultLanguage = options.defaultLanguage || "en";

    var schemaFields = {};
    for(var i in fields) {
        var field = fields[i];
        if(typeof field == 'string' || field instanceof String) {
            field = {
                "name": field,
                "lang": true
            };
            fields[i] = field;
        }

        var pluralFieldName = pluralize.plural(field.name);
        var multilangSchema = {
            "value": {type: String},
            "official": {type: Boolean}
        };
        if(field.lang) {
            multilangSchema["lang"] = {type: String};
        }

        schemaFields[pluralFieldName] = [multilangSchema];
    }

    schema.add(schemaFields);

    schema.virtual("language").set(function(lang) {
        this._lang = lang;
    });

    schema.virtual("language").get(function() {
        return this._lang;
    });

    var transform = function(doc, ret, options) {
        if(doc.schema == schema) {
            for(var i in fields) {
                var field = fields[i];
                var pluralField = pluralize.plural(field.name);
                if(ret[pluralField]) {
                    console.log(pluralField);
                    if(ret[pluralField].length === 0) {
                        delete ret[pluralField];
                    }
                    else if(ret[pluralField].length === 1) {
                        ret[field.name] = ret[pluralField][0].value;
                        delete ret[pluralField];
                    }
                    else {
                        var finalValue = ret[pluralField][0].value;
                        if(field.lang) {
                            var isOfficial = false;
                            var language = doc.language || defaultLanguage;
                            for(var i in ret[pluralField]) {
                                var string = ret[pluralField][i];
                                if(string.lang === language) {
                                    finalValue = string.value;
                                    if(string.official) {
                                        break;
                                    }
                                }
                                else if(string.lang === defaultLanguage && string.official) {
                                    finalValue = string.value;
                                }
                            }
                        }
                        else {
                            for(var i in ret[pluralField]) {
                                var string = ret[pluralField][i];
                                if(string.official) {
                                    finalValue = string.value;
                                    break;
                                }
                            }
                        }
                        delete ret[pluralField];
                        ret[field.name] = finalValue;
                    }
                }
            }
        }
        return ret;
    };

    schema.set("toJSON", {
        "transform": transform
    });

    schema.set("toObject", {
        "transform": transform
    });
};

module.exports = multilingualFieldsPlugin;