const XLSX = require('xlsx');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const path = require('path');

const ExcelService = {
  /**
   * [formatJson format a json by switching and filtering columns are required by the option]
   * [description]
   * @method
   * @param  {[Object]} json    [description]
   * @param  {[Object]} options [formating rules : columns dictionary and eager filtering or not]
   * @return {[Object]}         [a formatted json object]
   */
  formatJson(json, options = {}) {
    return json.map((item) => {
      if (options.columns && Object.keys(options.columns).length) {
        const newObject = {};
        Object.keys(item).forEach((key) => {
          let newKey = options.columns && options.columns[key];
          if (newKey || options.eager) {
            newKey = _.isString(newKey) ? newKey : key;
            newObject[newKey] = item[key];
          }
        });

        return newObject;
      }
      return item;
    });
  },

  parse(url, options = { sheet: 0 }) {
    const defaultOptions = {
      sheet: 0, // default to first sheet
      header: true, // if the excel has a header
      columns: {
        // excelColumn: expectedDatabaseColumn or true
      },
      eager: true, // if true  and column dictionary if provided return values
      // that are not in the dictionnary. else only return values that are in the columns
      parser: 'json' // html | json | csv | txt
    };
    options = _.merge(defaultOptions, options);

    const workbook = XLSX.readFile(url);
    const worksheet = workbook.Sheets[workbook.SheetNames[options.sheet || 0]];
    let json;
    switch (options.parser) {
        case 'json':
        default:
        /* eslint-disable no-case-declarations */
          json = XLSX.utils.sheet_to_json(worksheet, {
            header: options.header
          });
          return this.formatJson(json, options);
        case 'html':
          return XLSX.utils.sheet_to_html(worksheet, {
            header: options.header
          });
        case 'csv':
          return XLSX.utils.sheet_to_csv(worksheet, {
            header: options.header
          });
        case 'txt':
          return XLSX.utils.sheet_to_txt(worksheet, {
            header: options.header
          });
    }
  },

  export(data, fileName, options = { targetFolder: undefined }) {
    const defaultOptions = {
      sheet: 0, // default to first sheet
      header: true, // if the excel has a header
      columns: {
        // excelColumn: expectedDatabaseColumn or true
      },
      eager: true, // if true  and column dictionary if provided return values that
      // are not in the dictionnary. else only return values that are in the columns
      parser: 'json' // html | json | csv | txt
    };
    options = _.merge(defaultOptions, options);
    let folder;
    if (options.targetFolder) {
      folder = path.resolve(options.targetFolder);
    } else {
      folder = path.resolve(process.cwd(), 'public/data');
    }
    mkdirp(folder);
    let filePath = path.resolve(folder, `${fileName}.xlsx`);

    try {
      data = this.formatJson(data, options);
      const ws = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
      XLSX.writeFile(workbook, filePath);
    } catch (e) {
      console.warn('export error', e);
      return e;
    }
    if (filePath.includes('public/data')) {
      filePath = `${axel.config.appUrl || ''}${filePath.substring(filePath.indexOf('public') + 6)}`;
    }
    return filePath;
  }
};

module.exports = ExcelService;
