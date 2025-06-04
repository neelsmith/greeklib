// greeklib.js
(function(root) {
    'use strict';

    class Token {
        constructor(sequence, urn, text, type) {
            this.sequence = sequence; // Integer sequence number of token in passage
            this.urn = urn;           // String URN for the token
            this.text = text;         // String content of the token
            this.type = type;         // String type: "number", "lexical", or "punctuation"
        }
    }

    const PUNCTUATION_CHARS = ['.', ',', ':', ';'];
    const NUMERIC_TOKEN_FLAG = 'ʹ';

    function modifyPassageUrnForTokens(passageUrn) {
        const parts = passageUrn.split(':');
        
        if (parts.length < 5) {
            throw new Error(`Invalid URN format: "${passageUrn}". A passage URN must have at least 5 colon-delimited components (e.g., urn:cts:namespace:workId:passageId).`);
        }

        const workId = parts[3];
        const workIdParts = workId.split('.');
        let newWorkId;

        if (workIdParts.length === 3) {
            newWorkId = workId + ".tokens";
        } else if (workIdParts.length === 4) {
            newWorkId = workId + "_tokens";
        } else {
            throw new Error(`Work ID "${workId}" in URN "${passageUrn}" has ${workIdParts.length} parts. Tokenization URN rules are defined for work IDs with 3 or 4 period-separated parts only.`);
        }

        const originalPassageRef = parts.slice(4).join(':');
        // Reconstruct URN up to passage level, with modified workId
        // This becomes the base for individual token URNs
        return parts.slice(0, 3).join(':') + ':' + newWorkId + ':' + originalPassageRef;
    }

    function tokenize(input) {
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
            const parts = pair.split('|');
            if (parts.length !== 2) {
                console.warn(`Skipping malformed input pair: "${pair}". Expected "urn|text" format.`);
                continue;
            }
            const passageUrn = parts[0];
            const passageText = parts[1];

            if (!passageUrn.trim()) {
                console.warn(`Skipping input pair with empty URN: "${pair}".`);
                continue;
            }

            const baseUrnForTokensInPassage = modifyPassageUrnForTokens(passageUrn);

            let tokenSequenceInPassage = 0;       // Overall token counter for the current passage
            let lexicalNumericCounterForUrn = 0;  // Counter for lexical/numeric tokens (for URN suffix)
            let lastLexicalOrNumericUrnId = ""; // Stores the URN ID (e.g., "1", "2") of the last non-punctuation token

            let currentIndex = 0;
            while (currentIndex < passageText.length) {
                // 1. Skip whitespace
                while (currentIndex < passageText.length && /\s/.test(passageText[currentIndex])) {
                    currentIndex++;
                }
                if (currentIndex >= passageText.length) break; // End of text

                let char = passageText[currentIndex];
                let currentTokenText = "";
                let currentTokenType = "";
                let tokenUrnSuffix = "";

                // 2. Check for punctuation token
                if (PUNCTUATION_CHARS.includes(char)) {
                    currentTokenText = char;
                    currentTokenType = "punctuation";
                    currentIndex++; // Consume the punctuation character

                    if (!lastLexicalOrNumericUrnId) {
                        // This happens if punctuation is at the start of a passage or follows other punctuation
                        // without an intervening lexical/numeric token. The spec for URN generation for
                        // punctuation relies on a "preceding non-punctuation token".
                        console.warn(`Punctuation token "${currentTokenText}" in URN "${passageUrn}" cannot be assigned a URN suffix according to the rules, as no preceding non-punctuation token ID is available. Assigning a placeholder suffix.`);
                        tokenUrnSuffix = "error_orphaned_punctuation_a"; // Placeholder for URN
                    } else {
                        tokenUrnSuffix = lastLexicalOrNumericUrnId + "a";
                    }
                } else {
                    // 3. Lexical or Numeric token
                    let tokenBuffer = "";
                    let tempIndex = currentIndex;
                    // Greedily consume non-whitespace, non-punctuation characters
                    while (tempIndex < passageText.length && !/\s/.test(passageText[tempIndex]) && !PUNCTUATION_CHARS.includes(passageText[tempIndex])) {
                        tokenBuffer += passageText[tempIndex];
                        tempIndex++;
                    }

                    // Check if it's a numeric token (ends with NUMERIC_TOKEN_FLAG)
                    if (tokenBuffer.endsWith(NUMERIC_TOKEN_FLAG) && tokenBuffer.length > NUMERIC_TOKEN_FLAG.length) {
                        currentTokenText = tokenBuffer.slice(0, -NUMERIC_TOKEN_FLAG.length);
                        currentTokenType = "number";
                    } else {
                        // Otherwise, it's a lexical token
                        currentTokenText = tokenBuffer;
                        currentTokenType = "lexical";
                    }
                    currentIndex = tempIndex; // Update main index

                    // For lexical or numeric tokens, generate their URN suffix
                    lexicalNumericCounterForUrn++;
                    tokenUrnSuffix = lexicalNumericCounterForUrn.toString();
                    lastLexicalOrNumericUrnId = tokenUrnSuffix; // Update for subsequent punctuation
                }

                if (currentTokenText && currentTokenType) {
                    tokenSequenceInPassage++;
                    const finalTokenUrn = baseUrnForTokensInPassage + "." + tokenUrnSuffix;
                    allTokens.push(new Token(tokenSequenceInPassage, finalTokenUrn, currentTokenText, currentTokenType));
                }
            }
        }
        return allTokens;
    }

    // Expose greeklib
    const greeklib = {
        Token,
        tokenize
    };

    if (typeof define === 'function' && define.amd) {
        define(function() { return greeklib; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = greeklib;
    } else {
        root.greeklib = greeklib;
    }

})(typeof self !== 'undefined' ? self : this);