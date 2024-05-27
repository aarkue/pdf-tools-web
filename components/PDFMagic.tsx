"use client";
import { useEffect, useRef, useState } from "react";
import Merge from "./Merge";
import SmallAbout from "./small-about";
import ReorderPages from "./ReorderPages";
import ExtractText from "./ExtractText";
import Crop from "./Crop";
const MERGE_OP = "Merge";
const SPLIT_OP = "Split";
const REORDER_OP = "Reorder or Remove Pages";
const EXTRACT_TEXT_OP = "Extract Text";
const CROP_OP = "Auto-Crop"
const ALL_OPERATION_OPTIONS = [MERGE_OP, REORDER_OP, EXTRACT_TEXT_OP, /*,SPLIT_OP*/, CROP_OP] as const;
type OperationMode = (typeof ALL_OPERATION_OPTIONS)[number];

export default function PDFMagic() {
  const [operationMode, setOperationMode] = useState<OperationMode>(MERGE_OP);
  const selectRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if(selectRef.current){
      setOperationMode(selectRef.current.value as OperationMode);
    }
  },[])
  return (
    <>
      <h1 className="text-3xl mb-1">PDF Tools</h1>
      <h2 className="text-xl leading-tight tracking-tight mb-4">
        Merge, Reorder, Crop, or Process
        PDFs
      </h2>
      <div className="mb-5">
        <span className="text-xl">Mode: </span>
        <select ref={selectRef}
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
      {operationMode === MERGE_OP && <Merge />}
      {operationMode === REORDER_OP && <ReorderPages />}
      {operationMode === EXTRACT_TEXT_OP && <ExtractText />}
      {operationMode === CROP_OP && <Crop/>}
      <SmallAbout />
    </>
  );
}
