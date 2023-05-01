"use client";
import Button from "./button";
import {
  MERGED_OUTLINE_MODES,
  MergedOutlineMode,
  ParsedOutlineItem,
  parseOutline,
  writeOutlineToDoc,
} from "../lib/pdf-outline-helper";
import { PDFDocument } from "@cantoo/pdf-lib";
import { useRef, useState } from "react";
import { BsHeart, BsHeartFill, BsSortAlphaDown, BsSortAlphaUp } from "react-icons/bs";
import { TbPdf } from "react-icons/tb";
import { ReactSortable } from "react-sortablejs";
import SmallAbout from "./small-about";
const MERGE_OP = "Merge";
const SPLIT_OP = "Split";
const EXTRACT_TEXT_OP = "Extract Text";
const ALL_OPERATION_OPTIONS = [MERGE_OP /*SPLIT_OP, EXTRACT_TEXT_OP*/] as const;
type OperationMode = (typeof ALL_OPERATION_OPTIONS)[number];

export default function PDFMagic() {
  const [operationMode, setOperationMode] = useState<OperationMode>(MERGE_OP);
  const [files, setFiles] = useState<{ id: string; file: File }[]>([]);
  const mergeModeSelectRef = useRef<HTMLSelectElement>(null);
  return (
    <>
      <h1 className="text-3xl mb-1">PDF Tools</h1>
      <h2 className="text-xl leading-tight tracking-tight mb-4">Merge{" "}
      {/* , Split or Process */}
      PDFs</h2>
      <div className="mb-5">
        <span className="text-xl">Mode: </span>
        <select
          className=" dark:bg-slate-800 p-1 rounded-md text-xl border-2 border-blue-400 bg-blue-50 dark:border-blue-800"
          onChange={(e) => setOperationMode(e.currentTarget.value as OperationMode)}
          value={operationMode}
        >
          {ALL_OPERATION_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {operationMode === MERGE_OP && (
        <>
          <input aria-label="Add files"
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
            className="2xl:p-12 p-5 my-4 rounded-lg border border-blue-700 bg-blue-50 dark:bg-slate-800 dark:border-slate-700 border-dashed block mx-auto"
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
                  className="cursor-pointer bg-white dark:bg-slate-800 m-1 pl-3 p-1 rounded-lg border dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <span className="text-gray-400 mr-2">{i + 1}.</span>
                  {e.file.name}
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
          <Button
            size="lg"
            className="mt-1 bg-white dark:bg-slate-800"
            onClick={async (ev) => {
              const mergedPdf = await PDFDocument.create();
              const combindedOutline: ParsedOutlineItem[] = [];
              for (let i = 0; i < files.length; i++) {
                const pdf = await PDFDocument.load(await files[i].file.arrayBuffer());
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
                }
              }

              if (combindedOutline.length > 0) {
                writeOutlineToDoc(mergedPdf, combindedOutline);
              }

              const mergedPdfFile = await mergedPdf.save();
              const url = URL.createObjectURL(await new Response(mergedPdfFile).blob());

              const a = document.createElement("a");
              a.href = url;
              a.download = "merged.pdf";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            Merge
          </Button>
            <SmallAbout/>
        </>
      )}
    </>
  );
}
