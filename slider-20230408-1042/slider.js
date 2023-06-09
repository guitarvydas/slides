// Globals

const instructions = "Change slide contents here. Use return/enter after each line. Top line is heading.";
const aspect = screen.width / screen.height;

var presentation = [
    ["Welcome to Slider", "A tiny presentation tool."],
    ["First line is Title",
     "Following lines are body",
     "text. Everything centred."],
    ["Simple Interface", "Update text in left panel...", "Live preview in right!"]
];
var next = 1;


// Ohm.js Grammar and Semantic Function Spec
    
const g2 = String.raw`
Slide {
    slide = h1 body*
    body = ul | h2
    h1 = text nl?
    ul = li+
    li = "*" sp text nl
    h2 = text nl?
    text = (~nl any)+
    sp = (" " | "	")+
    nl = "\r"? "\n"
}
`;
const g = ohm.grammar(g2);

const s = g.createSemantics();
s.addOperation("a", { // Generate list of lists for debug.
    _iter(...children) {
        return children.map(c => c.a());
    },
    _terminal() { return this.sourceString; },

    slide(h1, body) { return ["div", h1.a(), body.a()]; },
    body(line) { return line.a(); },
    h1(text, nl) { return ["h1", text.a()]; },
    ul(li) { return ["ul", li.a()]; },
    li(bullet, space, text, nl) { return ["li", text.a()]; },
    h2(text, nl) { return ["h2", text.a()]; },
    text(chars) { return this.sourceString; }
});
s.addOperation("m", { // Generate Mithril nodes.
    _iter(...children) {
        return children.map(c => c.m());
    },
    _terminal() { return this.sourceString; },

    slide(h1, body) { return m(Slide, h1.m(), body.m()); },
    body(line) { return line.m(); },
    h1(text, nl) { return m("h1", text.m()); },
    ul(li) { return m("ul", li.m()); },
    li(bullet, space, text, nl) { return m("li", text.m()); },
    h2(text, nl) { return m("h2", text.m()); },
    text(chars) { return this.sourceString; }
});


// Mithril Components

function Slide() {
    function view(vnode) {
        return m("div.slide", {
            style: `aspect-ratio: ${aspect};` },
                 vnode.children);
     }
  
  return { view };
}

function Slides() {
    function view(vnode) {
        return m("div.slides", { },
                 vnode.attrs.presentation.map(
                     (x) => s(g.match(x.join("\n"))).m()));
    }

    return { view };
}

function Designer() {
  function view(vnode) {
    let n = vnode.attrs.n;
    let data = vnode.attrs.data;
    
    return m("div", 
      m("div.slide_controls",
        m("div", "Slide " + n),
        m("button", { 
          title: "Click to remove this slide.",
          onclick: (e) => vnode.attrs.removing(n) }, "x")),
      m("textarea", { 
        oninput: (e) => vnode.attrs.updating(n, e.target.value) 
      }, data.join("\n")));
  }
  
  return { view };
}

function Page() {
  function removing(n) {
    delete presentation[n];
  }
  
  function updating(n, text) {
    presentation[n] = text.split(/\n/)
  }
    
    function view(vnode) {
        return m("div.bed", { },
                 m("div.gui", { },
                   m("div.instructions", instructions),
                   presentation.map((data, n) => m(Designer, { data, n, updating, removing })),
                   m("button", {
                       title: "Click to add new slide.",
                       onclick: (e) => presentation.push([
                           "New Slide " + next++]) }, "+ slide")),
                 m(Slides, { presentation }),
                );
    }
    
    return { view };
}

m.mount(document.getElementById("content"), Page);
