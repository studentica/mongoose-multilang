/**
 * mongoose-multilang
 *
 * Plugin for mongoose ORM that supports multilingual resources
 *
 * @author Florian Reifschneider <florian@studentica.co>
 */

var pluralize = require('pluralize');

var transform = function(doc, ret, options) {
    if(doc.schema == schema) {
        for(var i in fields) {
            var field = fields[i];
            var pluralField = pluralize.plural(field);
            if(ret[pluralField]) {
                if(ret[pluralField].length === 1) {
                    ret[field] = ret[pluralField][0].value;
                    delete ret[pluralField];
                    return ret;
                }
                else if(doc.language) {
                    var finalValue;
                    for(var i in ret[pluralField]) {
                        var string = ret[pluralField][i];
                        if(string.lang === doc.language) {
                            if(string.official) {
                                finalValue = string.value;
                                break;
                            }
                        }
                        else if(string.lang === defaultLanguage && string.official) {
                            finalValue = string.value;
                        }
                    }
                    delete ret[pluralField];
                    ret[field] = finalValue;
                    return ret;
                }
            }
        }
    }
};

var multilingualFieldsPlugin = function(schema, options) {
    var languages = options.languages || ["en"];
    var fields = options.fields || [];
    var defaultLanguage = options.defaultLanguage || "en";

    var schemaFields = {};
    for(var i in fields) {
        schemaFields[fields[i]+"s"] = {
            "value": {type: String},
            "lang": {type: String},
            "official": {type: Boolean}
        };
    }

    schema.add(schemaFields);

    schema.virtual("language").set(function(lang) {
        this._lang = lang;
    });

    schema.virtual("language").get(function() {
        return this._lang;
    });

    schema.set("toJSON", {
        "transform": transform
    });

    schema.set("toObject", {
        "transform": transform
    });
};

module.exports = multilingualFieldsPlugin;