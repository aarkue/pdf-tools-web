import {
  MERGED_OUTLINE_MODES,
  MergedOutlineMode,
  ParsedOutlineItem,
  getNamedDestinations,
  parseOutline,
  writeOutlineToDoc,
} from "@/lib/pdf-outline-helper";
import { PDFDocument, PDFArray, PDFName, PDFDict } from "@cantoo/pdf-lib";
import { useState, useRef } from "react";
import { BsSortAlphaDown, BsSortAlphaUp, BsTrash } from "react-icons/bs";
import { ReactSortable } from "react-sortablejs";
import Button from "./button";
import { downloadFile } from "@/helper/download-file";

export default function Merge() {
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const mergeModeSelectRef = useRef<HTMLSelectElement>(null);

  async function merge() {
    const mergedPdf = await PDFDocument.create();
    const combindedOutline: ParsedOutlineItem[] = [];
    const namedDests = [];
    let p = null;
    for (let i = 0; i < files.length; i++) {
      const pdf = await PDFDocument.load(await files[i].file.arrayBuffer());
      try {
        const namedDest = getNamedDestinations(pdf);
        namedDests.push(namedDest);
      } catch (e) {
        console.error(e);
      }
      const o = parseOutline(
        pdf,
        pdf.getTitle() || files[i].file.name,
        mergedPdf.getPageCount(),
        mergeModeSelectRef.current!.value as MergedOutlineMode
      );
      combindedOutline.push(...o);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      for (const page of pages) {
        mergedPdf.addPage(page);
        p = page.ref;
      }
    }

    if (combindedOutline.length > 0) {
      writeOutlineToDoc(mergedPdf, combindedOutline);
    }
    console.log({ namedDests });

    const namedDestMap = new Map();
    const namedDestMapDest = new Map();
    let array = PDFArray.withContext(mergedPdf.context);
    for (const namedDest of namedDests) {
      for (const entry of namedDest) {
        const clonedEntry = entry[1].destEntry.clone(mergedPdf.context);
        const pageRed = clonedEntry.lookup(PDFName.of("D"), PDFArray);
        pageRed.set(0, p!);
        clonedEntry.set(PDFName.of("D"), pageRed);
        array.push(clonedEntry);
      }
    }
    console.log(array);
    namedDestMapDest.set(PDFName.of("Kids"), array);
    const namedDestMapDestPDF = PDFDict.fromMapWithContext(namedDestMapDest, mergedPdf.context);
    namedDestMap.set(PDFName.of("Dests"), namedDestMapDestPDF);
    const namedDestPDFMap = PDFDict.fromMapWithContext(namedDestMap, mergedPdf.context);
    mergedPdf.catalog.set(PDFName.of("Names"), namedDestPDFMap);

    const names = mergedPdf.context.lookup(mergedPdf.catalog.get(PDFName.of("Names")), PDFDict);
    const dests = mergedPdf.context.lookup(names.get(PDFName.of("Dests")), PDFDict);
    const pageRefs = mergedPdf.getPages().map((p) => p.ref);
    console.log({ dests });

    const mergedPdfFile = await mergedPdf.save();
    downloadFile(await new Response(mergedPdfFile).blob(), "merged.pdf");
  }

  return (
    <>
      <input
        aria-label="Add files"
        accept="application/pdf"
        onChange={(e) => {
          if (!e.currentTarget.files) return;
          const addedFiles: File[] = [];
          for (let i = 0; i < e.currentTarget.files.length; i++) {
            addedFiles.push(e.currentTarget.files.item(i)!);
          }
          setFiles([...files, ...addedFiles.map((f) => ({ id: f.name.toLowerCase() + Date.now(), file: f }))]);
          e.currentTarget.value = "";
        }}
        className="2xl:p-12 max-w-full p-5 my-4 rounded-lg border border-blue-700 bg-blue-50 dark:bg-slate-800 dark:border-slate-700 border-dashed block mx-auto"
        // ref={fileInputRef}
        type="file"
        multiple
      />
      <div className="border dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-800">
        <h2 className="font-bold">Added Files</h2>
        <span className="text-sm block mt-0">Drag to reorder</span>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={(e) => setFiles([])} disabled={files.length === 0}>
            Clear All
          </Button>
          <div>
            <Button
              title="Sort files by name (descending)"
              variant="ghost"
              onClick={(e) => {
                setFiles((files) => {
                  files.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
                  return [...files];
                });
              }}
            >
              <BsSortAlphaDown className="w-5 h-5" />
            </Button>
            <Button
              title="Sort files by name (descending)"
              variant="ghost"
              onClick={(e) => {
                setFiles((files) => {
                  files.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
                  return [...files];
                });
              }}
            >
              <BsSortAlphaUp className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <ReactSortable
          tag="ol"
          className="h-full overflow-auto scrollbar-gutter-stable"
          list={files}
          setList={(s) => {
            setFiles(s);
          }}
        >
          {files.map((e, i) => (
            <li
              key={e.id}
              className="cursor-pointer flex justify-between bg-white dark:bg-slate-800 m-1 pl-3 p-1 rounded-lg border dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <span>
                <span className="text-gray-400 mr-2">{i + 1}.</span>
                {e.file.name}
              </span>
              <button
                title="Remove PDF from list"
                className="p-1 text-red-700 dark:text-red-500 hover:bg-red-200 hover:text-red-800 dark:hover:bg-red-900 dark:hover:text-red-400 rounded-md"
                onClick={(ev) => {
                  const newFiles = [...files];
                  newFiles.splice(i, 1);
                  setFiles(newFiles);
                }}
              >
                <BsTrash />
              </button>
            </li>
          ))}
        </ReactSortable>
      </div>
      <div className="border dark:border-slate-700 rounded-md p-2 bg-white dark:bg-slate-800 mt-2">
        <h2 className="font-bold">Merge Options</h2>
        <div className="text-lg flex items-baseline xl:gap-2 xl:flex-row flex-col">
          Outline Mode:
          <select
            ref={mergeModeSelectRef}
            className=" dark:bg-slate-800 p-1 rounded-md xl:text-lg text-sm border-2 border-blue-400 bg-blue-50 dark:border-blue-800"
          >
            {(Object.keys(MERGED_OUTLINE_MODES) as MergedOutlineMode[]).map((l) => (
              <option key={l} value={l}>
                {MERGED_OUTLINE_MODES[l]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <br />
      <div className="w-full flex justify-end">
        <Button disabled={files.length < 1} size="lg" className="mt-1 bg-white dark:bg-slate-800" onClick={merge}>
          Merge
        </Button>
      </div>
    </>
  );
}
