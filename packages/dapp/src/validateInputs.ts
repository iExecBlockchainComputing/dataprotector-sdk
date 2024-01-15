import { string } from 'yup';

export const pathSchema = string().test({
  name: 'pathFormat',
  message: 'Invalid path format',
  test: (value) => {
    return (
      value === '/' ||
      /^(\/[a-zA-Z0-9_-]+)+([.][a-zA-Z0-9]+)?$/.test(value) ||
      /^[a-zA-Z]:\\[^\x00-\x1F*:"<>?|/]+\.[a-zA-Z0-9]+$/.test(value)
    );
  },
});
