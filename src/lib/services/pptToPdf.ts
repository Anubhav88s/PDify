// PPT to PDF conversion using canvas-based rendering (html2canvas)
// This approach renders each slide as an HTML element, captures it via
// html2canvas, and embeds the resulting image into a PDF page.

export async function convertPptxToPdf(
  file: File,
): Promise<{ success: boolean; url: string; message: string }> {
  if (typeof window === "undefined") {
    return { success: false, url: "", message: "Only supported in browser." };
  }

  let slideContainer: HTMLDivElement | null = null;

  try {
    const JSZip = (await import("jszip")).default;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // --- XML Parser ---
    const parseXml = (xmlString: string) =>
      new DOMParser().parseFromString(xmlString, "application/xml");

    // --- EMU to pixels (1 inch = 914400 EMUs, 96 DPI) ---
    const emuToPx = (emu: number) => (emu / 914400) * 96;

    // --- Slide dimensions ---
    let slideW = 960;
    let slideH = 540;
    try {
      const presXml = await zip.file("ppt/presentation.xml")?.async("text");
      if (presXml) {
        const doc = parseXml(presXml);
        const sldSz = doc.getElementsByTagName("p:sldSz")[0];
        if (sldSz) {
          const cx = parseInt(sldSz.getAttribute("cx") || "0");
          const cy = parseInt(sldSz.getAttribute("cy") || "0");
          if (cx > 0 && cy > 0) {
            slideW = emuToPx(cx);
            slideH = emuToPx(cy);
          }
        }
      }
    } catch {
      /* use defaults */
    }

    // --- Collect slides ---
    const slideFiles: string[] = [];
    zip.forEach((path, f) => {
      if (path.match(/^ppt\/slides\/slide\d+\.xml$/) && !f.dir)
        slideFiles.push(path);
    });
    slideFiles.sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return na - nb;
    });
    if (slideFiles.length === 0) {
      return { success: false, url: "", message: "No slides found." };
    }

    // --- Extract media → blob URLs ---
    const mediaUrls: Record<string, string> = {};
    const mediaFolder = zip.folder("ppt/media");
    if (mediaFolder) {
      const ps: Promise<void>[] = [];
      mediaFolder.forEach((_rp, f) => {
        if (f.dir) return;
        const name = f.name.split("/").pop()!;
        const ext = name.split(".").pop()?.toLowerCase() || "";
        const mimeMap: Record<string, string> = {
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          gif: "image/gif",
          bmp: "image/bmp",
          svg: "image/svg+xml",
          tiff: "image/tiff",
          tif: "image/tiff",
          emf: "image/x-emf",
          wmf: "image/x-wmf",
          webp: "image/webp",
        };
        const mime = mimeMap[ext] || "application/octet-stream";
        ps.push(
          f.async("arraybuffer").then((data) => {
            mediaUrls[name] = URL.createObjectURL(
              new Blob([data], { type: mime }),
            );
          }),
        );
      });
      await Promise.all(ps);
    }

    // --- Helper: get rels map ---
    const getRels = async (filePath: string) => {
      const parts = filePath.split("/");
      const fn = parts.pop()!;
      const dir = parts.join("/");
      const relsPath = `${dir}/_rels/${fn}.rels`;
      const map: Record<string, string> = {};
      const xml = await zip.file(relsPath)?.async("text");
      if (xml) {
        const doc = parseXml(xml);
        const rels = doc.getElementsByTagName("Relationship");
        for (let i = 0; i < rels.length; i++) {
          const id = rels[i].getAttribute("Id");
          const target = rels[i].getAttribute("Target");
          if (id && target) map[id] = target.split("/").pop()!;
        }
      }
      return map;
    };

    // --- XML helpers using localName (namespace-safe) ---
    const localName = (el: Element) =>
      el.localName || el.tagName.split(":").pop()!;

    const findChild = (parent: Element, name: string): Element | null => {
      for (let i = 0; i < parent.children.length; i++) {
        if (localName(parent.children[i]) === name) return parent.children[i];
      }
      return null;
    };

    const findDescendant = (parent: Element, name: string): Element | null => {
      for (let i = 0; i < parent.children.length; i++) {
        const child = parent.children[i];
        if (localName(child) === name) return child;
        const deep = findDescendant(child, name);
        if (deep) return deep;
      }
      return null;
    };

    const findAll = (parent: Element, name: string): Element[] => {
      const result: Element[] = [];
      const walk = (el: Element) => {
        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i];
          if (localName(child) === name) result.push(child);
          walk(child);
        }
      };
      walk(parent);
      return result;
    };

    // --- Color Helpers ---
    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace("#", ""), 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)
          .toUpperCase()
      );
    };

    const rgbToHsl = (r: number, g: number, b: number) => {
      ((r /= 255), (g /= 255), (b /= 255));
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return { h, s, l };
    };

    const hslToRgb = (h: number, s: number, l: number) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
      };
    };

    const applyColorTransform = (cHex: string, el: Element): string => {
      if (!cHex) return "";
      let { r, g, b } = hexToRgb(cHex);
      let a = 1;

      // Alpha
      const alpha = findChild(el, "alpha");
      if (alpha) {
        const val = parseInt(attr(alpha, "val"));
        if (!isNaN(val)) a = val / 100000;
      }

      // Lum Mod/Off
      const lumMod = findChild(el, "lumMod");
      const lumOff = findChild(el, "lumOff");
      if (lumMod || lumOff) {
        const hsl = rgbToHsl(r, g, b);
        if (lumMod) hsl.l *= parseInt(attr(lumMod, "val")) / 100000;
        if (lumOff) hsl.l += parseInt(attr(lumOff, "val")) / 100000;
        hsl.l = Math.max(0, Math.min(1, hsl.l));
        const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        r = rgb.r;
        g = rgb.g;
        b = rgb.b;
      }

      // Tint (closer to white) / Shade (closer to black)
      const tint = findChild(el, "tint");
      if (tint) {
        const t = parseInt(attr(tint, "val")) / 100000;
        r = r + (255 - r) * t;
        g = g + (255 - g) * t;
        b = b + (255 - b) * t;
      }
      const shade = findChild(el, "shade");
      if (shade) {
        const s = parseInt(attr(shade, "val")) / 100000;
        r = r * s;
        g = g * s;
        b = b * s;
      }

      r = Math.round(r);
      g = Math.round(g);
      b = Math.round(b);
      return a < 1 ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`;
    };

    const attr = (el: Element | null, a: string) => el?.getAttribute(a) || "";

    // --- Theme color map (common defaults) ---
    const themeColorMap: Record<string, string> = {
      dk1: "#000000",
      dk2: "#1F2937",
      lt1: "#FFFFFF",
      lt2: "#F3F4F6",
      tx1: "#000000",
      tx2: "#374151",
      bg1: "#FFFFFF",
      bg2: "#E5E7EB",
      accent1: "#4472C4",
      accent2: "#ED7D31",
      accent3: "#A5A5A5",
      accent4: "#FFC000",
      accent5: "#5B9BD5",
      accent6: "#70AD47",
      hlink: "#0563C1",
      folHlink: "#954F72",
    };

    // Try to load actual theme colors from theme XML
    try {
      const themeXml = await zip.file("ppt/theme/theme1.xml")?.async("text");
      if (themeXml) {
        const themeDoc = parseXml(themeXml);
        const parseThemeColor = (name: string, ...xmlNames: string[]) => {
          for (const xn of xmlNames) {
            const el = findDescendant(themeDoc.documentElement, xn);
            if (el) {
              const srgb = findDescendant(el, "srgbClr");
              if (srgb) {
                const v = attr(srgb, "val");
                if (v) themeColorMap[name] = `#${v}`;
                return;
              }
              const sys = findDescendant(el, "sysClr");
              if (sys) {
                const v = attr(sys, "lastClr");
                if (v) themeColorMap[name] = `#${v}`;
                return;
              }
            }
          }
        };
        parseThemeColor("dk1", "dk1");
        parseThemeColor("dk2", "dk2");
        parseThemeColor("lt1", "lt1");
        parseThemeColor("lt2", "lt2");
        parseThemeColor("tx1", "dk1");
        parseThemeColor("tx2", "dk2");
        parseThemeColor("bg1", "lt1");
        parseThemeColor("bg2", "lt2");
        // accent colors
        const clrScheme = findDescendant(themeDoc.documentElement, "clrScheme");
        if (clrScheme) {
          for (let ci = 0; ci < clrScheme.children.length; ci++) {
            const c = clrScheme.children[ci];
            const cName = localName(c);
            const srgb = findDescendant(c, "srgbClr");
            if (srgb) {
              const v = attr(srgb, "val");
              if (v) themeColorMap[cName] = `#${v}`;
            }
            const sys = findDescendant(c, "sysClr");
            if (sys) {
              const v = attr(sys, "lastClr");
              if (v) themeColorMap[cName] = `#${v}`;
            }
          }
        }
      }
    } catch {
      /* use defaults */
    }

    // Resolve any color element to a CSS color string
    const resolveColor = (parent: Element): string => {
      // Find the color choice element (srgbClr, schemeClr, sysClr, etc.)
      const colorTypes = ["srgbClr", "schemeClr", "sysClr", "prstClr"];
      let colorEl: Element | null = null;
      for (const t of colorTypes) {
        colorEl = findDescendant(parent, t);
        if (colorEl) break;
      }
      if (!colorEl) return "";

      const type = localName(colorEl);
      let baseHex = "";

      if (type === "srgbClr") {
        const v = attr(colorEl, "val");
        if (v) baseHex = `#${v}`;
      } else if (type === "schemeClr") {
        const v = attr(colorEl, "val");
        if (v && themeColorMap[v]) baseHex = themeColorMap[v];
        // Handle "phClr" (placeholder color)? - usually treated as black or parent style
      } else if (type === "sysClr") {
        const v = attr(colorEl, "lastClr");
        if (v) baseHex = `#${v}`;
      } else if (type === "prstClr") {
        // preset colors like 'black', 'white' etc (could map them but raw val might work if standard)
        const v = attr(colorEl, "val");
        if (v) return v;
      }

      if (!baseHex) return "";
      return applyColorTransform(baseHex, colorEl);
    };

    // Resolve fill element to a CSS background string
    const resolveFillCss = (
      parent: Element,
      rels?: Record<string, string>,
    ): string => {
      // Check for blip fill (image)
      if (rels) {
        const blip = findDescendant(parent, "blip");
        if (blip) {
          const url = resolveBlipUrl(blip, rels);
          if (url) return `background:url('${url}') center/cover no-repeat;`;
        }
      }
      // Solid fill
      const solidFill = findDescendant(parent, "solidFill");
      if (solidFill) {
        const clr = resolveColor(solidFill);
        if (clr) return `background:${clr};`;
      }
      // Gradient fill
      const gradFill = findDescendant(parent, "gradFill");
      if (gradFill) {
        const stops = findAll(gradFill, "gs");
        if (stops.length >= 2) {
          const cssStops = stops
            .map((gs: Element) => {
              const pos = parseInt(attr(gs, "pos") || "0") / 1000;
              const clr = resolveColor(gs);
              return `${clr || "#888"} ${pos}%`;
            })
            .join(", ");
          return `background:linear-gradient(180deg, ${cssStops});`;
        }
      }
      // Pattern / no fill
      const noFill = findDescendant(parent, "noFill");
      if (noFill) return "background:transparent;";
      return "";
    };

    // --- Resolve image URL from blip element ---
    const resolveBlipUrl = (
      blip: Element,
      rels: Record<string, string>,
    ): string => {
      const embedId =
        blip.getAttribute("r:embed") || blip.getAttribute("r:link") || "";
      if (!embedId || !rels[embedId]) return "";
      const filename = rels[embedId];
      // direct match
      if (mediaUrls[filename]) return mediaUrls[filename];
      // case-insensitive
      const match = Object.keys(mediaUrls).find(
        (k) => k.toLowerCase() === filename.toLowerCase(),
      );
      return match ? mediaUrls[match] : "";
    };

    // --- Build HTML for shapes in a spTree ---
    const buildShapesHtml = (
      spTree: Element,
      rels: Record<string, string>,
      pOffX = 0,
      pOffY = 0,
      sX = 1,
      sY = 1,
    ): string => {
      let html = "";

      for (let i = 0; i < spTree.children.length; i++) {
        const node = spTree.children[i];
        const tag = localName(node);

        // --- Transform ---
        let xfrm: Element | null = null;
        if (tag === "grpSp") {
          const pr = findChild(node, "grpSpPr");
          if (pr) xfrm = findDescendant(pr, "xfrm");
        } else if (tag === "sp" || tag === "pic" || tag === "cxnSp") {
          const pr = findChild(node, "spPr");
          if (pr) xfrm = findDescendant(pr, "xfrm");
        } else {
          continue; // skip unknown elements
        }

        let offX = 0,
          offY = 0,
          extW = 0,
          extH = 0;
        if (xfrm) {
          const off = findChild(xfrm, "off");
          if (off) {
            offX = emuToPx(parseInt(attr(off, "x") || "0"));
            offY = emuToPx(parseInt(attr(off, "y") || "0"));
          }
          const ext = findChild(xfrm, "ext");
          if (ext) {
            extW = emuToPx(parseInt(attr(ext, "cx") || "0"));
            extH = emuToPx(parseInt(attr(ext, "cy") || "0"));
          }
        }

        const x = pOffX + offX * sX;
        const y = pOffY + offY * sY;
        const w = extW * sX;
        const h = extH * sY;

        // Check for rotation
        let rotation = 0;
        if (xfrm) {
          const rot = attr(xfrm, "rot");
          if (rot) rotation = parseInt(rot) / 60000; // 60000ths of a degree
        }
        const rotStyle = rotation ? `transform:rotate(${rotation}deg);` : "";

        // --- GROUP ---
        if (tag === "grpSp") {
          let chOffX = 0,
            chOffY = 0,
            chExtW = 1,
            chExtH = 1;
          if (xfrm) {
            const chOff = findChild(xfrm, "chOff");
            if (chOff) {
              chOffX = emuToPx(parseInt(attr(chOff, "x") || "0"));
              chOffY = emuToPx(parseInt(attr(chOff, "y") || "0"));
            }
            const chExt = findChild(xfrm, "chExt");
            if (chExt) {
              chExtW = emuToPx(parseInt(attr(chExt, "cx") || "0")) || 1;
              chExtH = emuToPx(parseInt(attr(chExt, "cy") || "0")) || 1;
            }
          }
          const nsx = sX * (extW / chExtW);
          const nsy = sY * (extH / chExtH);
          const nox = x - chOffX * nsx;
          const noy = y - chOffY * nsy;
          html += buildShapesHtml(node, rels, nox, noy, nsx, nsy);
          continue;
        }

        // --- PICTURE ---
        if (tag === "pic") {
          const blips = findAll(node, "blip");
          for (const blip of blips) {
            const url = resolveBlipUrl(blip, rels);
            if (url && w > 0 && h > 0) {
              html += `<img src="${url}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;object-fit:fill;${rotStyle}" />`;
              break;
            }
          }
          continue;
        }

        // --- SHAPE (sp / cxnSp) ---
        if (tag === "sp" || tag === "cxnSp") {
          const spPr = findChild(node, "spPr");

          // Shape background / image fill
          if (spPr && w > 0 && h > 0) {
            // Image fill
            const blips = findAll(spPr, "blip");
            for (const blip of blips) {
              const url = resolveBlipUrl(blip, rels);
              if (url) {
                html += `<img src="${url}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;object-fit:fill;${rotStyle}" />`;
                break;
              }
            }

            // Solid / gradient / theme fill
            const fillCss = resolveFillCss(spPr);
            if (fillCss) {
              html += `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;${fillCss}${rotStyle}"></div>`;
            }
          }

          // --- TEXT ---
          const txBody = findChild(node, "txBody");
          if (txBody && w > 0 && h > 0) {
            const bodyPr = findDescendant(txBody, "bodyPr");
            const anchor = attr(bodyPr, "anchor") || "t";
            let jc = "flex-start";
            if (anchor === "ctr") jc = "center";
            else if (anchor === "b") jc = "flex-end";

            let thtml = "";
            const paras = findAll(txBody, "p");
            // Only get direct children p elements of txBody
            const directParas: Element[] = [];
            for (let pi = 0; pi < txBody.children.length; pi++) {
              if (localName(txBody.children[pi]) === "p")
                directParas.push(txBody.children[pi]);
            }

            for (const p of directParas) {
              const pPr = findChild(p, "pPr");
              const algn = attr(pPr, "algn") || "l";
              let ta = "left";
              if (algn === "ctr") ta = "center";
              else if (algn === "r" || algn === "rgt") ta = "right";

              // Collect runs (direct children named "r")
              let pContent = "";
              for (let ri = 0; ri < p.children.length; ri++) {
                const child = p.children[ri];
                const childTag = localName(child);
                if (childTag === "r") {
                  const t = findDescendant(child, "t");
                  const text = t?.textContent || "";
                  if (!text) continue;

                  const rPr = findChild(child, "rPr");
                  let fs = 18;
                  let clr = "inherit";
                  let bold = false;
                  let italic = false;
                  let underline = false;

                  if (rPr) {
                    const sz = attr(rPr, "sz");
                    if (sz) fs = (parseInt(sz) / 100) * 1.33;

                    if (attr(rPr, "b") === "1") bold = true;
                    if (attr(rPr, "i") === "1") italic = true;
                    if (attr(rPr, "u") === "sng") underline = true;

                    const sf = findDescendant(rPr, "solidFill");
                    if (sf) {
                      const resolved = resolveColor(sf);
                      if (resolved) clr = resolved;
                    }
                  }

                  const esc = text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                  const styles = [
                    `font-size:${fs}px`,
                    `color:${clr}`,
                    bold ? "font-weight:bold" : "",
                    italic ? "font-style:italic" : "",
                    underline ? "text-decoration:underline" : "",
                  ]
                    .filter(Boolean)
                    .join(";");
                  pContent += `<span style="${styles}">${esc}</span>`;
                } else if (childTag === "br") {
                  pContent += "<br/>";
                }
              }

              if (pContent) {
                thtml += `<div style="text-align:${ta};line-height:1.3;margin:0;padding:0;">${pContent}</div>`;
              } else {
                thtml += `<div style="height:0.5em;"></div>`;
              }
            }

            if (thtml) {
              html += `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;min-height:${h}px;display:flex;flex-direction:column;justify-content:${jc};padding:4px 8px;box-sizing:border-box;overflow:visible;word-wrap:break-word;overflow-wrap:break-word;font-family:Calibri,Arial,sans-serif;${rotStyle}">${thtml}</div>`;
            }
          }
        }
      }

      return html;
    };

    // --- Create jsPDF ---
    const pdfDoc = new jsPDF({
      orientation: slideW > slideH ? "landscape" : "portrait",
      unit: "px",
      format: [slideW, slideH],
      hotfixes: ["px_scaling"],
    });

    // Hidden container
    slideContainer = document.createElement("div");
    slideContainer.style.cssText = "position:absolute;left:-9999px;top:0;";
    document.body.appendChild(slideContainer);

    for (let si = 0; si < slideFiles.length; si++) {
      const sf = slideFiles[si];
      console.log(`[PPT→PDF] Slide ${si + 1}/${slideFiles.length}`);

      if (si > 0) pdfDoc.addPage([slideW, slideH]);

      const slideRels = await getRels(sf);
      const slideXml = await zip.file(sf)?.async("text");
      if (!slideXml) continue;
      const slideDoc = parseXml(slideXml);

      // --- Background ---
      let bgCss = "background:#FFFFFF;";
      const defaultBg = bgCss;

      // Helper: try to extract bg from a document
      const extractBg = async (
        doc: Document,
        rels: Record<string, string>,
        label: string,
      ): Promise<string> => {
        const bgs = findAll(doc.documentElement, "bg");
        console.log(`[PPT→PDF] ${label}: found ${bgs.length} bg elements`);
        for (const bg of bgs) {
          // Method 1: bgPr (background properties with explicit fill)
          const bgPr = findDescendant(bg, "bgPr");
          if (bgPr) {
            console.log(`[PPT→PDF] ${label}: found bgPr`);
            const fill = resolveFillCss(bgPr, rels);
            if (fill) {
              console.log(`[PPT→PDF] ${label}: bgPr fill = ${fill}`);
              return fill;
            }
          }
          // Method 2: bgRef (reference to theme fill style + color override)
          const bgRef = findDescendant(bg, "bgRef");
          if (bgRef) {
            const idx = attr(bgRef, "idx");
            console.log(`[PPT→PDF] ${label}: found bgRef idx=${idx}`);
            // The color inside bgRef is used as the fill color (override)
            const clr = resolveColor(bgRef);
            if (clr) {
              console.log(`[PPT→PDF] ${label}: bgRef color = ${clr}`);
              return `background:${clr};`;
            }
          }
          // Method 3: direct fill children
          const fill = resolveFillCss(bg, rels);
          if (fill) {
            console.log(`[PPT→PDF] ${label}: direct fill = ${fill}`);
            return fill;
          }
        }
        return "";
      };

      // 1. Try slide background
      const slideBg = await extractBg(slideDoc, slideRels, `Slide ${si + 1}`);
      if (slideBg) bgCss = slideBg;

      // 2. If still default, check layout → master
      if (bgCss === defaultBg) {
        const slideRelsXml = await zip
          .file(`ppt/slides/_rels/${sf.split("/").pop()}.rels`)
          ?.async("text");
        if (slideRelsXml) {
          const rDoc = parseXml(slideRelsXml);
          const allR = rDoc.getElementsByTagName("Relationship");
          let layoutPath = "";
          let masterPath = "";

          for (let ri = 0; ri < allR.length; ri++) {
            const rType = allR[ri].getAttribute("Type") || "";
            const target = allR[ri].getAttribute("Target") || "";
            if (rType.includes("slideLayout")) {
              const fn = target.split("/").pop() || "";
              if (fn) layoutPath = `ppt/slideLayouts/${fn}`;
            }
          }

          // Try layout
          if (layoutPath) {
            try {
              const lXml = await zip.file(layoutPath)?.async("text");
              if (lXml) {
                const lDoc = parseXml(lXml);
                const lRels = await getRels(layoutPath);
                const lBg = await extractBg(lDoc, lRels, `Layout`);
                if (lBg) bgCss = lBg;

                // Find master from layout rels
                if (bgCss === defaultBg) {
                  const lRelsXml = await zip
                    .file(
                      `ppt/slideLayouts/_rels/${layoutPath.split("/").pop()}.rels`,
                    )
                    ?.async("text");
                  if (lRelsXml) {
                    const lrDoc = parseXml(lRelsXml);
                    const lrs = lrDoc.getElementsByTagName("Relationship");
                    for (let li = 0; li < lrs.length; li++) {
                      if (
                        (lrs[li].getAttribute("Type") || "").includes(
                          "slideMaster",
                        )
                      ) {
                        const mf =
                          lrs[li].getAttribute("Target")?.split("/").pop() ||
                          "";
                        if (mf) masterPath = `ppt/slideMasters/${mf}`;
                      }
                    }
                  }
                }
              }
            } catch {
              /* skip */
            }
          }

          // Try master
          if (bgCss === defaultBg && masterPath) {
            try {
              const mXml = await zip.file(masterPath)?.async("text");
              if (mXml) {
                const mDoc = parseXml(mXml);
                const mRels = await getRels(masterPath);
                const mBg = await extractBg(mDoc, mRels, `Master`);
                if (mBg) bgCss = mBg;
              }
            } catch {
              /* skip */
            }
          }
        }
      }

      // 3. Final fallback: look for a full-slide rectangle shape with a fill
      if (bgCss === defaultBg) {
        const bgSpTree = findDescendant(slideDoc.documentElement, "spTree");
        if (bgSpTree) {
          for (let ci = 0; ci < bgSpTree.children.length; ci++) {
            const node = bgSpTree.children[ci];
            if (localName(node) !== "sp") continue;
            const spPr = findChild(node, "spPr");
            if (!spPr) continue;
            const xfrm = findDescendant(spPr, "xfrm");
            if (!xfrm) continue;
            const ext = findChild(xfrm, "ext");
            if (!ext) continue;
            const cxPx = emuToPx(parseInt(attr(ext, "cx") || "0"));
            const cyPx = emuToPx(parseInt(attr(ext, "cy") || "0"));
            // If shape covers >=90% of slide, treat as background
            if (cxPx >= slideW * 0.9 && cyPx >= slideH * 0.9) {
              const fill = resolveFillCss(spPr, slideRels);
              if (fill) {
                console.log(
                  `[PPT→PDF] Slide ${si + 1}: using full-slide shape as bg: ${fill}`,
                );
                bgCss = fill;
                break;
              }
            }
          }
        }
      }

      console.log(`[PPT→PDF] Slide ${si + 1}: final bgCss = ${bgCss}`);

      // --- Build slide HTML ---
      const spTree = findDescendant(slideDoc.documentElement, "spTree");
      let shapesHtml = "";
      if (spTree) shapesHtml = buildShapesHtml(spTree, slideRels);

      const slideDiv = document.createElement("div");
      slideDiv.style.cssText = `position:relative;width:${slideW}px;height:${slideH}px;overflow:hidden;${bgCss}`;
      slideDiv.innerHTML = shapesHtml;
      slideContainer.appendChild(slideDiv);

      // Wait for images to load
      const imgs = slideDiv.querySelectorAll("img");
      if (imgs.length > 0) {
        await Promise.all(
          Array.from(imgs).map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                  resolve();
                  return;
                }
                img.onload = () => resolve();
                img.onerror = () => {
                  console.warn("[PPT→PDF] Image load failed");
                  resolve();
                };
              }),
          ),
        );
        // Short delay for browser rendering
        await new Promise((r) => setTimeout(r, 150));
      }

      // Render via html2canvas
      try {
        const canvas = await html2canvas(slideDiv, {
          width: slideW,
          height: slideH,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: null,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        pdfDoc.addImage(imgData, "JPEG", 0, 0, slideW, slideH);
      } catch (err) {
        console.error(`[PPT→PDF] Slide ${si + 1} render error:`, err);
        pdfDoc.setFontSize(20);
        pdfDoc.text(`Slide ${si + 1} - Render Error`, slideW / 4, slideH / 2);
      }

      slideContainer.removeChild(slideDiv);
    }

    // Cleanup
    if (slideContainer && document.body.contains(slideContainer))
      document.body.removeChild(slideContainer);
    slideContainer = null;
    Object.values(mediaUrls).forEach((u) => URL.revokeObjectURL(u));

    const pdfBlob = pdfDoc.output("blob");
    return {
      success: true,
      url: URL.createObjectURL(pdfBlob),
      message: `PowerPoint converted! (${slideFiles.length} slide${slideFiles.length > 1 ? "s" : ""} processed)`,
    };
  } catch (error) {
    console.error("[PPT→PDF] Failed:", error);
    if (slideContainer && document.body.contains(slideContainer))
      document.body.removeChild(slideContainer);
    return {
      success: false,
      url: "",
      message: "Failed to convert PowerPoint. " + (error as Error).message,
    };
  }
}
