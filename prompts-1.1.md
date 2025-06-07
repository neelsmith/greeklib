I have a javascript library named `greeklib.js` that I want to modify. Here is the current library:

```
// greeklib.js
(function(root) {
    'use strict';

    class Token {
        constructor(sequence, urn, text, type) {
            this.sequence = sequence;
            this.urn = urn;
            this.text = text;
            this.type = type;
        }
    }

    const PUNCTUATION_CHARS = ['.', ',', ':', ';', '(', ')', '"'];
    const SENTENCE_TERMINATORS = ['.', ';'];
    const NUMERIC_TOKEN_FLAG = 'ʹ';

    function rewriteAndNormalize(str) {
        // Regex explanation:
        // ^          - Start of the string.
        // (\s*)      - Group 1: Capture any leading whitespace characters (zero or more).
        // ([\p{M}]+) - Group 2: Capture one or more Unicode combining marks.
        //              \p{M} is a Unicode property escape for "Mark".
        // (\p{L})    - Group 3: Capture the first Unicode alphabetic character.
        //              \p{L} is a Unicode property escape for "Letter".
        // (.*)       - Group 4: Capture the rest of the string.
        // u          - Unicode flag, essential for \p{} to work correctly.
        const regex = /^(\s*)([\p{M}]+)(\p{L})(.*)/u;

        let processedString;

        if (regex.test(str)) {
            // Reorder: whitespace + letter + combining_marks + rest_of_string
            processedString = str.replace(regex, "$1$3$2$4");
        } else {
            // If the pattern doesn't match (e.g., no leading combining characters,
            // or no alphabetic character after them), use the original string.
            processedString = str;
        }

        // Normalize the processed string to NFC (Normalization Form C - Precomposed)
        return processedString.normalize('NFC');
    }
    function modifyPassageUrnForTokens(passageUrn) {
        const parts = passageUrn.split(':');
        if (parts.length < 5) {
            throw new Error(`Invalid URN format: "${passageUrn}". A passage URN must have at least 5 colon-delimited components.`);
        }
        const workId = parts[3];
        const workIdParts = workId.split('.');
        let newWorkId;
        if (workIdParts.length === 3) {
            newWorkId = workId + ".tokens";
        } else if (workIdParts.length >= 4) {
            newWorkId = workId + "_tokens";
        } else {
            throw new Error(`Work ID "${workId}" has an unsupported number of parts.`);
        }
        const originalPassageRef = parts.slice(4).join(':');
        return parts.slice(0, 3).join(':') + ':' + newWorkId + ':' + originalPassageRef;
    }

    function tokenizeInternal(input) { // Renamed to avoid conflict if Orthography.tokenize is called directly
        const inputTextPairs = [];
        if (typeof input === 'string') {
            inputTextPairs.push(input);
        } else if (Array.isArray(input)) {
            inputTextPairs.push(...input);
        } else {
            throw new Error('Input to tokenize must be a single pipe-delimited string (urn|text) or an Array of such strings.');
        }

        const allTokens = [];
        for (const pair of inputTextPairs) {
            // ... (rest of the tokenizeInternal logic remains the same as the previous tokenize) ...
            if (typeof pair !== 'string' || !pair.includes('|')) {
                console.warn(`Skipping malformed input pair: "${pair}". Expected "urn|text" format.`);
                continue;
            }
            const parts = pair.split('|');
            if (parts.length !== 2) {
                console.warn(`Skipping malformed input pair: "${pair}". Expected "urn|text" format with exactly one pipe.`);
                continue;
            }
            const passageUrn = parts[0].trim();
            const passageText = parts[1]; 

            if (!passageUrn) {
                console.warn(`Skipping input pair with empty URN: "${pair}".`);
                continue;
            }
             if (!passageText.trim()) {
                console.warn(`Skipping input pair with empty text content for URN "${passageUrn}".`);
                continue;
            }

            let baseUrnForTokensInPassage;
            try {
                baseUrnForTokensInPassage = modifyPassageUrnForTokens(passageUrn);
            } catch (e) {
                console.error(`Error modifying URN for tokenization (passage URN: "${passageUrn}"): ${e.message}`);
                continue; 
            }
            
            let tokenSequenceInPassage = 0;
            let lexicalNumericCounterForUrn = 0;
            let lastLexicalOrNumericUrnId = "";
            let currentIndex = 0;

            while (currentIndex < passageText.length) {
                while (currentIndex < passageText.length && /\s/.test(passageText[currentIndex])) {
                    currentIndex++;
                }
                if (currentIndex >= passageText.length) break;

                let char = passageText[currentIndex];
                let currentTokenText = "";
                let currentTokenType = "";
                let tokenUrnSuffix = "";

                if (PUNCTUATION_CHARS.includes(char)) {
                    currentTokenText = char;
                    currentTokenType = "punctuation";
                    currentIndex++; 

                    if (!lastLexicalOrNumericUrnId) {
                        console.warn(`Punctuation token "${currentTokenText}" in URN "${passageUrn}" cannot be assigned a URN suffix according to the rules, as no preceding non-punctuation token ID is available. Assigning a placeholder suffix.`);
                        tokenUrnSuffix = "error_orphaned_punctuation_a";
                    } else {
                        tokenUrnSuffix = lastLexicalOrNumericUrnId + "a";
                    }
                } else {
                    let tokenBuffer = "";
                    let tempIndex = currentIndex;
                    while (tempIndex < passageText.length && !/\s/.test(passageText[tempIndex]) && !PUNCTUATION_CHARS.includes(passageText[tempIndex])) {
                        tokenBuffer += passageText[tempIndex];
                        tempIndex++;
                    }

                    if (tokenBuffer.endsWith(NUMERIC_TOKEN_FLAG) && tokenBuffer.length > NUMERIC_TOKEN_FLAG.length) {
                        currentTokenText = tokenBuffer.slice(0, -NUMERIC_TOKEN_FLAG.length);
                        currentTokenType = "number";
                    } else {
                        currentTokenText = tokenBuffer;
                        currentTokenType = "lexical";
                    }
                    currentIndex = tempIndex;

                    lexicalNumericCounterForUrn++;
                    tokenUrnSuffix = lexicalNumericCounterForUrn.toString();
                    lastLexicalOrNumericUrnId = tokenUrnSuffix;
                }

                if (currentTokenText && currentTokenType) {
                    tokenSequenceInPassage++;
                    const finalTokenUrn = baseUrnForTokensInPassage + "." + tokenUrnSuffix;
                    allTokens.push(new Token(tokenSequenceInPassage, finalTokenUrn, rewriteAndNormalize(currentTokenText), currentTokenType));
                }
            }
        }
        return allTokens;
    }

    function sentences(inputArray) {
        if (!Array.isArray(inputArray)) {
            throw new Error("Input to sentences must be an Array of 'urn|text' strings.");
        }
        const validInputs = inputArray.filter(s => typeof s === 'string' && s.trim() !== "" && s.includes('|'));
        if (validInputs.length === 0) return [];
        
        const allTokens = tokenizeInternal(validInputs);
        if (allTokens.length === 0) return [];

        const sentenceRanges = [];
        let currentSentenceStartIndex = 0;
        for (let i = 0; i < allTokens.length; i++) {
            const currentToken = allTokens[i];
            const isTerminator = SENTENCE_TERMINATORS.includes(currentToken.text);
            const isLastTokenOfAll = i === allTokens.length - 1;
            if (isTerminator || isLastTokenOfAll) {
                if (currentSentenceStartIndex <= i) {
                    const startTokenInSentence = allTokens[currentSentenceStartIndex];
                    const endTokenInSentence = currentToken;
                    const endTokenPassagePartIndex = endTokenInSentence.urn.lastIndexOf(':') + 1;
                    const endTokenPassageRef = endTokenInSentence.urn.substring(endTokenPassagePartIndex);
                    const rangeUrn = startTokenInSentence.urn + "-" + endTokenPassageRef;
                    sentenceRanges.push(rangeUrn);
                }
                currentSentenceStartIndex = i + 1;
            }
        }
        return sentenceRanges;
    }

    function tokens(rangeUrnString, allTokensArray) {
        if (typeof rangeUrnString !== 'string' || !rangeUrnString.includes('-')) {
            throw new Error("Invalid range URN string format. Expected 'START_URN-END_SUFFIX'.");
        }
        if (!Array.isArray(allTokensArray)) {
            throw new Error("Second parameter must be an array of Token objects.");
        }
        if (allTokensArray.length === 0) return [];

        const parts = rangeUrnString.split('-');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error("Invalid range URN string: Must be 'START_URN-END_SUFFIX'.");
        }
        const startTokenFullUrn = parts[0];
        const endTokenPassageIdSuffixFromRange = parts[1];
        const lastColonInStartUrn = startTokenFullUrn.lastIndexOf(':');
        if (lastColonInStartUrn === -1) {
            throw new Error(`Could not parse base URN from start token URN: ${startTokenFullUrn}`);
        }
        const urnBaseForEndToken = startTokenFullUrn.substring(0, lastColonInStartUrn + 1);
        const endTokenFullUrn = urnBaseForEndToken + endTokenPassageIdSuffixFromRange;

        let startIndex = -1, endIndex = -1;
        for (let i = 0; i < allTokensArray.length; i++) {
            const currentToken = allTokensArray[i];
            if (!currentToken || typeof currentToken.urn !== 'string') continue;
            if (currentToken.urn === startTokenFullUrn) startIndex = i;
            if (currentToken.urn === endTokenFullUrn) endIndex = i;
        }
        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            console.warn(`Token range not found or invalid for URN: ${rangeUrnString}. Start: ${startIndex}, End: ${endIndex}`);
            return [];
        }
        return allTokensArray.slice(startIndex, endIndex + 1);
    }

    // --- New Orthography Class and literarygreek function ---
    class Orthography {
        constructor(name, charsetMethod, tokenizeMethod) {
            this.name = name;
            this.charset = charsetMethod; // Store the method itself
            this.tokenize = tokenizeMethod; // Store the method itself
        }
    }

    function literarygreek() {
        const name = "Standard literary Greek orthography";

        const charsetMethod = function() {
            const charSet = new Set();

            charSet.add("'") // Elision mark
            // Basic lowercase Greek letters
            for (let i = 0x03B1; i <= 0x03C1; i++) charSet.add(String.fromCharCode(i)); // α-ρ
            charSet.add(String.fromCharCode(0x03C2)); // ς (final sigma)
            for (let i = 0x03C3; i <= 0x03C9; i++) charSet.add(String.fromCharCode(i)); // σ-ω

            // Basic uppercase Greek letters
            for (let i = 0x0391; i <= 0x03A1; i++) charSet.add(String.fromCharCode(i)); // Α-Ρ
            // Skip 0x03A2 (deprecated GREEK LETTER LUNATE SIGMA SYMBOL)
            for (let i = 0x03A3; i <= 0x03A9; i++) charSet.add(String.fromCharCode(i)); // Σ-Ω

            // Punctuation
            ['.', ',', ';', ':'].forEach(p => charSet.add(p));

            // Common precomposed characters from Greek and Coptic block (U+0370-U+03FF)
            // (vowels with tonos, vowels with diaeresis)
            [
                0x03AC, 0x03AD, 0x03AE, 0x03AF, 0x03CC, 0x03CD, 0x03CE, // ά έ ή ί ό ύ ώ
                0x0386, 0x0388, 0x0389, 0x038A, 0x038C, 0x038E, 0x038F, // Ά Έ Ή Ί Ό Ύ Ώ
                0x03AA, 0x03AB, // Ϊ Ϋ
                0x03CA, 0x03CB  // ϊ ϋ
            ].forEach(code => charSet.add(String.fromCharCode(code)));

            // Precomposed letters from Greek Extended block (U+1F00-U+1FFF)
            // These are ranges of precomposed letters.
            const greekExtendedLetterRanges = [
                [0x1F00, 0x1F07], [0x1F08, 0x1F0F], // smooth breathing
                [0x1F10, 0x1F15], [0x1F18, 0x1F1D], // rough breathing
                [0x1F20, 0x1F27], [0x1F28, 0x1F2F], // smooth + grave
                [0x1F30, 0x1F37], [0x1F38, 0x1F3F], // smooth + acute
                [0x1F40, 0x1F45], [0x1F48, 0x1F4D], // rough + grave
                [0x1F50, 0x1F57],                   // rough + acute (includes upsilon/omega variants)
                [0x1F59, 0x1F59], [0x1F5B, 0x1F5B], [0x1F5D, 0x1F5D], // Uppercase rough+acute (H, Y)
                [0x1F60, 0x1F67], [0x1F68, 0x1F6F], // smooth + circumflex
                [0x1F70, 0x1F7D],                   // vowels with grave / acute (some overlap, Set handles)
                // Iota subscript forms
                [0x1F80, 0x1F87], [0x1F88, 0x1F8F], // alpha + iota_sub + accents/breathings
                [0x1F90, 0x1F97], [0x1F98, 0x1F9F], // eta + iota_sub + accents/breathings
                [0x1FA0, 0x1FA7], [0x1FA8, 0x1FAF], // omega + iota_sub + accents/breathings
                // Standalone accented letters and iota subscript letters
                [0x1FB0, 0x1FB4], // alpha forms (grave, acute, circumflex, iota_sub)
                [0x1FB6, 0x1FB7], // alpha circumflex with/without iota_sub
                [0x1FBA, 0x1FBB], // Alpha grave, Eta grave (not here, they are 1F70, 1F74)
                [0x1FBC, 0x1FBC], // ᾳ (alpha with iota subscript)
                [0x1FC2, 0x1FC4], // eta forms (grave, acute, circumflex)
                [0x1FC6, 0x1FC7], // eta circumflex with/without iota_sub
                [0x1FCA, 0x1FCB], // Omega grave, Eta grave (not here, U+1F7C, U+1F74)
                [0x1FCC, 0x1FCC], // ῃ (eta with iota subscript)
                [0x1FD0, 0x1FD3], // iota forms (grave, acute, circumflex, dialytika+grave)
                [0x1FD6, 0x1FD7], // iota circumflex, iota dialytika+circumflex
                [0x1FDA, 0x1FDB], // Iota grave (not here, U+1F76)
                [0x1FE0, 0x1FE7], // upsilon forms, rho forms (includes ῤ, ῥ)
                [0x1FEA, 0x1FEB], // Upsilon grave (not here, U+1F7A)
                [0x1FEC, 0x1FEC], // ῳ (omega with iota subscript)
                [0x1FF2, 0x1FF4], // omega forms (grave, acute, circumflex)
                [0x1FF6, 0x1FF7], // omega circumflex with/without iota_sub
                // [0x1FFA, 0x1FFB] // Omega grave (not here U+1F7C)
                // [0x1FFC, 0x1FFC] // this is ῳ again, 1FEC is preferred.
            ];

            for (const range of greekExtendedLetterRanges) {
                for (let i = range[0]; i <= range[1]; i++) {
                     // Some ranges are sparse or have non-letters, a more robust check might be needed
                     // For now, this will add all code points in specified ranges.
                    charSet.add(String.fromCharCode(i));
                }
            }
             // Add specific characters that might be missed or are important
            [0x1FB3, // ᾳ (alpha + iota sub + oxia)
             0x1FC3, // ῃ (eta + iota sub + oxia)
             0x1FF3, // ΐ (iota + dialytika + oxia)
             0x1FE5, // ῥ
             0x1FE4, // ῤ
            ].forEach(c => charSet.add(String.fromCharCode(c)));


            return Array.from(charSet).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
        };

        // The Orthography.tokenize method will call the global greeklib.tokenize (now tokenizeInternal)
        const tokenizeMethod = function(inputString) {
            return tokenizeInternal(inputString); // Call the main tokenize function
        };

        return new Orthography(name, charsetMethod, tokenizeMethod);
    }


    // Expose greeklib
    const greeklib = {
        Token,
        tokenize: tokenizeInternal, // Keep original name for external use
        sentences,
        tokens,
        Orthography,        // New Class
        literarygreek       // New factory function
    };

    if (typeof define === 'function' && define.amd) {
        define(function() { return greeklib; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = greeklib;
    } else {
        root.greeklib = greeklib;
    }

})(typeof self !== 'undefined' ? self : this);
```


I would like to add a Boolean function `isValidString`. It takes two parameters: 1) a string and 2) an `Orthography` object. `Orthography` objects have a method `charset` that returns the set of valid characters in that orthography. `isValidString` should check every character in the string parameter (first parameter). If all occur in the set returned by the `charset` method, then `isValidString` is `true`; otherwise it is `false`.

Please implement this function and write an HTML to test it as follows. First, allow the user to enter a string value: use this as the default value:

`urn:cts:greekLit:tlg0016.tlg001.omar:1.1.0|̔Ηροδότου ̔Αλικαρνησσέος ἱστορίης ἀπόδεξις ἥδε, ὡς μήτε τὰ γενόμενα ἐξ ἀνθρώπων τῷ χρόνῳ ἐξίτηλα γένηται, μήτε ἔργα μεγάλα τε καὶ θωμαστά, τὰ μὲν ̔́Ελλησι τὰ δὲ βαρβάροισι ἀποδεχθέντα, ἀκλεᾶ γένηται, τά τε ἄλλα καὶ δι' ἣν αἰτίην ἐπολέμησαν ἀλλήλοισι.`

Then create an `Orthography` object with the `literarygreek()` function, and its `tokenize` function to tokenize the user's input text. This returns an Array of `Token` objects. Each `Token` object has a `text` property. Test the `text` property of each token by using it as the first parameter to the new `isValidString` function, with the orthography object as the second parameter. Display the results for each token.