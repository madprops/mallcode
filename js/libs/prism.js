"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // util-DdJteTVJ.js
  function e(n3) {
    return n3.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
  }

  // token-Dozwbq7Q.js
  var Token = class {
    type;
    content;
    alias;
    length;
    constructor(t3, s3, a3, i3 = "") {
      this.type = t3, this.content = s3, this.alias = a3, this.length = i3.length;
    }
    addAlias(t3) {
      let s3 = this.alias;
      s3 ? Array.isArray(s3) || (this.alias = s3 = [s3]) : this.alias = s3 = [], s3.push(t3);
    }
  };

  // iterables-BnTatl6v.js
  function r(r4) {
    return Array.isArray(r4) ? r4 : null == r4 ? [] : [r4];
  }
  function n(t3) {
    return ((r4) => "object" == typeof r4 && Symbol.iterator in Object(r4))(t3) ? t3 : r(t3);
  }

  // insert-CpDsPTVw.js
  async function t(e3, t3, n3, o4) {
    o4 && await o4, Object.defineProperty(e3, t3, { enumerable: true, configurable: true, get() {
      const e4 = n3.call(this);
      return r2(this, t3, e4), e4;
    }, set(e4) {
      r2(this, t3, e4);
    } });
  }
  function r2(e3, t3, r4) {
    Object.defineProperty(e3, t3, { value: r4, writable: true, enumerable: true, configurable: false });
  }
  function n2(e3, t3) {
    if (!e3 || "object" != typeof e3) return false;
    const r4 = Object.getPrototypeOf(e3);
    return r4.constructor?.name === t3;
  }
  function o(t3, r4, c3 = {}) {
    const { emptyValues: s3 = [void 0], containers: i3 = ["Object", "EventTarget"], isContainer: a3 = (e3) => i3.some(((t4) => n2(e3, t4))), mergeArrays: f3 = false } = c3;
    if (f3 && (Array.isArray(t3) || Array.isArray(r4))) return t3 = r(t3), r4 = r(r4), t3.concat(r4);
    if (a3(t3) && a3(r4)) {
      for (const e3 in r4) t3[e3] = o(t3[e3], r4[e3], c3);
      return t3;
    }
    return s3.includes(t3) ? r4 : r4 ?? t3;
  }
  function c(e3, t3 = {}) {
    if (!e3 || "object" != typeof e3) return e3;
    t3._clones ??= /* @__PURE__ */ new WeakMap();
    const { _clones: r4 } = t3;
    if (r4.has(e3)) return r4.get(e3);
    let o4 = e3;
    if (Array.isArray(e3)) {
      o4 = [], r4.set(e3, o4);
      for (const r5 of e3) o4.push(c(r5, t3));
    } else if (((e4) => n2(e4, "Object"))(e3)) {
      o4 = { ...e3 }, r4.set(e3, o4);
      for (const r5 in e3) o4[r5] = c(e3[r5], t3);
    }
    return o4;
  }
  function s(e3, ...t3) {
    for (const r4 of t3) {
      const t4 = Object.getOwnPropertyDescriptors(r4);
      for (const r5 in t4) {
        if (Object.hasOwn(e3, r5)) continue;
        const n3 = t4[r5];
        Object.defineProperty(e3, r5, n3);
      }
    }
    return e3;
  }
  function i(e3, t3, r4) {
    f(e3, t3, r4, "before");
  }
  function a(e3, t3, r4) {
    f(e3, t3, r4);
  }
  function f(e3, t3, r4, n3 = "after") {
    if (!(t3 in e3)) throw Error(`"${t3}" has to be a key of grammar.`);
    const o4 = Object.getOwnPropertyDescriptors(e3);
    for (const t4 in o4) Object.hasOwn(o4, t4) && delete e3[t4];
    for (const c3 in o4) "before" === n3 && c3 === t3 && s(e3, r4), Object.hasOwn(r4, c3) || Object.defineProperty(e3, c3, o4[c3]), "after" === n3 && c3 === t3 && s(e3, r4);
  }

  // prism-DU08x7FD.js
  var g = "undefined" != typeof document && "undefined" != typeof window;
  var h = g ? document.currentScript : null;
  var c2 = "Object" === globalThis.Prism?.constructor?.name ? globalThis.Prism : {};
  function u(e3) {
    const t3 = e3.replace(/-([a-z])/g, ((e4) => e4[1].toUpperCase()));
    return t3 in c2 ? c2[t3] : e3 in c2 ? c2[e3] : g ? h?.dataset[t3] ?? document.querySelector(`[data-prism-${e3}]`)?.getAttribute("data-prism-" + e3) : void 0;
  }
  function d(e3, t3) {
    const s3 = u(e3);
    return null == s3 ? t3 : !(false === s3 || "false" === s3);
  }
  function f2(e3) {
    const t3 = u(e3);
    return null == t3 || false === t3 || "false" === t3 ? [] : "string" == typeof t3 ? t3.split(",").map(((e4) => e4.trim())) : Array.isArray(t3) ? t3 : [];
  }
  var p = { manual: d("manual", !g), silent: d("silent", false), languages: f2("languages"), plugins: f2("plugins"), languagePath: u("language-path") ?? "./languages/", pluginPath: u("plugin-path") ?? "./plugins/" };
  function m() {
    return new Promise(((e3) => {
      "function" == typeof requestAnimationFrame ? requestAnimationFrame(e3) : "function" == typeof setImmediate ? setImmediate(e3) : setTimeout(e3, 0);
    }));
  }
  async function y(e3) {
    return Promise.allSettled(e3).then(((t3) => e3.length > 0 && e3.length !== t3.length ? y(e3) : t3.map(((e4) => "fulfilled" === e4.status ? e4.value : null))));
  }
  function v(e3 = {}) {
    const t3 = this ?? T, { root: s3, async: n3, callback: r4 } = e3, i3 = { callback: r4, root: s3 ?? document, selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code' };
    t3.hooks.run("before-highlightall", i3), i3.elements = [...i3.root.querySelectorAll(i3.selector)], t3.hooks.run("before-all-elements-highlight", i3);
    for (const e4 of i3.elements) t3.highlightElement(e4, { async: n3, callback: i3.callback });
  }
  var $ = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
  function A(e3) {
    let t3 = e3;
    for (; t3; t3 = t3.parentElement) {
      const e4 = $.exec(t3.className);
      if (e4) return e4[1].toLowerCase();
    }
    return "none";
  }
  function b(e3, t3) {
    e3.className = e3.className.replace(RegExp($, "gi"), ""), e3.classList.add("language-" + t3);
  }
  function x(e3) {
    const t3 = e3.parentElement;
    if (t3 && /pre/i.test(t3.nodeName)) return t3;
  }
  function k(t3, s3 = {}) {
    const n3 = this ?? T, { async: r4, callback: i3 } = s3, a3 = A(t3), o4 = n3.languageRegistry.getLanguage(a3)?.resolvedGrammar;
    b(t3, a3);
    let l2 = t3.parentElement;
    l2 && "pre" === l2.nodeName.toLowerCase() && b(l2, a3);
    const g2 = { element: t3, language: a3, grammar: o4, code: t3.textContent }, h2 = (e3) => {
      g2.highlightedCode = e3, n3.hooks.run("before-insert", g2), g2.element.innerHTML = g2.highlightedCode, n3.hooks.run("after-highlight", g2), n3.hooks.run("complete", g2), i3?.(g2.element);
    };
    if (n3.hooks.run("before-sanity-check", g2), l2 = g2.element.parentElement, l2 && "pre" === l2.nodeName.toLowerCase() && !l2.hasAttribute("tabindex") && l2.setAttribute("tabindex", "0"), !g2.code) return n3.hooks.run("complete", g2), void i3?.(g2.element);
    n3.hooks.run("before-highlight", g2), g2.grammar ? r4 ? r4({ language: g2.language, code: g2.code, grammar: g2.grammar }).then(h2, n3.config.errorHandler) : h2(n3.highlight(g2.code, g2.language, { grammar: g2.grammar })) : h2(e(g2.code));
  }
  function L(t3, s3, n3) {
    if ("string" == typeof t3) return e(t3);
    if (Array.isArray(t3)) {
      let e3 = "";
      return t3.forEach(((t4) => {
        e3 += L(t4, s3, n3);
      })), e3;
    }
    const r4 = { type: t3.type, content: L(t3.content, s3, n3), tag: "span", classes: ["token", t3.type], attributes: {}, language: s3 }, i3 = t3.alias;
    i3 && (Array.isArray(i3) ? r4.classes.push(...i3) : r4.classes.push(i3)), n3.run("wrap", r4);
    let a3 = "";
    for (const e3 in r4.attributes) a3 += " " + e3 + '="' + (r4.attributes[e3] || "").replace(/"/g, "&quot;") + '"';
    return "<" + r4.tag + ' class="' + r4.classes.join(" ") + '"' + a3 + ">" + r4.content + "</" + r4.tag + ">";
  }
  function R(e3, t3, s3) {
    const n3 = this ?? T, r4 = { code: e3, grammar: s3?.grammar ?? n3.languageRegistry.getLanguage(t3)?.resolvedGrammar, language: t3 };
    if (n3.hooks.run("before-tokenize", r4), !r4.grammar) throw Error('The language "' + r4.language + '" has no grammar.');
    return r4.tokens = n3.tokenize(r4.code, r4.grammar), n3.hooks.run("after-tokenize", r4), L(r4.tokens, r4.language, n3.hooks);
  }
  var LinkedList = class {
    head;
    tail;
    length;
    constructor() {
      const e3 = { value: null, prev: null, next: null }, t3 = { value: null, prev: e3, next: null };
      e3.next = t3, this.head = e3, this.tail = t3, this.length = 0;
    }
    addAfter(e3, t3) {
      const s3 = e3.next, n3 = { value: t3, prev: e3, next: s3 };
      return e3.next = n3, s3.prev = n3, this.length++, n3;
    }
    removeRange(e3, t3) {
      let s3 = e3.next, n3 = 0;
      for (; n3 < t3 && null !== s3.next; n3++) s3 = s3.next;
      e3.next = s3, s3.prev = e3, this.length -= n3;
    }
    toArray() {
      const e3 = [];
      let t3 = this.head.next;
      for (; null !== t3.next; ) e3.push(t3.value), t3 = t3.next;
      return e3;
    }
  };
  function P(e3) {
    const t3 = this ?? T;
    let s3 = e3 ?? void 0;
    if ("string" == typeof s3 && (s3 = t3.languageRegistry.getLanguage(s3)?.resolvedGrammar), "object" == typeof s3 && s3.$rest) {
      const e4 = P.call(t3, s3.$rest) ?? {};
      "object" == typeof e4 && (s3 = { ...s3, ...e4 }), delete s3.$rest;
    }
    return s3;
  }
  function E(e3, s3, n3, r4, i3, a3) {
    const o4 = this ?? T;
    n3 = P.call(o4, n3);
    for (const l2 in n3) {
      const g2 = n3[l2];
      if (!n3.hasOwnProperty(l2) || l2.startsWith("$") || !g2) continue;
      const h2 = Array.isArray(g2) ? g2 : [g2];
      for (let g3 = 0; g3 < h2.length; ++g3) {
        if (a3 && a3.cause === `${l2},${g3}`) return;
        const c3 = q(h2[g3]);
        let { pattern: u2, lookbehind: d2 = false, greedy: f3 = false, alias: p2, inside: m2 } = c3;
        const y2 = P.call(o4, m2);
        f3 && !u2.global && (c3.pattern = u2 = RegExp(u2.source, u2.flags + "g"));
        for (let h3 = r4.next, c4 = i3; null !== h3.next && !(a3 && c4 >= a3.reach); c4 += h3.value.length, h3 = h3.next) {
          let r5 = h3.value;
          if (s3.length > e3.length) return;
          if (r5 instanceof Token) continue;
          let i4, m3 = 1;
          if (f3) {
            if (i4 = j(u2, c4, e3, d2), !i4 || i4.index >= e3.length) break;
            const s4 = i4.index, n4 = i4.index + i4[0].length;
            let a4 = c4;
            for (a4 += h3.value.length; s4 >= a4; ) {
              if (h3 = h3.next, null === h3.next) throw Error("The linked list and the actual text have become de-synced");
              a4 += h3.value.length;
            }
            if (a4 -= h3.value.length, c4 = a4, h3.value instanceof Token) continue;
            let o5 = h3;
            for (; null !== o5.next && (a4 < n4 || "string" == typeof o5.value); o5 = o5.next) m3++, a4 += o5.value.length;
            m3--, r5 = e3.slice(c4, a4), i4.index -= c4;
          } else if (i4 = j(u2, 0, r5, d2), !i4) continue;
          const v2 = i4.index, $2 = i4[0], A2 = r5.slice(0, v2), b2 = r5.slice(v2 + $2.length), w = c4 + r5.length;
          a3 && w > a3.reach && (a3.reach = w);
          let x2 = h3.prev;
          A2 && (x2 = s3.addAfter(x2, A2), c4 += A2.length), s3.removeRange(x2, m3);
          const k2 = new Token(l2, y2 ? C.call(o4, $2, y2) : $2, p2, $2);
          if (h3 = s3.addAfter(x2, k2), b2 && s3.addAfter(h3, b2), m3 > 1) {
            const t3 = { cause: `${l2},${g3}`, reach: w };
            E.call(o4, e3, s3, n3, h3.prev, c4, t3), a3 && t3.reach > a3.reach && (a3.reach = t3.reach);
          }
        }
      }
    }
  }
  function j(e3, t3, s3, n3) {
    e3.lastIndex = t3;
    const r4 = e3.exec(s3);
    if (r4 && n3 && r4[1]) {
      const e4 = r4[1].length;
      r4.index += e4, r4[0] = r4[0].slice(e4);
    }
    return r4;
  }
  function q(e3) {
    return e3.pattern ? e3 : { pattern: e3 };
  }
  function C(e3, t3) {
    const s3 = this ?? T, n3 = t3.$tokenize;
    if (n3) return n3(e3, t3, s3);
    const r4 = new LinkedList();
    return r4.addAfter(r4.head, e3), E.call(s3, e3, r4, t3, r4.head, 0), r4.toArray();
  }
  var Hooks = class {
    _all = {};
    add(e3, t3) {
      if (Array.isArray(e3)) for (const s3 of e3) this.add(s3, t3);
      else if ("object" == typeof e3) {
        const t4 = e3;
        for (const e4 in t4) {
          const s3 = t4[e4];
          s3 && this.add(e4, s3);
        }
      } else (this._all[e3] ??= []).push(t3);
      return () => {
        this.remove(e3, t3);
      };
    }
    remove(e3, t3) {
      if (Array.isArray(e3)) for (const s3 of e3) this.remove(s3, t3);
      else if ("object" == typeof e3) for (const s3 in e3) this.remove(s3, t3);
      else {
        const s3 = this._all[e3]?.indexOf(t3);
        s3 > -1 && this._all[e3].splice(s3, 1);
      }
    }
    run(e3, t3) {
      const s3 = this._all[e3], n3 = t3?.this ?? t3?.context ?? t3;
      if (s3 && s3.length) for (const e4 of s3) e4.call(n3, t3);
    }
  };
  var ComponentRegistry = class extends EventTarget {
    static type = "unknown";
    cache = {};
    loading = {};
    #e = [];
    ready;
    path;
    prism;
    options;
    constructor(e3) {
      super(), this.options = e3;
      let { path: t3, preload: s3, prism: n3 } = e3;
      this.prism = n3, t3 = t3.endsWith("/") ? t3 : t3 + "/", this.path = t3, s3 && this.loadAll(s3), this.ready = y(this.#e);
    }
    async whenDefined(e3) {
      if (this.cache[e3]) return this.cache[e3];
      if (void 0 !== this.loading[e3]) return this.loading[e3];
      const t3 = this.constructor;
      return new Promise(((s3) => {
        const n3 = (t4) => {
          t4.detail.id === e3 && (s3(t4.detail.component), this.removeEventListener("add", n3));
        };
        this.addEventListener("add" + t3.type, n3);
      }));
    }
    add(e3, t3 = e3.id, s3) {
      const n3 = this.constructor;
      if (void 0 !== this.loading[t3]) {
        const e4 = this.#e.indexOf(this.loading[t3]);
        e4 > -1 && this.#e.splice(e4, 1), delete this.loading[t3];
      }
      return !(this.cache[t3] && !s3?.force || (this.cache[t3] = e3, this.dispatchEvent(new CustomEvent("add", { detail: { id: t3, type: n3.type, component: e3 } })), this.dispatchEvent(new CustomEvent("add" + n3.type, { detail: { id: t3, component: e3 } })), 0));
    }
    has(e3) {
      return void 0 !== this.cache[e3];
    }
    get(e3) {
      return this.cache[e3] ?? null;
    }
    load(e3) {
      if (this.cache[e3]) return this.cache[e3];
      if (void 0 !== this.loading[e3]) return this.loading[e3];
      const t3 = import(this.path + e3 + ".js").then(((t4) => {
        const s3 = t4.default ?? t4;
        return this.add(s3, e3), s3;
      })).catch(((e4) => (console.error(e4), null)));
      return this.loading[e3] = t3, this.#e.push(t3), t3;
    }
    loadAll(e3) {
      return Array.isArray(e3) || (e3 = [e3]), e3.map(((e4) => this.load(e4)));
    }
  };
  function G(e3, t3) {
    const r4 = c(e3);
    for (const e4 in t3) "string" != typeof e4 || e4.startsWith("$") || (r4[e4] = t3[e4]);
    if (t3.$insertBefore && (r4.$insertBefore = s(r4.$insertBefore ?? {}, t3.$insertBefore)), t3.$insertAfter && (r4.$insertAfter = s(r4.$insertAfter ?? {}, t3.$insertAfter)), t3.$insert) for (const e4 in t3.$insert) {
      const s3 = t3.$insert[e4], { $before: n3, $after: i3, ...a3 } = s3, o4 = n3 || i3, l2 = n3 ? "$insertBefore" : "$insertAfter";
      if (r4[l2] ??= {}, Array.isArray(o4)) for (const t4 of o4) r4[l2][t4][e4] = a3;
      else o4 ? (r4[l2][o4] ??= {})[e4] = a3 : r4[e4] = a3;
    }
    return t3.$delete && (r4.$delete ? r4.$delete.push(...t3.$delete) : r4.$delete = [...t3.$delete]), t3.$merge && (r4.$merge = s(r4.$merge ?? {}, t3.$merge)), r4;
  }
  var List = class extends Set {
    get length() {
      return this.size;
    }
    addAll(e3) {
      if (!e3) return this;
      for (const t3 of n(e3)) this.add(t3);
      return this;
    }
  };
  var Language = class extends EventTarget {
    def;
    registry;
    require = new List();
    optional = new List();
    languages = {};
    readyState = 0;
    constructor(e3, t3) {
      if (super(), this.def = e3, this.registry = t3, this.def.base && this.require.add(this.def.base), this.def.require && this.require.addAll(this.def.require), this.def.optional && (this.optional.addAll(this.def.optional), this.optional.size > 0)) for (const e4 of this.optional) this.registry.has(e4) || this.registry.whenDefined(e4).then((() => {
      }));
      for (const e4 of this.require) this.registry.add(e4), t(this.languages, e4.id, (() => {
        const t4 = this.registry.peek(e4);
        return t4 ? t4.resolvedGrammar : this.registry.getLanguage(e4.id).resolvedGrammar;
      }));
      for (const e4 of this.optional) t(this.languages, e4, (() => this.registry.getLanguage(e4).resolvedGrammar), this.registry.peek(e4) ?? this.registry.whenDefined(e4));
    }
    resolve() {
    }
    get id() {
      return this.def.id;
    }
    get alias() {
      return this.def.alias ? Array.isArray(this.def.alias) ? this.def.alias : [this.def.alias] : [];
    }
    get base() {
      if (!this.def.base) return null;
      const e3 = this.def.base;
      return this.registry.peek(e3) || this.registry.getLanguage(e3.id);
    }
    get grammar() {
      const e3 = this.def;
      let { grammar: t3 } = e3;
      const n3 = this.base;
      if ("function" == typeof t3) {
        const e4 = { ...n3 && { get base() {
          return n3.resolvedGrammar;
        } }, languages: this.languages, extend: (e5, t4) => G(this.languages[e5], t4), getOptionalLanguage: (e5) => {
          const t4 = this.languages[e5] ?? this.registry.getLanguage(e5);
          return t4?.resolvedGrammar ?? t4;
        }, whenDefined: (e5) => this.registry.whenDefined(e5) };
        t3 = t3.call(this, e4);
      }
      return n3 && (t3 = G(n3.grammar, t3)), e3.grammar === t3 && (t3 = c(t3)), this.grammar = t3;
    }
    set grammar(e3) {
      this.readyState = 2, Object.defineProperty(this, "grammar", { value: e3, writable: true });
    }
    get resolvedGrammar() {
      const e3 = ((e4, t3 = e4) => {
        if (t3.$insertBefore) {
          for (const s3 in t3.$insertBefore) {
            const n3 = t3.$insertBefore[s3];
            if (s3?.includes("/")) {
              let t4 = s3.split("/");
              const i3 = t4.pop();
              t4 = t4.flatMap(((e5) => [e5, "inside"]));
              const a3 = t4.reduce(((e5, t5) => e5?.[t5]), e4);
              a3 && i(a3, i3, n3);
            } else n3 && i(e4, s3, n3);
          }
          delete e4.$insertBefore;
        }
        if (t3.$insertAfter) {
          for (const s3 in t3.$insertAfter) {
            const n3 = t3.$insertAfter[s3];
            if (s3?.includes("/")) {
              let t4 = s3.split("/");
              const r4 = t4.pop();
              t4 = t4.flatMap(((e5) => [e5, "inside"]));
              const a3 = t4.reduce(((e5, t5) => e5?.[t5]), e4);
              a3 && a(a3, r4, n3);
            } else n3 && a(e4, s3, n3);
          }
          delete e4.$insertAfter;
        }
        if (t3.$delete) {
          for (const s3 of t3.$delete) delete e4[s3];
          delete e4.$delete;
        }
        if (t3.$merge) {
          for (const s3 in t3.$merge) {
            const n3 = t3.$merge[s3];
            e4[s3] ? o(e4[s3], n3) : e4[s3] = n3;
          }
          delete e4.$merge;
        }
        return e4;
      })(this.grammar);
      return this.resolvedGrammar = e3;
    }
    set resolvedGrammar(e3) {
      this.readyState = 3, Object.defineProperty(this, "resolvedGrammar", { value: e3, writable: true });
    }
  };
  var LanguageRegistry = class extends ComponentRegistry {
    static type = "language";
    aliases = {};
    instances = {};
    defs = /* @__PURE__ */ new WeakMap();
    add(e3) {
      const t3 = super.add(e3);
      if (t3) {
        if (e3.alias) {
          const t4 = e3.id;
          if ("string" == typeof e3.alias) this.aliases[e3.alias] = t4;
          else if (Array.isArray(e3.alias)) for (const s3 of e3.alias) this.aliases[s3] = t4;
        }
        e3.effect?.(this.prism);
      }
      return t3;
    }
    resolveRef(e3) {
      if (e3 instanceof Language) return { id: e3.id, def: e3.def, language: e3 };
      let t3, s3;
      if ("object" == typeof e3) s3 = e3, t3 = s3.id;
      else {
        if ("string" != typeof e3) throw Error("Invalid argument type: " + e3);
        t3 = e3;
      }
      return t3 = this.aliases[t3] ?? t3, s3 ??= this.cache[t3], { id: t3, def: s3, language: this.instances[t3] };
    }
    peek(e3) {
      const { id: t3, def: s3, language: n3 } = this.resolveRef(e3);
      return n3 || (this.defs.has(s3) ? this.defs.get(s3) ?? null : this.instances[t3] ? this.instances[t3] : null);
    }
    getLanguage(e3) {
      const t3 = this.peek(e3);
      if (t3 instanceof Language) return t3;
      const { id: s3, def: n3 } = this.resolveRef(e3);
      if (!this.cache[s3]) return null;
      const r4 = new Language(n3, this);
      return this.defs.set(n3, r4), this.instances[n3.id] = r4, r4;
    }
  };
  var Plugin = class extends EventTarget {
    def;
    registry;
    require = new List();
    constructor(e3, t3) {
      super(), this.def = e3, this.registry = t3, this.def.require && this.require.addAll(this.def.require);
      for (const e4 of this.require) e4.grammar ? this.registry.prism.languageRegistry.add(e4) : this.registry.add(e4);
    }
    get id() {
      return this.def.id;
    }
    get plugin() {
      return this.def.plugin ? this.plugin = this.def.plugin(this.registry.prism) : null;
    }
    set plugin(e3) {
      Object.defineProperty(this, "plugin", { value: e3, writable: true });
    }
    get effect() {
      return this.def.effect;
    }
  };
  var PluginRegistry = class extends ComponentRegistry {
    static type = "plugin";
    instances = {};
    defs = /* @__PURE__ */ new WeakMap();
    add(e3) {
      const t3 = super.add(e3);
      if (t3) {
        const t4 = new Plugin(e3, this);
        this.defs.set(e3, t4), this.instances[e3.id] = t4, t4.effect?.(this.prism);
      }
      return t3;
    }
    peek(e3) {
      if (e3 instanceof Plugin) return e3;
      if ("object" == typeof e3) return this.defs.get(e3) ?? null;
      if ("string" == typeof e3) return this.instances[e3] ?? null;
      throw Error("Invalid argument type: " + e3);
    }
  };
  var Prism = class {
    hooks = new Hooks();
    languageRegistry;
    pluginRegistry;
    config = p;
    waitFor = [m()];
    ready = y(this.waitFor);
    constructor(e3 = {}) {
      this.config = Object.assign({}, p, e3), this.config.errorHandler ??= this.config.silent ? () => {
      } : console.error;
      const t3 = this.config.errorHandler;
      this.languageRegistry = new LanguageRegistry({ path: this.config.languagePath, preload: this.config.languages, prism: this }), this.pluginRegistry = new PluginRegistry({ path: this.config.pluginPath, prism: this }), this.languagesReady = this.languageRegistry.ready, this.waitFor.push(this.languagesReady);
      const s3 = this.config.plugins;
      if (s3 && s3.length > 0) {
        const e4 = this.languagesReady.then((() => this.waitFor.push(...this.pluginRegistry.loadAll(s3)))).catch(t3);
        this.waitFor.push(e4);
      }
      this.config.manual || (this.waitFor.push(((e4 = globalThis.document) => {
        if (!e4) return Promise.reject();
        const t4 = e4.currentScript, s4 = e4.readyState;
        return "loading" === s4 || "interactive" === s4 && t4 && t4.defer && !t4.async ? new Promise(((t5) => {
          e4.addEventListener("DOMContentLoaded", t5, { once: true });
        })) : Promise.resolve();
      })()), this.ready.then((() => this.highlightAll())).catch(t3));
    }
    get languages() {
      return this.languageRegistry.cache;
    }
    get plugins() {
      return this.pluginRegistry.cache;
    }
    async loadLanguage(e3) {
      return await this.languageRegistry.load(e3);
    }
    async loadPlugin(e3) {
      return await this.languagesReady, await this.pluginRegistry.load(e3);
    }
    highlightAll(e3 = {}) {
      return v.call(this, e3);
    }
    highlightElement(e3, t3 = {}) {
      return k.call(this, e3, t3);
    }
    highlight(e3, t3, s3 = {}) {
      return R.call(this, e3, t3, s3);
    }
    tokenize(e3, t3) {
      return C.call(this, e3, t3);
    }
  };
  var T = new Prism();

  // autoloader-ByGRnkdt.js
  var s2 = { g4: "antlr4", ino: "arduino", "arm-asm": "armasm", art: "arturo", adoc: "asciidoc", avs: "avisynth", avdl: "avro-idl", gawk: "awk", sh: "bash", shell: "bash", shortcode: "bbcode", rbnf: "bnf", oscript: "bsl", cfc: "cfscript", "cilk-c": "cilkc", "cilk-cpp": "cilkcpp", cilk: "cilkcpp", coffee: "coffeescript", conc: "concurnas", cs: "csharp", dotnet: "csharp", razor: "cshtml", jinja2: "django", "dns-zone": "dns-zone-file", dockerfile: "docker", gv: "dot", eta: "ejs", xlsx: "excel-formula", xls: "excel-formula", po: "gettext", gamemakerlanguage: "gml", gni: "gn", "go-mod": "go-module", hbs: "handlebars", mustache: "handlebars", hs: "haskell", idr: "idris", gitignore: "ignore", hgignore: "ignore", npmignore: "ignore", js: "javascript", webmanifest: "json", kt: "kotlin", kts: "kotlin", kum: "kumir", tex: "latex", context: "latex", ly: "lilypond", ld: "linker-script", emacs: "lisp", elisp: "lisp", "emacs-lisp": "lisp", md: "markdown", html: "markup", svg: "markup", mathml: "markup", moon: "moonscript", n4jsd: "n4js", nani: "naniscript", objc: "objectivec", qasm: "openqasm", objectpascal: "pascal", px: "pcaxis", pcode: "peoplecode", text: "plain", txt: "plain", plaintext: "plain", plantuml: "plant-uml", pq: "powerquery", mscript: "powerquery", pbfasm: "purebasic", purs: "purescript", py: "python", qs: "qsharp", rkt: "racket", rpy: "renpy", res: "rescript", robot: "robotframework", rb: "ruby", "sh-session": "shell-session", shellsession: "shell-session", smlnj: "sml", sol: "solidity", sln: "solution-file", rq: "sparql", sclang: "supercollider", t4: "t4-cs", "tree-view": "treeview", trickle: "tremor", troy: "tremor", trig: "turtle", ts: "typescript", tsconfig: "typoscript", uscript: "unrealscript", uc: "unrealscript", url: "uri", vb: "visual-basic", vba: "visual-basic", webidl: "web-idl", mathematica: "wolfram", nb: "wolfram", wl: "wolfram", xeoracube: "xeora", ssml: "xml", atom: "xml", rss: "xml", yml: "yaml" };
  function a2(e3) {
    return s2[e3] || e3;
  }
  var i2 = /* @__PURE__ */ new Set(["none"]);
  function o2(e3, t3) {
    const r4 = e3.languageRegistry.resolveRef(t3).id;
    return e3.languageRegistry.has(r4) || i2.has(r4);
  }
  var Autoloader = class {
    srcPath = (() => {
      if ("undefined" != typeof document) {
        const e3 = document.currentScript;
        if (e3) {
          const t3 = /\bplugins\/autoloader\/autoloader\.(?:min\.)?js(?:\?[^\r\n/]*)?$/i, r4 = /(^|\/)[\w-]+\.(?:min\.)?m?js(?:\?[^\r\n/]*)?$/i, s3 = e3.getAttribute("data-autoloader-path");
          if (null != s3) return s3.trim().replace(/\/?$/, "/");
          {
            const s4 = e3.src;
            if (t3.test(s4)) return s4.replace(t3, "/");
            if (r4.test(s4)) return s4.replace(r4, "$1/");
          }
        }
      }
      return "./";
    })();
    _importCache = /* @__PURE__ */ new Map();
    Prism;
    constructor(e3) {
      this.Prism = e3;
    }
    async loadLanguages(e3) {
      const t3 = r(e3).map(a2).filter(((e4) => !o2(this.Prism, e4)));
      await Promise.all(t3.map(((e4) => {
        const t4 = (r4 = `languages/${e4}.js`, this.srcPath.replace(/\/$/, "") + "/" + r4);
        var r4;
        let s3 = this._importCache.get(t4);
        return void 0 === s3 && (s3 = import(t4).then(((e5) => {
          const t5 = e5.default;
          this.Prism.languageRegistry.add(t5);
        })), this._importCache.set(t4, s3)), s3;
      })));
    }
    preloadLanguages(e3) {
      this.loadLanguages(e3).catch(((t3) => {
        console.error(`Failed to preload languages (${r(e3).join(", ")}): ${t3 + ""}`);
      }));
    }
  };
  var l = { id: "autoloader", plugin: (e3) => new Autoloader(e3), effect(e3) {
    function r4(e4) {
      return !e4 || i2.has(e4) ? [] : /^diff-./i.test(e4) ? ["diff", e4.slice(5)] : [e4];
    }
    return e3.hooks.add("complete", (({ element: s3, language: a3 }) => {
      if (!a3 || i2.has(a3)) return;
      let n3 = r4(a3);
      for (const e4 of ((e5) => {
        let r5 = e5.getAttribute("data-dependencies")?.trim();
        if (!r5) {
          const s4 = x(e5);
          s4 && (r5 = s4.getAttribute("data-dependencies")?.trim());
        }
        return r5 ? r5.split(/\s*,\s*/) : [];
      })(s3)) n3.push(...r4(e4));
      if (n3 = n3.filter(((t3) => !o2(e3, t3))), 0 === n3.length) return;
      const c3 = e3.pluginRegistry.peek(l)?.plugin;
      c3.loadLanguages(n3).then((() => e3.highlightElement(s3)), ((e4) => {
        console.error(`Failed to load languages (${n3.join(", ")}): ${e4 + ""}`);
      }));
    }));
  } };
  T.pluginRegistry.add(l);

  // index.js
  var r3 = ["abap", "abnf", "actionscript", "ada", "agda", "al", "antlr4", "apacheconf", "apex", "apl", "applescript", "aql", "arduino", "arff", "armasm", "arturo", "asciidoc", "asm6502", "asmatmel", "aspnet", "autohotkey", "autoit", "avisynth", "avro-idl", "awk", "bash", "basic", "batch", "bbcode", "bbj", "bicep", "birb", "bison", "bnf", "bqn", "brainfuck", "brightscript", "bro", "bsl", "c", "cfscript", "chaiscript", "cil", "cilkc", "cilkcpp", "clike", "clojure", "cmake", "cobol", "coffeescript", "concurnas", "cooklang", "coq", "cpp", "crystal", "csharp", "cshtml", "csp", "css", "css-extras", "css-selector", "csv", "cue", "cypher", "d", "dart", "dataweave", "dax", "dhall", "diff", "django", "dns-zone-file", "docker", "dot", "ebnf", "editorconfig", "eiffel", "ejs", "elixir", "elm", "erb", "erlang", "etlua", "excel-formula", "factor", "false", "firestore-security-rules", "flow", "fortran", "fsharp", "ftl", "gap", "gcode", "gdscript", "gedcom", "gettext", "gherkin", "git", "glsl", "gml", "gn", "go", "go-module", "gradle", "graphql", "groovy", "haml", "handlebars", "haskell", "haxe", "hcl", "hlsl", "hoon", "hpkp", "hsts", "http", "ichigojam", "icon", "icu-message-format", "idris", "iecst", "ignore", "inform7", "ini", "io", "j", "java", "javadoc", "javadoclike", "javascript", "javastacktrace", "jexl", "jolie", "jq", "js-templates", "jsdoc", "json", "json5", "jsonp", "jsstacktrace", "jsx", "julia", "keepalived", "keyman", "kotlin", "kumir", "kusto", "latex", "latte", "less", "lilypond", "linker-script", "liquid", "lisp", "livescript", "llvm", "log", "lolcode", "lua", "magma", "makefile", "markdown", "markup", "mata", "matlab", "maxscript", "mel", "mermaid", "metafont", "mizar", "mongodb", "monkey", "moonscript", "n1ql", "n4js", "nand2tetris-hdl", "naniscript", "nasm", "neon", "nevod", "nginx", "nim", "nix", "nsis", "objectivec", "ocaml", "odin", "opencl", "opencl-extensions", "openqasm", "oz", "parigp", "parser", "pascal", "pascaligo", "pcaxis", "peoplecode", "perl", "php", "php-extras", "phpdoc", "plain", "plant-uml", "plsql", "powerquery", "powershell", "processing", "prolog", "promql", "properties", "protobuf", "psl", "pug", "puppet", "pure", "purebasic", "purescript", "python", "q", "qml", "qore", "qsharp", "r", "racket", "reason", "regex", "rego", "renpy", "rescript", "rest", "rip", "roboconf", "robotframework", "ruby", "rust", "sas", "sass", "scala", "scheme", "scss", "shell-session", "smali", "smalltalk", "smarty", "sml", "solidity", "solution-file", "soy", "sparql", "splunk-spl", "sqf", "sql", "squirrel", "stan", "stata", "stylus", "supercollider", "swift", "systemd", "t4-cs", "t4-vb", "tap", "tcl", "textile", "toml", "treeview", "tremor", "tsx", "tt2", "turtle", "twig", "typescript", "typoscript", "unrealscript", "uorazor", "uri", "v", "vala", "vbnet", "velocity", "verilog", "vhdl", "vim", "visual-basic", "warpscript", "wasm", "web-idl", "wgsl", "wiki", "wolfram", "wren", "xeora", "xml", "xml-doc", "xojo", "xquery", "yaml", "yang", "zig"];
  var t2 = /* @__PURE__ */ new Map();
  async function o3(a3, l2 = r3, i3 = ".") {
    l2 = r(l2).map(a2).filter(((s3) => !a3.languageRegistry.has(s3))), await Promise.all(l2.map((async (s3) => {
      try {
        const r4 = (e3 = `languages/${s3}.js`, i3.replace(/\/$/, "") + "/" + e3), o4 = await ((a4) => {
          let s4 = t2.get(a4);
          return void 0 === s4 && (s4 = import(a4), t2.set(a4, s4)), s4;
        })(r4);
        a3.languageRegistry.add(o4.default);
      } catch (a4) {
        o3.silent || console.warn(`Unable to load language ${s3}: ${a4 + ""}`);
      }
      var e3;
    })));
  }
  o3.silent = false;

  // languages/toml.js
  var toml_exports = {};
  __export(toml_exports, {
    default: () => e2
  });
  var e2 = { id: "toml", grammar() {
    function e3(e4) {
      return e4.replace(/__/g, (() => `(?:[\\w-]+|'[^'
\r]*'|"(?:\\\\.|[^\\\\"\r
])*")`));
    }
    return { comment: { pattern: /#.*/, greedy: true }, table: { pattern: RegExp(e3("(^[	 ]*\\[\\s*(?:\\[\\s*)?)__(?:\\s*\\.\\s*__)*(?=\\s*\\])"), "m"), lookbehind: true, greedy: true, alias: "class-name" }, key: { pattern: RegExp(e3("(^[	 ]*|[{,]\\s*)__(?:\\s*\\.\\s*__)*(?=\\s*=)"), "m"), lookbehind: true, greedy: true, alias: "property" }, string: { pattern: /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/, greedy: true }, date: [{ pattern: /\b\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?\b/i, alias: "number" }, { pattern: /\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b/, alias: "number" }], number: /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\b\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?\b(?:inf|nan)\b/, boolean: /\b(?:false|true)\b/, punctuation: /[.,=[\]{}]/ };
  } };

  // build-prism.js
  if (T.components) T.components.add(toml_exports);
  window.Prism = T;
})();
