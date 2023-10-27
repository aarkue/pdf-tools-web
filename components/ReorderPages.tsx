import { useCallback, useEffect, useState } from "react";
import { PDFDocumentProxy, getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import MiniPDFPage from "./MiniPDFPage";
import { ReactSortable } from "react-sortablejs";
import Button from "./button";
import { PDFDocument } from "@cantoo/pdf-lib";
import { downloadFile } from "@/helper/download-file";
import { debounce } from "lodash";
const DEFAULT_SCALE = 0.4;
export default function ReorderPages() {
  const [file, setFile] = useState<File>();
  const [pdfDoc, setPDFDoc] = useState<PDFDocumentProxy>();
  const [pageOrder, setPageOrder] = useState<{ id: number }[]>([]);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const scaleHandler = useCallback(
    debounce((newScale: number) => {
      setScale(newScale);
    }, 200),
    []
  );

  async function downloadReorderedPDF() {
    const resPDF = await PDFDocument.load(await file!.arrayBuffer());
    const allPages = resPDF.getPages();
    for (const pageIndex of resPDF.getPageIndices()) {
      resPDF.removePage(pageIndex);
      resPDF.insertPage(pageIndex, allPages[pageOrder[pageIndex].id]);
    }

    const resPDFSaved = await resPDF.save();
    downloadFile(await new Response(resPDFSaved).blob(), "reordered.pdf");
  }

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      getDocument(url).promise.then((doc) => {
        setPDFDoc(doc);
        setPageOrder([...Array(doc.numPages).keys()].map((i) => ({ id: i })));
      });
    }
  }, [file]);

  return (
    <>
      <input
        aria-label="Add files"
        accept="application/pdf"
        onChange={(e) => {
          if (!e.currentTarget.files) return;
          if (e.currentTarget.files.length > 0) {
            setFile(e.currentTarget.files.item(0)!);
          }
        }}
        className="2xl:p-12 p-5 my-4 rounded-lg border border-blue-700 bg-blue-50 dark:bg-slate-800 dark:border-slate-700 border-dashed block mx-auto"
        type="file"
      />
      {pdfDoc && (
        <>
          <div className="w-full flex justify-end mb-2">
            <Button size="lg" className="mt-1 bg-white dark:bg-slate-800" onClick={downloadReorderedPDF}>
              Download Result
            </Button>
          </div>
          <div className="w-fit mx-auto text-center">
            <h3 className="text-2xl font-semibold text-blue-500">Reorder Pages</h3>
            <details className="text-sm text-gray-700 dark:text-gray-300">
              <summary>Instructions</summary>
              <p className="mx-auto mb-2">
                Drag to reorder the pages of the PDF below.
                <br />
                Finally, download the processed PDF using the <i>Download Result</i> button.
              </p>
            </details>
            <label className="flex flex-col w-fit text-center gap-x-2 mx-auto text-lg text-gray-700 dark:text-gray-300 ">
              Preview Scale
              <input
                type="range"
                defaultValue={DEFAULT_SCALE}
                step={0.01}
                max={2}
                min={0.01}
                onChange={(ev) => {
                  scaleHandler(ev.currentTarget.valueAsNumber);
                }}
              />
            </label>
          </div>
          <ReactSortable
            tag="ol"
            className="h-full flex flex-wrap justify-center items-center"
            list={pageOrder}
            setList={(s) => {
              setPageOrder(s);
            }}
          >
            {pageOrder.map((p, i) => (
              <li
                onContextMenu={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  const newIndexPrompt = prompt("Move to page");
                  let newIndex = i;
                  try {
                    const newIndexParsed = parseInt(newIndexPrompt!);
                    if (newIndexParsed >= 1 && newIndexParsed <= pdfDoc.numPages) {
                      newIndex = newIndexParsed - 1;
                    }
                  } catch (e) {
                    console.error(e);
                  }
                  const newPageOrder = [...pageOrder];
                  newPageOrder.splice(i, 1);
                  newPageOrder.splice(newIndex, 0, p);
                  setPageOrder(newPageOrder);
                }}
                key={p.id}
                className="cursor-pointer relative h-fit bg-white dark:bg-slate-800 m-1 rounded-lg border dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900 group"
              >
                <MiniPDFPage key={i} doc={pdfDoc} pageIndex={p.id} scale={scale} />

                <span className="absolute top-2 left-4 text-gray-700 bg-white/80 rounded-md block px-2 py-1 border z-10 font-medium">
                  {"#"}
                  {i + 1}
                </span>
                <div className="absolute top-0 left-0 w-full h-full bg-green-400/0 group-hover:bg-blue-400/30 outline outline-2 outline-transparent group-hover:outline-blue-400 dark:group-hover:outline-blue-500">
                  {" "}
                </div>
              </li>
            ))}
          </ReactSortable>
          <div className="w-full flex justify-end mb-2">
            <Button size="lg" className="mt-1 bg-white dark:bg-slate-800" onClick={downloadReorderedPDF}>
              Download Result
            </Button>
          </div>
        </>
      )}
    </>
  );
}