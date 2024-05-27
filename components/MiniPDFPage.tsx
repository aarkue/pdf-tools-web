import { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef } from "react";

interface MiniPDFPageProps {
  doc: PDFDocumentProxy;
  pageIndex: number;
  scale: number;
  crop?: { left: number; right: number; top: number; bottom: number };
  callbackWithCanvas?: (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    page: PDFPageProxy,
    pageIndex: number
  ) => unknown;
  keepCropMargin?: { left: number; right: number; top: number; bottom: number };
}
export default function MiniPDFPage(props: MiniPDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let renderTask: RenderTask | undefined;
    props.doc.getPage(props.pageIndex + 1).then(function getPageHelloWorld(page) {
      const scaleFactor = 1.0 * (window.devicePixelRatio || 1);
      const scale = scaleFactor * props.scale;
      const viewport = page.getViewport({ scale });
      const context = canvasRef.current!.getContext("2d")!;
      context.scale(1 / scaleFactor, 1 / scaleFactor);
      canvasRef.current!.height = viewport.height;
      canvasRef.current!.width = viewport.width;
      renderTask = page.render({ canvasContext: context, viewport: viewport });
      canvasRef.current!.style.height = `${viewport.height / scaleFactor}px`;
      canvasRef.current!.style.width = `${viewport.width / scaleFactor}px`;
      renderTask.promise.then(() => {
        if (props.callbackWithCanvas) {
          setTimeout(() => {
            props.callbackWithCanvas!(canvasRef.current!, context, page, props.pageIndex);
          }, 100);
        }
      });
    });
    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [props.doc, props.pageIndex, props.scale, props.callbackWithCanvas]);

  return (
    <div className="relative">
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-700 bg-white/80 rounded-md block px-1 py-0.5 xlpx-2 xl:py-1 border z-10 text-xs xl:text-base">
        Page {props.pageIndex + 1}
      </span>
      {props.crop && (
        <div className="w-full h-full absolute flex">
          {/* Left */}
          <div
            className="bg-slate-300/60 dark:bg-slate-900/80 shrink-0"
            style={{
              width: `calc(${Math.round(100 * 100 * props.crop.left) / 100}% - ${props.keepCropMargin?.left ?? 0}px)`,
            }}
          ></div>
          {/* Center */}
          <div className="w-full h-full flex flex-col">
            {/* Top */}
            <div className=" bg-slate-300/60 dark:bg-slate-900/80 shrink-0" style={{
              height: `calc(${Math.round(100 * 100 * props.crop.top) / 100}% - ${props.keepCropMargin?.top ?? 0}px)`,}}></div>
            {/* Middle */}
            <div className="h-full border border-slate-600"></div>
            {/* Bottom */}
            <div className="bg-slate-300/60 dark:bg-slate-900/80 shrink-0" style={{
              height: `calc(${Math.round(100 * 100 * props.crop.bottom) / 100}% - ${props.keepCropMargin?.bottom ?? 0}px)`,}}></div>
          </div>
          {/* Right */}
          <div className="bg-slate-300/60 dark:bg-slate-900/80 shrink-0" style={{
              width: `calc(${Math.round(100 * 100 * props.crop.right) / 100}% - ${props.keepCropMargin?.right ?? 0}px)`,}}></div>
        </div>
      )}
      <canvas className="border " ref={canvasRef}></canvas>
    </div>
  );
}
