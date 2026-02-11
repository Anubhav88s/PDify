
const fs = require('fs');
const path = require('path');

// We need to resolve dependencies manually since we are running a script outside "src"
// This assumes running from project root with "node scripts/debug-pptx.js"
// But since the project is TS and uses imports, we might need to rely on CommonJS require if possible.
// Or we can try to use dynamic imports.
// The issue is jszip might be ESM only or CJS.
// Let's try standard requires.

// Helper to print Hierarchy
const printHierarchy = (node, depth = 0) => {
     if (node.nodeType !== 1) return; // Element only
     const indent = "  ".repeat(depth);
     let info = "";
     if (node.tagName.includes("pic")) {
         const xfrm = node.getElementsByTagName("a:xfrm")[0];
         if(xfrm) {
             const off = xfrm.getElementsByTagName("a:off")[0];
             const ext = xfrm.getElementsByTagName("a:ext")[0];
             info = ` [off: ${off?.getAttribute("x")},${off?.getAttribute("y")} ext: ${ext?.getAttribute("cx")},${ext?.getAttribute("cy")}]`;
         } else {
             info = " [NO XFRM]";
         }
         
         const blip = node.getElementsByTagName("a:blip")[0];
         if(blip) {
             const embed = blip.getAttribute("r:embed");
             info += ` embedId=${embed}`;
             
             // Check extensions for SVG
             const extLst = blip.getElementsByTagName("a:extLst")[0];
             if(extLst) {
                 const svgs = Array.from(extLst.getElementsByTagName("asvg:svgBlip"));
                 svgs.forEach(s => {
                     info += ` svgEmbedId=${s.getAttribute("r:embed")}`;
                 });
             }
         }
     }
     console.log(`${indent}<${node.tagName}>${info}`);
     
     const children = Array.from(node.childNodes);
     children.forEach(c => printHierarchy(c, depth + 1));
};

async function main() {
    try {
        console.log("Starting PPTX Analysis...");
        
        // 1. Load Dependencies
        let JSZip;
        try {
            JSZip = require('jszip');
        } catch (e) {
            console.log("Could not require 'jszip', trying dynamic import...");
            JSZip = (await import('jszip')).default;
        }

        let DOMParser;
        try {
             const xmldom = require('@xmldom/xmldom');
             DOMParser = xmldom.DOMParser;
        } catch (e) {
            console.error("Could not load @xmldom/xmldom. Is it installed?");
            process.exit(1);
        }

        // Helper: Parse XML
        const parseXml = (xmlStr) => new DOMParser().parseFromString(xmlStr, "application/xml");

        // 2. Load File
        // The path provided by User
        const pptxPath = path.join(__dirname, '../sample/Apple-Inc-From-Garage-Start-up-to-Global-Tech-Giant.pptx');
        if (!fs.existsSync(pptxPath)) {
            console.error("File not found:", pptxPath);
            return;
        }

        const data = fs.readFileSync(pptxPath);
        const zip = await JSZip.loadAsync(data);

        // 2b. Check Presentation Dimensions
        const presXml = await zip.file("ppt/presentation.xml")?.async("text");
        if (presXml) {
            const doc = parseXml(presXml);
            const sldSz = doc.getElementsByTagName("p:sldSz")[0];
            console.log(`Presentation Size: cx=${sldSz?.getAttribute("cx")} cy=${sldSz?.getAttribute("cy")}`);
        }

        // 3. List Media
        console.log("\n--- MEDIA FILES ---");
        const mediaFiles = [];
        zip.folder("ppt/media").forEach((relativePath, file) => {
            console.log(`- ${relativePath} (${file.name})`);
            mediaFiles.push(relativePath);
        });

        // 5. Analyze Slide 1 Relationship Chain
        console.log("\n--- ANALYZING SLIDE 1 ---");
        const slide1Path = "ppt/slides/slide1.xml";
        const slide1Xml = await zip.file(slide1Path)?.async("text");
        if (slide1Xml) {
             console.log("Slide 1 Hierarchy:");
             const doc = parseXml(slide1Xml);
             const spTree = doc.getElementsByTagName("p:spTree")[0];
             printHierarchy(spTree);
        }
        // const slide1Xml = await zip.file(slide1Path)?.async("text");
        
        if (!slide1Xml) {
            console.error("Slide 1 found");
            return;
        }
        
        const slide1RelsPath = "ppt/slides/_rels/slide1.xml.rels";
        const slide1RelsXml = await zip.file(slide1RelsPath)?.async("text");
        
        let layoutFilename = "";
        const slideRelsMap = {};

        if (slide1RelsXml) {
            const relsDoc = parseXml(slide1RelsXml);
            const rels = Array.from(relsDoc.getElementsByTagName("Relationship"));
            console.log("Slide 1 Relationships:");
            rels.forEach(r => {
                const id = r.getAttribute("Id");
                const target = r.getAttribute("Target");
                const type = r.getAttribute("Type");
                console.log(`  [${id}] -> ${target} (${type})`);
                slideRelsMap[id] = target;
                if (type.includes("slideLayout")) {
                    layoutFilename = target.split("/").pop();
                }
            });
        }

        // 6. Analyze Layout
        let masterFilename = "";
        if (layoutFilename) {
             console.log(`\n--- ANALYZING LAYOUT: ${layoutFilename} ---`);
             const layoutPath = `ppt/slideLayouts/${layoutFilename}`;
             const layoutXml = await zip.file(layoutPath)?.async("text");
             const layoutRelsPath = `ppt/slideLayouts/_rels/${layoutFilename}.rels`;
             const layoutRelsXml = await zip.file(layoutRelsPath)?.async("text");
             
             if (layoutRelsXml) {
                const relsDoc = parseXml(layoutRelsXml);
                const rels = Array.from(relsDoc.getElementsByTagName("Relationship"));
                console.log(`Layout Relationships:`);
                rels.forEach(r => {
                    const id = r.getAttribute("Id");
                    const target = r.getAttribute("Target");
                    const type = r.getAttribute("Type");
                    console.log(`  [${id}] -> ${target} (${type})`);
                    if (type.includes("slideMaster")) {
                        masterFilename = target.split("/").pop();
                    }
                });
             }
             
             // Check for Images in Layout XML
             if (layoutXml) {
                 const doc = parseXml(layoutXml);
                 const pics = Array.from(doc.getElementsByTagName("p:pic"));
                 console.log(`Layout contains ${pics.length} <p:pic> elements.`);
                 pics.forEach((p, i) => {
                     const blip = p.getElementsByTagName("a:blip")[0];
                     const embed = blip?.getAttribute("r:embed");
                     console.log(`  Pic #${i+1}: embedId=${embed}`);
                 });
             }
        }

        // 7. Analyze Master
        if (masterFilename) {
            console.log(`\n--- ANALYZING MASTER: ${masterFilename} ---`);
            const masterPath = `ppt/slideMasters/${masterFilename}`;
            const masterXml = await zip.file(masterPath)?.async("text");
            const masterRelsPath = `ppt/slideMasters/_rels/${masterFilename}.rels`;
            const masterRelsXml = await zip.file(masterRelsPath)?.async("text");

            if (masterRelsXml) {
                const relsDoc = parseXml(masterRelsXml);
                const rels = Array.from(relsDoc.getElementsByTagName("Relationship"));
                console.log(`Master Relationships:`);
                rels.forEach(r => {
                    const id = r.getAttribute("Id");
                    const target = r.getAttribute("Target");
                    const type = r.getAttribute("Type");
                    console.log(`  [${id}] -> ${target} (${type})`);
                });
            }

            // Check for Images in Master XML
             if (masterXml) {
                 const doc = parseXml(masterXml);
                 const pics = Array.from(doc.getElementsByTagName("p:pic"));
                 console.log(`Master contains ${pics.length} <p:pic> elements.`);
                 pics.forEach((p, i) => {
                     const blip = p.getElementsByTagName("a:blip")[0];
                     const embed = blip?.getAttribute("r:embed");
                     console.log(`  Pic #${i+1}: embedId=${embed}`);
                 });
                 
                 // Check backgrounds
                 const bg = doc.getElementsByTagName("p:bg")[0];
                 if (bg) {
                     console.log("Master has <p:bg> element.");
                     const blipFill = bg.getElementsByTagName("p:blipFill")[0];
                     if (blipFill) {
                         const blip = blipFill.getElementsByTagName("a:blip")[0];
                         console.log(`  Background Uses Blip: embedId=${blip?.getAttribute("r:embed")}`);
                     }
                 }
             }
        }
        


        // 6b. Deep Dive Layout 2
        if (layoutFilename) {
             console.log(`\n--- DEEP DIVE LAYOUT: ${layoutFilename} ---`);
             const layoutPath = `ppt/slideLayouts/${layoutFilename}`;
             const layoutXml = await zip.file(layoutPath)?.async("text");
             if(layoutXml) {
                 const doc = parseXml(layoutXml);
                 const spTree = doc.getElementsByTagName("p:spTree")[0];
                 if(spTree) {
                     console.log("Hierarchy:");
                     
                     // Print spTree xfrm details explicitly
                     const grpSpPr = spTree.getElementsByTagName("p:grpSpPr")[0];
                     if(grpSpPr) {
                         const xfrm = grpSpPr.getElementsByTagName("a:xfrm")[0];
                         if(xfrm) {
                             const chOff = xfrm.getElementsByTagName("a:chOff")[0];
                             const chExt = xfrm.getElementsByTagName("a:chExt")[0];
                             console.log(`spTree XFRM: chOff=[${chOff?.getAttribute("x")},${chOff?.getAttribute("y")}] chExt=[${chExt?.getAttribute("cx")},${chExt?.getAttribute("cy")}]`);
                         }
                     }
                     
                     printHierarchy(spTree);
                 }
             }
        }

        // 8. Analyze Slide 3 (Comparison)
        console.log("\n--- ANALYZING SLIDE 3 (Comparison) ---");
        const slide3Path = "ppt/slides/slide3.xml";
        const slide3Xml = await zip.file(slide3Path)?.async("text");
        
        if (slide3Xml) {
             const slide3RelsPath = "ppt/slides/_rels/slide3.xml.rels";
             const slide3RelsXml = await zip.file(slide3RelsPath)?.async("text");
             console.log("Slide 3 Relationships:");
             let s3Layout = "";
             if (slide3RelsXml) {
                const relsDoc = parseXml(slide3RelsXml);
                const rels = Array.from(relsDoc.getElementsByTagName("Relationship"));
                rels.forEach(r => {
                    const id = r.getAttribute("Id");
                    const target = r.getAttribute("Target");
                    const type = r.getAttribute("Type");
                    console.log(`  [${id}] -> ${target} (${type})`);
                    if (type.includes("slideLayout")) s3Layout = target.split("/").pop();
                });
             }
             
             // Check Slide 3 Images
             const doc = parseXml(slide3Xml);
             const pics = Array.from(doc.getElementsByTagName("p:pic"));
             console.log(`Slide 3 contains ${pics.length} <p:pic> elements.`);
             
             if (s3Layout) {
                 console.log(`Slide 3 uses Layout: ${s3Layout}`);
                 // Check that layout
                 const lPath = `ppt/slideLayouts/${s3Layout}`;
                 const lXml = await zip.file(lPath)?.async("text");
                 if(lXml) {
                     const lDoc = parseXml(lXml);
                     const lPics = Array.from(lDoc.getElementsByTagName("p:pic"));
                     console.log(`  Layout ${s3Layout} contains ${lPics.length} <p:pic> elements.`);
                     
                     const spTree = lDoc.getElementsByTagName("p:spTree")[0];
                     console.log("\nHierarchy of " + s3Layout + ":");
                     // Print spTree xfrm details explicitly
                     const grpSpPr = spTree.getElementsByTagName("p:grpSpPr")[0];
                     if(grpSpPr) {
                         const xfrm = grpSpPr.getElementsByTagName("a:xfrm")[0];
                         if(xfrm) {
                             const chOff = xfrm.getElementsByTagName("a:chOff")[0];
                             const chExt = xfrm.getElementsByTagName("a:chExt")[0];
                             console.log(`spTree XFRM: chOff=[${chOff?.getAttribute("x")},${chOff?.getAttribute("y")}] chExt=[${chExt?.getAttribute("cx")},${chExt?.getAttribute("cy")}]`);
                         }
                     }
                     printHierarchy(spTree);
                 }
             }
        } else {
            console.log("Slide 3 not found.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
