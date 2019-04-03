const loaderUtils = require('loader-utils')
const handler = require('./handler');

module.exports = function (source, map) {
  // init options
  const urlQuery = this.resourceQuery
    ? loaderUtils.parseQuery(this.resourceQuery)
    : null
  const options = Object.assign({}, loaderUtils.getOptions(this), urlQuery)

  let pureSource = handler.removeComments(source);

  // Ignore excluded files
  if (!this.resourcePath || (options.exclude && this.resourcePath.match(options.exclude))) return source
  // Use regString or delimiter to find targets
  // Default value is to map simplified chinese characters
  let matchRegText = options.regText || "[\u4e00-\u9fa5\u3002\uff1b\uff0c\uff1a\u2018\u2019\u201c\u201d\uff08\uff09\u3001\uff1f\uff01\ufe15\u300a\u300b]+";

  if (!source.match(matchRegText)) {
    // nothing to translate
    return source;
  }

  const filename = handler.getFileName(this.resourcePath)
  let defaultLang = "zh_Hans_CN";
  if(options.languages && options.languages.length > 0) {
    defaultLang = options.languages[0]
  }

  const resultContent = handler.generateContent(pureSource, matchRegText);
  let insertScript = handler.importlang(filename) + resultContent.result + handler.insertScript(defaultLang);

  const replacers = resultContent.replacers;
  const data = {};
  let targetLanguages = [defaultLang];
  if(options.languages) {
    targetLanguages = options.languages;
  }
  replacers.forEach(item => {
    targetLanguages.forEach(curlang => {
        data[curlang] = data[curlang] || {};
        data[curlang][item.key] = item.old;
    });
  });

  handler.writeDataToFile(data, this.resourcePath);

  return insertScript;
}