import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiCheck, FiClipboard } from "react-icons/fi";
const ICON_STYLE = { width: "1.5rem", height: "1.5rem" };
const ICON_STYLE_SUCCESS = { ...ICON_STYLE, color: "#28d353" };
export interface CopyToClipboardButtonProps {
  copy: string;
  type?: "text" | "html";
  title?: string;
}
export default function CopyToClipboardButton(props: CopyToClipboardButtonProps) {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <button
      aria-label="Copy to clipboard"
      title={props.title ?? "Copy to clipboard"}
      onClick={async () => {
        if (!success) {
          setLoading(true);

          try {
            if (props.type === undefined || props.type === "text") {
              await navigator.clipboard.writeText(props.copy);
            } else if (props.type === "html") {
              const blobHtml = new Blob([props.copy], { type: "text/html" });
              const blobText = new Blob([props.copy], { type: "text/plain" });
              const data = [
                new ClipboardItem({
                  ["text/plain"]: blobText,
                  ["text/html"]: blobHtml,
                }),
              ];
              await navigator.clipboard.write(data);
            }
            setTimeout(() => {
              setLoading(false);
              setSuccess(true);
              setTimeout(() => {
                setSuccess(false);
              }, 700);
            }, 200);
          } catch (e) {
            alert(`Could not copy text automatically. Please copy it manually.\n\n` + props.copy);

            setLoading(false);
          }
        }
      }}
    >
      {loading && <AiOutlineLoading3Quarters style={ICON_STYLE} className="animate-spin" />}
      {!loading && (success ? <FiCheck style={ICON_STYLE_SUCCESS} /> : <FiClipboard style={ICON_STYLE} />)}
    </button>
  );
}
