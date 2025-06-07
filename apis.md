
# Greeklib.js Documentation

## 1. Overview

`greeklib.js` is a JavaScript library designed for processing Ancient Greek text. Its primary functionalities include:

*   **Tokenization:** Breaking down Greek text into individual tokens (words, punctuation, numbers) based on specified orthographic rules.
*   **URN Management:** Generating and manipulating CITE CTS URNs for text passages and individual tokens.
*   **Text Normalization:** Applying Unicode normalization (NFC) and reordering combining marks for consistent text representation.
*   **Orthography Definition:** Allowing the definition of specific orthographies, including character sets and tokenization logic.
*   **String and Token Validation:** Checking if strings or tokens conform to a defined orthography.
*   **Sentence Segmentation:** Identifying sentence boundaries based on tokenized text and predefined terminators.

The library is UMD (Universal Module Definition) compatible, meaning it can be used in various JavaScript environments (browser global, CommonJS/Node.js, AMD).

## 2. Installation / Usage



### JSDelivr

Easiest:

```html
<script src="https://cdn.jsdelivr.net/gh/neelsmith/greeklib@1.2.1/greeklib.js"></script>
```


### Browser
```html
<script src="greeklib.js"></script>
<script>
    const herodotusUrnText = "urn:cts:greekLit:tlg0016.tlg001.omar:1.1.0|̔Ηροδότου...";
    const lgOrthography = greeklib.literarygreek();
    const tokens = lgOrthography.tokenize(herodotusUrnText);
    console.log(tokens);

    tokens.forEach(token => {
        console.log(`Token "${token.text}" is valid: ${greeklib.isValidToken(token, lgOrthography)}`);
    });
</script>
```

### Node.js (CommonJS)
```bash
# Assuming greeklib.js is in your project
npm install ./path/to/greeklib.js # or copy it to node_modules
```
```javascript
const greeklib = require('greeklib'); // or require('./path/to/greeklib.js')

const herodotusUrnText = "urn:cts:greekLit:tlg0016.tlg001.omar:1.1.0|̔Ηροδότου...";
const lgOrthography = greeklib.literarygreek();
const tokens = lgOrthography.tokenize(herodotusUrnText);
// ...
```

### ES Modules (e.g., with a bundler or in modern browsers)
```javascript
import * as greeklib from './greeklib.js'; // Adjust path as needed

const herodotusUrnText = "urn:cts:greekLit:tlg0016.tlg001.omar:1.1.0|̔Ηροδότου...";
const lgOrthography = greeklib.literarygreek();
const tokens = lgOrthography.tokenize(herodotusUrnText);
// ...
```

## 3. Core Concepts

### 3.1. Token
A `Token` object represents a single unit of text (a word, punctuation mark, or number) identified during tokenization.
*   **`sequence` (Number):** The 1-based sequential order of this token within the passage it was tokenized from.
*   **`urn` (String):** A CITE CTS URN uniquely identifying this token. The URN is derived from the passage URN and includes a token-specific suffix.
*   **`text` (String):** The actual textual content of the token, after normalization.
*   **`type` (String):** The category of the token. Can be:
    *   `"lexical"`: A word.
    *   `"punctuation"`: A punctuation mark.
    *   `"number"`: A numeric token (identified by the `ʹ` flag in the input).

### 3.2. Orthography
An `Orthography` object defines the rules for processing text according to a specific writing system.
*   **`name` (String):** A human-readable name for the orthography (e.g., "Standard literary Greek orthography").
*   **`charset()` (Function):** A method that returns an array of characters considered valid for this orthography.
*   **`tokenize(input)` (Function):** A method that takes an input string (or array of strings) in "urn|text" format and returns an array of `Token` objects.

### 3.3. URNs
The library works with CITE CTS URNs.
*   **Passage URNs:** Input text is expected to be associated with a passage URN (e.g., `urn:cts:greekLit:tlg0016.tlg001.omar:1.1.0`).
*   **Token URNs:** The `tokenize` function generates URNs for each token. It modifies the passage URN by appending `.tokens` or `_tokens` to the work ID part and then adding a token-specific identifier (e.g., `1`, `1a`, `2`).

### 3.4. Text Normalization
Before a token's text is stored, it undergoes two normalization steps:
1.  **Combining Mark Reordering:** If a string starts with whitespace followed by Unicode combining marks and then a letter, the combining marks are moved after the letter (e.g., ` ̔Η` becomes ` Ἡ`).
2.  **Unicode Normalization Form C (NFC):** The string is normalized to its NFC form, ensuring that characters are represented by their precomposed forms where available.

## 4. API Reference

The `greeklib` object exposes the following:

### 4.1. `greeklib.Token`
A class representing a token.
```javascript
new greeklib.Token(sequence, urn, text, type)
```
*   `sequence` (Number): The sequence number of the token.
*   `urn` (String): The CITE CTS URN for the token.
*   `text` (String): The normalized text content of the token.
*   `type` (String): The type of token (`"lexical"`, `"punctuation"`, `"number"`).

### 4.2. `greeklib.Orthography`
A class representing an orthography.
```javascript
new greeklib.Orthography(name, charsetMethod, tokenizeMethod)
```
*   `name` (String): Name of the orthography.
*   `charsetMethod` (Function): A function that returns an array of valid characters.
*   `tokenizeMethod` (Function): A function that performs tokenization for this orthography.

    **Instance Methods:**
*   **`orthography.charset()`:**
    *   Returns: `Array<String>` - A sorted array of characters valid in this orthography.
*   **`orthography.tokenize(input)`:**
    *   `input` (String | Array<String>): A single "urn|text" string or an array of such strings.
    *   Returns: `Array<greeklib.Token>` - An array of token objects.

### 4.3. `greeklib.tokenize(input)`
The primary tokenization function. This is the function typically called by an `Orthography` object's `tokenize` method but can also be used directly if an orthography object isn't needed for other purposes.
```javascript
greeklib.tokenize(input)
```
*   `input` (String | Array<String>): A single "urn|text" string or an array of such strings.
    *   Example: `"urn:cts:greekLit:tlg0001.tlg001:1.1|Μῆνιν ἄειδε θεά"`
    *   Example: `["urn:cts:greekLit:tlg0001.tlg001:1.1|Μῆνιν ἄειδε θεά", "urn:cts:greekLit:tlg0001.tlg001:1.2|Πηληϊάδεω Ἀχιλῆος"]`
*   Returns: `Array<greeklib.Token>` - An array of `Token` objects derived from the input text.

    **Behavior:**
    1.  Parses each "urn|text" pair.
    2.  Modifies the passage URN to create a base URN for tokens (e.g., appends `.tokens`).
    3.  Iterates through the passage text:
        *   Skips whitespace.
        *   Identifies punctuation based on `PUNCTUATION_CHARS` ( `['.', ',', ':', ';', '(', ')', '"']`). Punctuation tokens get a URN suffix like `1a` (where `1` is the ID of the preceding non-punctuation token).
        *   Identifies words (lexical tokens) and numbers. Numbers are words ending with `ʹ` (e.g., `αʹ` becomes token text `α` of type `number`). Lexical/numeric tokens get incrementing numeric URN suffixes (e.g., `1`, `2`).
    4.  Applies `rewriteAndNormalize` to each token's text.
    5.  Creates and collects `Token` objects.

### 4.4. `greeklib.literarygreek()`
A factory function that creates and returns a pre-configured `Orthography` object for standard literary Greek.
```javascript
const literaryGreekOrthography = greeklib.literarygreek();
```
*   Returns: `greeklib.Orthography`

    **The returned `Orthography` object has:**
    *   **`name`**: "Standard literary Greek orthography"
    *   **`charset()`**: Returns an array of characters including:
        *   Basic Greek lowercase and uppercase letters.
        *   Common precomposed accented Greek characters (from Greek and Coptic block, and Greek Extended block).
        *   Apostrophe (`'`).
        *   Punctuation: `.` `,` `;` `:` `(` `)` `"` (defined in `PUNCTUATION_CHARS`).
    *   **`tokenize(input)`**: Uses the main `greeklib.tokenize` function.

### 4.5. `greeklib.isValidString(str, orthography)`
Checks if all characters in a given string are present in the character set of the provided orthography.
```javascript
greeklib.isValidString(str, orthography)
```
*   `str` (String): The string to validate.
*   `orthography` (greeklib.Orthography): An `Orthography` object.
*   Returns: `Boolean` - `true` if all characters in `str` are found in `orthography.charset()`, `false` otherwise.

    **Example:**
    ```javascript
    const lg = greeklib.literarygreek();
    console.log(greeklib.isValidString("θεά", lg)); // true
    console.log(greeklib.isValidString("θεά!", lg)); // false (if '!' is not in charset)
    ```

### 4.6. `greeklib.isValidToken(token, orthography)`
Checks if the `text` property of a given `Token` object is valid according to the provided orthography. This is a convenience function that calls `greeklib.isValidString`.
```javascript
greeklib.isValidToken(token, orthography)
```
*   `token` (greeklib.Token): The `Token` object to validate.
*   `orthography` (greeklib.Orthography): An `Orthography` object.
*   Returns: `Boolean` - `true` if `token.text` is valid, `false` otherwise.

    **Example:**
    ```javascript
    const lg = greeklib.literarygreek();
    const tokens = lg.tokenize("urn:cts:greekLit:tlg0001.tlg001:1.1|θεά");
    if (tokens.length > 0) {
        console.log(greeklib.isValidToken(tokens[0], lg)); // true
    }
    ```

### 4.7. `greeklib.sentences(inputArray)`
Tokenizes input text and then segments it into sentences, returning an array of URN ranges representing those sentences.
```javascript
greeklib.sentences(inputArray)
```
*   `inputArray` (Array<String>): An array of "urn|text" strings.
*   Returns: `Array<String>` - An array of URN range strings. Each string represents a sentence, formatted as `START_TOKEN_URN-END_TOKEN_SUFFIX`.
    *   Example: `["urn:cts:greekLit:tlg0001.tlg001.tokens:1.1.1-1a", "urn:cts:greekLit:tlg0001.tlg001.tokens:1.1.2-3a"]`

    **Behavior:**
    1.  Calls `greeklib.tokenize` on the `inputArray` to get all tokens.
    2.  Iterates through the tokens, identifying sentence boundaries based on `SENTENCE_TERMINATORS` ( `['.', ';']`).
    3.  The last token of the entire input also marks the end of a sentence.
    4.  Constructs URN ranges for each sentence.

### 4.8. `greeklib.tokens(rangeUrnString, allTokensArray)`
Extracts a slice of tokens from a larger array of tokens, based on a URN range.
```javascript
greeklib.tokens(rangeUrnString, allTokensArray)
```
*   `rangeUrnString` (String): A URN range, e.g., `"urn:cts:greekLit:tlg0001.tlg001.tokens:1.1.1-1a"`. It consists of the full URN of the start token and the suffix of the end token, separated by a hyphen.
*   `allTokensArray` (Array<greeklib.Token>): The complete array of tokens from which to extract the slice.
*   Returns: `Array<greeklib.Token>` - A sub-array of tokens matching the range, or an empty array if the range is not found or invalid.

## 5. Internal Constants (Informational)

These constants are used internally by the library:

*   `PUNCTUATION_CHARS` (Array<String>): `['.', ',', ':', ';', '(', ')', '"']`
    *   Used by `tokenizeInternal` to identify punctuation tokens.
    *   Used by `literarygreek().charsetMethod` to define valid punctuation characters.
*   `SENTENCE_TERMINATORS` (Array<String>): `['.', ';']`
    *   Used by the `sentences` function to determine sentence boundaries.
*   `NUMERIC_TOKEN_FLAG` (String): `ʹ` (Greek numeral sign)
    *   Used by `tokenizeInternal` to identify tokens that should be classified as `type: "number"`. The flag itself is removed from the token's text.

## 6. Example Workflow

```javascript
// 1. Get an orthography definition
const literaryGreek = greeklib.literarygreek();
console.log("Orthography Name:", literaryGreek.name);
// console.log("Charset sample:", literaryGreek.charset().slice(0, 20)); // See some valid chars

// 2. Define input text (can be an array for multiple passages)
const inputText = [
    "urn:cts:greekLit:tlg0012.tlg001.perseus-grc2:1.1.1|Μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος οὐλομένην.",
    "urn:cts:greekLit:tlg0012.tlg001.perseus-grc2:1.1.2|ἣ μυρί’ Ἀχαιοῖς ἄλγε’ ἔθηκε,"
];

// 3. Tokenize the input using the orthography's tokenize method
let allTokens = [];
try {
    allTokens = literaryGreek.tokenize(inputText);
} catch (e) {
    console.error("Tokenization error:", e.message);
}

// 4. Work with the tokens
console.log(`\nTotal tokens generated: ${allTokens.length}`);
allTokens.forEach(token => {
    const isValid = greeklib.isValidToken(token, literaryGreek);
    console.log(
        `Token: "${token.text}" (Type: ${token.type}, URN: ${token.urn}, Valid: ${isValid})`
    );
});

// 5. Get sentences from the original input
let sentenceUrns = [];
try {
    sentenceUrns = greeklib.sentences(inputText); // Assumes allTokens were generated from same inputText
} catch (e) {
    console.error("Sentence segmentation error:", e.message);
}

console.log("\nSentence URN Ranges:");
sentenceUrns.forEach(urnRange => {
    console.log(urnRange);
    // Optionally, retrieve tokens for each sentence
    const sentenceTokens = greeklib.tokens(urnRange, allTokens);
    // console.log("  Tokens in sentence:", sentenceTokens.map(t => t.text).join(" "));
});

// 6. Using isValidString directly
const testString1 = "Ἑλλήνων";
const testString2 = "Hello!";
console.log(`\n"${testString1}" is valid for literary Greek: ${greeklib.isValidString(testString1, literaryGreek)}`);
console.log(`"${testString2}" is valid for literary Greek: ${greeklib.isValidString(testString2, literaryGreek)}`);
```