I want to build a javascript library named `greeklib.js` for working with citable texts in polytonic ancient Greek, packaged so that I can add it to a GitHub repo and use it via jsDeliver. 


The first function I want to write is named `tokenize`. It should accept 1 of 2 possible forms of parameter: 1) a single string or 2) an Array of strings. In both forms, individual strings contain a pair of pipe-delimited values: the first value is the `urn` value, and the second is the `text` value. `tokenize` will return an Array of objects of class `Token`. The `Token` class will have these properties: `sequence` (integer); `urn` (string); `text` (string); `type` (string).

Summary: `tokenize` will examine the `text` content of a single passage of text and split it into a series of tokens. It will use the `urn` value for that passage to compose indivdual urn values for each token. Here is how to split the text and define urn values.

**Split the text**: This is how to find the values for the `text` ,  `type` and `sequence` properties of each `Token` object. In examining the source text, we need to recognize these classes of characters.Any occurrence of the following characters is a single token of class *punctuation*: `.`, `,`, `:`, `;`.  The character `ʹ` is a numeric token flag.  Any preceding series of non-punctuation, non-whitespace characters is a token of class *number*. Any continuous series of characters that is not part of a number token, is not a white space character and is not a punctuation token constitutes a token of class *lexical*. White space characters separate tokens but do not form part of a token.  The `sequence` value is simply the numeric count for each token

**Example**: The string "Αʹ ἐάνπερ κύκλον πολύγωνον," consists of 5 tokens:

`1`: `Α`, type `number`
`2`:  ἐάνπερ`, type `lexical`
`3`: `κύκλον`, type `lexical`
`4`: `πολύγωνον`, type `lexical`
`5`: `,` type `punctuation`


For each token, the `tokenize` function must create a new URN value as follows. The urn value identifying the text to tokenize will have five colon-delimited components. The 4th component is a work identifier separated by periods into subparts. To create a new URN for each token we will first modify the work identifer. It it has 3 period-separated subparts, we will add a fourth part called `tokens`. **Example**: If the text passage has the URN `urn:cts:greekLit:tlg0552.tlg001.ap:1.preface.1`, then its work component is `tlg0552.tlg001.ap`. This has 3 period-separated parts so we will create a new work component `tlg0552.tlg001.ap.tokens`. If the work identifier has already has four subparts , we will append the string `_tokens` to the current work identifier. **Example**: If the text passage has the URN `urn:cts:greekLit:tlg0552.tlg001.ap.normalized:1.preface.1`, the work identifier  is `tlg0552.tlg001.ap.normalized`. It already has 4 subparts, so we will create a new work identifier `tlg0552.tlg001.ap.normalized_tokens`.

We must then create a unique passage identifier for each token as follows. Lexical and numeric tokens should be numbered in a continuous sequence. This value should be appended to the modified URN string with a period. Punctuation tokens are not numbered. Instead, they append to the modified URN string the value of the preceding non-numeric token followed by the character `a`.

**Example**: In the preceding example, if the URN `urn:cts:greekLit:tlg0552.tlg001.ap:1.proposition.1` identifies the string"Αʹ ἐάνπερ κύκλον πολύγωνον,", then the final URN for the tokens will be:

- `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.proposition.1.1`  (numeric token)
- `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.proposition.1.2`  (lexical token)
- `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.proposition.1.3`  (lexical token)
- `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.proposition.1.4`  (lexical token)
- `urn:cts:greekLit:tlg0552.tlg001.ap.tokens:1.proposition.1.4a`  (numeric token)




**Test**: Please implement this, then test by writing an HTML page that uses this Array of strings (listed here 1 per line) as the source data:

```
urn:cts:greekLit:tlg0552.tlg001.ap:1.proposition.1|Αʹ ἐάνπερ κύκλον / [πολύγωνον] , ἡ τοῦ / [περιγραφέντος] περί/[μετρος] [μείζων] τῆς περιμέ/[τρου] [τοῦ] . περὶ γὰρ κύκλον / [τὸ] [ὑ]/*π*οκείμενον. λέγω ὅτι ἡ [π]ερίμε/τρ[ος] [τοῦ] [ἐστὶν] / [τῆς] [περιμέτρου] [τοῦ] [κύκλου]. [ἐπεὶ] [γὰρ] / [συναμφότερος] [ἡ] [ΒΑΛ] [μείζων] [ἐστὶ] / [τῆς] [ΒΛ] [περιφερείας] [διὰ] τὸ / [τὰ] [αὐτὰ] [πέρατα] πε/ριλαμβάνειν τὴν περιφέρειαν , / συναμφότερος μὲν / ἡ ΓΒ τῆς ΔΒ, συναμφότερος / δὲ ἡ ΛΚ ΚΘ τῆς ΛΘ, συναμφό/[τερος] [δὲ] [ἡ] τῆς ΘΖ, ἔτι δὲ συν*αμ*/[φότερο]ς ἡ ΔΕ ΕΖ τῆς ΔΖ, [ἄρα] [ἡ] / τοῦ [μεί]/ζων ἐστὶν τῆς περιφερείας τοῦ κύκλ[ου] .
urn:cts:greekLit:tlg0552.tlg001.ap:1.proposition.2|Βʹ / Δύο μεγεθῶν ἀνίσων δοθέντων / δυνατόν ἐστιν εὑρεῖν δύο εὐθείας / ἀνίσους, ὥστε τὴν μείζονα εὐθεῖαν / πρὸς τὴν ἐλάσσονα λόγον ἔχειν ἐλάσ/σονα ἤτοι μείζων μέγεθος πρὸς τὸ / ἔλασσον. ἔστω δύο μεγέθη ἄνισα / τὰ ΑΒΔ, καὶ ἔστω μείζων τὸ ΑΒ. λέγω / ὅτι δυνατόν ἐστι δύο εὐθείας ἀνί/σους εὑρεῖν τὸ εἰρημένον ἐπίταγ/μα ποιούσας. κείσθω διὰ τοῦ Βʹ τοῦ / Αʹ Εὐκλείδου τῶι Δ ἴσον τὸ ΒΓ, καὶ / κείσθω τις εὐθεῖα γραμμὴ ἡ ΖΗ: / τὸ δὴ ΓΑ ἑαυτῶι ἐπισυντιθέμενον / τοῦ Δ. πεπολλαπλασι/άσθω οὖν, καὶ ἔστω τὸ ΑΘ, καὶ ὁσαπλά/σιόν ἐστι τὸ ΑΘ τοῦ ΑΓ, τοσαυταπλά/σιος ἔστω ἡ ΖΗ τῆς ΖΕ: ἔστιν ἄρα, / ὡς τὸ ΘΑ πρὸς ΑΓ, οὕτως τὸ ΖΗ πρὸς ΗΕ: καὶ ἀνά/παλίν ἐστιν, ὡς ἡ ΗΕ πρὸς ΗΖ, οὕτως / τὸ ΑΓ πρὸς ΑΘ. καὶ ἐπεὶ μεῖζόν ἐστιν τὸ / ΑΘ τοῦ Δ, τουτέστι τοῦ ΓΒ, τὸ ἄρα ΓΑ / πρὸς τὸ ΑΘ λόγον ἐλάσσονα ἔχει ἤπερ / [τὸ] [ΓΑ] πρὸς ΓΒ. ἀλλ’ ὡς τὸ ΓΑ πρὸς ΑΘ, οὕτως / ἡ ΕΗ πρὸς ΗΖ: ἡ ΕΗ ἄρα πρὸς ΗΖ ἐλάσσονα / ἤπερ τὸ ΓΑ πρὸς τὸ *Γ*Β: καὶ / συνθέντι ἡ ΕΖ ἄρα πρὸς ΖΗ ἐλάσσονα / λόγον ἔχει ἤπερ τὸ ΑΒ πρὸς ΒΓ {} / {/μα}. ἴσον δὲ τὸ ΒΓ τῶι Δ: ἡ ΕΖ ἄρα πρὸς ΖΗ / ἐλάσσονα λόγον ἔχει ἤπερ τὸ ΑΒ / πρὸς τὸ Δ. εὑρημέναι εἰσὶν ἄρα δύο εὐ/θεῖαι ἄνισοι ποιοῦσαι τὸ εἰρημέ/νον ἐπίταγμα τουτέστιν τὴν μείζο/να πρὸς τὴν ἐλάσσονα λόγον ἔχoν / ἐλάσσονα ἢ τὸ μεῖζον μέγεθος / πρὸς τὸ ἔλασσον.
urn:cts:greekLit:tlg0552.tlg001.ap:1.proposition.7|/ πυραμὶς βάσιν μὲν ἔχουσα ἰ/σόπλευρον τρίγωνον τὸ ΑΒΓ, καὶ ἐ/πεζεύχθωσαν αἱ ΔΑ ΔΓ ΔΒ: λέ/γω ὅτι τὰ ΑΔΒ ΑΔΓ τρίγωνα ἴσα / ἐστὶ τριγώνωι, οὗ ἡ μὲν βάσις ἴση / ἐστὶ τῆι περιμέτρωι τοῦ ΑΒΓ τρι/γώνου, ἡ δὲ ἀπὸ τῆς κορυφῆς / ἐπὶ τὴν βάσιν κάθετος ἴση τῆι / καθέτωι τῆι ἀπὸ τοῦ Δ ἐπὶ τὴν / ΒΓ ἀγομένην. ἤχθωσαν γὰρ κά/θετοι αἱ ΔΚ ΔΛ ΔΜ: αὗται ἄρα / ἴσαι ἀλλήλαις εἰσίν . καὶ κείσθω τρί/γωνον τὸ ΕΖΗ ἔχον τὴν μὲν ΕΖ / βάσιν τῆ περιμέτρωι τοῦ ΑΒΓ / τριγώνου ἴσην, τὴν δὲ ΗΘ κάθε/τον τῆι ΔΛ ἴσην. ἐπεὶ οὖν τὸ ὑπὸ / τῶν ΒΓ ΔΛ διπλάσιόν ἐστιν τοῦ / ΔΒΓ τριγώνου, ἔστι δὲ καὶ τὸ μὲν / ὑπὸ τῶν ΑΒ ΔΚ / ΑΒΔ τριγώνου, τὸ δὲ ὑπὸ ΑΓΔΜ / διπλάσιον τοῦ ΑΔΓ τριγώνου, / τὸ ἄρα ὑπὸ τῆς περιμέτρου τοῦ ΑΔΓ / τριγώνου, τουτέστι τῆς ΕΖ, καὶ τῆς / ΔΛ, τουτέστι τῆς ΗΘ, διπλάσιόν ἐστι / τῶν ΑΔΒ ΒΔΓ ΑΔΓ τριγώνων. / ἔστι δὲ καὶ τὸ ὑπὸ ΕΖΗΘ διπλάσιον / τοῦ ΕΗΖ τριγώνου: ἴσον ἄρα τὸ ΕΖΗ / τρίγωνον τοῖς ΑΛΒ ΒΔΓ ΑΔΓ τρι/γώνοις.
```


The test page should display each line, then tokenize it and display the results.


---

Thank you! Please write documentation for the library.



---


Example data taken from:


https://raw.githubusercontent.com/neelsmith/archimedes/refs/heads/main/texts/SandC-ap-editorial.cex


