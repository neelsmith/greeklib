
# greeklib.js

`greeklib.js` is a JavaScript library designed for working with citable texts in polytonic Ancient Greek. It provides tools for parsing and manipulating Greek text according to common scholarly conventions, particularly those related to CTS (Citable Text Services) URNs.

## Table of Contents

1.  [Installation](#installation)
2.  [Core Concepts](#core-concepts)
    *   [CTS URNs](#cts-urns)
    *   [Tokens](#tokens)
3.  [API Reference](#api-reference)
    *   [`greeklib.Token`](#greeklibtoken) (Class)
    *   [`greeklib.tokenize(input)`](#greeklibtokenizeinput) (Function)
4.  [Usage Examples](#usage-examples)
5.  [Tokenization Rules](#tokenization-rules)
    *   [Text Splitting](#text-splitting)
    *   [Token Types](#token-types)
    *   [URN Generation for Tokens](#urn-generation-for-tokens)
6.  [Contributing](#contributing)
7.  [License](#license)

## Installation

### Using jsDelivr CDN

You can include `greeklib.js` directly in your HTML file from the jsDelivr CDN like this:

```html
<script src="https://cdn.jsdelivr.net/gh/neelsmith/greeklib@1.0.0/greeklib.js"></script>
```

### Local Installation

1.  Download `greeklib.js` from the repository.
2.  Include it in your project:

```html
<script src="path/to/greeklib.js"></script>
```

## Core Concepts

### CTS URNs

The library heavily utilizes CTS URNs (Canonical Text Services Uniform Resource Names) for identifying text passages and individual tokens.The syntax of a CTS URN  is:

`urn:cts:<namespace>:<work_id>:<passage>`

Example: `urn:cts:greekLit:tlg0552.tlg001.ap:1.proposition.1`

### Tokens

A token is the smallest unit of text resulting from the tokenization process. Each token has associated properties like its text content, type, sequence number, and a unique URN.

## API Reference

The library exposes a global object `greeklib` when included in a browser environment.

### `greeklib.Token` (Class)

Represents a single token extracted from a text passage.

#### Constructor

`new greeklib.Token(sequence, urn, text, type)`

*   `sequence` (Integer): The 1-based sequence number of this token within its original passage.
*   `urn` (String): The unique CTS URN identifying this specific token.
*   `text` (String): The textual content of the token.
*   `type` (String): The type of the token. Possible values are:
    *   `"number"`: For numeric tokens (e.g., "Α" when followed by "ʹ").
    *   `"lexical"`: For word tokens.
    *   `"punctuation"`: For punctuation marks.

#### Properties

*   `token.sequence`: (Integer) As above.
*   `token.urn`: (String) As above.
*   `token.text`: (String) As above.
*   `token.type`: (String) As above.

### `greeklib.tokenize(input)` (Function)

Analyzes a passage of Greek text (or multiple passages) and splits it into a series of `Token` objects.

#### Parameters

*   `input` (String | Array<String>):
    *   If a String: A single pipe-delimited string in the format `"urn|text"`.
        Example: `"urn:cts:greekLit:tlg0001.tlg001.perseus-grc2:1.1|Μῆνιν ἄειδε θεά"`
    *   If an Array of Strings: Each string in the array must be a pipe-delimited `"urn|text"` pair.

#### Returns

*   (Array<`greeklib.Token`>): An array of `Token` objects. If the input was an array of passage strings, the returned array will contain all tokens from all processed passages, concatenated.

#### Error Handling

*   Throws an `Error` if the input parameter is not a string or an array of strings.
*   Throws an `Error` if a passage URN is malformed (e.g., less than 5 colon-delimited components or work ID part count is not 3 or 4).
*   Logs a warning to the console for malformed `"urn|text"` pairs and skips them.
*   Logs a warning and uses a placeholder URN suffix if punctuation occurs where its URN cannot be determined by the standard rules (e.g., at the very start of a passage).

## Usage Examples

```html
<!DOCTYPE html>
<html>
<head>
    <title>greeklib.js Example</title>
    <script src="greeklib.js"></script> <!-- Or CDN link -->
</head>
<body>
    <div id="results"></div>
    <script>
        const passageData1 = "urn:cts:greekLit:tlg0552.tlg001.ap:1.ex.1|Αʹ ἐάνπερ κύκλον.";
        const passageData2 = "urn:cts:greekLit:tlg0552.tlg001.ap.ver1:1.ex.2|Βʹ πάλιν.";

        try {
            // Tokenize a single passage
            const tokens1 = greeklib.tokenize(passageData1);
            console.log("Tokens from passage 1:", tokens1);
            
            // Tokenize multiple passages
            const allTokens = greeklib.tokenize([passageData1, passageData2]);
            console.log("All tokens:", allTokens);

            // Displaying tokens (simple example)
            const resultsDiv = document.getElementById('results');
            allTokens.forEach(token => {
                const p = document.createElement('p');
                p.textContent = `Seq: ${token.sequence}, URN: ${token.urn}, Text: "${token.text}", Type: ${token.type}`;
                resultsDiv.appendChild(p);
            });

        } catch (error) {
            console.error("Error during tokenization:", error);
        }
    </script>
</body>
</html>
```

## Tokenization Rules

### Text Splitting and Token Properties (`text`, `type`, `sequence`)

1.  **Whitespace**: Whitespace characters (spaces, newlines, tabs) are used to separate tokens but are not part of any token themselves.
2.  **Punctuation Tokens**:
    *   Characters: `.`, `,`, `:`, `;`
    *   Each occurrence forms a single token of type `"punctuation"`.
    *   The `text` property is the punctuation character itself.
3.  **Numeric Tokens**:
    *   The character `ʹ` (Greek numeral sign / Keraia) acts as a numeric token flag.
    *   Any continuous series of non-punctuation, non-whitespace characters *immediately preceding* the `ʹ` flag constitutes the `text` of a token of type `"number"`. The `ʹ` itself is not part of the token's `text`.
    *   Example: "Αʹ" results in a token with `text: "Α"` and `type: "number"`.
4.  **Lexical Tokens**:
    *   Any continuous series of characters that is:
        *   Not part of a numeric token (i.e., not immediately followed by `ʹ`).
        *   Not a whitespace character.
        *   Not a punctuation token.
    *   Constitutes a token of type `"lexical"`.
    *   The `text` property is the continuous series of characters.
5.  **Sequence**: The `sequence` property is a 1-based integer, incrementing for each token identified within a single input passage string.

**Example**: `"Αʹ ἐάνπερ κύκλον,"`
*   Token 1: `sequence: 1`, `text: "Α"`, `type: "number"`
*   Token 2: `sequence: 2`, `text: "ἐάνπερ"`, `type: "lexical"`
*   Token 3: `sequence: 3`, `text: "κύκλον"`, `type: "lexical"`
*   Token 4: `sequence: 4`, `text: ","`, `type: "punctuation"`

### URN Generation for Tokens

Each token is assigned a unique CTS URN derived from the URN of its parent passage.

1.  **Modify Work Identifier**:
    The 4th component of the passage URN (the work identifier) is modified:
    *   If the work identifier has 3 period-separated subparts (e.g., `tlg0552.tlg001.ap`):
        A fourth subpart `tokens` is added.
        Example: `tlg0552.tlg001.ap` -> `tlg0552.tlg001.ap.tokens`
    *   If the work identifier has 4 period-separated subparts (e.g., `tlg0552.tlg001.ap.normalized`):
        The string `_tokens` is appended to the existing fourth subpart.
        Example: `tlg0552.tlg001.ap.normalized` -> `tlg0552.tlg001.ap.normalized_tokens`
    *   If the work identifier does not have 3 or 4 parts, an error is thrown.

    The base URN for tokens in a passage becomes:
    `urn:cts:<namespace>:<modified_work_id>:<original_passage_id_or_range>`

2.  **Append Token-Specific Passage Identifier**:
    A token-specific identifier is appended to this modified base URN, separated by a period.
    *   **Lexical and Numeric Tokens**:
        These tokens are numbered sequentially within the passage, starting from 1. This number becomes their token-specific identifier.
        Example: `.1`, `.2`, `.3`, ...
    *   **Punctuation Tokens**:
        They are *not* independently numbered in the main sequence for URN generation. Instead, their identifier is formed by taking the numeric identifier of the *immediately preceding lexical or numeric token* and appending the letter `a`.
        Example: If the preceding lexical token was `.4`, a subsequent punctuation token gets `.4a`.
        *Note*: If a punctuation token appears at the very beginning of a passage or is not preceded by a lexical/numeric token (e.g., multiple punctuation marks in a row), its URN suffix cannot be formed by this rule. In such cases, a warning is logged, and a placeholder suffix like `.error_orphaned_punctuation_a` is used.

**Example of Final Token URNs**:
Given passage URN `urn:cts:greekLit:tlg0552.tlg001.ap:1.prop.1` and text `"Αʹ λόγος."`

*   Base token URN: `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.prop.1`
*   Token 1 ("Α", number): `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.prop.1.1`
*   Token 2 ("λόγος", lexical): `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.prop.1.2`
*   Token 3 (".", punctuation): `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.prop.1.2a`

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs, feature requests, or improvements.
