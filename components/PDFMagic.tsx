"use client";
import { useState } from "react";
import Merge from "./Merge";
import SmallAbout from "./small-about";
const MERGE_OP = "Merge";
const SPLIT_OP = "Split";
const REORDER_OP = "Reorder Pages";
const EXTRACT_TEXT_OP = "Extract Text";
const ALL_OPERATION_OPTIONS = [MERGE_OP /* SPLIT_OP, REORDER_OP , EXTRACT_TEXT_OP*/] as const;
type OperationMode = (typeof ALL_OPERATION_OPTIONS)[number];

export default function PDFMagic() {
  const [operationMode, setOperationMode] = useState<OperationMode>(MERGE_OP);
  return (
    <>
      <h1 className="text-3xl mb-1">PDF Tools</h1>
      <h2 className="text-xl leading-tight tracking-tight mb-4">
        Merge {/* , Split or Process */}
        PDFs
      </h2>
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
      {operationMode === MERGE_OP && <Merge />}
      <SmallAbout />
    </>
  );
}
