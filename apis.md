


# greeklib.js

`greeklib.js` is a JavaScript library designed for working with citable texts in polytonic Ancient Greek. It provides tools for tokenizing Greek text according to common scholarly conventions, identifying sentence structures based on token URNs, retrieving specific token sequences, and defining orthographic properties. The library heavily utilizes CTS (Citable Text Services) URNs.

## Table of Contents

1.  [Installation](#installation)
2.  [Core Concepts](#core-concepts)
    *   [CTS URNs](#cts-urns)
    *   [Tokens](#tokens)
    *   [Orthography](#orthography)
3.  [API Reference](#api-reference)
    *   [`greeklib.Token`](#greeklibtoken) (Class)
    *   [`greeklib.Orthography`](#greekliborthography) (Class)
    *   [`greeklib.tokenize(input)`](#greeklibtokenizeinput-function)
    *   [`greeklib.sentences(inputArray)`](#greeklibsentencesinputarray-function)
    *   [`greeklib.tokens(rangeUrnString, allTokensArray)`](#greeklibtokensrangeurnstring-alltokensarray-function)
    *   [`greeklib.literarygreek()`](#greeklibliterarygreek--function)
4.  [Usage Examples](#usage-examples)
5.  [Tokenization Rules](#tokenization-rules)
    *   [Text Splitting](#text-splitting)
    *   [Token Types](#token-types)
    *   [URN Generation for Tokens](#urn-generation-for-tokens)
6.  [Sentence Identification](#sentence-identification)
7.  [Contributing](#contributing)
8.  [License](#license)

## Installation

### Using jsDelivr CDN

You can include `greeklib.js` directly in your HTML file from the jsDelivr CDN. Replace `your-github-username` and `your-repo-name` with your actual GitHub username and repository name, and `@main` with the specific branch, tag, or commit hash if needed.

```html
<script src="https://cdn.jsdelivr.net/gh/neelsmith/greeklib/greeklib.js"></script>
```

### Local Installation

1.  Download `greeklib.js` from the repository.
2.  Include it in your project:

```html
<script src="path/to/greeklib.js"></script>
```

## Core Concepts

### CTS URNs

The library heavily utilizes CTS URNs (Canonical Text Services Uniform Resource Names) for identifying text passages and individual tokens. A typical passage URN structure is:

`urn:cts:<namespace>:<work_id>:<passage_id_or_range>`

Example: `urn:cts:greekLit:tlg0552.tlg001.ap:1.proposition.1`

Token URNs are derived from passage URNs, as detailed in the [URN Generation for Tokens](#urn-generation-for-tokens) section.

### Tokens

A token is the smallest unit of text resulting from the tokenization process. Each token is an instance of the `greeklib.Token` class and has associated properties like its text content, type, sequence number, and a unique URN.

### Orthography

An orthography defines a set of linguistic conventions, including the valid character set and specific tokenization rules for a language or text type. In `greeklib.js`, this is represented by the `greeklib.Orthography` class.

## API Reference

The library exposes a global object `greeklib` when included in a browser environment.

### `greeklib.Token` (Class)

Represents a single token extracted from a text passage.

#### Constructor

`new greeklib.Token(sequence, urn, text, type)`

*   `sequence` (Integer): The 1-based sequence number of this token within its original passage.
*   `urn` (String): The unique CTS URN identifying this specific token.
*   `text` (String): The textual content of the token.
*   `type` (String): The type of the token. Possible values: `"number"`, `"lexical"`, or `"punctuation"`.

#### Properties

*   `token.sequence`: (Integer) As above.
*   `token.urn`: (String) As above.
*   `token.text`: (String) As above.
*   `token.type`: (String) As above.

### `greeklib.Orthography` (Class)

Represents an orthographic system, defining its character set and tokenization behavior.

#### Constructor

`new greeklib.Orthography(name, charsetMethod, tokenizeMethod)`

*   `name` (String): A human-readable name for the orthography.
*   `charsetMethod` (Function): A method that, when called, returns an array of strings, where each string is a character belonging to the orthography's character set.
*   `tokenizeMethod` (Function): A method that takes a single string parameter (in `urn|text` format) and returns an array of `greeklib.Token` objects.

#### Properties

*   `orthography.name`: (String) The name of the orthography.
*   `orthography.charset`: (Function) The method to get the character set.
*   `orthography.tokenize`: (Function) The method to tokenize text according to this orthography.

### `greeklib.tokenize(input)` (Function)

Analyzes a passage of Greek text (or multiple passages) and splits it into a series of `Token` objects based on the library's default tokenization rules.

#### Parameters

*   `input` (String | Array<String>):
    *   If a String: A single pipe-delimited string in the format `"urn|text"`.
        Example: `"urn:cts:greekLit:tlg0001.tlg001.perseus-grc2:1.1|Μῆνιν ἄειδε θεά"`
    *   If an Array of Strings: Each string in the array must be a pipe-delimited `"urn|text"` pair.

#### Returns

*   (Array<`greeklib.Token`>): An array of `Token` objects. If the input was an array of passage strings, the returned array will contain all tokens from all processed passages, concatenated.

#### Error Handling

*   Throws an `Error` if the input parameter is not a string or an array of strings.
*   Throws an `Error` if a passage URN is malformed.
*   Logs warnings for malformed `"urn|text"` pairs or problematic URN generation scenarios.

### `greeklib.sentences(inputArray)` (Function)

Identifies sentence boundaries within a tokenized text and returns URN ranges for each sentence.

#### Parameters

*   `inputArray` (Array<String>): An array of pipe-delimited strings, each in the format `"urn|text"`.

#### Returns

*   (Array<String>): An array of CTS URN range strings. Each string represents a sentence. The range is formed by the full URN of the first token in the sentence and the passage identifier part of the last token's URN, separated by a hyphen.
    Example: `"urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.ex.1.1-1.ex.1.26a"`

#### Process

1.  Calls `greeklib.tokenize()` internally on the `inputArray` to get a flat list of all tokens.
2.  Iterates through the tokens. A sentence is considered terminated by a token whose `text` property is `.` or `;`, or by the end of the entire token sequence.
3.  Constructs a URN range for each identified sentence.

### `greeklib.tokens(rangeUrnString, allTokensArray)` (Function)

Retrieves a subset of `Token` objects from a larger array based on a CTS URN range string.

#### Parameters

*   `rangeUrnString` (String): A CTS URN range string. The expected format is the full URN of the starting token, a hyphen (`-`), and then the passage identifier part of the ending token's URN.
    Example: `"urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.ex.1.27-1.ex.1.37a"`
*   `allTokensArray` (Array<`greeklib.Token`>): An array of `Token` objects (e.g., the full output of `greeklib.tokenize()` for a text).

#### Returns

*   (Array<`greeklib.Token`>): An array containing the `Token` objects that fall within the specified range, inclusive. Returns an empty array if the range is invalid or no tokens match.

#### Process

1.  Parses the `rangeUrnString` to determine the full URN of the start token and reconstruct the full URN of the end token.
2.  Finds the indices of the start and end tokens within `allTokensArray`.
3.  Returns a slice of `allTokensArray` from the start index to the end index (inclusive).

### `greeklib.literarygreek()` (Function)

A factory function that returns a pre-configured `greeklib.Orthography` object representing standard literary polytonic Ancient Greek.

#### Parameters

None.

#### Returns

*   (`greeklib.Orthography`): An `Orthography` object with:
    *   `name`: `"Standard literary Greek orthography"`
    *   `charset()`: A method returning an array of characters including:
        *   Basic Greek alphabet (uppercase and lowercase).
        *   Punctuation: `.`, `,`, `;`, `:`.
        *   A comprehensive list of precomposed Unicode characters for polytonic Greek (from the "Greek and Coptic" and "Greek Extended" Unicode blocks).
    *   `tokenize(inputString)`: A method that internally calls `greeklib.tokenize(inputString)` using the library's default tokenization rules.

## Usage Examples

```javascript
// Get the standard literary Greek orthography
const literaryGreek = greeklib.literarygreek();
console.log("Orthography Name:", literaryGreek.name);

// Get its character set
// const charSet = literaryGreek.charset();
// console.log("First 10 Chars:", charSet.slice(0, 10).join(" ")); // Charset is very long

// Tokenize using the orthography's tokenizer
const passageData = "urn:cts:greekLit:tlg0001.tlg001:1.1|Μῆνιν ἄειδε θεά.";
const tokensFromOrtho = literaryGreek.tokenize(passageData);
console.log("Tokens (from Ortho):", tokensFromOrtho);

// Tokenize directly using the library's main function
const tokensDirect = greeklib.tokenize(passageData);
console.log("Tokens (direct):", tokensDirect);

// --- Sentence and Token Range Example ---
const corpusData = [
    "urn:cts:greekLit:tlg0552.tlg001.ap:1.ex.1|Δύο μεγεθῶν. Πρώτη πρότασις.",
    "urn:cts:greekLit:tlg0552.tlg001.ap:1.ex.2|Ἄλλη δέ τις. Καὶ οὕτως;"
];

// Get all tokens from the corpus
const allCorpusTokens = greeklib.tokenize(corpusData);

// Identify sentence ranges
const sentenceUrns = greeklib.sentences(corpusData);
console.log("Sentence URN Ranges:", sentenceUrns);

// If sentences were found, get tokens for the first sentence
if (sentenceUrns.length > 0) {
    const firstSentenceRange = sentenceUrns[0];
    const tokensInFirstSentence = greeklib.tokens(firstSentenceRange, allCorpusTokens);
    console.log(`Tokens in sentence "${firstSentenceRange}":`, tokensInFirstSentence);
}
```

## Tokenization Rules

These rules apply to the default `greeklib.tokenize()` function and thus to the `tokenize` method of the `Orthography` object returned by `greeklib.literarygreek()`.

### Text Splitting and Token Properties (`text`, `type`, `sequence`)

1.  **Whitespace**: Whitespace characters (spaces, newlines, tabs) separate tokens but are not part of any token.
2.  **Punctuation Tokens**:
    *   Characters: `.`, `,`, `:`, `;`
    *   Each forms a single token of type `"punctuation"`.
3.  **Numeric Tokens**:
    *   The character `ʹ` (Greek numeral sign / Keraia) flags a numeric token.
    *   A preceding continuous series of non-punctuation, non-whitespace characters forms the `text` of a `"number"` token. The `ʹ` is not included in the `text`.
    *   Example: "Αʹ" -> `text: "Α"`, `type: "number"`.
4.  **Lexical Tokens**:
    *   Any continuous series of non-punctuation, non-whitespace characters, not part of a numeric token, forms a `"lexical"` token.
5.  **Sequence**: The `sequence` property is a 1-based integer, incrementing for each token within a single input passage string.

### URN Generation for Tokens

Each token receives a unique CTS URN.

1.  **Modify Work Identifier (from passage URN)**:
    *   If passage work ID has 3 parts (e.g., `tlg0552.tlg001.ap`): Append `.tokens`.
        -> `tlg0552.tlg001.ap.tokens`
    *   If passage work ID has 4+ parts (e.g., `tlg0552.tlg001.ap.normalized`): Append `_tokens`.
        -> `tlg0552.tlg001.ap.normalized_tokens`
    The base URN for tokens becomes: `urn:cts:<namespace>:<modified_work_id>:<original_passage_id>`

2.  **Append Token-Specific Identifier**:
    *   **Lexical/Numeric Tokens**: Sequentially numbered within the passage (e.g., `.1`, `.2`).
    *   **Punctuation Tokens**: Appends the number of the preceding lexical/numeric token followed by `a` (e.g., `.2a`). If no such preceding token exists (e.g., punctuation at start), a placeholder like `.error_orphaned_punctuation_a` is used.

## Sentence Identification

The `greeklib.sentences()` function identifies sentences based on the following logic:
*   It first tokenizes all input text passages using `greeklib.tokenize()`.
*   Sentence terminators are tokens with the text `.` or `;`.
*   The end of the entire token stream also implicitly ends the last sentence.
*   The function returns an array of URN range strings. Each string identifies a sentence using the URN of its first token and the passage-specific part of the URN of its last token (e.g., `urn:...:1.1-1.5a`).

## Contributing

Contributions are welcome! Please submit pull requests or open issues for bugs, feature requests, or improvements.