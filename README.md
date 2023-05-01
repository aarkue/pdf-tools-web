<img style="width: 200px" src="https://user-images.githubusercontent.com/20766652/235507439-7ffdd1f8-56b7-4a5a-817e-be2ebc06d50b.svg" alt="PDF Tools Logo showing a PDF file icon with a wrench" />

# PDF Tools (Web)
This project aims to provide a powerful web-based toolbox of different PDF-related features.

**Try or install PDF Tools here: [https://pdf.wolke7.cloud](https://pdf.wolke7.cloud)**.

## Features

### Merging PDF Files
Merge multiple PDF documents to one file.

There are different options for the outline of the merged file available:
- _Retain outline entries as one entry per file_: The outlines of the original documents are retained. They are included as children of the corresponding top-level outline element, which is created for every file.
- _Retain outline entries_: Simply retain the outline entries of the original documents, only adjusting the page/destination they point to, to account for the changed page numbering.
- _Create one outline entry per file_: Create a single outline entry for each of the documents, using the file name as a title.
- _Don't create an outline_: Don't create any outline for the merged PDF file.

### Offline Use
The web app hosted at **[https://pdf.wolke7.cloud](https://pdf.wolke7.cloud)** is a progressive web app (PWA).
You can use it offline (after first visit) and even install it to have it easily available.

## Screenshots
<p align="center">
<img style="display: block; width: 45%" src="https://user-images.githubusercontent.com/20766652/235502732-4b21e6f1-5fdf-4ce7-a9cd-438dfb633f98.png" alt="Screenshot of user interface in light mode"/>
<img  style="display: block; width: 45%" src="https://user-images.githubusercontent.com/20766652/235502851-e78a3e23-e9d6-48d5-932d-1ac302ad860a.png" alt="Screenshot of user interface in dark mode"/>
</p>
<p align="center">
<img src="https://user-images.githubusercontent.com/20766652/235502512-d9395cc6-a2fb-40dc-9674-6f9103eb06ab.png" alt="Screenshot of user interface in light mode"/>
</p>


## Project Structure
This project uses Typescript.
The Web App (PWA) is implemented using Next.JS (React) and Tailwind CSS.

The main PDF merging and outline processing work is done in the following files: `lib/pdf-outline-helper.ts` and `components/PDFMagic.tsx`.

This project makes heavy use of the `pdf-lib` JavaScript library for PDF manipulation.
See also [https://pdf-lib.js.org](https://pdf-lib.js.org), [https://github.com/Hopding/pdf-lib](https://github.com/Hopding/pdf-lib) and its fork used in this project: [https://github.com/cantoo-scribe/pdf-lib](https://github.com/cantoo-scribe/pdf-lib).



