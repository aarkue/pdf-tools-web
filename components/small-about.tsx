import { BsHeart, BsHeartFill } from "react-icons/bs";
import { TbPdf } from "react-icons/tb";

export default function SmallAbout(){
  return <div className="mt-6 -mb-2 flex justify-end items-center gap-1">
  Made with
  <div className="group relative w-7 h-7 flex justify-center items-center">
    <BsHeart className="w-7 h-7 group-hover:fill-red-500 transition" />
    <BsHeartFill className="opacity-0 group-hover:opacity-100 absolute group-hover:fill-red-400 w-7 h-7 transition" />
    <TbPdf
      className="stroke-slate-800 absolute w-4 h-4 top-[4px] right-[6px] transition group-hover:animate-ping once"
      style={{ animationIterationCount: 1, animationFillMode: "forwards" }}
    />
  </div>
  <span>
    by{" "}
    <a className="underline hover:text-blue-500" target="_blank" href="https://aarkue.eu">
      aarkue.eu
    </a>
    .
  </span>
</div>
}