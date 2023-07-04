import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFPageLeaf,
  PDFRef,
  PDFString
} from "@cantoo/pdf-lib";

export function getAllPageRefs(pdfDoc: PDFDocument) {
  const refs: PDFRef[] = [];
  pdfDoc.catalog.Pages().traverse((kid, ref) => {
    if (kid instanceof PDFPageLeaf) {
      refs.push(ref);
    }
  });
  return refs;
}

export function getNamedDestinations(doc: PDFDocument) {
  const names = doc.context.lookup(doc.catalog.get(PDFName.of("Names")), PDFDict);
  const dests = doc.context.lookup(names.get(PDFName.of("Dests")), PDFDict);
  const pageRefs = doc.getPages().map((p) => p.ref);
  function getAllKidsRec(e: PDFDict) {
    const destKids: PDFArray | undefined = e.get(PDFName.of("Kids")) as PDFArray | undefined;
    if (destKids !== undefined) {
      const ret: PDFDict[] = [];
      for (const d of destKids.asArray()) {
        const dest = doc.context.lookup(d, PDFDict);
        if (dest !== undefined) {
          if (dest.has(PDFName.of("Kids"))) {
            // Recursion
            const recKids = getAllKidsRec(dest);
            if (recKids) {
              ret.push(...recKids);
            }
          } else {
            ret.push(dest);
          }
        }
      }
      return ret;
    } else {
      return [];
    }
  }
  const res = getAllKidsRec(dests);
  const resNames = res.map((r) => r.get(PDFName.of("Names")) as PDFArray | undefined);
  const namedDestMap = new Map<string, { destEntry: PDFDict; pageIndex: number }>();
  for (const entries of resNames) {
    if (entries !== undefined) {
      for (let i = 0; i < entries.size(); i += 2) {
        const tmp = doc.context.lookup(entries.get(i + 1));
        if (tmp !== undefined && tmp instanceof PDFDict) {
          const destEntry = tmp;
          const pageIndex = pageRefs.indexOf(destEntry.lookup(PDFName.of("D"), PDFArray).asArray()[0] as PDFRef);
          namedDestMap.set(entries.get(i).toString(), { destEntry, pageIndex });
        }
      }
    }
  }
  return namedDestMap;
}

export function createOutlineItem(
  pdfDoc: PDFDocument,
  title: string,
  parent: PDFRef,
  nextOrPrev: PDFRef, // Prev only iff. isLast is true
  page: PDFRef,
  isLast = false,
  children: PDFRef[] = []
) {
  let array = PDFArray.withContext(pdfDoc.context);
  array.push(page);
  array.push(PDFName.of("XYZ"));
  array.push(PDFNull);
  array.push(PDFNull);
  array.push(PDFNull);
  const map = new Map();
  map.set(PDFName.Title, PDFString.of(title));
  map.set(PDFName.Parent, parent);
  map.set(PDFName.of(isLast ? "Prev" : "Next"), nextOrPrev);
  map.set(PDFName.of("Dest"), array);
  if (children.length > 0) {
    map.set(PDFName.of("First"), children[0]);
    map.set(PDFName.of("Last"), children[children.length - 1]);
    map.set(PDFName.of("Count"), PDFNumber.of(children.length));
  }
  return PDFDict.fromMapWithContext(map, pdfDoc.context);
}

function parseOutlineRecursive(doc: PDFDocument, firstEl: PDFDict) {
  let el: PDFDict | undefined = firstEl;
  const ret: ParsedOutlineItem[] = [];
  while (el !== undefined) {
    let title: string | undefined = undefined;
    if (el.has(PDFName.of("Title"))) {
      title = (el.lookup(PDFName.of("Title")) as PDFHexString | PDFString).decodeText();
    }
    let dest: PDFArray | undefined = undefined;
    if (el.has(PDFName.of("Dest"))) {
      dest = el.lookup(PDFName.of("Dest"), PDFArray);
    }
    let destA: PDFDict | undefined = undefined;
    if (el.has(PDFName.of("A"))) {
      destA = el.lookup(PDFName.of("A"), PDFDict);
    }
    let children: ParsedOutlineItem[] | undefined = undefined;
    if (el.has(PDFName.of("First"))) {
      const firstChild = el.lookup(PDFName.of("First"), PDFDict);
      children = parseOutlineRecursive(doc, firstChild);
    }

    ret.push({ title, dest, children, destA });
    let next: PDFDict | undefined = undefined;
    if (el.has(PDFName.of("Next"))) {
      next = el.lookup(PDFName.of("Next"), PDFDict);
    }
    el = next;
  }
  return ret;
}
export type ParsedOutlineItem = {
  title?: string;
  dest?: PDFArray;
  destA?: PDFDict;
  page?: number;
  children?: ParsedOutlineItem[];
};

export const MERGED_OUTLINE_MODES = { "retainOutlineAsOneEntry": "Retain outline entries as one entry per file", "retainOutlineEntries": "Retain outline entries", "oneEntryPerFile": "Create one outline entry per file", "none": "Don't create an outline" } as const;
export type MergedOutlineMode = keyof (typeof MERGED_OUTLINE_MODES);

export function parseOutline(
  doc: PDFDocument,
  title: string,
  startPage: number,
  mode: MergedOutlineMode
): ParsedOutlineItem[] {
  if (mode === "none") {
    return [];
  }
  if (mode === "oneEntryPerFile") {
    return [{ title: title, page: startPage }];
  }
  let namedDestsMap: Map<string, { destEntry: PDFDict; pageIndex: number }> = new Map();
  try {
    namedDestsMap = getNamedDestinations(doc);
  } catch (e) {
    console.log("No named destinations found. This is not necessarily an error!", e);
  }
  if (!doc.catalog.has(PDFName.of("Outlines"))) {
    if (mode === "retainOutlineEntries") {
      return [];
    }
    if (mode === "retainOutlineAsOneEntry") {
      return [{ title: title, page: startPage }];
    }
  }

  const outlineEl = doc.catalog.lookup(PDFName.of("Outlines"), PDFDict);
  const outline = parseOutlineRecursive(doc, outlineEl.lookup(PDFName.of("First"), PDFDict));
  const pageRefs = doc.getPages().map((p) => p.ref);
  const processedOutline = addPageNumbers(outline, startPage, pageRefs, namedDestsMap);
  if (mode === "retainOutlineEntries") {
    return processedOutline;
  }
  if (mode === "retainOutlineAsOneEntry") {
    return [{ title: title, page: startPage, children: processedOutline }];
  }
  return [];
}

function addPageNumbers(
  outline: ParsedOutlineItem[],
  startPage: number,
  pageRefs: PDFRef[],
  namedDestsMap: Map<string, { destEntry: PDFDict; pageIndex: number }>
): ParsedOutlineItem[] {
  return outline.map((outEl) => ({
    ...outEl,
    page: determinePage(outEl, pageRefs, namedDestsMap) + startPage,
    children: outEl.children ? addPageNumbers(outEl.children, startPage, pageRefs, namedDestsMap) : undefined,
  }));
}

function determinePage(
  outEl: ParsedOutlineItem,
  pageRefs: PDFRef[],
  namedDestsMap: Map<string, { destEntry: PDFDict; pageIndex: number }>
): number {
  if (outEl.page !== undefined) {
    return outEl.page;
  } else {
    if (outEl.dest) {
      const pageRef = outEl.dest.get(0) as PDFRef;
      const pageIndex = pageRefs.indexOf(pageRef);
      if (pageIndex >= 0) {
        return pageIndex;
      } else {
        console.error("Could not determine page from dest");
        return -1;
      }
    }
    if (outEl.destA) {
      if (outEl.destA.lookup(PDFName.of("S"), PDFName) === PDFName.of("GoTo")) {
        const d = outEl.destA.lookup(PDFName.of("D"), PDFString).asString();
        if (namedDestsMap.has(d)) {
          return namedDestsMap.get(d)!.pageIndex;
        }
        if (namedDestsMap.has(`(${d})`)) {
          return namedDestsMap.get(`(${d})`)!.pageIndex;
        }
        console.error("Outline item destination not found in destiantion map", d);
        return -1;
      } else {
        console.error("Unknown outline item action (Not GoTo)");
        return -1;
      }
    }
    return -1;
  }
}

export function writeOutlineToDoc(doc: PDFDocument, outline: ParsedOutlineItem[], parentRef: PDFRef | undefined = undefined) {
  const pageRefs = getAllPageRefs(doc);
  let parent: PDFRef | undefined = parentRef;
  if (parent === undefined) {
    parent = doc.context.nextRef();
  }

  const outlineItemRefs: PDFRef[] = outline.map(() => doc.context.nextRef());
  const outlineItems: PDFDict[] = [];
  for (let i = 0; i < outline.length; i++) {
    if (outline[i].page === undefined || outline[i].page! < 0) {
      console.error("No page associated with item. Skipping!", outline[i].title);
      continue;
    }
    let childRefs: PDFRef[] = [];
    if (outline[i].children !== undefined) {
      childRefs = writeOutlineToDoc(doc, outline[i].children!, outlineItemRefs[i]);
    }
    const isLast = i == outline.length - 1;
    let nextOrPrev: PDFRef;
    if (outline.length === 1) {
      // Only me, myself, and I
      nextOrPrev = outlineItemRefs[0];
    } else {
      nextOrPrev = isLast ? outlineItemRefs[i - 1] : outlineItemRefs[i + 1]
    }
    const outlineItem = createOutlineItem(
      doc,
      outline[i].title || "-",
      parent,
      nextOrPrev, //prev or next (prev only if this is the last one)
      pageRefs[outline[i].page!],
      isLast,
      childRefs
    );
    outlineItems.push(outlineItem);
  }
  if (parentRef === undefined) {
    // This means, that we are at root level: Create Outline Entry
    const outlinesDictMap = new Map();
    outlinesDictMap.set(PDFName.Type, PDFName.of("Outlines"));
    outlinesDictMap.set(PDFName.of("First"), outlineItemRefs[0]);
    outlinesDictMap.set(PDFName.of("Last"), outlineItemRefs[outlineItemRefs.length - 1]);
    outlinesDictMap.set(PDFName.of("Count"), PDFNumber.of(outlineItemRefs.length));
    doc.catalog.set(PDFName.of("Outlines"), parent);
    const outlineDict = PDFDict.fromMapWithContext(outlinesDictMap, doc.context);
    doc.context.assign(parent, outlineDict);
  }

  // Actual outline items that will be displayed
  for (let i = 0; i < outlineItems.length; i++) {
    doc.context.assign(outlineItemRefs[i], outlineItems[i]);
  }

  return outlineItemRefs;
}
