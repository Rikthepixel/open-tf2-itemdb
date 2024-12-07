const normalizeLineEndingRule = /\r\n/g; // Replace \r\n with \n
const baseIncludeRule = /^#(?:include|base).*/gm; // Has CPP like inlude and import for us that isn't nessecary
const numericRule = /^\d*\.?\d+$/gm; // Checks if value is numeric

const commentRule = /^\/\/.*$|(?<=.*"\s*)\/\/.*$/gm; // Removes comments and empty newlines and UTF8 boms
const keyValueRule = /\s*"(?:[^"\\]|\\.)*?"|\s*[{}]/gsy; // Matches the simple key-value format and subobjects

/**
 * Parses Valve's Key Value format.
 *
 * @see https://developer.valvesoftware.com/wiki/KeyValues
 * @throws {SyntaxError} If the passed string contains invalid VDF
 */
export function parseVdf<T = unknown>(vdf: string): T {
  if (vdf.charCodeAt(0) === 0xfeff) {
    vdf = vdf.slice(1);
  }

  vdf = vdf
    .replace(normalizeLineEndingRule, "\n")
    .replace(baseIncludeRule, "")
    .replace(commentRule, "")
    .trim();

  const matches = vdf.match(keyValueRule);

  if (!matches) {
    throw new SyntaxError("Passed string was not valid VDF");
  }

  const deserialized: any = {};
  const stack = [deserialized];

  let currentKey: string | null = null;

  for (const match of matches) {
    let content = match.trim();

    // String, or key
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
      if (!currentKey) {
        currentKey = content;
        continue;
      } else {
        let value: any = content;

        switch (content) {
          case "true":
          case "false":
            value = Boolean(content);
            break;

          case "null":
            value = null;
            break;

          case "undefined":
            value = undefined;
            break;

          default:
            const isNummeric = numericRule.test(content);
            if (isNummeric) {
              value = parseFloat(content);
              break;
            }

            break;
        }

        stack.at(-1)![currentKey] = value;
        currentKey = null;
        continue;
      }
    }

    // Start object
    if (content === "{") {
      if (!currentKey) {
        throw new SyntaxError(
          "Opening bracket `{` used, but there is no matching preceding key",
        );
      }
      const newObject = {};
      stack.at(-1)![currentKey] = newObject;
      stack.push(newObject);
      currentKey = null;
      continue;
    }

    // End object
    if (content === "}") {
      if (stack.length === 0) {
        throw new SyntaxError(
          "Closing bracket `}` used, but not inside object",
        );
      }
      stack.pop();
      continue;
    }
  }

  return deserialized;
}
