import { useEffect, useState } from "react";
import { PDFDocumentProxy, getDocument } from "pdfjs-dist";
import { TextContent } from "pdfjs-dist/types/src/display/api";
import CopyToClipboardButton from "./CopyToClipboardButton";
import Button from "./button";
interface TextContentTextareaProps {
  label: string;
  text: string;
  highlighted?: boolean;
}
function TextContentTextarea(props: TextContentTextareaProps) {
  return (
    <div
      className={`w-full bg-slate-50 dark:bg-slate-700 px-2 pt-1 pb-4 text-black dark:text-white rounded-md shadow flex flex-col  ${
        props.highlighted
          ? "border-2 dark:border-blue-700 border-blue-400 min-h-[15rem]"
          : "border dark:border-blue-900 min-h-[12rem]"
      }`}
    >
      <div className="flex justify-between">
        <h4 className="text-blue-700 dark:text-blue-400 text-lg font-medium my-1">{props.label}</h4>
        <CopyToClipboardButton type="text" title={`Copy text`} copy={props.text} />
      </div>
      <textarea
        className="w-full h-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-md p-1.5 whitespace-pre-wrap"
        readOnly
        value={props.text}
      ></textarea>
    </div>
  );
}
export default function ExtractText() {
  const [file, setFile] = useState<File>();
  const [pdfDoc, setPDFDoc] = useState<PDFDocumentProxy>();
  const [textContentPerPages, setTextContentPerPages] = useState<string[]>();
  const [isLoading, setIsLoading] = useState(false);

  function convertTextContent(textContent: TextContent): string {
    let ret = "";
    for (const t of textContent.items) {
      if ("str" in t) {
        ret += t.str + " ";
      }
    }
    return ret;
  }
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      getDocument(url).promise.then(async (doc) => {
        setPDFDoc(doc);
        setTextContentPerPages(undefined);
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
        className="2xl:p-12 max-w-full p-5 my-4 rounded-lg border border-blue-700 bg-blue-50 dark:bg-slate-800 dark:border-slate-700 border-dashed block mx-auto"
        type="file"
      />
      <div className="w-full flex justify-end mb-2">
        <Button
          isLoading={isLoading}
          disabled={!pdfDoc}
          onClick={async (ev) => {
            setIsLoading(true);
            try {
              const allPageIndices = [...Array(pdfDoc!.numPages).keys()];
              const res = await Promise.allSettled(
                allPageIndices.map(async (pIndex) => {
                  const page = await pdfDoc!.getPage(pIndex + 1);
                  const textOnPage = await page.getTextContent();
                  return convertTextContent(textOnPage);
                })
              );
              setTextContentPerPages(res.map((r) => (r.status === "fulfilled" ? r.value : "Error")));
              setIsLoading(false);
            } catch (e) {
              console.error(e);
              setIsLoading(false);
            }
          }}
        >
          Extract Text
        </Button>
      </div>
      {textContentPerPages !== undefined && (
        <>
          <div className="w-fit mx-auto text-center my-2">
            <h3 className="text-2xl font-semibold text-blue-500 dark:text-blue-400">Extract PDF Text</h3>
            <details className=" text-gray-700 dark:text-gray-300 px-2 p-1 rounded-md border bg-slate-50 dark:bg-slate-800 dark:border-slate-600">
              <summary className="cursor-pointer">Options & Instructions</summary>
              <p className="mx-auto mb-2 text-sm">
                Below the text contents of all pages are displayed and can be copied using the button on the right.
              </p>
            </details>
          </div>
          <div className="flex">
            <TextContentTextarea text={textContentPerPages.join("/n")} label="All pages" highlighted={true} />
          </div>
          <h3 className="text-lg mt-4 mb-1 font-medium">Text per Page</h3>
          <div className="w-full flex flex-wrap gap-4">
            {textContentPerPages.map((t, i) => (
              <TextContentTextarea text={t} label={`Page ${i + 1}`} key={i} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
