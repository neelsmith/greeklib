# `greeklib.js` version 1.1.0

> *A vibe coded Javascript library for working with text in polytonic ancient Greek.*

## Motivation

The javascript library in `greeklib.js` is designed to simplify working with canonically cited Greek texts in a web browser or other javascript environment.

## Contents of this repository

In addition to the library itself (`greeklib.js`) and the documentation (`apis.md`), this repository a web app illustrating the library's functionality:


- `ortho.html`: illustrates how to create an <code>Orthography</code> object for standard literary Greek orthography as found in printed editions, and use it to tokenize texts as `Token` objects.
- `sentences.html`: illustrates how to analyze a text as sentences composed of a sequence of `Token`s.
- `sentence-tokens.html`: illustrates how to analyze a text as sentences, and retrieve the corresponding `Token` objects.

## Planned development 

See the project [issue tracker](https://github.com/neelsmith/greeklib/issues).

## Caveats and technical information

I built this library, but I don't (and won't) write javascript, so I gave in completely to what Anrej Karpathy has called vibe coding. The javascript, the markdown documentation (including the quoted summary at the top of this page), and the illustrative HTML page were all written by gemini-2.5-pro. I've made sure that the library passes a handful of sanity tests, but I have not looked at the code at all. When I ran into errors, I let gemini fix them. Use the code as you like, but be aware that I have no idea what it does or how it works.

### How I build it

If you're curious about how I built the library, the file `chat.txt` has a complete transcript of the conversation I had with gemini-2.5-pro. The stages directory has the functioning intermediate versions of the library. The numbers in the filenames correspond to the sequence of the library in the conversation, culminating in urn-lib-6.js, which is the final version of the library, and identical to urn-lib.js in this repository.

## License

This repository is licensed under the GPL-3.0 license. You can use the code in this repository for any purpose, but you must include a copy of the GPL-3.0 license in any distribution of the code or derivative works. See the LICENSE file for more details.
