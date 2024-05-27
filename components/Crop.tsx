import { useCallback, useState } from "react";
import Button from "./button";
import { PDFArray, PDFContentStream, PDFDict, PDFDocument, PDFName, PDFStream } from "@cantoo/pdf-lib";
import { downloadFile } from "@/helper/download-file";
import { PDFDocumentProxy, PDFPageProxy, getDocument } from "pdfjs-dist";
import MiniPDFPage from "./MiniPDFPage";
import { debounce } from "lodash";
const DEFAULT_SCALE = 0.4;
export default function Crop() {
  const [file, setFile] = useState<File>();
  const [pdfDoc, setPDFDoc] = useState<PDFDocument>();
  const [pdfJSDoc, setPDFJSDoc] = useState<PDFDocumentProxy>();
  const [isLoading, setIsLoading] = useState(false);
  const [keepMargins, setKeepMargins] = useState<[number, number, number, number]>([4, 4, 4, 4]);
  const [marginsPerPage, setMarginsPerPage] = useState<{ left: number; right: number; top: number; bottom: number }[]>(
    []
  );
  const SIDE_LABELS = ["Left", "Right", "Top", "Bottom"] as const;
  const [scale, setScale] = useState(DEFAULT_SCALE);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scaleHandler = useCallback(
    debounce((newScale: number) => {
      setScale(newScale);
    }, 200),
    []
  );

  const callbackWithCanvas = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, page: PDFPageProxy, pageIndex: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const pixelData = imgData.data;

      const colorMap: Map<string, number> = new Map();
      // Reduce step size for _very_ large images
      const stepSize = Math.min(Math.max(Math.floor(((w * h) / 250_000)), 1), 10);
      const stepSizeSquared = stepSize * stepSize;
      console.log("Step Size: " + stepSize, "Width*Height:" + w * h);
      for (let i = 0, n = pixelData.length; i < n; i += stepSizeSquared * 4) {
        const s = `${pixelData[i]}-${pixelData[i + 1]}-${pixelData[i + 2]}`;
        colorMap.set(s, (colorMap.get(s) ?? 0) + 1);
      }
      const colorEntries = [...colorMap.entries()];
      colorEntries.sort((a, b) => (a[1] > b[1] ? -1 : 1));
      // Assume bgColor is the most common one
      const bgColor = [colorEntries[0]].map((c) => c[0]);
      let x1 = w;
      let y1 = h;
      let x2 = 0;
      let y2 = 0;
      for (let y = 0; y < h; y += stepSize) {
        for (let x = 0; x < w; x += stepSize) {
          const i = (y * w + x) * 4;
          const r = pixelData[i],
            g = pixelData[i + 1],
            b = pixelData[i + 2];
          const s = `${r}-${g}-${b}`;
          if (!bgColor.includes(s)) {
            x1 = Math.min(x, x1);
            y1 = Math.min(y, y1);
            x2 = Math.max(x, x2);
            y2 = Math.max(y, y2);
          }
        }
      }
      const left = x1 / w;
      const right = (w - x2) / w;
      const top = y1 / h;
      const bottom = (h - y2) / h;
      setMarginsPerPage((mpp) => {
        const newMpp = [...mpp];
        newMpp[pageIndex] = { left, right, top, bottom };
        return newMpp;
      });
    },
    []
  );
  return (
    <>
      <input
        aria-label="Add files"
        accept="application/pdf"
        onChange={async (e) => {
          if (!e.currentTarget.files) return;
          if (e.currentTarget.files.length > 0) {
            const file = e.currentTarget.files.item(0)!;
            setFile(file);
            if (file) {
              const b = await file.arrayBuffer();
              const pdf = await PDFDocument.load(b);
              const pdfJSDoc = await getDocument(b).promise;
              setPDFDoc(pdf);
              setPDFJSDoc(pdfJSDoc);
              setMarginsPerPage(pdf.getPageIndices().map((i) => ({ left: 0, right: 0, bottom: 0, top: 0 })));
            }
          }
        }}
        className="2xl:p-12 max-w-full p-5 my-4 rounded-lg border border-blue-700 bg-blue-50 dark:bg-slate-800 dark:border-slate-700 border-dashed block mx-auto"
        type="file"
      />
      <div className="w-full flex flex-col justify-center items-center mb-2 gap-y-2">
        <p className="text-lg">Keep Margins</p>
        <div className="flex flex-col gap-y-1">
          {keepMargins.map((m, i) => (
            <label className="grid grid-cols-[4rem,4rem] gap-x-2" key={i}>
              {SIDE_LABELS[i]}:
              <input
                type="number"
                className="w-full dark:bg-slate-800"
                defaultValue={keepMargins[i]}
                onChange={(ev) => {
                  const val = ev.currentTarget.valueAsNumber;
                  setKeepMargins((ms) => {
                    const newMs = [...ms];
                    if (isFinite(val)) {
                      newMs[i] = val;
                    }
                    return newMs as [number, number, number, number];
                  });
                }}
              />
            </label>
          ))}
        </div>
        <Button
          size="lg"
          className="mt-2"
          disabled={!pdfDoc}
          onClick={async (ev) => {
            if (!pdfDoc) {
              return;
            }
            setIsLoading(true);
            try {
              const resDoc = await pdfDoc.copy();
              const allPages = resDoc.getPages();
              await Promise.allSettled(
                allPages.map(async (page, i) => {
                  const { width, height } = page.getSize();
                  const left = width * -marginsPerPage[i].left + (1 / scale) * keepMargins[0];
                  const right = width * -marginsPerPage[i].right + (1 / scale) * keepMargins[1];
                  const top = height * -marginsPerPage[i].top + (1 / scale) * keepMargins[2];
                  const bottom = height * -marginsPerPage[i].bottom + (1 / scale) * keepMargins[3];
                  const newWidth = page.getWidth() + left + right;
                  const newHeight = page.getHeight() + top + bottom;
                  page.setSize(newWidth, newHeight);
                  page.translateContent(left, bottom);
                })
              );
              const mergedPdfFile = await resDoc.save();
              downloadFile(await new Response(mergedPdfFile).blob(), "cropped.pdf");
              setIsLoading(false);
            } catch (e) {
              console.error(e);
              setIsLoading(false);
            }
          }}
        >
          Crop & Download
        </Button>
        <h3 className="text-xl mt-4 font-semibold">Preview</h3>
        {pdfJSDoc === undefined && <p>Please first select a PDF above.</p>}
        {pdfJSDoc !== undefined && (
          <label className="flex flex-col w-fit text-center gap-x-2 mx-auto text-lg text-gray-700 dark:text-gray-300 ">
            Preview Scale
            <input
              type="range"
              defaultValue={DEFAULT_SCALE}
              step={0.01}
              max={2}
              min={0.05}
              onChange={(ev) => {
                scaleHandler(ev.currentTarget.valueAsNumber);
              }}
            />
          </label>
        )}
        <ul className="flex flex-wrap gap-2 justify-center">
          {pdfJSDoc !== undefined &&
            marginsPerPage.map((m, i) => (
              <li key={i}>
                <MiniPDFPage
                  doc={pdfJSDoc}
                  pageIndex={i}
                  scale={scale}
                  crop={m}
                  keepCropMargin={{
                    left: keepMargins[0],
                    right: keepMargins[1],
                    top: keepMargins[2],
                    bottom: keepMargins[3],
                  }}
                  callbackWithCanvas={callbackWithCanvas}
                />
              </li>
            ))}
        </ul>
      </div>
    </>
  );
}
