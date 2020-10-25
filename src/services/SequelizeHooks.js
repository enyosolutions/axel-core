export const jsonStringifyHook = (fields: string | string[], defaultValue) => (item) => {
  if (!item) {
    return;
  }
  if (typeof fields === 'string') {
    fields = [fields];
  }
  for (const field of fields) {
    try {
      item[field] = JSON.stringify(item[field]);
    } catch (e) {
      console.error(e);
      item[field] = defaultValue;
    }
  }
  return item;
};
export const bulkJsonStringifyHook = (fields: string | string[], defaultValue) => (
  items,
) => {
  if (!items) {
    return;
  }
  if (typeof fields === 'string') {
    fields = [fields];
  }
  for (const field of fields) {
    if (Array.isArray(items)) {
      items.map(item => jsonStringifyHook(field, defaultValue)(item));
    }
    jsonStringifyHook(field, defaultValue)(items);
  }
  return items;
};

export const jsonParseHook = (fields: string | string[], defaultValue) => (item) => {
  if (!item) {
    return;
  }
  if (typeof fields === 'string') {
    fields = [fields];
  }
  for (const field of fields) {
    if (typeof item[field] === 'string') {
      try {
        item[field] = JSON.parse(item[field]);
      } catch (e) {
        console.error('ERROR WHILE PARSING ', field, ', PLEASE FIX', item[field], e);
        item[field] = defaultValue;
      }
    }
  }
};

export const bulkJsonParseHook = (fields: string | string[], defaultValue?) => (
  items,
) => {
  if (!items) {
    return;
  }
  if (typeof fields === 'string') {
    fields = [fields];
  }
  for (const field of fields) {
    if (Array.isArray(items)) {
      items.forEach(item => jsonParseHook(field, defaultValue)(item));
    }
    jsonParseHook(field, defaultValue)(items);
  }
  return items;
};
