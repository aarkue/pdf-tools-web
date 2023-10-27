import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import {GlobalWorkerOptions } from "pdfjs-dist";

export default function App({ Component, pageProps }: AppProps) {
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  return <Component {...pageProps} />
}
