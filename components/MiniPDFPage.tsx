import { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef } from "react";

interface MiniPDFPageProps {
  doc: PDFDocumentProxy;
  pageIndex: number;
  scale: number,
}
export default function MiniPDFPage(props: MiniPDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let renderTask :  RenderTask|undefined;
    props.doc.getPage(props.pageIndex + 1).then(function getPageHelloWorld(page) {
      const scaleFactor = 1.0 * (window.devicePixelRatio || 1);
      const scale =  scaleFactor*props.scale;
      const viewport = page.getViewport({ scale });
      const context = canvasRef.current!.getContext("2d")!;
      context.scale(1/scaleFactor,1/scaleFactor);
      canvasRef.current!.height = viewport.height;
      canvasRef.current!.width = viewport.width;
      renderTask = page.render({ canvasContext: context, viewport: viewport });
      canvasRef.current!.style.height = `${viewport.height/scaleFactor}px`;
      canvasRef.current!.style.width = `${viewport.width/scaleFactor}px`;
    });
    return () => {
      if(renderTask){
        renderTask.cancel();
      }
    }
  }, [props.doc, props.pageIndex, props.scale]);

  return (
    <div className="relative">
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-700 bg-white/80 rounded-md block px-1 py-0.5 xlpx-2 xl:py-1 border z-10 text-xs xl:text-base">
        Page {props.pageIndex + 1}
      </span>
      <canvas className="border " ref={canvasRef}></canvas>
    </div>
  );
}
