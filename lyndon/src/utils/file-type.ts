/**
 * This file handles the assignment of colors to file types for display purposes.
 *
 * Color assignment is managed through two mechanisms:
 *
 * 1. **Specific Colors**: Certain file types can be assigned specific colors.
 *    These mappings are defined in the `specificColors` object. If you need a
 *    specific file format to use a specific color, add it to `specificColors`
 *    with the following format:
 *
 *    ```javascript
 *    export const specificColors = {
 *      'csv': 'bg-status-fail-500',
 *      'private': 'bg-primary-b-900',
 *      'xlsx': 'bg-status-success-700',
 *      // Add more specific file type color mappings here.
 *    };
 *    ```
 *
 * 2. **Loop Colors**: For file types that do not have a specific color assigned,
 *    colors are assigned from the `loopColors` array in a cyclic manner. This
 *    ensures all file types get a color, even if they are not listed in `specificColors`.
 *
 *    ```javascript
 *    export const loopColors = [
 *      'bg-primary-a-500',
 *      'bg-secondary-a-500',
 *      'bg-secondary-b-500',
 *      'bg-tertiary-a-500',
 *      // Add more loop colors here.
 *    ];
 *    ```

 * The `getFileTypes` function returns the file types as an array.
 * The `assignColorsToFileTypes` function takes an array of file types, assigns colors
 * to them using the specific and loop colors, and returns an array of objects containing
 * the file type names and their corresponding background colors.
 */

export const specificColors = {
  csv: 'bg-status-fail-500',
  Private: 'bg-primary-b-900',
  xlsx: 'bg-status-success-700',
};

export const loopColors = ['bg-primary-a-500', 'bg-secondary-a-500', 'bg-secondary-b-500', 'bg-tertiary-a-500'];

export const getFileTypes = (fileTypes: string[]): string[] => {
  return fileTypes;
};

export const assignColorsToFileTypes = (fileTypes: string[]): { name: string; bgColor: string }[] => {
  const colorMapping = {};

  // Assign specific colors to certain file types.
  fileTypes.forEach(fileType => {
    if (specificColors[fileType]) {
      colorMapping[fileType] = specificColors[fileType];
    }
  });

  // Assign loop colors to remaining file types.
  let loopIndex = 0;
  fileTypes.forEach(fileType => {
    if (!colorMapping[fileType]) {
      colorMapping[fileType] = loopColors[loopIndex % loopColors.length];
      loopIndex++;
    }
  });

  return fileTypes.map(fileType => ({
    name: fileType,
    bgColor: colorMapping[fileType],
  }));
};
