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
    const SENTENCE_TERMINATORS = ['.', ';']; // Used by sentences()
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
        } else if (workIdParts.length >= 4) { // Allow 4 or more, append _tokens to 4th part.
            // Example: tlg0552.tlg001.ap.normalized -> tlg0552.tlg001.ap.normalized_tokens
            // Example: tlg0552.tlg001.ap.ref.subref -> tlg0552.tlg001.ap.ref_tokens.subref (This rule might need refinement based on CTS URN construction for deeper work hierarchies, but for now, we stick to the provided rule)
            // Based on "If the work identifier has already has four subparts , we will append the string _tokens to the current work identifier." this implies modifying the 4th part specifically.
            // Let's assume it means append to the whole workId if it has 4+ parts.
            // Re-reading the prompt "append the string _tokens to the current work identifier". This is simpler.
            newWorkId = workId + "_tokens";

        } else {
             // This case should not be reached if workIdParts.length >=4 is handled, 
             // but as a fallback or if rules change:
            throw new Error(`Work ID "${workId}" in URN "${passageUrn}" has ${workIdParts.length} parts. Tokenization URN rules are defined for work IDs with 3 or 4+ period-separated parts only.`);
        }
        
        const originalPassageRef = parts.slice(4).join(':');
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
            const passageText = parts[1]; // Do not trim text here, whitespace is handled by tokenizer logic

            if (!passageUrn) {
                console.warn(`Skipping input pair with empty URN: "${pair}".`);
                continue;
            }
             if (!passageText.trim()) { // Check if text content is effectively empty
                console.warn(`Skipping input pair with empty text content for URN "${passageUrn}".`);
                continue;
            }


            let baseUrnForTokensInPassage;
            try {
                baseUrnForTokensInPassage = modifyPassageUrnForTokens(passageUrn);
            } catch (e) {
                console.error(`Error modifying URN for tokenization (passage URN: "${passageUrn}"): ${e.message}`);
                continue; // Skip this passage
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
                    allTokens.push(new Token(tokenSequenceInPassage, finalTokenUrn, currentTokenText, currentTokenType));
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
        if (validInputs.length === 0) {
            return [];
        }

        const allTokens = tokenize(validInputs); // Use greeklib.tokenize internally

        if (allTokens.length === 0) {
            return [];
        }

        const sentenceRanges = [];
        let currentSentenceStartIndex = 0;

        for (let i = 0; i < allTokens.length; i++) {
            const currentToken = allTokens[i];
            // Check if current token's text is one of the defined sentence terminators
            const isTerminator = SENTENCE_TERMINATORS.includes(currentToken.text);
            const isLastTokenOfAll = i === allTokens.length - 1;

            // A sentence ends if it's a terminator OR it's the very last token of the entire input
            if (isTerminator || isLastTokenOfAll) {
                // Ensure we have a valid start for this sentence
                // (currentSentenceStartIndex should always be less than allTokens.length here if allTokens is not empty)
                if (currentSentenceStartIndex <= i) { // currentSentenceStartIndex must be less than or equal to current token index
                    const startTokenInSentence = allTokens[currentSentenceStartIndex];
                    const endTokenInSentence = currentToken; // This is the terminating token or the last token overall

                    const startUrn = startTokenInSentence.urn;
                    
                    // The end token's suffix is the part after the last dot in its URN
                    // e.g., if endToken.urn is "...passage.subpassage.3a", suffix is "3a"
                    const endTokenUrnParts = endTokenInSentence.urn.split('.');
                    const endTokenSuffix = endTokenUrnParts.pop(); 

                    const rangeUrn = startUrn + "-" + endTokenSuffix;
                    sentenceRanges.push(rangeUrn);
                }
                currentSentenceStartIndex = i + 1; // Next sentence starts after this token
            }
        }
        return sentenceRanges;
    }

    // Expose greeklib
    const greeklib = {
        Token,
        tokenize,
        sentences // New function added
    };

    if (typeof define === 'function' && define.amd) {
        define(function() { return greeklib; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = greeklib;
    } else {
        root.greeklib = greeklib;
    }

})(typeof self !== 'undefined' ? self : this);