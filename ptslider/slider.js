var instructions = "Change slide contents here. Use return/enter after each line. Top line is heading.";
var presentation = [
  ["Welcome to PT3 Slider", "A tiny presentation tool."],
  ["First line is PT3 Title", "Following lines are body", "text. Everything centred."],
  ["Simple Interface", "Update text in left panel...", "Live preview in right!"]
];
var next = 1;

const g = ohm.grammar(String.raw`
Slide {
    slide = title body?
    title = line
    body = bodyline+
    bodyline = bullet | line

    bullet = "*" sps word (sps word)* nl
    line = word (sps word)* nl

    sps = spc+
    spc = " " | "\t"

    nl = "\r"? "\n"

    word = wordchar+
    wordchar = ~(nl | spc) any
}
`);
const s = g.createSemantics();
s.addOperation("identity", {
    slide(title, opt_body) { return title.identity() + opt_body.identity(); },
    title(_) { return this.sourceString; },
    body(rep1_bodyline) { return rep1_bodyline.identity(); },
    bodyline(x) { return x.identity(); },
    bullet(kasterisk, s, w, rep0_s2, rep0_word, nl) { return kasterisk.identity() + s.identity() + rep0_s2.identity() + rep0_word.identity() + nl.identity();},
    line(w, rep0_s2, rep0_word, nl) { return rep0_s2.identity() + rep0_word.identity() + nl.identity(); },
    sps(rep1_s) { return rep1_s.identity(); },
    spc(c) { return c.identity(); },
    nl(ret, c) { return ret.identity() + c.identity(); },
    word(w) { return w.identity(); },
    wordchar(c) {return this.sourceString; }
});
s.addOperation("noop", {
    slide(title, opt_body) { return title.noop() + opt_body.noop(); },
    title(_) { return this.sourceString; },
    bullet(kasterisk, s, w, s2, word, nl) { return kasterisk.noop() + s.noop() + s2.noop() + word.noop() + nl.noop();},
    line(w, s2, word, nl) { return s2.noop() + word.noop() + nl.noop(); },
    nl(ret, c) { return this.sourceString; },
    word(w) { return this.sourceString; }
});

function Slide() {
  function layout(lines) {
    let els = [];
    let state = "h1";
    
    let i = 0;
    while(i < lines.length) {
      let line = lines[i];
      let bullet = !!line.match(/^\* /);
      switch(state) {
        case "li":
          if(bullet) {
            els[els.length - 1][1].push(["li", line.slice(2)]);
            i++;
          } else {
            state = "h2";
          }
          break;
        case "h2":
          if(bullet) { 
            els.push(["div", ["ul"]]); 
            state = "li";
          } else {
            els.push(["h2", line]);
            i++;
          }
          break;
        case "h1":
          if(line) { 
            els.push(["h1", line]); 
            state = "h2";
            i++; 
          }
          break;
        default:
          state = "h1";
      }
    }
    return els; 
  }
  
  function inflate(els) {
    // ( else -- m) Convert elements to mithril tags.
    return els.map((e) => {
      if(e.length > 1 && Array.isArray(e[1])) {
        return m(e[0], inflate(e.slice(1)));
      } else {
        return m(e[0], e[1]);
      }
    })
  }
    
  function view(vnode) {
    let lines = vnode.attrs.lines;
    layout(lines);
    return m("div.slide", { style: `aspect-ratio: ${vnode.attrs.aspect};` },
      inflate(layout(vnode.attrs.lines)));
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
    let aspect = screen.width / screen.height; 
    
    return m("div.bed", { },
      m("div.gui", { },
        m("div.instructions", instructions),
        presentation.map((data, n) => m(Designer, { data, n, updating, removing })),
        m("button", {
          title: "Click to add new slide.",
          onclick: (e) => presentation.push(["New Slide " + next++]) }, "+ slide")
        ),
      m("div.slides", { },
        presentation.map((x) => m(Slide, { aspect, lines: x })))
      );
  }
  
  return { view };
}

m.mount(document.getElementById("content"), Page);
