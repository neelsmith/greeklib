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
        } else if (workIdParts.length >= 4) {
            newWorkId = workId + "_tokens";
        } else {
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

        const allTokens = tokenize(validInputs); 

        if (allTokens.length === 0) {
            return [];
        }

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

                    // Construct range URN as: startToken.urn + "-" + endTokenPassageIdentifier
                    // where endTokenPassageIdentifier is the part of endToken.urn after its last colon.
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
            throw new Error("Invalid range URN string format for tokens(). Expected 'START_TOKEN_FULL_URN-END_TOKEN_PASSAGE_SUFFIX'.");
        }
        if (!Array.isArray(allTokensArray)) {
            throw new Error("Second parameter to tokens() must be an array of Token objects.");
        }
        if (allTokensArray.length === 0) {
            return []; // No tokens to search within
        }

        const parts = rangeUrnString.split('-');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new Error("Invalid range URN string format for tokens(). Must contain exactly one hyphen separating two non-empty parts.");
        }

        const startTokenFullUrn = parts[0];
        const endTokenPassageIdSuffixFromRange = parts[1];

        // Reconstruct the full URN for the end token.
        // The base URN (everything up to the last colon before the passage identifier)
        // is taken from the start token's URN structure.
        const lastColonInStartUrn = startTokenFullUrn.lastIndexOf(':');
        if (lastColonInStartUrn === -1) {
            throw new Error(`Could not parse base URN from start token URN: ${startTokenFullUrn}`);
        }
        const urnBaseForEndToken = startTokenFullUrn.substring(0, lastColonInStartUrn + 1);
        const endTokenFullUrn = urnBaseForEndToken + endTokenPassageIdSuffixFromRange;

        let startIndex = -1;
        let endIndex = -1;

        for (let i = 0; i < allTokensArray.length; i++) {
            const currentToken = allTokensArray[i];
            // Basic check if it's a Token-like object, more robust would be `instanceof Token`
            if (!currentToken || typeof currentToken.urn !== 'string') {
                console.warn(`Item at index ${i} in allTokensArray is not a valid Token object or lacks a URN.`);
                continue;
            }
            if (currentToken.urn === startTokenFullUrn) {
                startIndex = i;
            }
            if (currentToken.urn === endTokenFullUrn) {
                endIndex = i;
            }
        }

        if (startIndex === -1) {
            console.warn(`Start token URN not found in allTokensArray: ${startTokenFullUrn}`);
            return [];
        }
        if (endIndex === -1) {
            console.warn(`End token URN not found in allTokensArray: ${endTokenFullUrn}`);
            return [];
        }

        if (startIndex > endIndex) {
            console.warn(`Start token (index ${startIndex}, URN: ${startTokenFullUrn}) appears after end token (index ${endIndex}, URN: ${endTokenFullUrn}) in the provided token list. Returning empty array.`);
            return [];
        }

        return allTokensArray.slice(startIndex, endIndex + 1);
    }

    // Expose greeklib
    const greeklib = {
        Token,
        tokenize,
        sentences,
        tokens // New function added
    };

    if (typeof define === 'function' && define.amd) {
        define(function() { return greeklib; });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = greeklib;
    } else {
        root.greeklib = greeklib;
    }

})(typeof self !== 'undefined' ? self : this);