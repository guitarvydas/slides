const g = ohm.grammar(String.raw`
Slide {
    lines = title body
    body = (bullets | line)*
    title = line
    bullets = bullet bullet*
    bullet = "*" sps word (sps word)* nl?
    line = word (sps word)* nl?
    word = wordchar+
    wordchar = ~(nl | sps) any
    sps = (" " | "    ")+
    nl = "\r"? "\n"
}
`);
const s = g.createSemantics();
s.addOperation("mkslide", {
    lines(title, body) { return m("div", title, body); },
    title(_) { return m("h1", this.sourceString); },
    line(word, ix, words, iy) { return m("h2", word, words); },
    bullets(a, b) { return m("ul", a, b); },
    bullet(iw, ix, word, iy, words, iz) { return m("li", word, words); },
});

const test = `
New Slide 1
pt line 1
* line 2
* line 3
`;

