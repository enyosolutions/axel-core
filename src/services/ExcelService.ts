const XLSX = require('xlsx');
const _ = require('lodash');
const path = require('path');
declare const axel: any;

interface ExcelServiceOptions {
      sheet?: number;
      header?: boolean;
      columns?: any;
      eager?: boolean;
      parser?: 'json' | 'html' | 'json' | 'csv' | 'txt';
  }


const ExcelService = {
  /**
   * [formatJson format a json by switching and filtering columns are required by the option]
   * [description]
   * @method
   * @param  {[Object]} json    [description]
   * @param  {[Object]} options [formating rules : columns dictionary and eager filtering or not]
   * @return {[Object]}         [a formatted json object]
   */
  formatJson(json: JSON[], options: ExcelServiceOptions = {}) {
    return json.map((item: any) => {
      if (options.columns && Object.keys(options.columns).length) {
        const newObject: any = {};
        Object.keys(item).forEach(key => {
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

  parse(url: string, options: ExcelServiceOptions = { sheet: 0 }) {
    const defaultOptions = {
      sheet: 0, // default to first sheet
      header: true, // if the excel has a header
      columns: {
        // excelColumn: expectedDatabaseColumn or true
      },
      eager: true, // if true  and column dictionary if provided return values
      // that are not in the dictionnary. else only return values that are in the columns
      parser: 'json', // html | json | csv | txt
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
          header: options.header,
        });
        return this.formatJson(json, options);
      case 'html':
        return XLSX.utils.sheet_to_html(worksheet, {
          header: options.header,
        });
      case 'csv':
        return XLSX.utils.sheet_to_csv(worksheet, {
          header: options.header,
        });
      case 'txt':
        return XLSX.utils.sheet_to_txt(worksheet, {
          header: options.header,
        });
    }
  },

  export(data: any, url: string, options: ExcelServiceOptions = {}) {
    const defaultOptions = {
      sheet: 0, // default to first sheet
      header: true, // if the excel has a header
      columns: {
        // excelColumn: expectedDatabaseColumn or true
      },
      eager: true, // if true  and column dictionary if provided return values that
      // are not in the dictionnary. else only return values that are in the columns
      parser: 'json', // html | json | csv | txt
    };
    options = _.merge(defaultOptions, options);

    url = path.resolve('assets/data', `${url}.xlsx`);
    try {
      data = this.formatJson(data, options);
      const ws = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
      XLSX.writeFile(workbook, url);
    } catch (e) {
      console.warn('export error', e);
      return e;
      48;
    }
    url = axel.config.appUrl + url.substr(url.indexOf('assets') + 6);
    return url;
  },
};

export default ExcelService;