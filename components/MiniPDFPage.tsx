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
      const scale = props.scale;
      const viewport = page.getViewport({ scale });
      var context = canvasRef.current!.getContext("2d")!;
      canvasRef.current!.height = viewport.height;
      canvasRef.current!.width = viewport.width;
      renderTask = page.render({ canvasContext: context, viewport: viewport });
    });
    return () => {
      if(renderTask){
        renderTask.cancel();
      }
    }
  }, [props.doc, props.pageIndex, props.scale]);

  return (
    <div className="relative">
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-700 bg-white/80 rounded-md block px-2 py-1 border z-10 font-medium">
        Page {props.pageIndex + 1}
      </span>
      <canvas className="border " ref={canvasRef}></canvas>
    </div>
  );
}
